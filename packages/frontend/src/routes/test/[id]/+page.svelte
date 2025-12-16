<script lang="ts">
import { fade } from 'svelte/transition';
import type { PageProps } from './$types';

const { params }: PageProps = $props();
</script>

<h1 in:fade={{ duration: 300, delay: 150 }} out:fade={{ duration: 150 }}>Hello! { params.id }</h1>

<style>

</style>
