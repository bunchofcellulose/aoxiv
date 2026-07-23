<script lang="ts">
	const { olympiadId }: { olympiadId: string } = $props();
	import { competitions } from '$lib/competitions';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import SearchEmptyState from '$lib/components/SearchEmptyState.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import {
		FileText,
		CircleCheck,
		ClipboardList,
		FileCheck2,
		Trophy,
		Info,
		Paperclip,
		ExternalLink,
		Clock
	} from '@lucide/svelte';

	// ---------------------------------------------------------------------------
	// Types
	// ---------------------------------------------------------------------------

	type Competition = (typeof competitions)[number];
	type Edition = Competition['editions'][number];
	type PaperItem = Edition['papers'][number];
	type ProblemItem = Edition['problems'][number];

	interface MatchedEdition extends Edition {
		matchedProblems: ProblemItem[];
	}

	type FileKind =
		| 'problem'
		| 'solution'
		| 'grading'
		| 'answer'
		| 'results'
		| 'instructions'
		| 'additional';

	interface FileLink {
		label: string;
		url: string;
		kind: FileKind;
	}

	interface Round {
		key: string;
		title: string;
		majorCategory?: string;
		duration?: number;
		files: FileLink[];
		problems: ProblemItem[];
	}

	// ---------------------------------------------------------------------------
	// State
	// ---------------------------------------------------------------------------

	const competition = $derived(competitions.find((c) => c.id === olympiadId));
	const editions = $derived(competition?.editions ?? []);

	let query = $state('');
	let showFullYear = $state(false);

	// Round display order — anything unknown sorts after these, alphabetically.
	const ROUND_ORDER = [
		'first round',
		'qualifier',
		'qualification',
		'invitationals',
		'nac',
		'final theory',
		'theory',
		'theory long',
		'theory short',
		'data analysis',
		'practical',
		'final practical',
		'observation',
		'night observation',
		'day observation',
		'planetarium',
		'sky map',
		'sky chart',
		'telescope',
		'group competition',
		'group',
		'team competition',
		'team'
	];

	function roundRank(title: string): number {
		const i = ROUND_ORDER.indexOf(title.toLowerCase());
		return i === -1 ? ROUND_ORDER.length : i;
	}

	// ---------------------------------------------------------------------------
	// File extraction
	// ---------------------------------------------------------------------------

	function fileName(url: string): string {
		return decodeURIComponent(url.split('/').pop() ?? 'File').replace(/\.[a-z0-9]+$/i, '');
	}

	function resourceFiles(src: {
		link?: string;
		solutionLink?: string;
		gradingScheme?: string;
		answerSheet?: string;
		instructions?: string;
		results?: string;
		additionalFiles?: string[];
	}): FileLink[] {
		const out: FileLink[] = [];
		if (src.link) out.push({ label: 'Problems', url: src.link, kind: 'problem' });
		if (src.solutionLink) out.push({ label: 'Solutions', url: src.solutionLink, kind: 'solution' });
		if (src.gradingScheme)
			out.push({ label: 'Grading scheme', url: src.gradingScheme, kind: 'grading' });
		if (src.answerSheet) out.push({ label: 'Answer sheet', url: src.answerSheet, kind: 'answer' });
		if (src.instructions)
			out.push({ label: 'Instructions', url: src.instructions, kind: 'instructions' });
		if (src.results) out.push({ label: 'Results', url: src.results, kind: 'results' });
		for (const f of src.additionalFiles ?? [])
			out.push({ label: fileName(f), url: f, kind: 'additional' });
		return out;
	}

	function isResultsOnly(p: PaperItem): boolean {
		return !p.link && !p.solutionLink && !p.gradingScheme && !p.answerSheet && !!p.results;
	}

	// ---------------------------------------------------------------------------
	// Grouping: build rounds (by category) + year-level results
	// ---------------------------------------------------------------------------

	function buildRounds(
		edition: MatchedEdition,
		includePapers: boolean
	): { rounds: Round[]; results: FileLink[]; official?: string } {
		// Local, non-reactive lookup used only within this function.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const map = new Map<string, Round>();
		const results: FileLink[] = [];

		const get = (title: string): Round => {
			const key = title || 'Exam';
			let r = map.get(key);
			if (!r) {
				r = { key, title, files: [], problems: [] };
				map.set(key, r);
			}
			return r;
		};

		if (includePapers) {
			for (const paper of edition.papers ?? []) {
				const cat = (paper.category ?? '').trim();
				// Roll "Overall" / results-only papers up into a year-level results row.
				if (cat.toLowerCase() === 'overall' || (isResultsOnly(paper) && !cat)) {
					results.push(...resourceFiles(paper));
					continue;
				}
				const r = get(cat);
				r.files.push(...resourceFiles(paper));
				if (paper.examDuration && !r.duration) r.duration = paper.examDuration;
				const mc = (paper as Record<string, unknown>).majorCategory as string | undefined;
				if (mc && !r.majorCategory) r.majorCategory = mc;
			}
		}

		// Attach problems to their round (by category). Problems without a category
		// go to the single unnamed exam, or a generic bucket.
		const singleUnnamed =
			map.size === 1 && map.has('Exam') ? (map.get('Exam') as Round) : undefined;

		for (const prob of edition.matchedProblems ?? []) {
			const cat = (prob.category ?? '').trim();
			let round: Round;
			if (cat && map.has(cat)) round = map.get(cat) as Round;
			else if (!cat && singleUnnamed) round = singleUnnamed;
			else round = get(cat);
			round.problems.push(prob);
		}

		const rounds = [...map.values()]
			.filter((r) => r.files.length > 0 || r.problems.length > 0)
			.sort((a, b) => {
				const ra = roundRank(a.title);
				const rb = roundRank(b.title);
				return ra !== rb ? ra - rb : a.title.localeCompare(b.title);
			});

		return { rounds, results, official: edition.link };
	}

	// ---------------------------------------------------------------------------
	// Search / filtering
	// ---------------------------------------------------------------------------

	function matchesProblem(p: ProblemItem, q: string): boolean {
		return (
			(p.name?.toLowerCase().includes(q) ?? false) ||
			(p.number?.toLowerCase().includes(q) ?? false) ||
			(p.author?.toLowerCase().includes(q) ?? false) ||
			(p.category?.toLowerCase().includes(q) ?? false)
		);
	}

	const filtered = $derived((): MatchedEdition[] => {
		const q = query.trim().toLowerCase();
		if (!q) return editions.map((ed) => ({ ...ed, matchedProblems: ed.problems }));

		const results: MatchedEdition[] = [];
		for (const edition of editions) {
			const yearMatches = String(edition.year).includes(q);
			const locationMatches = edition.location?.toLowerCase().includes(q) ?? false;
			const matchedProblems = edition.problems.filter((p) => matchesProblem(p, q));

			if (yearMatches || locationMatches) {
				results.push({ ...edition, matchedProblems: edition.problems });
			} else if (matchedProblems.length > 0) {
				results.push({
					...edition,
					matchedProblems: showFullYear ? edition.problems : matchedProblems
				});
			}
		}
		return results;
	});

	const hasProblemMatches = $derived((): boolean => {
		const q = query.trim().toLowerCase();
		if (!q) return false;
		return editions.some(
			(ed) =>
				!String(ed.year).includes(q) &&
				!(ed.location?.toLowerCase().includes(q) ?? false) &&
				ed.problems.some((p) => matchesProblem(p, q))
		);
	});

	function showYearLevel(edition: MatchedEdition): boolean {
		const q = query.trim().toLowerCase();
		return (
			!q ||
			String(edition.year).includes(q) ||
			(edition.location?.toLowerCase().includes(q) ?? false) ||
			showFullYear
		);
	}

	function editionProblemCount(edition: MatchedEdition): number {
		return edition.problems.length;
	}
</script>

<section class="my-4">
	<div class="mb-5">
		<SearchBar placeholder="Search by year or problem…" bind:value={query}>
			{#snippet filters()}
				{#if hasProblemMatches()}
					<label class="flex cursor-pointer items-center gap-2">
						<Switch bind:checked={showFullYear} />
						<span class="text-sm font-medium text-nowrap text-muted-foreground">Show full year</span
						>
					</label>
				{/if}
			{/snippet}
		</SearchBar>
	</div>

	<!-- Icon for a file kind — shared by the pill + circle variants -->
	{#snippet fileIcon(kind: FileKind)}
		{#if kind === 'problem'}<FileText class="size-3.5" />
		{:else if kind === 'solution'}<CircleCheck class="size-3.5" />
		{:else if kind === 'grading'}<ClipboardList class="size-3.5" />
		{:else if kind === 'answer'}<FileCheck2 class="size-3.5" />
		{:else if kind === 'results'}<Trophy class="size-3.5" />
		{:else if kind === 'instructions'}<Info class="size-3.5" />
		{:else}<Paperclip class="size-3.5" />{/if}
	{/snippet}

	<!-- Full labelled pill — used for round-level (paper) files -->
	{#snippet fileLink(f: FileLink)}
		{@const styles = {
			problem: 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent',
			solution:
				'bg-primary/12 text-primary hover:bg-primary/20 border-primary/20 dark:bg-primary/15',
			grading: 'bg-card text-foreground/80 hover:bg-muted hover:text-foreground border-border',
			answer: 'bg-card text-foreground/80 hover:bg-muted hover:text-foreground border-border',
			results: 'bg-card text-foreground/80 hover:bg-muted hover:text-foreground border-border',
			instructions: 'bg-card text-foreground/80 hover:bg-muted hover:text-foreground border-border',
			additional: 'bg-card text-foreground/80 hover:bg-muted hover:text-foreground border-border'
		}}
		<a
			href={f.url}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {styles[
				f.kind
			]}"
		>
			{@render fileIcon(f.kind)}
			{f.label}
		</a>
	{/snippet}

	<!-- Compact icon-only circle — used for individual problem files -->
	{#snippet fileCircle(f: FileLink)}
		{@const styles = {
			problem: 'bg-primary text-primary-foreground hover:bg-primary/90',
			solution: 'bg-primary/15 text-primary hover:bg-primary/25',
			grading: 'bg-muted text-foreground/70 hover:bg-accent hover:text-foreground',
			answer: 'bg-muted text-foreground/70 hover:bg-accent hover:text-foreground',
			results: 'bg-muted text-foreground/70 hover:bg-accent hover:text-foreground',
			instructions: 'bg-muted text-foreground/70 hover:bg-accent hover:text-foreground',
			additional: 'bg-muted text-foreground/70 hover:bg-accent hover:text-foreground'
		}}
		<a
			href={f.url}
			target="_blank"
			rel="noopener noreferrer"
			title={f.label}
			aria-label={f.label}
			class="inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors {styles[
				f.kind
			]}"
		>
			{@render fileIcon(f.kind)}
		</a>
	{/snippet}

	{#if filtered().length > 0}
		<div class="flex flex-col gap-10">
			{#each filtered() as edition (edition.year)}
				{@const yearVisible = showYearLevel(edition)}
				{@const grouped = buildRounds(edition, yearVisible)}
				<div
					id={`year-${edition.year}`}
					class="scroll-mt-24 rounded-2xl border border-border bg-card/60 shadow-sm"
				>
					<!-- Year header — sticky, so the current year stays pinned while scrolling its rounds -->
					<div
						class="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b-2 border-primary/40 bg-card/95 px-4 py-3.5 backdrop-blur-md sm:px-5"
					>
						<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
							<span class="flex items-center gap-2.5">
								<span class="h-6 w-1.5 rounded-full bg-primary" aria-hidden="true"></span>
								<span class="font-mono text-2xl font-bold tracking-tight text-primary tabular-nums">
									{edition.year}
								</span>
							</span>
							{#if edition.location}
								<span class="text-sm font-medium text-foreground/80">{edition.location}</span>
							{/if}
							<span class="text-xs text-muted-foreground/70">
								{grouped.rounds.length}
								{grouped.rounds.length === 1 ? 'round' : 'rounds'}
								{#if editionProblemCount(edition) > 0}
									· {editionProblemCount(edition)} problems
								{/if}
							</span>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							{#each grouped.results as f (f.url)}
								<a
									href={f.url}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/60 hover:bg-primary/20"
								>
									{@render fileIcon(f.kind)}
									{f.label}
								</a>
							{/each}
							{#if grouped.official}
								<a
									href={grouped.official}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/60 hover:bg-primary/20"
								>
									<ExternalLink class="size-3.5" /> Official site
								</a>
							{/if}
						</div>
					</div>

					<!-- Rounds -->
					{#if grouped.rounds.length > 0}
						<div class="flex flex-col gap-3 p-3 sm:p-4">
							{#each grouped.rounds as round (round.key)}
								<div class="rounded-xl border border-border/60 bg-background/50 p-4">
									<!-- Round header -->
									{#if round.title}
										<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
											<div class="flex flex-wrap items-center gap-2">
												<h3 class="text-sm font-semibold tracking-wide text-foreground uppercase">
													{round.title}
												</h3>
												{#if round.majorCategory && round.majorCategory !== round.title}
													<span
														class="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground"
													>
														{round.majorCategory}
													</span>
												{/if}
											</div>
											{#if round.duration}
												<span
													class="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
												>
													<Clock class="size-3.5" />
													{round.duration} min
												</span>
											{/if}
										</div>
									{/if}

									<!-- Round file links -->
									{#if round.files.length > 0}
										<div class="mb-3 flex flex-wrap gap-1.5">
											{#each round.files as f (f.url + f.label)}
												{@render fileLink(f)}
											{/each}
										</div>
									{/if}

									<!-- Problems in this round -->
									{#if round.problems.length > 0}
										<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
											{#each round.problems as problem (problem.id)}
												{@const problemFiles = resourceFiles(problem)}
												<div
													id={problem.id}
													class="flex scroll-mt-24 items-center justify-between gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5"
												>
													<div class="flex min-w-0 flex-col gap-0.5">
														<div class="flex min-w-0 items-baseline gap-2">
															<span
																class="shrink-0 font-mono text-sm font-semibold text-primary tabular-nums"
															>
																{problem.number}
															</span>
															{#if problem.name}
																<span class="text-sm leading-snug font-medium text-foreground">
																	{problem.name}
																</span>
															{/if}
														</div>
														{#if problem.author}
															<span class="text-xs text-muted-foreground">by {problem.author}</span>
														{/if}
													</div>
													<div class="flex shrink-0 items-center gap-1.5">
														{#each problemFiles as f (f.url + f.label)}
															{@render fileCircle(f)}
														{/each}
														{#if problem.maxScore}
															<span
																class="ml-0.5 font-mono text-xs whitespace-nowrap text-muted-foreground"
															>
																{problem.maxScore} pts
															</span>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="px-5 py-6 text-sm text-muted-foreground">
							No files available for this year yet.
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<SearchEmptyState
			message="No results found"
			hint="Try a different year, location, or problem name."
			onClear={() => {
				query = '';
			}}
		/>
	{/if}
</section>
