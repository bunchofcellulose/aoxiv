<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import type { Paper, Problem } from '$lib/competitions';

	const {
		edition,
		filteredProblems
	}: {
		edition: {
			papers: Paper[];
		};
		filteredProblems: Problem[];
	} = $props();

	type ResultsPaper = {
		category?: string;
		examDuration?: number;
		scores?: unknown;
	};

	type HistogramBucket = { label: string; count: number };
	type SummaryStats = { n: number; mean: number; median: number; min: number; max: number };

	type RenderPaper = {
		category?: string;
		examDuration?: number;
		totalMax: number;
		overallStats: SummaryStats | null;
		overallHistogram: HistogramBucket[];
		maxOverallBar: number;
	};

	const normalizeScoreMatrix = (scores: unknown): number[][] => {
		if (!Array.isArray(scores) || scores.length === 0) return [];
		if (scores.every((value) => typeof value === 'number')) return [scores as number[]];
		if (scores.every((value) => Array.isArray(value))) {
			return (scores as unknown[]).map((row) =>
				Array.isArray(row) ? row.filter((v): v is number => typeof v === 'number') : []
			);
		}
		return [];
	};

	const getBucketedHistogram = (values: number[], bucketCount = 12) => {
		if (values.length === 0) return [];
		const min = Math.min(...values);
		const max = Math.max(...values);
		if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
		if (min === max) return [{ label: `${min.toFixed(1)}`, count: values.length }];

		const step = (max - min) / bucketCount;
		const bins = Array.from({ length: bucketCount }, (_, i) => ({
			from: min + i * step,
			to: i === bucketCount - 1 ? max : min + (i + 1) * step,
			count: 0
		}));

		for (const value of values) {
			let idx = Math.floor((value - min) / step);
			if (idx >= bucketCount) idx = bucketCount - 1;
			if (idx < 0) idx = 0;
			bins[idx].count += 1;
		}

		return bins.map((bin) => ({
			label: `${bin.from.toFixed(0)}-${bin.to.toFixed(0)}`,
			count: bin.count
		}));
	};

	const getStats = (values: number[]) => {
		if (values.length === 0) return null;
		const sorted = [...values].sort((a, b) => a - b);
		const n = sorted.length;
		const mean = sorted.reduce((sum, value) => sum + value, 0) / n;
		const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[(n - 1) / 2];
		return {
			n,
			mean,
			median,
			min: sorted[0],
			max: sorted[n - 1]
		};
	};

	const toOverallScores = (matrix: number[][]) => {
		if (matrix.length === 0) return [];
		const participantCount = Math.max(...matrix.map((row) => row.length), 0);
		const totals = Array.from({ length: participantCount }, () => 0);
		matrix.forEach((row) => {
			row.forEach((score, i) => {
				if (typeof score === 'number' && Number.isFinite(score)) {
					totals[i] += score;
				}
			});
		});
		return totals;
	};

	const scorePapers = $derived(
		edition.papers
			.map((paper) => paper as ResultsPaper)
			.map((paper): RenderPaper | null => {
				const scoreMatrix = normalizeScoreMatrix(paper.scores);
				if (scoreMatrix.length === 0) return null;

				const problemMaxByCategory = filteredProblems
					.filter(
						(problem) => !paper.category || !problem.category || problem.category === paper.category
					)
					.map((problem) => problem.maxScore ?? 20);
				const totalMax = problemMaxByCategory.reduce((sum, value) => sum + value, 0);

				const overallScores = toOverallScores(scoreMatrix);
				const overallStats = getStats(overallScores);
				const overallHistogram = getBucketedHistogram(overallScores);
				const maxOverallBar = Math.max(...overallHistogram.map((b) => b.count), 1);

				return {
					category: paper.category,
					examDuration: paper.examDuration,
					totalMax,
					overallStats,
					overallHistogram,
					maxOverallBar
				};
			})
			.filter((paper): paper is RenderPaper => paper !== null)
	);
</script>

{#if scorePapers.length > 0}
	<div class="rounded-xl border border-border bg-background p-4">
		<details class="group">
			<summary
				class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md px-1 py-1 text-left hover:bg-muted/40"
			>
				<div class="flex items-center gap-2">
					<Badge variant="secondary">Official Results</Badge>
					<span class="text-sm text-muted-foreground"
						>Overall score distribution and summary statistics</span
					>
				</div>
				<span class="text-xs font-medium text-muted-foreground group-open:hidden">Show</span>
				<span class="hidden text-xs font-medium text-muted-foreground group-open:inline">Hide</span>
			</summary>

			<div class="mt-4 flex flex-col gap-4">
				{#each scorePapers as paper, i (i)}
					<div class="rounded-lg border border-border/80 bg-card p-4">
						<div class="mb-3 flex flex-wrap items-center gap-2">
							<Badge variant="outline">{paper.category ?? 'General'}</Badge>
							{#if paper.examDuration !== undefined}
								<Badge variant="outline">Duration: {paper.examDuration} min</Badge>
							{/if}
						</div>

						<div>
							<p class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
								Overall score distribution
							</p>
							<div class="rounded-md border border-border/70 bg-background/60 p-2">
								<svg viewBox="0 0 560 230" class="h-56 w-full">
									<line
										x1="44"
										y1="170"
										x2="540"
										y2="170"
										stroke="currentColor"
										class="text-border"
									/>
									<line
										x1="44"
										y1="20"
										x2="44"
										y2="170"
										stroke="currentColor"
										class="text-border"
									/>

									{#each paper.overallHistogram as bucket, idx (idx)}
										<rect
											x={46 + idx * (490 / Math.max(paper.overallHistogram.length, 1))}
											y={170 - (bucket.count / paper.maxOverallBar) * 140}
											width={Math.max(490 / Math.max(paper.overallHistogram.length, 1) - 2, 1)}
											height={(bucket.count / paper.maxOverallBar) * 140}
											class="fill-primary/80"
										/>
									{/each}
								</svg>
								<div
									class="mt-2 flex items-center justify-between text-[10px] text-muted-foreground"
								>
									<span>{paper.overallHistogram[0]?.label ?? ''}</span>
									<span class="font-mono">max freq: {paper.maxOverallBar}</span>
									<span
										>{paper.overallHistogram[paper.overallHistogram.length - 1]?.label ?? ''}</span
									>
								</div>
							</div>
						</div>

						{#if paper.overallStats}
							<div class="mt-4 overflow-x-auto rounded-md border border-border/70">
								<table class="w-full min-w-[420px] text-xs">
									<thead class="bg-muted/50 text-muted-foreground">
										<tr>
											<th class="px-3 py-2 text-left font-semibold">Metric</th>
											<th class="px-3 py-2 text-left font-semibold">Overall</th>
										</tr>
									</thead>
									<tbody>
										<tr class="border-t border-border/70">
											<td class="px-3 py-2 font-medium">Participants</td>
											<td class="px-3 py-2 font-mono">{paper.overallStats.n}</td>
										</tr>
										<tr class="border-t border-border/70">
											<td class="px-3 py-2 font-medium">Mean</td>
											<td class="px-3 py-2 font-mono">{paper.overallStats.mean.toFixed(2)}</td>
										</tr>
										<tr class="border-t border-border/70">
											<td class="px-3 py-2 font-medium">Median</td>
											<td class="px-3 py-2 font-mono">{paper.overallStats.median.toFixed(2)}</td>
										</tr>
										<tr class="border-t border-border/70">
											<td class="px-3 py-2 font-medium">Min / Max</td>
											<td class="px-3 py-2 font-mono">
												{paper.overallStats.min.toFixed(2)} / {paper.overallStats.max.toFixed(2)}
											</td>
										</tr>
										<tr class="border-t border-border/70">
											<td class="px-3 py-2 font-medium">Max possible</td>
											<td class="px-3 py-2 font-mono"
												>{paper.totalMax > 0 ? paper.totalMax.toFixed(2) : '-'}</td
											>
										</tr>
									</tbody>
								</table>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</details>
	</div>
{/if}
