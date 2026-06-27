<script lang="ts">
	const { contestId }: { contestId: string } = $props();
	import { competitions } from '$lib/competitions';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import SearchEmptyState from '$lib/components/SearchEmptyState.svelte';
	import OfficialResultsPanel from '$lib/components/OfficialResultsPanel.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';

	// ---------------------------------------------------------------------------
	// Types (derived from the data shape, not hardcoded union literals)
	// ---------------------------------------------------------------------------

	type Competition = (typeof competitions)[number];
	type Edition = Competition['editions'][number];
	type PaperItem = Edition['papers'][number];
	type ProblemItem = Edition['problems'][number];

	interface MatchedEdition extends Edition {
		matchedProblems: ProblemItem[];
	}

	interface MajorGroup {
		name: string;
		papers: PaperItem[];
		problems: ProblemItem[];
	}

	interface Grouping {
		grouped: MajorGroup[];
		ungroupedPapers: PaperItem[];
		ungroupedProblems: ProblemItem[];
	}

	// ---------------------------------------------------------------------------
	// Known groups — controls display order; anything else sorts alphabetically
	// ---------------------------------------------------------------------------

	const KNOWN_ORDER = [
		'Overall',
		'Theory',
		'Practical',
		'Data Analysis',
		'Observation',
		'Group',
		'Team'
	] as const;

	// ---------------------------------------------------------------------------
	// State
	// ---------------------------------------------------------------------------

	const competition = $derived(competitions.find((c) => c.id === contestId));
	const editions = $derived(competition?.editions ?? []);

	let query = $state('');
	let showFullYear = $state(false);

	// ---------------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------------

	function matchesProblem(p: ProblemItem, q: string): boolean {
		return (
			(p.name?.toLowerCase().includes(q) ?? false) ||
			(p.number?.toLowerCase().includes(q) ?? false) ||
			(p.author?.toLowerCase().includes(q) ?? false) ||
			(p.category?.toLowerCase().includes(q) ?? false)
		);
	}

	/**
	 * Infer a canonical major-group name from a raw string.
	 * Returns undefined when no known prefix matches — callers can then
	 * fall back to using the raw value directly.
	 */
	function inferMajorGroup(value: string | undefined): string | undefined {
		if (!value) return undefined;
		const n = value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
		if (n.startsWith('data analysis')) return 'Data Analysis';
		if (n.startsWith('theory') || n.startsWith('long') || n.startsWith('short')) return 'Theory';
		if (n.startsWith('observation') || n.startsWith('planetarium')) return 'Observation';
		if (n.startsWith('group')) return 'Group';
		if (n.startsWith('team')) return 'Team';
		if (n.startsWith('practical') || n.startsWith('experimental')) return 'Practical';
		if (n.startsWith('overall')) return 'Overall';
		return undefined;
	}

	/**
	 * Resolve the major-group name for a paper.
	 * Priority: explicit majorCategory string → infer from majorCategory → infer from category.
	 */
	function resolvePaperMajor(paper: PaperItem): string | undefined {
		const raw = (paper as Record<string, unknown>).majorCategory as string | undefined;
		if (raw && raw.trim()) return raw.trim();
		return inferMajorGroup(raw) ?? inferMajorGroup(paper.category);
	}

	function sortGroups(groups: MajorGroup[]): MajorGroup[] {
		return groups.slice().sort((a, b) => {
			const ai = KNOWN_ORDER.indexOf(a.name as (typeof KNOWN_ORDER)[number]);
			const bi = KNOWN_ORDER.indexOf(b.name as (typeof KNOWN_ORDER)[number]);
			if (ai !== -1 && bi !== -1) return ai - bi;
			if (ai !== -1) return -1;
			if (bi !== -1) return 1;
			return a.name.localeCompare(b.name);
		});
	}

	function getMajorGrouping(edition: MatchedEdition, includePapers: boolean): Grouping {
		const groupMap = new Map<string, MajorGroup>();
		const categoryToMajor: Record<string, string> = {};
		const ungroupedPapers: PaperItem[] = [];
		const ungroupedProblems: ProblemItem[] = [];

		function getOrCreate(name: string): MajorGroup {
			let g = groupMap.get(name);
			if (!g) {
				g = { name, papers: [], problems: [] };
				groupMap.set(name, g);
			}
			return g;
		}

		// --- Papers ---
		if (includePapers) {
			for (const paper of edition.papers ?? []) {
				const major = resolvePaperMajor(paper);
				if (major) {
					getOrCreate(major).papers.push(paper);
					if (paper.category) {
						categoryToMajor[paper.category] = major;
						// Also map the base category (strip suffixes like "Solutions", "Part 1")
						const base = paper.category
							.replace(/\s+solutions?$/i, '')
							.replace(/\s+answer\s*sheet$/i, '')
							.replace(/\s+part\s+\d+$/i, '')
							.trim();
						if (base && base !== paper.category) categoryToMajor[base] = major;
					}
				} else {
					ungroupedPapers.push(paper);
				}
			}
		}

		// --- Problems ---
		for (const problem of edition.matchedProblems ?? []) {
			const major =
				(problem.category ? categoryToMajor[problem.category] : undefined) ??
				inferMajorGroup(problem.category);
			if (major) {
				getOrCreate(major).problems.push(problem);
			} else {
				ungroupedProblems.push(problem);
			}
		}

		const grouped = sortGroups(
			[...groupMap.values()].filter((g) => g.papers.length > 0 || g.problems.length > 0)
		);

		return { grouped, ungroupedPapers, ungroupedProblems };
	}

	// ---------------------------------------------------------------------------
	// Derived state
	// ---------------------------------------------------------------------------

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

	// Unique key for a paper (used in #each)
	function paperKey(paper: PaperItem): string {
		return [
			paper.category ?? '',
			(paper as Record<string, unknown>).majorCategory ?? '',
			paper.link ?? '',
			paper.solutionLink ?? '',
			paper.instructions ?? '',
			paper.gradingScheme ?? '',
			paper.answerSheet ?? '',
			(paper.additionalFiles ?? []).join(','),
			paper.results ?? '',
			paper.examDuration ?? ''
		].join('|');
	}
</script>

<section class="my-4">
	<div class="mb-4">
		<SearchBar placeholder="Search by year or problem…" bind:value={query}>
			{#snippet filters()}
				{#if hasProblemMatches()}
					<label class="flex cursor-pointer items-center gap-2">
						<Switch bind:checked={showFullYear} />
						<span class="text-sm font-medium text-muted-foreground">Show full year</span>
					</label>
				{/if}
			{/snippet}
		</SearchBar>
	</div>

	{#if filtered().length > 0}
		<div class="flex flex-col gap-4">
			{#each filtered() as edition (edition.year)}
				{@const yearVisible = showYearLevel(edition)}
				{@const grouping = getMajorGrouping(edition, yearVisible)}

				<div
					id={`year-${edition.year}`}
					class="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card"
				>
					<!-- Year header -->
					<div
						class="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-2.5"
					>
						<div class="flex items-center gap-3">
							<span class="font-mono text-lg font-semibold text-foreground tabular-nums">
								{edition.year}
							</span>
							{#if edition.location}
								<span class="text-sm text-muted-foreground">{edition.location}</span>
							{/if}
						</div>
						{#if edition.link}
							<Badge variant="outline" href={edition.link} target="_blank">Official Site</Badge>
						{/if}
					</div>

					<div class="flex flex-col gap-4 p-4">
						{#if yearVisible}
							<OfficialResultsPanel
								{edition}
								filteredProblems={edition.matchedProblems ?? edition.problems}
							/>
						{/if}

						<!-- Major-category boxes -->
						{#if grouping.grouped.length > 0 || grouping.ungroupedPapers.length > 0 || grouping.ungroupedProblems.length > 0}
							<div class="flex flex-col gap-3">
								<!-- Grouped sections -->
								{#each grouping.grouped as group (group.name)}
									<div class="rounded-lg border border-border/70 bg-background/70 p-3">
										<div
											class="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
										>
											{group.name}
										</div>

										<!-- Papers -->
										{#if yearVisible && group.papers.length > 0}
											<div class="mb-3 flex flex-wrap items-center gap-1.5">
												{#each group.papers as paper (paperKey(paper))}
													{@const categoryLabel = paper.category ?? group.name}
													{@const hasDownloads = !!(
														paper.link ||
														paper.solutionLink ||
														paper.answerSheet ||
														paper.gradingScheme ||
														paper.instructions ||
														paper.results ||
														(paper.additionalFiles?.length ?? 0) > 0
													)}
													{#if paper.examDuration}
														<Badge
															variant="secondary"
															class="bg-primary/15 text-primary hover:bg-primary/25"
														>
															<svg
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																aria-hidden="true"
															>
																<circle cx="12" cy="13" r="7"></circle>
																<path d="M12 13V9m0 4l2.5 2.5M9 2h6m-4 0v2m8.5 4.5-1.5 1.5"
																></path>
															</svg>
															{categoryLabel}
															{paper.examDuration} min{hasDownloads ? ' →' : ''}
														</Badge>
													{/if}
													{#if paper.instructions}
														<Badge variant="outline" href={paper.instructions} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Instructions
														</Badge>
													{/if}
													{#if paper.link}
														<Badge variant="outline" href={paper.link} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Problems
														</Badge>
													{/if}
													{#if paper.additionalFiles}
														{#each paper.additionalFiles as file (file)}
															<Badge variant="outline" href={file} target="_blank">
																{paper.category ? `${paper.category} ` : ''}Additional Files
															</Badge>
														{/each}
													{/if}
													{#if paper.answerSheet}
														<Badge variant="outline" href={paper.answerSheet} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Answer Sheet
														</Badge>
													{/if}
													{#if paper.solutionLink}
														<Badge variant="outline" href={paper.solutionLink} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Solutions
														</Badge>
													{/if}
													{#if paper.gradingScheme}
														<Badge variant="outline" href={paper.gradingScheme} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Grading Scheme
														</Badge>
													{/if}
													{#if paper.results}
														<Badge variant="outline" href={paper.results} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Results
														</Badge>
													{/if}
												{/each}
											</div>
										{/if}

										<!-- Problems -->
										{#if group.problems.length > 0}
											<div class="grid grid-cols-1 gap-2 xs:grid-cols-2 xl:grid-cols-3">
												{#each group.problems as problem (problem.id)}
													<div
														id={problem.id}
														class="flex scroll-mt-24 flex-col gap-2 rounded-md border border-border/60 bg-background p-3"
													>
														<div class="flex items-center gap-2">
															<span class="font-mono text-sm font-semibold text-primary">
																Problem {problem.number}
															</span>
															{#if problem.maxScore}
																<span class="text-xs text-muted-foreground">
																	({problem.maxScore} pts)
																</span>
															{/if}
														</div>
														<span
															class="text-left text-sm leading-snug font-medium text-foreground"
														>
															{problem.name}
														</span>
														{#if problem.category}
															<span class="text-xs font-medium text-primary">{problem.category}</span>
														{/if}
														<div class="flex flex-wrap gap-1.5">
															{#if problem.instructions}
																<Badge
																	variant="outline"
																	href={problem.instructions}
																	target="_blank">Instructions</Badge
																>
															{/if}
															{#if problem.link}
																<Badge variant="outline" href={problem.link} target="_blank"
																	>Problem</Badge
																>
															{/if}
															{#if problem.additionalFiles}
																{#each problem.additionalFiles as file (file)}
																	<Badge variant="outline" href={file} target="_blank"
																		>Additional Files</Badge
																	>
																{/each}
															{/if}
															{#if problem.answerSheet}
																<Badge
																	variant="outline"
																	href={problem.answerSheet}
																	target="_blank">Answer Sheet</Badge
																>
															{/if}
															{#if problem.solutionLink}
																<Badge
																	variant="outline"
																	href={problem.solutionLink}
																	target="_blank">Solution</Badge
																>
															{/if}
															{#if problem.gradingScheme}
																<Badge
																	variant="outline"
																	href={problem.gradingScheme}
																	target="_blank">Grading Scheme</Badge
																>
															{/if}
															{#if problem.results}
																<Badge variant="outline" href={problem.results} target="_blank"
																	>Results</Badge
																>
															{/if}
														</div>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/each}

								<!-- Ungrouped papers + problems -->
								{#if (yearVisible && grouping.ungroupedPapers.length > 0) || grouping.ungroupedProblems.length > 0}
									<div class="flex flex-col gap-3">
										{#if yearVisible && grouping.ungroupedPapers.length > 0}
											<div class="flex flex-wrap items-center gap-1.5">
												{#each grouping.ungroupedPapers as paper (paperKey(paper))}
													{@const categoryLabel = paper.category ?? 'Paper'}
													{@const hasDownloads = !!(
														paper.link ||
														paper.solutionLink ||
														paper.answerSheet ||
														paper.gradingScheme ||
														paper.instructions ||
														paper.results ||
														(paper.additionalFiles?.length ?? 0) > 0
													)}
													{#if paper.examDuration}
														<Badge
															variant="secondary"
															class="bg-primary/15 text-primary hover:bg-primary/25"
														>
															<svg
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																aria-hidden="true"
															>
																<circle cx="12" cy="13" r="7"></circle>
																<path d="M12 13V9m0 4l2.5 2.5M9 2h6m-4 0v2m8.5 4.5-1.5 1.5"
																></path>
															</svg>
															{categoryLabel}
															{paper.examDuration} min{hasDownloads ? ' →' : ''}
														</Badge>
													{/if}
													{#if paper.instructions}
														<Badge variant="outline" href={paper.instructions} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Instructions
														</Badge>
													{/if}
													{#if paper.link}
														<Badge variant="outline" href={paper.link} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Problems
														</Badge>
													{/if}
													{#if paper.additionalFiles}
														{#each paper.additionalFiles as file (file)}
															<Badge variant="outline" href={file} target="_blank">
																{paper.category ? `${paper.category} ` : ''}Additional Files
															</Badge>
														{/each}
													{/if}
													{#if paper.answerSheet}
														<Badge variant="outline" href={paper.answerSheet} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Answer Sheet
														</Badge>
													{/if}
													{#if paper.solutionLink}
														<Badge variant="outline" href={paper.solutionLink} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Solutions
														</Badge>
													{/if}
													{#if paper.gradingScheme}
														<Badge variant="outline" href={paper.gradingScheme} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Grading Scheme
														</Badge>
													{/if}
													{#if paper.results}
														<Badge variant="outline" href={paper.results} target="_blank">
															{paper.category ? `${paper.category} ` : ''}Results
														</Badge>
													{/if}
												{/each}
											</div>
										{/if}

										{#if grouping.ungroupedProblems.length > 0}
											<div class="grid grid-cols-1 gap-2 xs:grid-cols-2 xl:grid-cols-3">
												{#each grouping.ungroupedProblems as problem (problem.id)}
													<div
														id={problem.id}
														class="flex scroll-mt-24 flex-col gap-2 rounded-md border border-border/60 bg-background p-3"
													>
														<div class="flex items-center gap-2">
															<span class="font-mono text-sm font-semibold text-primary">
																Problem {problem.number}
															</span>
															{#if problem.maxScore}
																<span class="text-xs text-muted-foreground">
																	({problem.maxScore} pts)
																</span>
															{/if}
														</div>
														<span
															class="text-left text-sm leading-snug font-medium text-foreground"
														>
															{problem.name}
														</span>
														{#if problem.category}
															<span class="text-xs font-medium text-primary">{problem.category}</span>
														{/if}
														<div class="flex flex-wrap gap-1.5">
															{#if problem.instructions}
																<Badge
																	variant="outline"
																	href={problem.instructions}
																	target="_blank">Instructions</Badge
																>
															{/if}
															{#if problem.link}
																<Badge variant="outline" href={problem.link} target="_blank"
																	>Problem</Badge
																>
															{/if}
															{#if problem.additionalFiles}
																{#each problem.additionalFiles as file (file)}
																	<Badge variant="outline" href={file} target="_blank"
																		>Additional Files</Badge
																	>
																{/each}
															{/if}
															{#if problem.answerSheet}
																<Badge
																	variant="outline"
																	href={problem.answerSheet}
																	target="_blank">Answer Sheet</Badge
																>
															{/if}
															{#if problem.solutionLink}
																<Badge
																	variant="outline"
																	href={problem.solutionLink}
																	target="_blank">Solution</Badge
																>
															{/if}
															{#if problem.gradingScheme}
																<Badge
																	variant="outline"
																	href={problem.gradingScheme}
																	target="_blank">Grading Scheme</Badge
																>
															{/if}
															{#if problem.results}
																<Badge variant="outline" href={problem.results} target="_blank"
																	>Results</Badge
																>
															{/if}
														</div>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/if}

								<!-- Archive link -->
								{#if yearVisible && edition.problemsLink}
									<div class="rounded-lg border border-border/70 bg-background/70 p-3">
										<div
											class="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
										>
											Archive
										</div>
										<Badge variant="outline" href={edition.problemsLink} target="_blank">
											All Problems
										</Badge>
									</div>
								{/if}
							</div>
						{/if}
					</div>
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