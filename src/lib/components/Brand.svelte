<script lang="ts">
	// "aoχiv" wordmark. The middle glyph is the real chi (χ) — the same
	// calligraphic mark used as the logo/watermark (static/chi.svg) — masked so
	// it can carry the gradient. Letters + chi read as one peach → light → blue
	// sweep, matching the logo's colour theme in both light and dark modes.
	let { class: className = '' }: { class?: string } = $props();
</script>

<span class="brand {className}" role="img" aria-label="aoXiv">
	<span class="seg seg-left">ao</span>
	<span class="chi" aria-hidden="true"></span>
	<span class="seg seg-right">iv</span>
</span>

<style>
	.brand {
		display: inline-flex;
		align-items: center;
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1;
	}

	.seg,
	.chi {
		/* Override the global `span { font-size: 1rem }` base rule so the wordmark
		   scales with the font-size set on .brand. */
		font-size: inherit;
		line-height: 1;
	}

	.seg {
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		color: transparent;
	}

	/* Cool, cosmic sweep — violet → blue → cyan/teal with a bright core, for a
	   modern scientific-astronomy feel that keys off the mauve/blue theme. */
	.seg-left {
		background-image: linear-gradient(
			100deg,
			var(--primary) 0%,
			color-mix(in oklab, var(--foreground) 55%, var(--chart-3)) 100%
		);
	}

	.seg-right {
		background-image: linear-gradient(
			100deg,
			color-mix(in oklab, var(--foreground) 55%, var(--chart-3)) 0%,
			var(--chart-5) 100%
		);
	}

	.chi {
		display: inline-block;
		width: 0.88em;
		height: 1.02em;
		margin: 0 -0.05em;
		background: linear-gradient(
			120deg,
			color-mix(in oklab, var(--foreground) 60%, var(--chart-3)),
			var(--foreground) 50%,
			color-mix(in oklab, var(--foreground) 60%, var(--chart-5))
		);
		-webkit-mask: url('/chi.svg') center / contain no-repeat;
		mask: url('/chi.svg') center / contain no-repeat;
	}
</style>
