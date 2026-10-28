import raw from '@content/content.json';
import askRaw from '@content/ask-my-resume.json';

/* content.json is the single source of copy. Every string traces to a source (docs/COPY_SOURCES.md). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const content: Any = raw;
export const ask: Any = askRaw;

export const section = (id: string): Any => content.sections.find((s: Any) => s.id === id);

/** Text of a copy item ({ text }) or a plain string. */
export const t = (item: Any): string => (item == null ? '' : typeof item === 'string' ? item : item.text ?? '');

/** The visible "needed" message for an item that is still waiting on Travis, or null. */
export const needed = (item: Any): string | null =>
  item && item.confirm && item.confirmText ? String(item.confirmText).replace(/^\[|\]$/g, '') : null;

export const person = content.person;
export const EMAIL_USER: string = person.email?.user ?? 'travisjterry';
export const EMAIL_DOMAIN: string = person.email?.domain ?? 'gmail.com';
