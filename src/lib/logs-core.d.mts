export type RawPost = {
  file: string;
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
  body: string;
};
export const SECTIONS: string[];
export function readAll(dir: string): RawPost[];
export function published(dir: string, opts?: { includeDrafts?: boolean }): RawPost[];
export type Heading = { id: string; text: string; fixes: boolean };
export function render(post: RawPost, dir: string): { html: string; images: string[]; headings: Heading[] };
export function readingTime(body: string): number;
export function renderFixes(src: string): string;
export function historyState(root: string): 'full' | 'shallow' | 'none';
export function publishCommit(root: string, file: string): string | null;
