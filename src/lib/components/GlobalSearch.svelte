<script lang="ts">
	import { goto } from '$app/navigation';
	import { getClientSearchData, type ProblemSearchItem } from '$lib/competitions';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { Dialog } from 'bits-ui';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const MAX_RESULTS = 8;
	const searchItems = getClientSearchData();

	let query = $state('');
	let focusedIndex = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);
	let resultsEl = $state<HTMLDivElement | null>(null);

	function escapeHtml(value: string) {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');
	}

	function escapeRegExp(value: string) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	// Bullet-proofed to never crash on undefined/null values
	function highlightText(value: string | number | undefined | null, q: string) {
		if (value === undefined || value === null) return '';
		const strValue = String(value);

		const normalizedQuery = q.trim().toLowerCase().replace(/\s+/g, ' ');
		if (!normalizedQuery) return escapeHtml(strValue);

		const tokens = normalizedQuery.split(' ').filter(Boolean);
		if (tokens.length === 0) return escapeHtml(strValue);

		const sortedTokens = [...tokens].sort((a, b) => b.length - a.length);
		const pattern = new RegExp(`(${sortedTokens.map(escapeRegExp).join('|')})`, 'ig');

		const parts = strValue.split(pattern);

		return parts
			.map((part, i) => {
				if (i % 2 === 1) {
					return `<mark>${escapeHtml(part)}</mark>`;
				}
				return escapeHtml(part);
			})
			.join('');
	}

	// Bullet-proofed to safely fallback to '' if ANY database property is missing
	function scoreItem(item: ProblemSearchItem, q: string) {
		const normalizedQuery = q.trim().toLowerCase().replace(/\s+/g, ' ');
		if (!normalizedQuery) return -1;

		const compName = item.compName || '';
		const yearStr = item.year ? String(item.year) : '';
		const location = item.location || '';
		const probName = item.problem?.name || '';
		const probNum = item.problem?.number ? String(item.problem.number) : '';
		const category = item.problem?.category || '';
		const author = item.problem?.author || '';

		const searchableText = [compName, yearStr, location, probName, probNum, category, author]
			.join(' ')
			.toLowerCase();

		const tokens = normalizedQuery.split(' ').filter(Boolean);
		let score = 0;
		let allTokensMatch = true;

		for (const token of tokens) {
			if (!searchableText.includes(token)) {
				allTokensMatch = false;
				break;
			}
			score += 10;
			if (probName.toLowerCase().includes(token)) score += 20;
			if (probNum.toLowerCase() === token) score += 15;
			if (compName.toLowerCase().includes(token)) score += 10;
		}

		if (!allTokensMatch) return -1;
		if (searchableText.includes(normalizedQuery)) score += 50;

		return score;
	}

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];

		return searchItems
			.map((item) => ({ item, score: scoreItem(item, q) }))
			.filter(({ score }) => score >= 0)
			.sort((a, b) => {
				// Bullet-proofed sorting
				if (b.score !== a.score) return b.score - a.score;
				const yearA = a.item.year || 0;
				const yearB = b.item.year || 0;
				if (yearB !== yearA) return yearB - yearA;
				const nameA = a.item.compName || '';
				const nameB = b.item.compName || '';
				return nameA.localeCompare(nameB);
			})
			.slice(0, MAX_RESULTS)
			.map(({ item }) => item);
	});

	// Mirrors Phoxiv: Resets focused element securely when query changes
	$effect(() => {
		query;
		focusedIndex = 0;
	});

	// Reset purely on open
	$effect(() => {
		if (open) {
			query = '';
			focusedIndex = 0;
		}
	});

	function openSearch() {
		open = true;
		query = '';
		focusedIndex = 0;
	}

	function closeSearch() {
		open = false;
		query = '';
	}

	function navigateTo(item: ProblemSearchItem) {
		closeSearch();
		goto(`/contests/${item.compId}#${item.problemId}`);
	}

	function resourceLinks(item: ProblemSearchItem) {
		return [
			{ label: 'Problem', href: item.problem?.link },
			{ label: 'Solution', href: item.problem?.solutionLink },
			{ label: 'Answer Sheet', href: item.problem?.answerSheet },
			{ label: 'Grading Scheme', href: item.problem?.gradingScheme },
			{ label: 'Results', href: item.problem?.results },
			{ label: 'Instructions', href: item.problem?.instructions }
		].filter((link): link is { label: string; href: string } => Boolean(link.href));
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			open ? closeSearch() : openSearch();
			return;
		}

		if (!open) return;

		if (event.key === 'ArrowDown' && results.length > 0) {
			event.preventDefault();
			focusedIndex = Math.min(focusedIndex + 1, results.length - 1);
			queueMicrotask(() => {
				(
					resultsEl?.querySelectorAll('[data-search-result]')[focusedIndex] as
						| HTMLButtonElement
						| undefined
				)?.scrollIntoView({ block: 'nearest' });
			});
			return;
		}

		if (event.key === 'ArrowUp' && results.length > 0) {
			event.preventDefault();
			focusedIndex = Math.max(focusedIndex - 1, 0);
			queueMicrotask(() => {
				(
					resultsEl?.querySelectorAll('[data-search-result]')[focusedIndex] as
						| HTMLButtonElement
						| undefined
				)?.scrollIntoView({ block: 'nearest' });
			});
			return;
		}

		if (event.key === 'Enter' && results[focusedIndex]) {
			event.preventDefault();
			navigateTo(results[focusedIndex]);
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/55 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:duration-150 data-open:fade-in-0 data-closed:animate-out data-closed:duration-150 data-closed:fade-out-0"
		/>

		<div
			class="pointer-events-none fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]"
		>
			<Dialog.Content
				class="pointer-events-auto flex h-[min(38rem,72vh)] w-full max-w-xl flex-col overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm data-open:animate-in data-open:duration-150 data-open:fade-in-0 data-open:zoom-in-[0.96] data-closed:animate-out data-closed:duration-150 data-closed:fade-out-0 data-closed:zoom-out-[0.96]"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					inputEl?.focus();
				}}
			>
				<Dialog.Title class="sr-only">Search problems</Dialog.Title>

				<div class="flex items-center gap-2 border-b border-border/70 px-4 py-3.5">
					<SearchIcon class="size-4 shrink-0 text-muted-foreground/90" aria-hidden="true" />

					<input
						bind:this={inputEl}
						bind:value={query}
						type="search"
						placeholder="search..."
						class="min-w-0 flex-1 border-0 bg-transparent p-0 text-[0.98rem] text-foreground outline-none placeholder:text-muted-foreground/80 focus:ring-0"
					/>

					<Dialog.Close
						class={cn(
							buttonVariants({ variant: 'ghost', size: 'icon' }),
							'h-7 w-7 text-muted-foreground hover:text-foreground'
						)}
						aria-label="Close search"
					>
						<XIcon class="size-4" />
					</Dialog.Close>
				</div>

				<div bind:this={resultsEl} class="min-h-0 flex-1 overflow-y-auto">
					{#if !query.trim()}
						<div class="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
							<p class="text-sm text-muted-foreground">
								Start typing to search problems across all contests.
							</p>
							<p class="text-xs text-muted-foreground">Press Esc to close.</p>
						</div>
					{:else if results.length === 0}
						<div class="flex h-full items-center justify-center px-6 text-center">
							<p class="text-sm text-muted-foreground">No problems found.</p>
						</div>
					{:else}
						<ul class="flex flex-col gap-2 p-2">
							{#each results as item, index (item.problemId)}
								<li class="overflow-hidden rounded-2xl border border-border/60 bg-card">
									<button
										data-search-result
										type="button"
										onclick={() => navigateTo(item)}
										onmouseenter={() => (focusedIndex = index)}
										class={cn(
											'flex w-full flex-col gap-2.5 px-4 py-3.5 text-left transition-colors hover:bg-muted/60',
											index === focusedIndex && 'bg-muted/60'
										)}
									>
										<div class="flex items-start gap-2.5">
											{#if item.compIcon?.startsWith('/')}
												<img
													src={item.compIcon}
													alt=""
													aria-hidden="true"
													class="mt-0.5 h-5 w-5 shrink-0 object-contain opacity-80"
												/>
											{:else}
												<span
													class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-sm leading-none opacity-80"
												>
													{item.compIcon}
												</span>
											{/if}

											<div class="min-w-0 flex-1">
												<div
													class="flex flex-wrap items-center gap-1 text-[0.95rem] text-muted-foreground"
												>
													<span class="truncate">{@html highlightText(item.compName, query)}</span>
													<span aria-hidden="true">·</span>
													<span class="font-mono tabular-nums"
														>{@html highlightText(item.year, query)}</span
													>
													{#if item.location}
														<span aria-hidden="true">·</span>
														<span>{@html highlightText(item.location, query)}</span>
													{/if}
												</div>

												<div class="mt-1 flex items-baseline gap-2">
													<span class="font-mono text-sm font-bold tracking-tight text-primary">
														{item.problem?.number}
													</span>
													<span class="text-sm font-semibold tracking-tight text-foreground">
														{@html highlightText(item.problem?.name, query)}
													</span>
												</div>

												{#if item.problem?.author || item.problem?.category}
													<div
														class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
													>
														{#if item.problem.category}
															<span>{item.problem.category}</span>
														{/if}
														{#if item.problem.author}
															<span>by {item.problem.author}</span>
														{/if}
													</div>
												{/if}
											</div>
										</div>
									</button>

									{#if resourceLinks(item).length > 0}
										<div class="flex flex-wrap gap-1.5 border-t border-border/60 px-4 py-3">
											{#each resourceLinks(item) as link (link.label)}
												<Badge
													variant="outline"
													href={link.href}
													target="_blank"
													rel="noopener noreferrer"
													onclick={(event) => event.stopPropagation()}
												>
													{link.label}
												</Badge>
											{/each}
										</div>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<div
					class="hidden items-center gap-4 border-t border-border/70 px-4 py-2 text-xs text-muted-foreground md:flex"
				>
					<span>Search problems across all contests</span>
					<span class="ml-auto inline-flex items-center gap-1">
						<span
							class="rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[0.7rem]"
							>⌘</span
						>
						<span
							class="rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[0.7rem]"
							>K</span
						>
					</span>
				</div>
			</Dialog.Content>
		</div>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(mark) {
		background: transparent;
		color: var(--primary);
		font-weight: 600;
	}
</style>
