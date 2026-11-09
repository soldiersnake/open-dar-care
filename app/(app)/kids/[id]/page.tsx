import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/shared/avatar";
import { InfoList } from "@/components/shared/info-list";
import { LinkParentCard } from "@/components/kids/link-parent-card";
import { KidsLoading } from "@/components/kids/kids-loading";
import {
  getKidById,
  kidFromDbRow,
  type DbChildRow,
  type Kid,
} from "@/lib/kids-data";
import { isMockEnv } from "@/lib/dev-environment";
import { createAdminClient } from "@/utils/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function BackLink() {
  return (
    <Link
      href="/kids"
      className="mb-5 flex items-center gap-1.75 text-[14px] font-bold text-muted-soft"
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
    <div className="flex items-center gap-4.5">
      <Avatar initials={kid.initials} color={kid.avatarColor} size="xl" />
      <div className="min-w-0 flex-1">
        <h1 className="m-0 font-display text-[28px] font-semibold text-ink">
          {kid.name}
        </h1>
        <p className="m-0 mt-0.75 text-[15px] text-muted-soft">
          {kid.age} años · Sala {kid.room}
        </p>
      </div>
      {/* Inert until the edit-kid spec lands (SPEC 13 decision) */}
      <a
        href="#"
        className="rounded-[12px] border-[1.5px] border-line bg-panel px-4 py-2.25 text-[14px] font-bold text-ink-body"
      >
        Editar
      </a>
    </div>
  );
}

// Lines 1..n: translated allergy note first, medical notes second (SPEC 13:
// tags + notes together). No data at all → no banner.
function AllergyBanner({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;

  return (
    <div className="flex gap-3.5 rounded-2xl bg-allergy-bg px-4.5 py-4">
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
        <div className="mb-0.5 text-[15px] font-extrabold text-allergy-title">
          Alergias y notas
        </div>
        {lines.map((line, index) => (
          <div
            key={index}
            className={`whitespace-normal text-[14.5px] leading-[1.5] text-allergy-text ${
              index > 0 ? "mt-1.5" : ""
            }`}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function DaySummaryButton() {
  return (
    <a
      href="#"
      className="flex w-full items-center justify-center gap-2.25 rounded-[14px] bg-ink p-3.25 text-[15px] font-extrabold text-white"
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

// In-page error state for a failed profile read (reproducible with `?fail=1`
// in dev): no crash, no redirect — a centered box and the way back.
function ProfileUnavailable() {
  return (
    <div className="rounded-[18px] border border-line bg-panel py-16 text-center">
      <p className="m-0 font-display text-[18px] font-semibold text-ink">
        Perfil no disponible
      </p>
      <p className="m-0 mt-1.5 text-[14px] text-muted">
        No pudimos leer el perfil del niño. Reintenta en unos segundos.
      </p>
      <Link
        href="/kids"
        className="mt-5 inline-flex items-center justify-center rounded-[12px] border-[1.5px] border-line bg-panel px-4 py-2.25 text-[14px] font-bold text-ink-body"
      >
        Volver a Niños
      </Link>
    </div>
  );
}

async function KidProfile({
  id,
  forcedFailure,
}: {
  id: string;
  forcedFailure: boolean;
}) {
  // Real mode only: a valid uuid that exists as an active child. Numeric mock
  // ids, unknown or malformed ids → default not-found (mock profiles live in
  // the dev:mock environment, SPEC 14).
  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  let kid: Kid | null = null;
  let medicalNotes: string | null = null;
  // A dev-forced failure (`?fail=1`) takes the same in-page error path as a
  // real read failure: no DB hit, "Perfil no disponible" box (SPEC 13).
  let readFailed = forcedFailure;

  if (!forcedFailure) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("children")
        .select(
          "id, full_name, birth_date, enrolled_at, allergy_tags, medical_notes, status, rooms ( name )",
        )
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle<DbChildRow>();

      if (error) {
        throw error;
      }
      if (data) {
        kid = kidFromDbRow(data);
        medicalNotes = kid.medicalNotes ?? null;
      }
    } catch (error) {
      console.error("kid profile: remote read failed", error);
      readFailed = true;
    }
  }

  if (readFailed) {
    return <ProfileUnavailable />;
  }

  if (!kid) {
    // Unknown uuid (or archived child with the logical delete).
    notFound();
  }

  const bannerLines = [kid.allergiesNote, medicalNotes].filter(
    (line): line is string => line !== undefined && line !== null,
  );

  return (
    <div className="flex flex-wrap items-start gap-6.5">
      <div className="flex min-w-75 flex-1 flex-col gap-4.5">
        <Hero kid={kid} />
        <AllergyBanner lines={bannerLines} />
        <InfoList
          items={[
            { label: "Fecha de nacimiento", value: kid.birthDate },
            { label: "Sala", value: kid.room },
            { label: "Ingreso", value: kid.entryDate },
          ]}
        />
      </div>

      <div className="flex w-75 flex-none flex-col gap-3.5">
        <DaySummaryButton />
        {/* SPEC 06 block stays client-mock: parents arrive later via
            parent_children/invitations; the button is always available. */}
        <LinkParentCard parents={[]} kidName={kid.name} />
      </div>
    </div>
  );
}

// Mock environment profile (SPEC 14): numeric mock ids (1–8) resolve the
// example profiles; uuids and unknown ids → default not-found. `?fail=1`
// has no effect here — there is no DB connection in the first place.
async function MockKidProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const kidId = Number(id);
  if (!Number.isInteger(kidId)) {
    notFound();
  }

  const kid = getKidById(kidId);
  if (!kid) {
    notFound();
  }

  const bannerLines = [kid.allergiesNote, kid.medicalNotes].filter(
    (line): line is string => line !== undefined,
  );

  return (
    <div className="flex flex-wrap items-start gap-6.5">
      <div className="flex min-w-75 flex-1 flex-col gap-4.5">
        <Hero kid={kid} />
        <AllergyBanner lines={bannerLines} />
        <InfoList
          items={[
            { label: "Fecha de nacimiento", value: kid.birthDate },
            { label: "Sala", value: kid.room },
            { label: "Ingreso", value: kid.entryDate },
          ]}
        />
      </div>

      <div className="flex w-75 flex-none flex-col gap-3.5">
        <DaySummaryButton />
        {/* Mock parents (SPEC 06 example rows) + the always-available button. */}
        <LinkParentCard parents={kid.parents} kidName={kid.name} />
      </div>
    </div>
  );
}

// Inner section: resolves id + fail flag at request time inside the
// Suspense boundary (cacheComponents keeps the route fully dynamic).
async function KidProfileSection({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fail?: string }>;
}) {
  const [{ id }, { fail }] = await Promise.all([params, searchParams]);
  const forcedFailure =
    process.env.NODE_ENV === "development" && fail === "1";

  return <KidProfile id={id} forcedFailure={forcedFailure} />;
}

export default function KidProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fail?: string }>;
}) {
  if (isMockEnv()) {
    // Mock environment (SPEC 14): numeric mock profiles only, no DB reads.
    // Validation and visuals stay identical to SPEC 13.
    return (
      <div className="mx-auto w-full max-w-205 px-5 pb-20 pt-24.5 md:px-10 md:pt-8.5">
        <BackLink />

        <Suspense fallback={<KidsLoading label="Cargando niño…" />}>
          <MockKidProfile params={params} />
        </Suspense>
      </div>
    );
  }

  // Real environment (SPEC 13): uuid → database read; everything else 404.
  return (
    <div className="mx-auto w-full max-w-205 px-5 pb-20 pt-24.5 md:px-10 md:pt-8.5">
      <BackLink />

      <Suspense fallback={<KidsLoading label="Cargando niño…" />}>
        <KidProfileSection params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
