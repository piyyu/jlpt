export default function Bar({ value = 0, max = 0, color, height }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      style={{ border: '1px solid var(--border)', background: 'var(--panel)', height: height || '0.55rem' }}
    >
      <div style={{ width: `${pct}%`, height: '100%', background: color || 'var(--gold)', transition: 'width 0.4s ease' }} />
    </div>
  );
}
