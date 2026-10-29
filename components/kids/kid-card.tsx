import Link from "next/link";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/shared/badge";
import type { Kid } from "@/lib/kids-data";

function linkedParentsText(parentCount: number): string {
  if (parentCount === 0) return "sin padres vinculados";
  const noun = parentCount === 1 ? "padre vinculado" : "padres vinculados";
  return `${parentCount} ${noun}`;
}

function Chevron() {
  return (
    <svg
      className="flex-none"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#CBB89F"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function KidCard({ kid }: { kid: Kid }) {
  return (
    <Link
      href={`/kids/${kid.id}`}
      className="flex min-w-0 items-center gap-3.5 rounded-[18px] border border-line bg-panel p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition duration-150 hover:-translate-y-[2px] hover:border-[#F2A78E]"
    >
      <Avatar initials={kid.initials} color={kid.avatarColor} size="md" />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[16px] font-semibold text-ink">
          {kid.name}
        </div>
        <div className="text-[13px] text-muted">
          {kid.age} años · {linkedParentsText(kid.parents.length)}
        </div>
      </div>
      {kid.allergyTag ? (
        <Badge variant="allergy">{kid.allergyTag}</Badge>
      ) : kid.parents.length === 0 ? (
        <Badge variant="link">VINCULAR</Badge>
      ) : (
        <Chevron />
      )}
    </Link>
  );
}
