<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	let { children } = $props();

	import NavLink from '$lib/components/NavLink.svelte';
	import GlobalSearch from '$lib/components/GlobalSearch.svelte';
	import { siteConfig } from '$lib/site-config';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import NavButtons from './NavButtons.svelte';
	import SearchIcon from '@lucide/svelte/icons/search';

	const navLinks = siteConfig.navigation?.links ?? [];
	let searchOpen = $state(false);
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/chi.svg?v=2" />
</svelte:head>

<ModeWatcher />
<GlobalSearch bind:open={searchOpen} />

<Sidebar.Provider>
	<AppSidebar {navLinks} brandName={siteConfig.name} />
	<div
		class="flex min-h-screen w-full flex-col items-center bg-background px-8 py-3 sm:px-10 sm:py-6"
	>
		<div class="w-full md:w-5/6 xl:w-2/3">
			<nav class="grid grid-cols-3 items-center md:hidden">
				<Sidebar.Trigger />
				<a
					href={resolve('/')}
					class="justify-self-center text-base font-medium text-foreground hover:text-primary"
				>
					{siteConfig.name}
				</a>
				<Button
					variant="ghost"
					size="icon"
					class="justify-self-end"
					onclick={() => (searchOpen = true)}
					aria-label="Search problems"
				>
					<SearchIcon class="size-4" />
				</Button>
			</nav>
			<nav class="hidden flex-row flex-wrap items-center justify-between gap-2 md:flex">
				<NavigationMenu.Root>
					<NavigationMenu.List class="gap-2 sm:gap-3">
						{#each navLinks as navLink (navLink.url)}
							<NavLink url={navLink.url} label={navLink.label} />
						{/each}
					</NavigationMenu.List>
				</NavigationMenu.Root>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						class="items-center gap-2 text-sm text-muted-foreground"
						onclick={() => (searchOpen = true)}
						aria-label="Search problems"
					>
						<SearchIcon class="size-4" />
						<span class="hidden lg:block">search...</span>
						<span
							class="hidden rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground lg:inline-flex"
						>
							⌘
						</span>
						<span
							class="hidden rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground lg:inline-flex"
						>
							K
						</span>
					</Button>
					<NavButtons />
				</div>
			</nav>

			<Separator class="my-3" />
			<main>
				{@render children?.()}
			</main>
		</div>
	</div>
</Sidebar.Provider>
