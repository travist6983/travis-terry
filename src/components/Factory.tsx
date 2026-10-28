/* Isometric "agent factory": six stations along one conveyor. Original drawing, synthetic labels only. */

const C = Math.cos(Math.PI / 6);
const S = 0.5;
const U = 34; // px per unit
const OX = 150;
const OY = 82;
const iso = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * C * U, OY + (x + y) * S * U - z * U];
const poly = (pts: [number, number, number][]) => pts.map(([x, y, z]) => iso(x, y, z).map((n) => n.toFixed(1)).join(',')).join(' ');

/** An isometric box: returns its three visible faces. */
function Box({ x, y, z = 0, w, d, h, cls }: { x: number; y: number; z?: number; w: number; d: number; h: number; cls: string }) {
  const top = poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]);
  const left = poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]);
  const right = poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]);
  return (
    <g className={cls}>
      <polygon points={left} className="f-left" />
      <polygon points={right} className="f-right" />
      <polygon points={top} className="f-top" />
    </g>
  );
}

export const STATION_X = [1.2, 3.1, 5.0, 6.9, 8.8, 10.7];
const GLYPH = ['◉', '✎', '2', '▦', '!', '⇪'];
export const BELT_START = 0.4;
export const BELT_END = 12;

export function Factory({ stage }: { stage: number }) {
  const [tx0, ty0] = iso(BELT_START, 2.05, 0.5);
  return (
    <svg className="factory" viewBox="0 0 560 400" aria-hidden="true">
      {/* floor */}
      <polygon points={poly([[-0.4, -0.6, 0], [12.8, -0.6, 0], [12.8, 4.2, 0], [-0.4, 4.2, 0]])} className="floor" />
      <polygon points={poly([[-0.4, 4.2, 0], [12.8, 4.2, 0], [12.8, 4.2, -0.35], [-0.4, 4.2, -0.35]])} className="floor-edge" />
      <polygon points={poly([[12.8, -0.6, 0], [12.8, 4.2, 0], [12.8, 4.2, -0.35], [12.8, -0.6, -0.35]])} className="floor-edge2" />
      {/* stations behind the belt */}
      {STATION_X.map((x, i) => (
        <g key={i} className={`station-iso ${i === stage ? 'is-active' : ''} ${i < stage ? 'is-done' : ''} st-${i}`}>
          <Box x={x - 0.6} y={0} w={1.2} d={1.1} h={1.5} cls="st-box" />
          {/* screen on the front face */}
          <polygon points={poly([[x - 0.45, 1.1, 0.55], [x + 0.45, 1.1, 0.55], [x + 0.45, 1.1, 1.3], [x - 0.45, 1.1, 1.3]])} className="st-screen" />
          <text x={iso(x, 1.1, 0.92)[0]} y={iso(x, 1.1, 0.92)[1] + 5} textAnchor="middle" className="st-glyph">{GLYPH[i]}</text>
          {/* scan beam onto the belt */}
          <polygon points={poly([[x - 0.35, 1.1, 0.4], [x + 0.35, 1.1, 0.4], [x + 0.5, 2.6, 0.42], [x - 0.5, 2.6, 0.42]])} className="st-beam" />
          {/* status lamp */}
          <Box x={x - 0.12} y={0.45} z={1.5} w={0.24} d={0.24} h={0.3} cls="st-lamp" />
        </g>
      ))}
      {/* verifier orb: the second agent */}
      <g className={`orb ${stage === 2 ? 'is-on' : ''}`}>
        <circle cx={iso(STATION_X[2], 2, 2.6)[0]} cy={iso(STATION_X[2], 2, 2.6)[1]} r="13" />
        <text x={iso(STATION_X[2], 2, 2.6)[0]} y={iso(STATION_X[2], 2, 2.6)[1] + 4} textAnchor="middle">2</text>
      </g>
      {/* conveyor */}
      <Box x={BELT_START - 0.2} y={1.5} w={BELT_END - BELT_START + 0.4} d={1.1} h={0.38} cls="belt" />
      {Array.from({ length: 22 }, (_, i) => {
        const x = BELT_START + i * 0.55;
        return <polygon key={i} points={poly([[x, 1.5, 0.385], [x + 0.06, 1.5, 0.385], [x + 0.06, 2.6, 0.385], [x, 2.6, 0.385]])} className="belt-slat" />;
      })}
      {/* the ticket on the belt; JS moves this group along the belt */}
      <g className="belt-ticket" data-x0={tx0} data-y0={ty0}>
        <polygon
          points={[iso(0, 1.75, 0.4), iso(0.9, 1.75, 0.4), iso(0.9, 2.45, 0.4), iso(0, 2.45, 0.4)]
            .map(([a, b]) => `${(a - iso(0, 1.75, 0.4)[0]).toFixed(1)},${(b - iso(0, 1.75, 0.4)[1]).toFixed(1)}`)
            .join(' ')}
          className={`tk ${stage >= 5 ? 'tk--pr' : ''}`}
        />
      </g>
      {/* outgoing chute toward the merge */}
      <polygon points={poly([[12, 1.5, 0.38], [12.8, 1.5, 0.38], [12.8, 2.6, 0.38], [12, 2.6, 0.38]])} className="chute" />
    </svg>
  );
}

/** Screen position of a belt x, relative to the ticket's start. */
export const beltOffset = (x: number) => {
  const [a0, b0] = iso(BELT_START, 1.75, 0.4);
  const [a, b] = iso(x, 1.75, 0.4);
  return [a - a0, b - b0] as const;
};
export const ticketOrigin = () => iso(BELT_START, 1.75, 0.4);
