<script lang="ts">
import { animate } from 'motion';
interface Props {
	/** Value in the 0-100 range. */
	value?: number;
	/** Max value for normalization. */
	max?: number;
	/** Display text override. */
	text?: string;
	/** Custom formatter for display text. */
	format?: (value: number, percent: number) => string;
	/** Text position mode. */
	textPosition?: 'follow' | 'center';
	/** Accessible label. */
	ariaLabel?: string;
}

const { value = 0, max = 100, text, format, textPosition = 'follow', ariaLabel }: Props = $props();
const gaugePadding = 5;

let trackElement: HTMLDivElement | undefined = $state();
let textElement: HTMLSpanElement | undefined = $state();
let textLeft = $state(0);
let animatedPercent = $state(0);
let animation: ReturnType<typeof animate> | null = null;
let previousPercent = 0;

function stopAnimation(): void {
	animation?.cancel?.();
	animation?.stop?.();
}

const clampedPercent = $derived.by(() => {
	if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
		return 0;
	}
	const percent = (value / max) * 100;
	return Math.min(100, Math.max(0, percent));
});

const displayText = $derived.by(() => {
	if (text !== undefined) {
		return text;
	}
	if (format) {
		return format(value, clampedPercent);
	}
	return `${Math.round(clampedPercent)}%`;
});

const measureText = $derived(displayText === '' ? ' ' : displayText);
const showText = $derived(displayText !== '');

function updateTextPosition(percent = animatedPercent): void {
	if (!trackElement || !textElement) {
		return;
	}

	const trackWidth = trackElement.clientWidth;
	const textWidth = textElement.offsetWidth;
	if (trackWidth <= 0 || textWidth <= 0) {
		textLeft = 0;
		return;
	}
	const padding = gaugePadding;
	const half = textWidth / 2;
	const min = padding + half;
	const max = trackWidth - padding - half;
	const available = trackWidth - padding * 2;
	if (textWidth >= available) {
		textLeft = trackWidth / 2;
		return;
	}

	if (textPosition === 'center') {
		textLeft = Math.min(max, Math.max(min, trackWidth / 2));
		return;
	}

	const fillWidth = (percent / 100) * trackWidth;
	const fitsInFill = textWidth + padding * 2 <= fillWidth;
	const raw = fitsInFill
		? fillWidth - padding - half
		: fillWidth + padding + half;

	textLeft = Math.min(max, Math.max(min, raw));
}

$effect(() => {
	const target = clampedPercent;
	const start = previousPercent;
	previousPercent = target;
	stopAnimation();
	animatedPercent = start;
	updateTextPosition(start);
	animation = animate(start, target, {
		duration: 1,
		ease: 'easeOut',
		onUpdate: (latest) => {
			animatedPercent = latest;
			updateTextPosition(latest);
		},
	});

	return () => {
		stopAnimation();
	};
});

$effect(() => {
	if (!trackElement || !textElement) {
		return;
	}

	const observer = new ResizeObserver(() => {
		updateTextPosition(animatedPercent);
	});
	observer.observe(trackElement);
	observer.observe(textElement);

	return () => {
		observer.disconnect();
	};
});
</script>

<div
	class="gauge"
	role="progressbar"
	aria-valuenow={Math.round(clampedPercent)}
	aria-valuemin="0"
	aria-valuemax="100"
	aria-valuetext={displayText}
	aria-label={ariaLabel}
	style={`--gauge-percent: ${animatedPercent}%; --gauge-text-left: ${textLeft}px; --gauge-pad: ${gaugePadding}px;`}
>
	<span class="gauge-measure" aria-hidden="true">{measureText}</span>
	<div class="gauge-track" bind:this={trackElement}>
		<div class="gauge-fill"></div>
		{#if showText}
			<div class="gauge-text-layer gauge-text-base">
				<span class="gauge-text" bind:this={textElement}>{displayText}</span>
			</div>
			<div class="gauge-text-layer gauge-text-invert">
				<span class="gauge-text">{displayText}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.gauge {
		position: relative;
		width: 100%;
		padding: var(--gauge-pad);
		background-color: #2F2D53;
		font-size: 0.93rem;
		font-weight: 600;
		line-height: 1;
	}

	.gauge-measure {
		display: block;
		visibility: hidden;
		pointer-events: none;
	}

	.gauge-track {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.gauge-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: var(--gauge-percent);
		background-color: #B8C4FF;
	}

	.gauge-text-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.gauge-text {
		position: absolute;
		top: 50%;
		left: var(--gauge-text-left);
		transform: translate(-50%, -50%);
		white-space: nowrap;
	}

	.gauge-text-base {
		color: #ffffff;
	}

	.gauge-text-invert {
		color: #2F2D53;
		clip-path: inset(0 calc(100% - var(--gauge-percent)) 0 0);
	}
</style>
