<script lang="ts">
	import { resolve } from '$app/paths';
	import SvelteSeo from 'svelte-seo';
	import { Button } from '$lib/components/ui/button/index.js';
	import { siteConfig } from '$lib/site-config';
	import { competitions } from '$lib/competitions';
	import Brand from '$lib/components/Brand.svelte';
	import GitHubButton from '$lib/components/buttons/GitHubButton.svelte';
	import DiscordButton from '$lib/components/buttons/DiscordButton.svelte';
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { authClient } from '$lib/auth-client';

	const { data } = $props();

	// This page's data is cached (ssr = false + cache-control in +page.server.ts), so
	// `data.user` can be stale right after login/logout. Read the true auth state from the
	// client session store, falling back to server data only while it's still loading.
	const session = authClient.useSession();
	const currentUser = $derived(
		$session.isPending ? (data.user ?? null) : ($session.data?.user ?? null)
	);

	// ---------------------------------------------------------------------------
	// Stats — computed from the static competition data
	// ---------------------------------------------------------------------------
	function countFiles(): number {
		let files = 0;
		const fields = (o: Record<string, unknown>) =>
			[o.link, o.solutionLink, o.answerSheet, o.gradingScheme, o.results, o.instructions].filter(
				Boolean
			).length + ((o.additionalFiles as unknown[] | undefined)?.length ?? 0);
		for (const c of competitions) {
			for (const e of c.editions) {
				for (const p of e.problems) files += fields(p as unknown as Record<string, unknown>);
				for (const pa of e.papers) files += fields(pa as unknown as Record<string, unknown>);
			}
		}
		return files;
	}

	const stats = {
		olympiads: competitions.length,
		years: competitions.reduce((sum, c) => sum + c.editions.length, 0),
		files: countFiles()
	};

	const statItems = [
		{ value: stats.olympiads, label: 'Olympiads' },
		{ value: stats.years, label: 'Years' },
		{ value: stats.files, label: 'Files' }
	];

	let pageRoot: HTMLElement | undefined = $state();
	onMount(() => {
		if (!pageRoot) return;

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const dur = (d: number) => (reduceMotion ? 0 : d);

		const ctx = gsap.context(() => {
			gsap.set(
				['.hero-brand', '.hero-phonetic', '.hero-desc', '.hero-cta', '.stat', '.hero-credit'],
				{
					autoAlpha: 0,
					y: 20
				}
			);
			gsap.set('.stat-item', { autoAlpha: 0, y: 30 });

			gsap
				.timeline({ defaults: { ease: 'power3.out' } })
				.to('.hero-brand', { autoAlpha: 1, y: 0, duration: dur(0.6) })
				.to('.hero-phonetic', { autoAlpha: 1, y: 0, duration: dur(0.6) }, '-=0.5')
				.to('.hero-desc', { autoAlpha: 1, y: 0, duration: dur(0.6) }, '-=0.5')
				.to(
					'.hero-cta',
					{ autoAlpha: 1, y: 0, duration: dur(0.5), stagger: dur(0.1), ease: 'power3.out' },
					'-=0.5'
				)
				.to('.stat', { autoAlpha: 1, y: 0, duration: dur(0.5) }, '-=0.5')
				.to(
					'.stat-item',
					{ autoAlpha: 1, y: 0, duration: dur(0.7), stagger: dur(0.12), ease: 'power3.out' },
					'-=0.4'
				)
				.to('.hero-credit', { autoAlpha: 1, y: 0, duration: dur(0.5) }, '-=0.3');
		}, pageRoot);

		return () => ctx.revert();
	});
</script>

<SvelteSeo
	title={siteConfig.seo.homeTitle}
	description={siteConfig.seo.homeDescription}
	keywords={siteConfig.seo.homeKeywords}
/>

<div bind:this={pageRoot} class="flex flex-col">
	<!-- ============================================================= -->
	<!-- Hero section — centered title                                 -->
	<!-- ============================================================= -->
	<section
		class="relative flex min-h-[calc(100svh-10rem)] flex-col items-center justify-center gap-7 py-12 text-center"
	>
		<!-- Blurred logo watermark, kept purely as atmosphere -->
		<div
			class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
			aria-hidden="true"
		>
			<img
				src="/logo.svg"
				alt=""
				class="h-120 w-md opacity-40 select-none dark:opacity-10"
				style="filter: blur(2px);"
			/>
		</div>

		<!-- Title -->
		<div class="hero-brand relative z-10 flex flex-col items-center gap-2">
			<Brand class="text-[clamp(4.5rem,17vw,11rem)]" />
			{#if siteConfig.pronunciation}
				<span class="hero-phonetic font-mono text-sm tracking-[0.02em] text-muted-foreground">
					{siteConfig.pronunciation}
				</span>
			{/if}
		</div>

		<!-- Description -->
		<p class="hero-desc relative z-10 m-0 prose max-w-[46ch] text-foreground/75">
			{siteConfig.hero.description}
		</p>

		<!-- CTAs -->
		<div class="relative z-10 flex flex-col justify-center gap-3 xs:flex-row">
			<div class="hero-cta flex flex-row justify-center gap-2">
				<Button href={resolve('/olympiads')}>Browse olympiads</Button>

				{#if currentUser}
					<Button
						href="/contribute"
						variant="outline"
						class="border-white/60 bg-white/40 backdrop-blur-sm hover:bg-white/60 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
					>
						Contribute
					</Button>
				{:else}
					<Button
						href="/login"
						variant="outline"
						class="border-white/60 bg-white/40 backdrop-blur-sm hover:bg-white/60 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
					>
						Login
					</Button>
				{/if}
			</div>
			<div class="hero-cta flex flex-row justify-center gap-2">
				<GitHubButton />
				<DiscordButton />
			</div>
		</div>

		<div
			class="stat mx-auto flex w-[80vw] max-w-md flex-row overflow-hidden rounded-2xl border
			       border-white/70 bg-white/50 shadow-md
			       ring-1 shadow-black/5 ring-white/60
			       backdrop-blur-md ring-inset
			       dark:border-white/10 dark:bg-white/5 dark:shadow-black/30 dark:ring-white/5"
		>
			{#each statItems as { value, label }, i (label)}
				<div class="stat-item flex flex-1 flex-col items-center gap-1 px-4 py-4">
					<span class="font-mono text-xl leading-none font-bold text-foreground">
						{value}
					</span>
					<span class="font-mono text-xs tracking-widest text-muted-foreground uppercase">
						{label}
					</span>
				</div>
				{#if i < statItems.length - 1}
					<div class="h-auto w-px self-stretch bg-border/60" aria-hidden="true"></div>
				{/if}
			{/each}
		</div>

		{#if siteConfig.fork}
			<p class="hero-credit relative z-10 m-0 text-xs text-muted-foreground">
				{siteConfig.fork.text}
				<a
					href={siteConfig.fork.url}
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium text-foreground/80 underline decoration-dotted underline-offset-4 transition-colors hover:text-primary"
				>
					{siteConfig.fork.label}
				</a>
			</p>
		{/if}
	</section>
</div>
