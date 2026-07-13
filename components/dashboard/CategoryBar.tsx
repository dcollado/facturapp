function formatMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type CategoryBarProps = {
  label: string;
  monto: number;
  max: number;
};

export default function CategoryBar({ label, monto, max }: CategoryBarProps) {
  const pct = max > 0 ? (monto / max) * 100 : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text">{label}</span>
        <span className="font-mono text-text-muted">{formatMoney(monto)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-raised">
        <div
          className="h-2 rounded-full bg-rust"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
