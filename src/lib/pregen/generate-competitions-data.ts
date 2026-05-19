import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export interface Problem {
	id: string;
	number: string;
	name: string;
	category?: string | undefined;
	author?: string | undefined;
	maxScore?: number | undefined;
	link?: string | undefined;
	solutionLink?: string | undefined;
	answerSheet?: string | undefined;
	gradingScheme?: string | undefined;
	results?: string | undefined;
}

export interface Paper {
	category?: string;
	link?: string;
	solutionLink?: string;
	answerSheet?: string;
	gradingScheme?: string;
	results?: string;
	additionalFiles?: string[];
	examDuration?: number;
	scores?: number[][];
	n?: number;
	gold?: number;
	silver?: number;
	bronze?: number;
	hm?: number;
	camp?: number;
	[key: string]: any;
}

export interface MockExam {
	id: string;
	name: string;
	problemIds: string[];
	examDuration?: number;
}

export interface Edition {
	year: number;
	name: string;
	location?: string | undefined;
	link?: string | undefined;
	problemsLink?: string | undefined;
	papers: Paper[];
	mockExams?: MockExam[] | undefined;
	problems: Problem[];
}

export interface Competition {
	id: string;
	name: string;
	shortName: string;
	website: string;
	desc?: string;
	summary?: string;
	icon?: string;
	tag?: 'International' | 'Regional' | 'National' | 'Open';
	url?: string;
	editions: Edition[];
}

interface CompYaml {
	id?: string;
	name: string;
	shortName: string;
	website: string;
	summary?: string;
	icon?: string;
	tag?: 'International' | 'Regional' | 'National' | 'Open';
	url?: string;
	desc?: string;
}

interface ProblemYaml {
	number: string | number;
	id: string;
	name: string;
	category?: string;
	author?: string;
	link?: string;
	solutionLink?: string;
	maxScore?: number;
	answerSheet?: string;
	gradingScheme?: string;
	results?: string;
}

interface PaperYaml {
	category?: string;
	link?: string;
	solutionLink?: string;
	answerSheet?: string;
	gradingScheme?: string;
	results?: string;
	additionalFiles?: string[];
	examDuration?: number;
	scores?: number[][];
	n?: number;
	gold?: number;
	silver?: number;
	bronze?: number;
	hm?: number;
	camp?: number;
	[key: string]: any;
}

interface MockExamYaml {
	id: string;
	name: string;
	problemIds: string[];
	examDuration?: number;
}

interface EditionYaml {
	name: string;
	location?: string;
	link?: string;
	problemsLink?: string;
	papers?: PaperYaml[];
	results?: PaperYaml[];
	mockExams?: MockExamYaml[];
	problems: ProblemYaml[];
}

interface SiteNavLinkYaml {
	label: string;
	url: string;
}

interface SiteConfigYaml {
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
		links?: SiteNavLinkYaml[];
	};
}

function readYaml<T>(filePath: string): T {
	return yaml.load(fs.readFileSync(filePath, 'utf-8')) as T;
}

function loadCompetition(compDir: string): Competition {
	const compId = path.basename(compDir);
	const indexFilePath = path.join(compDir, 'index.yaml');

	let meta: CompYaml = { id: compId, name: compId, shortName: compId.toUpperCase(), website: '' };
	try {
		meta = readYaml<CompYaml>(indexFilePath);
	} catch (e) {
		console.warn(`Warning: Missing or invalid index.yaml for competition ${compId}`);
	}

	const compContents = fs.readdirSync(compDir, { withFileTypes: true });
	const yearDirs = compContents.filter((d) => d.isDirectory() && /^\d{4}$/.test(d.name));

	yearDirs.sort((a, b) => parseInt(b.name, 10) - parseInt(a.name, 10));

	const editions: Edition[] = [];

	for (const yd of yearDirs) {
		const yearStr = yd.name;
		const year = parseInt(yearStr, 10);
		const yamlPath = path.join(compDir, yearStr, `${yearStr}.yaml`);

		if (!fs.existsSync(yamlPath)) {
			console.warn(
				`Warning: Directory ${yearStr} exists in ${compId} but ${yearStr}.yaml is missing.`
			);
			continue;
		}

		try {
			const edMeta = readYaml<EditionYaml>(yamlPath);
			const rawProblems = edMeta.problems || [];

			// Determine a fallback category from papers when there is exactly one unique paper category
			const uniquePaperCategories = [
				...new Set((edMeta.papers || []).map((p) => p.category).filter(Boolean))
			] as string[];
			const fallbackCategory =
				uniquePaperCategories.length === 1 ? uniquePaperCategories[0] : undefined;

			// 1. Process Problems
			const processedProblems: Problem[] = rawProblems.map((p) => ({
				id: p.id,
				number: String(p.number),
				name: p.name,
				category: p.category ?? fallbackCategory,
				author: p.author,
				link: p.link,
				solutionLink: p.solutionLink,
				answerSheet: p.answerSheet,
				gradingScheme: p.gradingScheme,
				results: p.results,
				maxScore: p.maxScore
			}));

			// 2. Process Papers
			const rawPapers = edMeta.papers || [];
			const rawResults = edMeta.results || [];
			const basePapers = rawPapers.filter((p) => !p.category);
			const categoryPapers = rawPapers.filter((p) => p.category);
			const baseResults = rawResults.filter((r) => !r.category);
			const categoryResults = rawResults.filter((r) => r.category);

			const baseProps = Object.assign({}, ...basePapers);
			const baseResultProps = Object.assign({}, ...baseResults);

			const getCategoryResult = (category?: string) =>
				category ? categoryResults.find((r) => r.category === category) : undefined;

			let finalPapers: Paper[] = [];
			if (categoryPapers.length > 0) {
				finalPapers = categoryPapers.map((p) => ({
					...baseProps,
					...baseResultProps,
					...p,
					...(getCategoryResult(p.category) || {}),
					category: p.category
				}));
				const categoryOnlyResults = categoryResults.filter(
					(r) => !categoryPapers.some((p) => p.category === r.category)
				);
				finalPapers.push(
					...categoryOnlyResults.map((r) => ({
						...baseProps,
						...baseResultProps,
						...r,
						category: r.category
					}))
				);
			} else if (basePapers.length > 0) {
				finalPapers = [{ ...baseProps, ...baseResultProps }];
				finalPapers.push(
					...categoryResults.map((r) => ({
						...baseProps,
						...baseResultProps,
						...r,
						category: r.category
					}))
				);
			} else if (rawResults.length > 0) {
				finalPapers = rawResults.map((r) => ({ ...r }));
			}

			// 3. Generate Virtual Mock Exams
			let mockExams: MockExam[] | undefined = undefined;

			if (edMeta.mockExams && edMeta.mockExams.length > 0) {
				mockExams = edMeta.mockExams.map((m) => ({
					id: String(m.id),
					name: m.name,
					problemIds: m.problemIds,
					examDuration: m.examDuration
				}));
			} else {
				const categories = [
					...new Set(rawProblems.map((p) => p.category).filter(Boolean))
				] as string[];

				if (categories.length > 0) {
					mockExams = categories.map((cat) => {
						const problemIds = rawProblems
							.filter((p) => !p.category || p.category === cat)
							.map((p) => p.id);

						return {
							id: cat.toLowerCase().replace(/\s+/g, '-'),
							name: cat.charAt(0).toUpperCase() + cat.slice(1),
							problemIds
						};
					});
				}
			}

			editions.push({
				year,
				name: edMeta.name,
				location: edMeta.location,
				link: edMeta.link,
				problemsLink: edMeta.problemsLink,
				papers: finalPapers,
				mockExams,
				problems: processedProblems
			});
		} catch (e) {
			console.error(`Error reading YAML for ${compId} year ${year}:`, e);
		}
	}

	return {
		id: meta.id ?? compId,
		name: meta.name,
		shortName: meta.shortName,
		website: meta.website,
		desc: meta.desc,
		summary: meta.summary,
		icon: meta.icon,
		tag: meta.tag,
		url: meta.url,
		editions
	};
}

const DATA_ROOT = path.resolve('./static/aoxiv');

export const competitions: Competition[] = fs
	.readdirSync(DATA_ROOT, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => loadCompetition(path.join(DATA_ROOT, d.name)))
	.sort((a, b) => a.name.localeCompare(b.name));

const siteConfigPath = path.join(DATA_ROOT, 'index.yaml');
const siteConfig = readYaml<SiteConfigYaml>(siteConfigPath);

const outputPath = path.resolve('./src/lib/pregen/competitions-data.json');
fs.writeFileSync(outputPath, JSON.stringify(competitions, null, 2));
const siteConfigOutputPath = path.resolve('./src/lib/pregen/site-config.json');
fs.writeFileSync(siteConfigOutputPath, JSON.stringify(siteConfig, null, 2));
console.log('✅ Competition data generated successfully!');
