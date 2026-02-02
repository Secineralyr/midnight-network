import { env } from 'cloudflare:workers';

export interface PushSubscriptionData {
	endpoint: string;
	p256dh: string;
	auth: string;
}

/**
 * Web Push通知を送信する (Cloudflare Workers互換)
 * RFC 8291 (Message Encryption for Web Push) + RFC 8292 (VAPID) 準拠
 */
export async function sendPushNotification(
	subscription: PushSubscriptionData,
	payload: string,
): Promise<{ success: boolean; statusCode?: number; gone?: boolean }> {
	try {
		const vapidHeaders = await createVapidHeaders(subscription.endpoint);
		const encrypted = await encryptPayload(subscription, payload);

		const response = await fetch(subscription.endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Encoding': 'aes128gcm',
				'Content-Length': String(encrypted.byteLength),
				TTL: '86400',
				Authorization: vapidHeaders.authorization,
			},
			body: encrypted,
		});

		return {
			success: response.status >= 200 && response.status < 300,
			statusCode: response.status,
			gone: response.status === 410 || response.status === 404,
		};
	} catch (e) {
		console.error(`web-push: send failed: ${e}`);
		return { success: false };
	}
}

// --- VAPID ---

async function createVapidHeaders(endpoint: string): Promise<{
	authorization: string;
}> {
	const audience = new URL(endpoint).origin;
	const subject = `mailto:noreply@${env.BACKEND_HOST}`;

	const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
	const publicKeyRaw = base64UrlDecode(env.VAPID_PUBLIC_KEY);

	const privateKey = await crypto.subtle.importKey(
		'jwk',
		{
			kty: 'EC',
			crv: 'P-256',
			d: vapidPrivateKey,
			x: base64UrlEncode(publicKeyRaw.slice(1, 33)),
			y: base64UrlEncode(publicKeyRaw.slice(33, 65)),
		},
		{ name: 'ECDSA', namedCurve: 'P-256' },
		false,
		['sign'],
	);

	const now = Math.floor(Date.now() / 1000);
	const headerPart = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
	const payloadPart = base64UrlEncode(
		new TextEncoder().encode(
			JSON.stringify({
				aud: audience,
				exp: now + 12 * 3600,
				sub: subject,
			}),
		),
	);

	const signingInput = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
	const signatureRaw = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: 'SHA-256' },
		privateKey,
		signingInput.buffer as ArrayBuffer,
	);

	const sig = derToRaw(new Uint8Array(signatureRaw));
	const jwt = `${headerPart}.${payloadPart}.${base64UrlEncode(sig)}`;

	return {
		authorization: `vapid t=${jwt}, k=${base64UrlEncode(publicKeyRaw)}`,
	};
}

// --- Payload Encryption (RFC 8291 / aes128gcm) ---

async function encryptPayload(subscription: PushSubscriptionData, plaintext: string): Promise<ArrayBuffer> {
	const clientPublicKey = base64UrlDecode(subscription.p256dh);
	const clientAuth = base64UrlDecode(subscription.auth);
	const plaintextBytes = new TextEncoder().encode(plaintext);

	const localKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);

	const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', localKeyPair.publicKey));

	const peerPublicKey = await crypto.subtle.importKey(
		'raw',
		clientPublicKey.buffer as ArrayBuffer,
		{ name: 'ECDH', namedCurve: 'P-256' },
		false,
		[],
	);

	const sharedSecret = new Uint8Array(
		await crypto.subtle.deriveBits({ name: 'ECDH', public: peerPublicKey }, localKeyPair.privateKey, 256),
	);

	const authInfo = concatBuffers(new TextEncoder().encode('WebPush: info\0'), clientPublicKey, localPublicKeyRaw);

	const prk = await hkdfExtract(clientAuth.buffer as ArrayBuffer, sharedSecret.buffer as ArrayBuffer);
	const ikm = await hkdfExpand(prk, authInfo, 32);

	const salt = crypto.getRandomValues(new Uint8Array(16));

	const prkForContent = await hkdfExtract(salt.buffer as ArrayBuffer, ikm.buffer as ArrayBuffer);
	const contentKey = await hkdfExpand(prkForContent, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16);
	const nonce = await hkdfExpand(prkForContent, new TextEncoder().encode('Content-Encoding: nonce\0'), 12);

	const paddedPlaintext = concatBuffers(plaintextBytes, new Uint8Array([2]));

	const aesKey = await crypto.subtle.importKey('raw', contentKey.buffer as ArrayBuffer, 'AES-GCM', false, ['encrypt']);
	const ciphertext = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: nonce.buffer as ArrayBuffer },
			aesKey,
			paddedPlaintext.buffer as ArrayBuffer,
		),
	);

	const rs = 4096;
	const headerBuf = new Uint8Array(16 + 4 + 1 + localPublicKeyRaw.length);
	headerBuf.set(salt, 0);
	new DataView(headerBuf.buffer as ArrayBuffer).setUint32(16, rs);
	headerBuf[20] = localPublicKeyRaw.length;
	headerBuf.set(localPublicKeyRaw, 21);

	return concatBuffers(headerBuf, ciphertext).buffer as ArrayBuffer;
}

// --- Helpers ---

function base64UrlDecode(str: string): Uint8Array {
	const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
	const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
	const binary = atob(base64 + pad);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

const regPlus = /\+/g;
const regSlash = /\//g;
const regEnd = /=+$/;
function base64UrlEncode(bytes: Uint8Array | ArrayBuffer): string {
	const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let binary = '';
	for (const byte of uint8) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replace(regPlus, '-').replace(regSlash, '_').replace(regEnd, '');
}

function concatBuffers(...buffers: (Uint8Array | ArrayBuffer)[]): Uint8Array {
	const arrays = buffers.map((b) => (b instanceof Uint8Array ? b : new Uint8Array(b)));
	const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}

async function hkdfExtract(salt: ArrayBuffer, ikm: ArrayBuffer): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	return new Uint8Array(await crypto.subtle.sign('HMAC', key, ikm));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey('raw', prk.buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, [
		'sign',
	]);
	const input = concatBuffers(info, new Uint8Array([1]));
	const output = new Uint8Array(await crypto.subtle.sign('HMAC', key, input.buffer as ArrayBuffer));
	return output.slice(0, length);
}

function derToRaw(der: Uint8Array): Uint8Array {
	const raw = new Uint8Array(64);
	let offset = 2;
	// r
	const rLen = der[offset + 1] ?? 0;
	offset += 2;
	const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
	const rDest = rLen < 32 ? 32 - rLen : 0;
	raw.set(der.slice(rStart, rStart + Math.min(rLen, 32)), rDest);
	offset += rLen;
	// s
	const sLen = der[offset + 1] ?? 0;
	offset += 2;
	const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
	const sDest = sLen < 32 ? 64 - sLen : 32;
	raw.set(der.slice(sStart, sStart + Math.min(sLen, 32)), sDest);
	return raw;
}
