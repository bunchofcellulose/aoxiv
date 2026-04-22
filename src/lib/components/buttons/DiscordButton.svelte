<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import { siteConfig } from '$lib/site-config';
	import { mode } from 'mode-watcher';

	import DiscordWhite from '$lib/assets/icons/Discord-Symbol-White.svg';
	import DiscordBlack from '$lib/assets/icons/Discord-Symbol-Black.svg';
</script>

{#if mode.current == 'dark'}
	<Button variant="ghost" size="icon" href={siteConfig.discordUrl} target="_blank"
		><img alt="Discord" src={DiscordWhite} class="scale-50 opacity-75" /></Button
	>
{:else}
	<Button variant="ghost" size="icon" href={siteConfig.discordUrl} target="_blank"
		><img alt="Discord" src={DiscordBlack} class="scale-50 opacity-75" /></Button
	>
{/if}
