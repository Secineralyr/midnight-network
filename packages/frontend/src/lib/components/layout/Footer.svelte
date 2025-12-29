<script lang="ts">
import { IconBrandGithub, IconBrandX } from '@tabler/icons-svelte';

/**
 * フッターコンポーネント
 * @description サイトフッター。ロゴ、リンク、ソーシャルアイコン
 */
</script>

<footer class="footer">
	<div class="footer__inner">
		<div class="footer__left">
			<span class="footer__logo"></span>
		</div>
		<nav class="footer__nav">
			<!-- 以下は現状無視 -->
			<!-- <a href="/contact" class="footer__link">お問い合わせ</a> -->
			<!-- <a href="/terms" class="footer__link">利用規約</a> -->
			<!-- <a href="/privacy" class="footer__link">プライバシーポリシー</a> -->
		</nav>
		<div class="footer__right">
			<a
				href="https://github.com"
				target="_blank"
				rel="noopener noreferrer"
				class="footer__social"
			>
			</a>
			<a
				href="https://github.com"
				target="_blank"
				rel="noopener noreferrer"
				class="footer__social"
			>
				<IconBrandGithub size={20} />
			</a>
		</div>
	</div>
</footer>

<style>
	.footer {
		padding: var(--spacing-lg) 0;
		border-top: 1px solid var(--color-border-secondary);
		background-color: var(--color-bg-primary);
	}

	.footer__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: var(--content-max-width);
		margin: 0 auto;
		padding: 0 var(--spacing-lg);
	}

	.footer__left {
		display: flex;
		align-items: center;
	}

	.footer__logo {
		font-family: var(--font-special);
		font-size: var(--font-size-lg);
		color: var(--color-text-secondary);
	}

	.footer__nav {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.footer__right {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.footer__social {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		transition: color var(--transition-fast);
	}

	.footer__social:hover {
		color: var(--color-text-secondary);
	}

	@media (max-width: 768px) {
		.footer__inner {
			flex-direction: column;
			gap: var(--spacing-md);
		}

		.footer__nav {
			flex-wrap: wrap;
			justify-content: center;
		}
	}
</style>
