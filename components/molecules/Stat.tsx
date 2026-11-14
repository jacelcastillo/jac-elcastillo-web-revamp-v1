type StatProps = { value: string; label: string };

export function Stat({ value, label }: StatProps) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 text-ink">
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
