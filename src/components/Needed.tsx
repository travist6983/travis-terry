/** Loud placeholder for anything Travis still has to supply. Launch is blocked while any render. */
export function Needed({ children, inline = false }: { children: React.ReactNode; inline?: boolean }) {
  const Tag = inline ? 'span' : 'div';
  return (
    <Tag className={inline ? 'needed needed--inline' : 'needed'} role="note">
      <strong>Needed:</strong> {children}
    </Tag>
  );
}
