import type { ReactNode } from "react";

export type BadgeVariant = "allergy" | "link" | "active" | "pending";

const variantClasses: Record<BadgeVariant, string> = {
  allergy: "bg-badge-allergy text-badge-allergy-ink",
  link: "bg-badge-link text-badge-link-ink",
  active: "bg-badge-achievement text-badge-achievement-ink",
  pending: "bg-badge-pending text-badge-pending-ink",
};

const sizeClasses = {
  sm: "px-2.5 py-1 text-[10.5px]",
  md: "px-[9px] py-[5px] text-[11px]",
} as const;

export function Badge({
  children,
  variant,
  size = "md",
}: {
  children: ReactNode;
  variant: BadgeVariant;
  size?: keyof typeof sizeClasses;
}) {
  return (
    <span
      className={`flex-none rounded-full font-extrabold ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}
