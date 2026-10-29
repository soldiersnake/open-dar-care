export type AvatarColor =
  | "sky"
  | "pink"
  | "green"
  | "yellow"
  | "purple"
  | "blue"
  | "parentPurple";

const colorClasses: Record<AvatarColor, string> = {
  sky: "bg-avatar-kids text-avatar-kids-ink",
  pink: "bg-avatar-pink text-avatar-pink-ink",
  green: "bg-avatar-green text-avatar-green-ink",
  yellow: "bg-avatar-yellow text-avatar-yellow-ink",
  purple: "bg-avatar-purple text-avatar-purple-ink",
  blue: "bg-avatar-parent text-white",
  parentPurple: "bg-avatar-purple text-white",
};

const sizeClasses = {
  sm: "h-10 w-10 text-base",
  md: "h-12 w-12 text-[19px]",
  xl: "h-[84px] w-[84px] text-[34px]",
} as const;

export type AvatarSize = keyof typeof sizeClasses;

export function Avatar({
  initials,
  color,
  size,
}: {
  initials: string;
  color: AvatarColor;
  size: AvatarSize;
}) {
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-display font-semibold ${colorClasses[color]} ${sizeClasses[size]}`}
    >
      {initials}
    </div>
  );
}
