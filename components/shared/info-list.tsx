export type InfoListItem = {
  label: string;
  value: string;
};

export function InfoList({ items }: { items: InfoListItem[] }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-panel">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`flex items-center justify-between px-4.5 py-3.75 ${
            index < items.length - 1 ? "border-b border-line-soft" : ""
          }`}
        >
          <span className="text-[14.5px] text-muted-soft">{item.label}</span>
          <span className="text-[14.5px] font-extrabold text-ink">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
