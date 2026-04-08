<script lang="ts">
	const { contestId }: { contestId: string } = $props();
	import { competitions } from '$lib/competitions';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import SearchEmptyState from '$lib/components/SearchEmptyState.svelte';
	import OfficialResultsPanel from '$lib/components/OfficialResultsPanel.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';

	// Find the competition by ID
	const competition = $derived(competitions.find(c => c.id === contestId));
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

	function showYearLevel(edition: (typeof filtered extends () => infer R ? R : never)[number]) {
		const q = query.trim().toLowerCase();
		return !q || String(edition.year).includes(q) || (edition.location?.toLowerCase().includes(q) ?? false) || showFullYear;
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
					<div class="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-2.5">
						<div class="flex items-center gap-3">
							<span class="font-mono text-lg font-semibold tabular-nums text-foreground">
								{edition.year}
							</span>
							{#if edition.location}
								<span class="text-sm text-muted-foreground">
									{edition.location}
								</span>
							{/if}
						</div>
						{#if edition.link}
							<Badge variant="outline" href={edition.link} target="_blank">
								Official Site
							</Badge>
						{/if}
					</div>

					<div class="flex flex-col gap-4 p-4">

						<!-- Year-level links (if available) -->
						{#if showYearLevel(edition) && edition.papers && edition.papers.length > 0}
							<div class="flex flex-wrap items-center gap-2">
								{#each edition.papers as paper}
									{#if paper.category}
										<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
											{paper.category}:
										</span>
									{/if}
									{#if paper.link}
										<Badge variant="outline" href={paper.link} target="_blank">
											Problems
										</Badge>
									{/if}
									{#if paper.solutionLink}
										<Badge variant="outline" href={paper.solutionLink} target="_blank">
											Solutions
										</Badge>
									{/if}
									{#if paper.gradingScheme}
										<Badge variant="outline" href={paper.gradingScheme} target="_blank">
											Grading Scheme
										</Badge>
									{/if}
									{#if paper.answerSheet}
										<Badge variant="outline" href={paper.answerSheet} target="_blank">
											Answer Sheet
										</Badge>
									{/if}
								{/each}
								{#if edition.problemsLink}
									<Badge variant="outline" href={edition.problemsLink} target="_blank">
										All Problems
									</Badge>
								{/if}
							</div>
						{/if}

						{#if showYearLevel(edition)}
							<OfficialResultsPanel edition={edition} filteredProblems={edition.matchedProblems ?? edition.problems} />
						{/if}

						<!-- Problem cards grid -->
						{#if edition.matchedProblems && edition.matchedProblems.length > 0}
							<div class="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-3">
								{#each edition.matchedProblems as problem (problem.id)}
									<div class="flex flex-col gap-3 rounded-xl bg-background p-4">
										<!-- Problem identifier + title -->
										<div class="flex flex-col gap-0.5">
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
											<span class="text-sm font-medium leading-snug text-left text-foreground">
												{problem.name}
											</span>
											{#if problem.author}
												<span class="text-xs text-muted-foreground italic">
													by {problem.author}
												</span>
											{/if}
											{#if problem.category}
												<span class="text-xs text-primary font-medium">
													{problem.category}
												</span>
											{/if}
										</div>
										<!-- File links -->
										<div class="flex flex-wrap gap-1.5">
											{#if problem.link}
												<Badge
													variant="outline"
													href={problem.link}
													target="_blank"
												>
													Problem
												</Badge>
											{/if}
											{#if problem.solutionLink}
												<Badge
													variant="outline"
													href={problem.solutionLink}
													target="_blank"
												>
													Solution
												</Badge>
											{/if}
										</div>
									</div>
								{/each}
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
			onClear={() => { query = ''; }}
		/>
	{/if}
</section>
