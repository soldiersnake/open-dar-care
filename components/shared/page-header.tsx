import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-[22px] flex items-end justify-between gap-4">
      <div>
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent">
          {eyebrow}
        </div>
        <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}
