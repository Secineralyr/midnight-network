<script lang="ts">
import { IconBrandGithub, IconBrandX } from '@tabler/icons-svelte';

/**
 * フッターコンポーネント
 * @description サイトフッター。ロゴ、リンク、ソーシャルアイコン
 */
</script>

<footer>
	<div class="inner">
		<div class="left">
			<span class="logo"><img src="/secineralyr_text_logo.png" alt="Secineralyr"></span>
			<nav class="nav">
				<!-- 以下は現状無視 -->
				<a href="/contact" class="link">お問い合わせ</a>
				<a href="/terms" class="link">利用規約</a>
				<a href="/privacy" class="link">プライバシーポリシー</a>
			</nav>
		</div>
		<div class="right">
			<a
				href="https://github.com"
				target="_blank"
				rel="noopener noreferrer"
				class="social"
			>
			</a>
			<a
				href="https://github.com"
				target="_blank"
				rel="noopener noreferrer"
				class="social"
			>
				<IconBrandGithub size={20} />
			</a>
		</div>
	</div>
</footer>

<style>
	footer {
		padding: 20px 40px;
		width: 840px;
		height: 80px;
		margin: 0 auto;
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

	.social:hover {
		color: #fff;
	}

	.link {
		font-size: 0.75rem;
	}
</style>
