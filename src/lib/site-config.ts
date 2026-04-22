import rawSiteConfig from './pregen/site-config.json';

export interface SiteNavLink {
	label: string;
	url: string;
}

export interface SiteConfig {
	name: string;
	pronunciation?: string;
	topic?: string;
	githubUrl: string;
	discordUrl: string;
	fork?: {
		text: string;
		label: string;
		url: string;
	};
	hero: {
		title: string;
		description: string;
		primaryCtaLabel: string;
		primaryCtaPath: string;
		secondaryCtaLabel: string;
	};
	seo: {
		homeTitle: string;
		homeDescription: string;
		homeKeywords: string;
		contestKeywords: string;
	};
	navigation?: {
		links?: SiteNavLink[];
	};
}

export const siteConfig = rawSiteConfig as SiteConfig;
