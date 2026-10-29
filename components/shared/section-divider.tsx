export function SectionDivider({
  label,
  count,
}: {
  label: string;
  count?: string;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
        {label}
      </span>
      {count && <span className="text-[13px] text-muted">{count}</span>}
      <span className="h-px flex-1 bg-line-strong" />
    </div>
  );
}
