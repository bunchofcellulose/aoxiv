import rawData from './pregen/competitions-data.json';

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
}

export interface Paper {
	category?: string;
	link?: string;
	solutionLink?: string;
	gradingScheme?: string;
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

export const competitions = rawData as Competition[];
export type ContestTag = 'International' | 'Regional' | 'National' | 'Open';

export interface ContestCard {
	id: string;
	name: string;
	summary: string;
	icon: string;
	tag: ContestTag;
	url?: string;
}

export const contests: ContestCard[] = competitions.map((competition) => ({
	id: competition.id,
	name: competition.name,
	summary: competition.summary ?? `${competition.name} archive`,
	icon: competition.icon ?? '🌌',
	tag: competition.tag ?? 'Open',
	url: competition.url
}));

export const examDurations: Record<string, number> = {};
competitions.forEach((comp) => {
	comp.editions.forEach((ed) => {
		if (ed.papers.length > 0 && ed.papers[0].examDuration !== undefined) {
			examDurations[`${comp.id}-${ed.year}`] = ed.papers[0].examDuration;
		}

		ed.papers.forEach((paper) => {
			if (paper.category && paper.examDuration !== undefined) {
				const catId = paper.category.toLowerCase().replace(/\s+/g, '-');
				examDurations[`${comp.id}-${ed.year}-${catId}`] = paper.examDuration;
			}
		});

		if (ed.mockExams) {
			ed.mockExams.forEach((mock) => {
				if (mock.examDuration !== undefined) {
					examDurations[`${comp.id}-${ed.year}-${mock.id}`] = mock.examDuration;
				}
			});
		}
	});
});

export function getAllProblemIds(): string[] {
	const allIds = competitions
		.flatMap((comp) => comp.editions)
		.flatMap((edition) => edition.problems)
		.map((problem) => problem.id);

	return [...new Set(allIds)];
}

export function getTotalProblems(): number {
	return getAllProblemIds().length;
}

export function getEdition(
	compId: string,
	year: number
): { competition: Competition; edition: Edition } | null {
	const comp = competitions.find((c) => c.id === compId);
	if (!comp) return null;
	const edition = comp.editions.find((e) => e.year === year);
	if (!edition) return null;
	return { competition: comp, edition };
}

export function getGlobalStats(compId: string, year: number): Paper[] | null {
	const editionData = getEdition(compId, year);
	if (!editionData || !editionData.edition.papers) return null;
	const stats = editionData.edition.papers.filter((p) => p.scores && p.scores.length > 0);
	return stats.length > 0 ? stats : null;
}

export function getClientSearchData() {
	const allProblemsFlat: any[] = [];
	const seenIds = new Set<string>();

	competitions.forEach((comp) => {
		comp.editions.forEach((edition) => {
			edition.problems.forEach((problem) => {
				if (!seenIds.has(problem.id)) {
					seenIds.add(problem.id);
					allProblemsFlat.push({
						id: problem.id,
						name: problem.name,
						number: problem.number,
						author: problem.author || 'Unknown',
						category: problem.category || 'General',
						year: edition.year,
						compShortName: comp.shortName,
						compId: comp.id,
						link: problem.link || '',
						solutionLink: problem.solutionLink || '',
						answerSheet: problem.answerSheet || '',
						gradingScheme: problem.gradingScheme || '',
						maxScore: problem.maxScore
					});
				}
			});
		});
	});

	return allProblemsFlat;
}
