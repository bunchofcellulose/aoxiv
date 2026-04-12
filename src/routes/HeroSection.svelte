<script lang="ts">
	import { resolve } from '$app/paths';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { competitions, getTotalProblems } from '$lib/competitions';
	import { cn } from '$lib/utils.js';
	import { onMount } from 'svelte';

	let rotX = $state(12);
	let rotY = $state(-18);
	let mounted = $state(false);

	function handleMouseMove(e: MouseEvent) {
		const cx = window.innerWidth / 2;
		const cy = window.innerHeight / 2;
		rotY = ((e.clientX - cx) / cx) * 25;
		rotX = -((e.clientY - cy) / cy) * 18;
	}

	onMount(() => {
		mounted = true;
		window.addEventListener('mousemove', handleMouseMove, { passive: true });
		return () => window.removeEventListener('mousemove', handleMouseMove);
	});

	const totalOlympiads = competitions.length;
	const totalEditions = competitions.reduce(
		(sum, competition) => sum + competition.editions.length,
		0
	);
	const totalProblems = getTotalProblems();

	const stats = [
		{ value: String(totalOlympiads), label: 'olympiads' },
		{ value: String(totalEditions), label: 'editions' },
		{ value: String(totalProblems), label: 'problems' }
	] as const;
</script>

<div
	class="relative flex min-h-[calc(100svh-10rem)] flex-col items-center justify-center gap-8 py-12 md:flex-row md:items-center md:justify-between"
>
	<div
		class="pointer-events-none absolute inset-0 flex items-center justify-end overflow-hidden md:hidden"
		aria-hidden="true"
	>
		<img
			src="/logo.svg"
			alt=""
			class="h-[28rem] w-[28rem] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-10 select-none dark:opacity-5"
		/>
	</div>

	<div
		class={cn(
			'relative z-10 flex min-w-0 flex-1 flex-col justify-center gap-7 transition-[opacity,transform] duration-[600ms] ease-in-out',
			mounted ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
		)}
	>
		<div class="flex flex-col gap-1">
			<h1
				class="text-left! text-[clamp(4rem,10vw,7rem)] leading-none font-bold tracking-[-0.03em] text-foreground"
			>
				aoXiv
			</h1>
			<span class="font-mono text-xs tracking-[0.02em] text-muted-foreground">/ ˌeɪ.oʊ.ˈkaɪv /</span
			>
		</div>

		<div class="flex flex-col gap-3">
			<p class="m-0 max-w-[44ch] text-left text-base leading-[1.7] text-foreground/70">
				A comprehensive archive of astronomy and astrophysics olympiads — from the prestigious IOAA
				and INAO to regional competitions like OAC and USAAAO. Includes problem statements,
				solutions, and grading schemes you rarely find elsewhere, all in a mobile-friendly UI.
			</p>
			<p class="m-0 text-xs text-muted-foreground">
				This project is a fork of
				<a
					href="https://phoxiv.org"
					target="_blank"
					rel="noopener noreferrer"
					class="underline hover:text-foreground"
				>
					phoxiv.org
				</a>.
			</p>
		</div>

		<div class="flex flex-wrap gap-3">
			<a href={resolve('/contests')} class={cn(buttonVariants({ variant: 'default' }))}>
				Browse contests
			</a>
			<a
				href="https://github.com/bunchofcellulose/aoXiv"
				class={cn(buttonVariants({ variant: 'outline' }))}
			>
				Contribute
			</a>
		</div>

		<div class="flex flex-wrap items-center gap-6">
			{#each stats as { value, label }, i (label)}
				<div class="flex flex-col gap-0.5">
					<span class="font-mono text-[1.75rem] leading-none font-bold text-foreground"
						>{value}</span
					>
					<span class="font-mono text-[0.65rem] tracking-[0.1em] text-muted-foreground uppercase">
						{label}
					</span>
				</div>
				{#if i < stats.length - 1}
					<div class="hidden h-8 w-px bg-border sm:block" aria-hidden="true"></div>
				{/if}
			{/each}
		</div>
	</div>

	<div
		class={cn(
			'hidden shrink-0 items-center justify-center transition-[opacity] delay-300 duration-[800ms] ease-in-out md:flex',
			mounted ? 'opacity-100' : 'opacity-0'
		)}
		aria-hidden="true"
	>
		<div
			class="relative flex h-[clamp(16rem,28vw,26rem)] w-[clamp(16rem,28vw,26rem)] items-center justify-center [transform-style:preserve-3d] [transition:transform_0.08s_ease-out]"
			style="transform: perspective(900px) rotateX({rotX}deg) rotateY({rotY}deg);"
		>
			<div
				class="absolute inset-0 [transform:translateZ(-20px)] rounded-full [background:radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_40%,transparent),transparent_50%)]"
			></div>

			<img
				src="/logo.svg"
				alt=""
				class="pointer-events-none h-full w-full [transform:translateZ(30px)] object-contain opacity-80 select-none dark:opacity-60"
			/>
		</div>
	</div>
</div>
