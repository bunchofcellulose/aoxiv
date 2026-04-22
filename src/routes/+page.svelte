<script lang="ts">
	import SvelteSeo from 'svelte-seo';
	import { siteConfig } from '$lib/site-config';
	import HeroSection from './HeroSection.svelte';
</script>

<SvelteSeo
	title={siteConfig.seo.homeTitle}
	description={siteConfig.seo.homeDescription}
	keywords={siteConfig.seo.homeKeywords}
/>

<HeroSection />
