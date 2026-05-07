export default function ProgressBar({ value = 0, max = 100, label, showPercent = true, colorClass = 'bg-zinc-900' }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-zinc-600">{label}</span>}
          {showPercent && (
            <span className="text-sm font-medium text-zinc-900">{percent}%</span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
        <div
          className={`h-full rounded-full progress-bar-fill ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {max > 0 && (
        <p className="text-xs text-zinc-400 mt-1">{value} / {max}</p>
      )}
    </div>
  );
}
