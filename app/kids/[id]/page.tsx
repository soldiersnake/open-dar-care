import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/shared/badge";
import { InfoList } from "@/components/shared/info-list";
import { Sidebar } from "@/components/shared/sidebar";
import { getKidById } from "@/lib/kids-data";
import type { Kid, LinkedParent } from "@/lib/kids-data";
import { kids } from "@/lib/kids-data";

function BackLink() {
  return (
    <Link
      href="/kids"
      className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-muted-soft"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      Volver a Niños
    </Link>
  );
}

function Hero({ kid }: { kid: Kid }) {
  return (
    <div className="flex items-center gap-[18px]">
      <Avatar initials={kid.initials} color={kid.avatarColor} size="xl" />
      <div className="min-w-0 flex-1">
        <h1 className="m-0 font-display text-[28px] font-semibold text-ink">
          {kid.name}
        </h1>
        <p className="m-0 mt-[3px] text-[15px] text-muted-soft">
          {kid.age} años · Sala {kid.room}
        </p>
      </div>
      <a
        href="#"
        className="rounded-[12px] border-[1.5px] border-line bg-panel px-4 py-[9px] text-[14px] font-bold text-ink-body"
      >
        Editar
      </a>
    </div>
  );
}

function AllergyBanner({ note }: { note: string }) {
  return (
    <div className="flex gap-3.5 rounded-[16px] bg-allergy-bg px-[18px] py-4">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-allergy-icon">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="mb-[2px] text-[15px] font-extrabold text-allergy-title">
          Alergias y notas
        </div>
        <div className="text-[14.5px] leading-[1.5] text-allergy-text">
          {note}
        </div>
      </div>
    </div>
  );
}

function DaySummaryButton() {
  return (
    <a
      href="#"
      className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink p-[13px] text-[15px] font-extrabold text-white"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      Resumen del día
    </a>
  );
}

function LinkedParentRow({ parent }: { parent: LinkedParent }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar
        initials={parent.name[0]}
        color={parent.avatarColor === "purple" ? "parentPurple" : parent.avatarColor}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-extrabold text-ink">
          {parent.name}
        </div>
        <div className="text-[12.5px] text-muted">
          {parent.relation} · {parent.note}
        </div>
      </div>
      <Badge variant={parent.status} size="sm">
        {parent.status === "active" ? "ACTIVA" : "PENDIENTE"}
      </Badge>
    </div>
  );
}

function LinkParentCard({ parents }: { parents: LinkedParent[] }) {
  return (
    <div className="rounded-[16px] border border-line bg-panel px-[18px] py-4">
      <div className="mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-3.5">
        {parents.map((parent) => (
          <LinkedParentRow key={parent.id} parent={parent} />
        ))}
        <a href="#" className="flex items-center gap-3 pt-2">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-photo-ink">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="text-[14.5px] font-extrabold text-accent-edit">
            Vincular otro padre
          </span>
        </a>
      </div>
    </div>
  );
}

// With cacheComponents, all known mock ids are prerendered at build time;
// unknown ids fall back to request-time rendering and hit notFound().
export function generateStaticParams() {
  return kids.map((kid) => ({ id: String(kid.id) }));
}

async function KidProfile({ id }: { id: string }) {
  const kidId = Number(id);
  const kid = getKidById(kidId);

  if (!Number.isInteger(kidId) || !kid) {
    notFound();
  }

  return (
    <div className="flex flex-wrap items-start gap-[26px]">
      <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
        <Hero kid={kid} />
        {kid.allergiesNote && <AllergyBanner note={kid.allergiesNote} />}
        <InfoList
          items={[
            { label: "Fecha de nacimiento", value: kid.birthDate },
            { label: "Sala", value: kid.room },
            { label: "Ingreso", value: kid.entryDate },
          ]}
        />
      </div>

      <div className="flex w-[300px] flex-none flex-col gap-3.5">
        <DaySummaryButton />
        <LinkParentCard parents={kid.parents} />
      </div>
    </div>
  );
}

export default function KidProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex min-h-screen bg-bg md:h-screen md:overflow-hidden">
      <Sidebar />

      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-5 pb-20 pt-[98px] md:px-10 md:pt-[34px]">
          <BackLink />

          <Suspense fallback={null}>
            {params.then(({ id }) => (
              <KidProfile id={id} />
            ))}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
