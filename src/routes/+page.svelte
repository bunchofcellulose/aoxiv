<script lang="ts">
	import SvelteSeo from 'svelte-seo';
	import HeroSection from './HeroSection.svelte';
	import ContestList from './ContestList.svelte';
</script>

<SvelteSeo
	title="aoXiv"
	description="An archive of problems and solutions from various astronomy and astrophysics olympiads. Includes IOAA, INAO, OAC, and many more international, regional, and national competitions."
	keywords="problems, solutions, olympiad, astronomy, astrophysics, ioaa, inao, oac"
/>

<HeroSection />

<!-- Contests -->
<section id="contests" class="mb-4">
	<div class="mb-4">
		<h2 class="py-0">Contests</h2>
		<p class="mb-0 text-sm text-muted-foreground">
			Click any card to explore problems, solutions &amp; marking schemes.
		</p>
	</div>
	<ContestList />
</section>

<!-- Contribute CTA -->
<section class="">
	<div
		class="flex flex-col items-start justify-between gap-4 rounded-2xl bg-primary px-6 py-5 sm:flex-row sm:items-center"
	>
		<p class="mb-0 text-sm font-medium text-primary-foreground/90">
			Want to add problems or help maintain the site? Open a PR.
		</p>
		<a
			href="https://github.com/bunchofcellulose/aoXiv"
			target="_blank"
			rel="noopener noreferrer"
			class="shrink-0 rounded-lg bg-primary-foreground px-4 py-2 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
		>
			Contribute on GitHub →
		</a>
	</div>
</section>
