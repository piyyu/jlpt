export default function ProgressBar({ value = 0, max = 100, label, showPercent = true, colorClass }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>}
          {showPercent && (
            <span className="text-sm font-bold" style={{ color: percent > 0 ? 'var(--pink)' : 'var(--text-3)' }}>
              {percent}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div
          className="h-full rounded-full progress-bar-fill"
          style={{
            width: `${percent}%`,
            background: percent > 0 ? 'var(--pink)' : 'transparent',
          }}
        />
      </div>
      {max > 0 && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{value} / {max}</p>
      )}
    </div>
  );
}
