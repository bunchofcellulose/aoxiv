<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	let { children, data } = $props();

	// Google Analytics page-view tracking on client-side navigations. The gtag loader and
	// initial config live in app.html; here we just re-send the current path after each
	// SPA navigation. (This previously lived in app.html, but that file is a plain HTML
	// template — not a Svelte component — so its `import`/`afterNavigate` threw at runtime.)
	afterNavigate(() => {
		const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
		gtag?.('config', 'G-BHEQ5451BE', { page_path: window.location.pathname });
	});

	import { ModeWatcher } from 'mode-watcher';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from './AppSidebar.svelte';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';
	import GlobalSearch from '$lib/components/GlobalSearch.svelte';
	import Brand from '$lib/components/Brand.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { Search } from '@lucide/svelte';
	import LogIn from '$lib/components/buttons/LogIn.svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import DarkModeButton from '$lib/components/buttons/DarkModeButton.svelte';

	const navLinks = [
		{ url: '/', label: 'home' },
		{ url: '/olympiads', label: 'olympiads' },
		{ url: '/resources', label: 'resources' }
	];

	// Page/route data is cached (see +page.server.ts and (reg)/+layout.server.ts), so the
	// server-rendered `data.user` can be stale after a login/logout — e.g. the logged-out
	// payload lingers after signing in through the OAuth full-page redirect. The client
	// session store always reflects the true auth state and is not affected by that cache,
	// so the auth chrome (login/profile button, sidebar, admin link) reads from it. We fall
	// back to `data.user` only while the session is still loading, to avoid a flash.
	const session = authClient.useSession();
	const currentUser = $derived(
		$session.isPending ? (data?.user ?? null) : ($session.data?.user ?? null)
	);

	const moreNavLinks = $derived([
		{ url: '/blog', label: 'blog' },
		{ url: '/contribute', label: 'contribute' },
		{ url: '/privacy', label: 'privacy policy' },
		...(currentUser?.role === 'admin' ? [{ url: '/admin', label: 'admin' }] : [])
	]);

	let searchOpen = $state(false);
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/chi.svg?v=2" />
</svelte:head>

<ModeWatcher />
<GlobalSearch bind:open={searchOpen} />
<Toaster richColors closeButton position="top-center" />

<Sidebar.Provider>
	<AppSidebar navLinks={navLinks.concat(moreNavLinks)} user={currentUser} />
	<!-- Main wrapper — transparent so html gradient shows through -->
	<div class="flex min-h-screen w-full flex-col items-center bg-background px-4 pt-6 pb-3">
		<div class="w-full lg:w-5/6 xl:w-2/3">
			<!-- Mobile nav — glass pill -->
			<nav
				class="sticky top-3 z-40 flex flex-row flex-wrap items-center justify-between gap-2 rounded-full border
				       border-white/65
				       bg-white/45 p-1.5
				       shadow-lg
				       ring-1 shadow-violet-500/5 ring-white/50
				       backdrop-blur-xl ring-inset md:hidden
				       dark:border-white/10 dark:bg-white/5 dark:shadow-black/40 dark:ring-white/5"
			>
				<Sidebar.Trigger />
				<a href={resolve('/')} class="px-1">
					<Brand class="text-lg" />
				</a>
				<button
					onclick={() => (searchOpen = true)}
					class="{buttonVariants({ variant: 'ghost', size: 'icon' })} justify-self-end"
					aria-label="Search problems"
				>
					<Search class="size-4" />
				</button>
			</nav>

			<!-- Desktop nav — glass pill -->
			<nav
				class="sticky top-3 z-40 hidden flex-row flex-wrap items-center justify-between gap-2 rounded-full border
				       border-white/65
				       bg-white/45 p-1.5
				       shadow-lg
				       ring-1 shadow-violet-500/5 ring-white/50
				       backdrop-blur-xl ring-inset md:flex
				       dark:border-white/10 dark:bg-white/5 dark:shadow-black/40 dark:ring-white/5"
			>
				<NavigationMenu.Root viewport={false}>
					<NavigationMenu.List class="gap-1 sm:gap-2">
						{#each navLinks as navLink (navLink.url)}
							<NavigationMenu.Item>
								<NavigationMenu.Link
									href={navLink.url}
									aria-current={page.url.pathname == navLink.url}
									data-active={page.url.pathname == navLink.url}
									class="rounded-full py-2 text-base font-medium text-foreground transition-colors duration-250 hover:text-primary"
									>{navLink.label}</NavigationMenu.Link
								>
							</NavigationMenu.Item>
						{/each}
						<NavigationMenu.Item openOnHover={false}>
							<NavigationMenu.Trigger class="transition-colors duration-250">
								<p>more</p>
							</NavigationMenu.Trigger>
							<NavigationMenu.Content>
								<ul class="flex flex-col gap-1">
									{#each moreNavLinks as navLink (navLink.url)}
										<li>
											<NavigationMenu.Link
												href={navLink.url}
												aria-current={page.url.pathname == navLink.url}
												data-active={page.url.pathname == navLink.url}
												class="rounded-full py-2 text-base font-medium text-foreground transition-colors duration-250 hover:text-primary"
												>{navLink.label}</NavigationMenu.Link
											>
										</li>
									{/each}
								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
					</NavigationMenu.List>
				</NavigationMenu.Root>
				<div class="flex items-center gap-2">
					<button
						onclick={() => (searchOpen = true)}
						class="{buttonVariants({
							variant: 'ghost'
						})} items-center gap-2 border border-white/50
						       bg-white/30 text-sm text-muted-foreground hover:bg-white/50 dark:border-white/10
						       dark:bg-white/5 dark:hover:bg-white/10"
						aria-label="Search problems"
					>
						<Search class="size-4" />
						<span class="block">search…</span>
						<Kbd.Root class="inline-flex">⌘</Kbd.Root>
						<Kbd.Root class="inline-flex">K</Kbd.Root>
					</button>
					<DarkModeButton />
					<LogIn user={currentUser} />
				</div>
			</nav>

			<main>
				{@render children?.()}
			</main>
		</div>
	</div>
</Sidebar.Provider>

<ScrollToTop />
