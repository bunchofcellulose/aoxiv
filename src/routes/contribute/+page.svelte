<script lang="ts">
	import Title from '$lib/components/Title.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { siteConfig } from '$lib/site-config';
	import SvelteSeo from 'svelte-seo';
	import {
		FileText,
		CircleCheck,
		ClipboardList,
		Trophy,
		Sparkles,
		PencilLine,
		GitPullRequest,
		MessagesSquare,
		ExternalLink
	} from '@lucide/svelte';

	// Things people commonly send in — shown as a quick "what belongs here" grid.
	const contributions = [
		{ icon: FileText, label: 'Missing problem papers' },
		{ icon: CircleCheck, label: 'Official solutions' },
		{ icon: ClipboardList, label: 'Grading schemes & answer keys' },
		{ icon: Trophy, label: 'Results & score statistics' },
		{ icon: Sparkles, label: 'A whole new olympiad' },
		{ icon: PencilLine, label: 'Fixes & corrections' }
	];
</script>

<SvelteSeo
	title="Contribute — aoXiv"
	description="How to add problems, solutions, and new olympiads to the aoXiv archive."
/>

<Title
	title="Contribute"
	description="aoXiv is a community-maintained, open archive. Every problem, solution, and result here was added by someone like you — here's how to add more."
/>

<div class="mx-auto flex max-w-2xl flex-col gap-8">
	<!-- What you can add -->
	<section>
		<h2 class="mb-3 text-lg font-semibold tracking-tight">What you can add</h2>
		<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
			{#each contributions as item (item.label)}
				<div
					class="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 px-3.5 py-3 text-sm"
				>
					<item.icon class="size-4 shrink-0 text-primary" />
					<span class="text-foreground/90">{item.label}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Two ways to contribute -->
	<section class="flex flex-col gap-4">
		<h2 class="text-lg font-semibold tracking-tight">Two ways to do it</h2>

		<!-- Path A: pull request -->
		<div class="rounded-2xl border border-border bg-card/60 p-5">
			<div class="mb-3 flex items-center gap-2.5">
				<GitPullRequest class="size-5 text-primary" />
				<h3 class="text-base font-semibold">Open a pull request</h3>
				<span class="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
					comfortable with git
				</span>
			</div>
			<p class="mt-0 mb-4 text-sm text-muted-foreground">
				All archive data is plain files in the repo — no database. Each olympiad is a folder under
				<code class="rounded bg-muted px-1.5 py-0.5 text-xs">static/aoxiv/</code>, and each year is a
				subfolder holding its PDFs plus one YAML file that describes them.
			</p>
			<ol class="m-0 flex list-none flex-col gap-3 p-0">
				{#snippet step(n: number)}
					<span
						class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 font-mono text-xs font-semibold text-primary tabular-nums"
					>
						{n}
					</span>
				{/snippet}

				<li class="flex gap-3">
					{@render step(1)}
					<span class="pt-0.5 text-sm text-foreground/90">
						Fork the repository and clone it locally.
					</span>
				</li>
				<li class="flex gap-3">
					{@render step(2)}
					<span class="pt-0.5 text-sm text-foreground/90">
						Drop the PDFs into
						<code class="rounded bg-muted px-1.5 py-0.5 text-xs"
							>static/aoxiv/&lt;olympiad&gt;/&lt;year&gt;/</code
						> (create the folders if the year is new).
					</span>
				</li>
				<li class="flex gap-3">
					{@render step(3)}
					<span class="pt-0.5 text-sm text-foreground/90">
						Add or edit the
						<code class="rounded bg-muted px-1.5 py-0.5 text-xs">&lt;year&gt;.yaml</code>
						(e.g. <code class="rounded bg-muted px-1.5 py-0.5 text-xs">2025/2025.yaml</code>) listing
						each paper and problem. The full format — with a worked example — is in the repo README
						under <span class="font-medium text-foreground">“Adding more competitions.”</span>
					</span>
				</li>
				<li class="flex gap-3">
					{@render step(4)}
					<span class="pt-0.5 text-sm text-foreground/90">
						Preview it with <code class="rounded bg-muted px-1.5 py-0.5 text-xs">pnpm install</code>
						then <code class="rounded bg-muted px-1.5 py-0.5 text-xs">pnpm dev</code> — the site
						regenerates its data on start, so your addition shows up locally.
					</span>
				</li>
				<li class="flex gap-3">
					{@render step(5)}
					<span class="pt-0.5 text-sm text-foreground/90">
						Commit, push, and open a pull request. That’s it.
					</span>
				</li>
			</ol>

			<div class="mt-5 flex flex-wrap gap-2">
				<Button href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer">
					Open the repo <ExternalLink class="size-3.5" />
				</Button>
				<Button
					variant="outline"
					href={`${siteConfig.githubUrl}#adding-more-competitions`}
					target="_blank"
					rel="noopener noreferrer"
				>
					Read the format guide <ExternalLink class="size-3.5" />
				</Button>
			</div>
		</div>

		<!-- Path B: Discord -->
		<div class="rounded-2xl border border-border bg-card/60 p-5">
			<div class="mb-3 flex items-center gap-2.5">
				<MessagesSquare class="size-5 text-primary" />
				<h3 class="text-base font-semibold">Send it on Discord</h3>
				<span class="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
					no git needed
				</span>
			</div>
			<p class="mt-0 mb-4 text-sm text-muted-foreground">
				Not into git, or unsure where something belongs? Just hand us the material and a maintainer
				will file it. In your message, include:
			</p>
			<ul class="m-0 mb-5 flex list-disc flex-col gap-1.5 pl-5 text-sm text-foreground/90">
				<li>Which <span class="font-medium">olympiad and year</span> it’s from</li>
				<li>The <span class="font-medium">PDFs or links</span> (problems, solutions, results…)</li>
				<li>Anything you know about it — the round, exam duration, or scoring</li>
			</ul>
			<Button
				variant="outline"
				href={siteConfig.discordUrl}
				target="_blank"
				rel="noopener noreferrer"
			>
				<MessagesSquare class="size-4" /> Join the Discord
			</Button>
		</div>
	</section>

	<p class="text-center text-sm text-muted-foreground">
		Spot a typo or a broken link? That counts too — open an issue or ping us on Discord.
	</p>
</div>
