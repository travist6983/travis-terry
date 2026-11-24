import { t } from '@/lib/content';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/** A copy item's text with its `accent` phrase (if any) in the accent color. */
export function Accent({ item }: { item: Any }) {
  const text = t(item);
  const a: string | undefined = item?.accent;
  const i = a ? text.indexOf(a) : -1;
  if (!a || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="accent">{a}</span>
      {text.slice(i + a.length)}
    </>
  );
}
