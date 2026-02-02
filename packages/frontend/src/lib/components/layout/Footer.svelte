<script lang="ts">
import { IconBrandGithub, IconChevronRight, IconX } from '@tabler/icons-svelte';
import { blur, fade } from 'svelte/transition';
import MiIcon from '$lib/assets/MiIcon.svelte';

const miLinks = [
	{ href: 'https://misskey.io/@sangatsu_tsuitachi', label: 'ランカーBot' },
	{ href: 'https://misskey.io/@secineralyr', label: 'Secineralyr' },
];

let isMiModalOpen = $state(false);

function openMiModal(): void {
	isMiModalOpen = true;
}

function closeMiModal(): void {
	isMiModalOpen = false;
}

function handleModalKeydown(event: KeyboardEvent): void {
	if (event.key === 'Escape' && isMiModalOpen) {
		closeMiModal();
	}
}
</script>

<svelte:window onkeydown={handleModalKeydown} />

<footer>
	<div class="inner">
		<div class="left">
			<a href="https://secinet.jp" target="_blank" rel="noopener noreferrer" class="logo"><img src="/secineralyr_text_logo.png" alt="Secineralyr"></a>
			<nav class="nav">
				<!-- 以下は現状無視 -->
				<!-- <a href="/contact" class="link">お問い合わせ</a>
				<a href="/terms" class="link">利用規約</a>
				<a href="/privacy" class="link">プライバシーポリシー</a> -->
			</nav>
		</div>
		<div class="right">
			<button
				class="social social-button"
				type="button"
				aria-haspopup="dialog"
				aria-expanded={isMiModalOpen}
				onclick={openMiModal}
			>
				<MiIcon weight={50} size={32} />
			</button>
			<a
				href="https://github.com/Secineralyr/midnight-network"
				target="_blank"
				rel="noopener noreferrer"
				class="social"
			>
				<IconBrandGithub size={20} />
			</a>
		</div>
	</div>
</footer>

{#if isMiModalOpen}
	<div class="mi-modal-backdrop" in:fade={{ duration: 150 }} out:fade={{ duration: 150 }}>
		<button class="mi-modal-dismiss" type="button" onclick={closeMiModal} aria-label="Close modal"></button>
		<div
			class="mi-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="mi-modal-title"
			tabindex="-1"
			in:blur={{ duration: 150, amount: 10 }}
			out:blur={{ duration: 150, amount: 10 }}
		>
			<div class="mi-modal-header">
				<h2 id="mi-modal-title">Misskeyリンク</h2>
				<button class="mi-modal-close" type="button" onclick={closeMiModal} aria-label="Close">
					<IconX size={16} />
				</button>
			</div>
			<div class="mi-modal-links">
				{#each miLinks as link (link.href)}
					<a
						class="mi-modal-link"
						href={link.href}
						target="_blank"
						rel="noopener noreferrer"
					>
						<span>{link.label}</span>
						<IconChevronRight />
					</a>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	footer {
		padding: 20px 40px;
		width: 100%;
		max-width: 840px;
		height: 80px;
		margin: 0 auto;
	}

	/* モバイル表示 */
	@media (max-width: 899px) {
		footer {
			padding: 20px;
		}
		.inner {
			gap: 15px;
		}
		.left {
			flex-direction: column;
			gap: 15px;
			align-items: center;
		}
		.logo {
			height: 30px;
		}
	}

	.inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
	}

	.left {
		height: 100%;
		display: flex;
		align-items: center;
		gap: 40px;
	}

	.logo {
		height: 100%;
	}
	.logo > img {
		height: 100%;
	}

	.nav {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.right {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.social {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #808080;
		transition: color 150ms ease;
	}

	.social-button {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.social:hover {
		color: #fff;
	}

	.mi-modal-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(3, 0, 10, 0.4);
		backdrop-filter: blur(5px);
		z-index: 10;
	}

	.mi-modal-dismiss {
		position: absolute;
		inset: 0;
		border: none;
		background: transparent;
		padding: 0;
		cursor: pointer;
	}

	.mi-modal {
		position: relative;
		z-index: 1;
		width: 350px;
		max-width: calc(100% - 40px);
		background: #201E3A;
		border-radius: 4px;
		padding: 20px;
	}

	.mi-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 10px;
	}

	.mi-modal-header h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
	}

	.mi-modal-close {
		border: none;
		background: rgba(148, 168, 255, 0.1);
		color: #fff;
		border-radius: 9999px;
		padding: 6px;
		display: grid;
		place-items: center;
		cursor: pointer;
		transition: background 150ms ease, color 150ms ease;
	}

	.mi-modal-close :global(svg) {
		transition: transform 200ms ease;
	}

	.mi-modal-close:hover :global(svg) {
		transform: rotate(90deg);
	}

	.mi-modal-close:hover {
		background: rgba(148, 168, 255, 0.2);
		color: #fff;
	}

	.mi-modal-links {
		display: grid;
		gap: 10px;
	}

	.mi-modal-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px;
		border-radius: 4px;
		background: rgba(148, 168, 255, 0.05);
		color: #cfcfcf;
		font-size: 0.9rem;
		text-decoration: none;
		transition: border 150ms ease, background 150ms ease, color 150ms ease;
	}

	.mi-modal-link:hover {
		background: rgba(148, 168, 255, 0.1);
		color: #fff;
	}
</style>
