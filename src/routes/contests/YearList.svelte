<script lang="ts">
	const { contestId }: { contestId: string } = $props();
	import { competitions } from '$lib/competitions';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import SearchEmptyState from '$lib/components/SearchEmptyState.svelte';
	import OfficialResultsPanel from '$lib/components/OfficialResultsPanel.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';

	// Find the competition by ID
	const competition = $derived(competitions.find((c) => c.id === contestId));
	const editions = $derived(competition?.editions ?? []);

	let query = $state('');
	let showFullYear = $state(false);

	const filtered = $derived(() => {
		const q = query.trim().toLowerCase();
		if (!q) return editions.map((ed) => ({ ...ed, matchedProblems: ed.problems }));

		const results = [];
		for (const edition of editions) {
			const yearMatches = String(edition.year).includes(q);
			const locationMatches = edition.location?.toLowerCase().includes(q) ?? false;
			const matchedProblems = edition.problems.filter(
				(p) =>
					p.name?.toLowerCase().includes(q) ||
					p.number?.toLowerCase().includes(q) ||
					p.author?.toLowerCase().includes(q) ||
					p.category?.toLowerCase().includes(q)
			);

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

	const hasProblemMatches = $derived(() => {
		const q = query.trim().toLowerCase();
		if (!q) return false;
		return editions.some(
			(ed) =>
				!String(ed.year).includes(q) &&
				!(ed.location?.toLowerCase().includes(q) ?? false) &&
				ed.problems.some(
					(p) =>
						p.name?.toLowerCase().includes(q) ||
						p.number?.toLowerCase().includes(q) ||
						p.author?.toLowerCase().includes(q) ||
						p.category?.toLowerCase().includes(q)
				)
		);
	});

	type FilteredEdition = (typeof filtered extends () => infer R ? R : never)[number];
	type PaperItem = FilteredEdition['papers'][number];
	type ProblemItem = FilteredEdition['matchedProblems'][number];
	type MajorGroupName = 'Data Analysis' | 'Theory' | 'Practical' | 'Observation' | 'Team/Group';

	function showYearLevel(edition: FilteredEdition) {
		const q = query.trim().toLowerCase();
		return (
			!q ||
			String(edition.year).includes(q) ||
			(edition.location?.toLowerCase().includes(q) ?? false) ||
			showFullYear
		);
	}

	function getMajorGrouping(edition: FilteredEdition, includePapers: boolean) {
		const order: MajorGroupName[] = [
			'Theory',
			'Practical',
			'Data Analysis',
			'Observation',
			'Team/Group'
		];
		const groups: Record<
			MajorGroupName,
			{ name: MajorGroupName; papers: PaperItem[]; problems: ProblemItem[] }
		> = {
			'Data Analysis': { name: 'Data Analysis', papers: [], problems: [] },
			Theory: { name: 'Theory', papers: [], problems: [] },
			Practical: { name: 'Practical', papers: [], problems: [] },
			Observation: { name: 'Observation', papers: [], problems: [] },
			'Team/Group': { name: 'Team/Group', papers: [], problems: [] }
		};
		const categoryToMajor: Record<string, MajorGroupName> = {};
		const ungroupedPapers: PaperItem[] = [];
		const ungroupedProblems: ProblemItem[] = [];
		const inferMajorGroup = (value?: string): MajorGroupName | undefined => {
			if (!value) return undefined;
			const normalized = value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
			if (normalized.startsWith('data analysis')) return 'Data Analysis';
			if (
				normalized.startsWith('theory') ||
				normalized.startsWith('long') ||
				normalized.startsWith('short')
			)
				return 'Theory';
			if (normalized.startsWith('observation') || normalized.startsWith('planetarium'))
				return 'Observation';
			if (normalized.startsWith('team/group') || normalized.startsWith('team group'))
				return 'Team/Group';
			if (normalized.startsWith('practical') || normalized.startsWith('experimental'))
				return 'Practical';
			return undefined;
		};

		if (includePapers) {
			for (const paper of edition.papers ?? []) {
				const raw = paper.majorCategory as string | undefined;
				const paperMajor = inferMajorGroup(raw) ?? inferMajorGroup(paper.category);
				if (paperMajor) {
					groups[paperMajor].papers.push(paper);
				} else {
					ungroupedPapers.push(paper);
				}
				if (paperMajor && paper.category) {
					categoryToMajor[paper.category] = paperMajor;
					const baseCategory = paper.category
						.replace(/\s+solutions?$/i, '')
						.replace(/\s+answer\s*sheet$/i, '')
						.replace(/\s+part\s+\d+$/i, '')
						.trim();
					if (baseCategory) {
						categoryToMajor[baseCategory] = paperMajor;
					}
				}
			}
		}

		for (const problem of edition.matchedProblems ?? []) {
			const mappedMajor =
				(problem.category && categoryToMajor[problem.category]) ||
				inferMajorGroup(problem.category);
			if (mappedMajor) {
				groups[mappedMajor].problems.push(problem);
			} else {
				ungroupedProblems.push(problem);
			}
		}

		const grouped = order
			.map((name) => groups[name])
			.filter(
				(
					group
				): group is { name: MajorGroupName; papers: PaperItem[]; problems: ProblemItem[] } => {
					return group.papers.length > 0 || group.problems.length > 0;
				}
			);

		return { grouped, ungroupedPapers, ungroupedProblems };
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
				<div class="overflow-hidden rounded-2xl border border-border bg-card">
					<!-- Year header -->
					<div
						class="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-2.5"
					>
						<div class="flex items-center gap-3">
							<span class="font-mono text-lg font-semibold text-foreground tabular-nums">
								{edition.year}
							</span>
							{#if edition.location}
								<span class="text-sm text-muted-foreground">
									{edition.location}
								</span>
							{/if}
						</div>
						{#if edition.link}
							<Badge variant="outline" href={edition.link} target="_blank">Official Site</Badge>
						{/if}
					</div>

					<div class="flex flex-col gap-4 p-4">
						{#if showYearLevel(edition)}
							<OfficialResultsPanel
								{edition}
								filteredProblems={edition.matchedProblems ?? edition.problems}
							/>
						{/if}

						<!-- Major-category boxes -->
						{#if (showYearLevel(edition) && edition.papers && edition.papers.length > 0) || (edition.matchedProblems && edition.matchedProblems.length > 0)}
							{@const grouping = getMajorGrouping(edition, showYearLevel(edition))}
							<div class="flex flex-col gap-3">
								{#each grouping.grouped as group (group.name)}
									<div class="rounded-lg border border-border/70 bg-background/70 p-3">
										<div
											class="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
										>
											{group.name}
										</div>

										{#if showYearLevel(edition) && group.papers.length > 0}
											<div class="mb-3 flex flex-wrap items-center gap-1.5">
												{#each group.papers as paper (`${paper.category ?? ''}-${paper.link ?? ''}-${paper.solutionLink ?? ''}-${paper.gradingScheme ?? ''}-${paper.answerSheet ?? ''}`)}
													{#if paper.link}
														<Badge variant="outline" href={paper.link} target="_blank"
															>{paper.category ? `${paper.category} ` : ''}Problems</Badge
														>
													{/if}
													{#if paper.solutionLink}
														<Badge variant="outline" href={paper.solutionLink} target="_blank"
															>{paper.category ? `${paper.category} ` : ''}Solutions</Badge
														>
													{/if}
													{#if paper.gradingScheme}
														<Badge variant="outline" href={paper.gradingScheme} target="_blank"
															>{paper.category ? `${paper.category} ` : ''}Grading Scheme</Badge
														>
													{/if}
													{#if paper.answerSheet}
														<Badge variant="outline" href={paper.answerSheet} target="_blank"
															>{paper.category ? `${paper.category} ` : ''}Answer Sheet</Badge
														>
													{/if}
												{/each}
											</div>
										{/if}

										{#if group.problems.length > 0}
											<div class="grid grid-cols-1 gap-2 xs:grid-cols-2 xl:grid-cols-3">
												{#each group.problems as problem (problem.id)}
													<div
														class="flex flex-col gap-2 rounded-md border border-border/60 bg-background p-3"
													>
														<div class="flex items-center gap-2">
															<span class="font-mono text-sm font-semibold text-primary"
																>Problem {problem.number}</span
															>
															{#if problem.maxScore}
																<span class="text-xs text-muted-foreground"
																	>({problem.maxScore} pts)</span
																>
															{/if}
														</div>
														<span class="text-left text-sm leading-snug font-medium text-foreground"
															>{problem.name}</span
														>
														{#if problem.category}
															<span class="text-xs font-medium text-primary"
																>{problem.category}</span
															>
														{/if}
														<div class="flex flex-wrap gap-1.5">
															{#if problem.link}
																<Badge variant="outline" href={problem.link} target="_blank"
																	>Problem</Badge
																>
															{/if}
															{#if problem.solutionLink}
																<Badge variant="outline" href={problem.solutionLink} target="_blank"
																	>Solution</Badge
																>
															{/if}
															{#if problem.answerSheet}
																<Badge variant="outline" href={problem.answerSheet} target="_blank"
																	>Answer Sheet</Badge
																>
															{/if}
															{#if problem.gradingScheme}
																<Badge
																	variant="outline"
																	href={problem.gradingScheme}
																	target="_blank">Grading Scheme</Badge
																>
															{/if}
														</div>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/each}

								{#if (showYearLevel(edition) && grouping.ungroupedPapers.length > 0) || grouping.ungroupedProblems.length > 0}
									<div class="flex flex-col gap-3">
										{#if showYearLevel(edition) && grouping.ungroupedPapers.length > 0}
											<div class="flex flex-wrap items-center gap-1.5">
												{#each grouping.ungroupedPapers as paper (`${paper.category ?? ''}-${paper.link ?? ''}-${paper.solutionLink ?? ''}-${paper.gradingScheme ?? ''}-${paper.answerSheet ?? ''}`)}
													{#if paper.link}
														<Badge variant="outline" href={paper.link} target="_blank"
															>{paper.category ? `${paper.category} ` : ''}Problems</Badge
														>
													{/if}
													{#if paper.solutionLink}
														<Badge variant="outline" href={paper.solutionLink} target="_blank"
															>{paper.category ? `${paper.category} ` : ''}Solutions</Badge
														>
													{/if}
													{#if paper.gradingScheme}
														<Badge variant="outline" href={paper.gradingScheme} target="_blank"
															>{paper.category ? `${paper.category} ` : ''}Grading Scheme</Badge
														>
													{/if}
													{#if paper.answerSheet}
														<Badge variant="outline" href={paper.answerSheet} target="_blank"
															>{paper.category ? `${paper.category} ` : ''}Answer Sheet</Badge
														>
													{/if}
												{/each}
											</div>
										{/if}

										{#if grouping.ungroupedProblems.length > 0}
											<div class="grid grid-cols-1 gap-2 xs:grid-cols-2 xl:grid-cols-3">
												{#each grouping.ungroupedProblems as problem (problem.id)}
													<div
														class="flex flex-col gap-2 rounded-md border border-border/60 bg-background p-3"
													>
														<div class="flex items-center gap-2">
															<span class="font-mono text-sm font-semibold text-primary"
																>Problem {problem.number}</span
															>
															{#if problem.maxScore}
																<span class="text-xs text-muted-foreground"
																	>({problem.maxScore} pts)</span
																>
															{/if}
														</div>
														<span class="text-left text-sm leading-snug font-medium text-foreground"
															>{problem.name}</span
														>
														{#if problem.category}
															<span class="text-xs font-medium text-primary"
																>{problem.category}</span
															>
														{/if}
														<div class="flex flex-wrap gap-1.5">
															{#if problem.link}
																<Badge variant="outline" href={problem.link} target="_blank"
																	>Problem</Badge
																>
															{/if}
															{#if problem.solutionLink}
																<Badge variant="outline" href={problem.solutionLink} target="_blank"
																	>Solution</Badge
																>
															{/if}
															{#if problem.answerSheet}
																<Badge variant="outline" href={problem.answerSheet} target="_blank"
																	>Answer Sheet</Badge
																>
															{/if}
															{#if problem.gradingScheme}
																<Badge
																	variant="outline"
																	href={problem.gradingScheme}
																	target="_blank">Grading Scheme</Badge
																>
															{/if}
														</div>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/if}

								{#if showYearLevel(edition) && edition.problemsLink}
									<div class="rounded-lg border border-border/70 bg-background/70 p-3">
										<div
											class="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
										>
											Archive
										</div>
										<Badge variant="outline" href={edition.problemsLink} target="_blank"
											>All Problems</Badge
										>
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
