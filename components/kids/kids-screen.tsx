"use client";

import { useEffect, useState } from "react";
import { AddKidModal } from "@/components/kids/add-kid-modal";
import { KidList } from "@/components/kids/kid-list";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/components/shared/toast-provider";
import {
  createKidFromForm,
  kids as mockKids,
  ROOMS,
  type Kid,
  type KidDraft,
  type RoomOption,
} from "@/lib/kids-data";

function AddKidIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function AddKidButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className="flex cursor-pointer items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4.5 py-2.75 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
    >
      <AddKidIcon />
      Agregar niño
    </button>
  );
}

// Zero real children with a healthy DB: centered box pointing to the CTA.
function KidsEmptyState() {
  return (
    <div className="rounded-[18px] border border-line bg-panel py-16 text-center">
      <p className="font-display text-[18px] font-semibold text-ink">
        No hay niños agregados
      </p>
      <p className="mt-2 text-[14px] text-muted">
        Usa el botón “+ Agregar niño” para crear el primero
      </p>
    </div>
  );
}

// Data mode comes from the server page (app/(app)/kids):
//  - kids + rooms: healthy DB read. The prop is the single source of truth —
//    the list renders straight from it, so router.refresh() (fired by the
//    add-kid modal after a successful POST) re-reads the DB and the new kid
//    shows up with no extra action (defect of the first implementation:
//    a useState copy swallowed the refreshed prop and required F5).
//  - connectionLost: server read failed (or dev `?fail=1`); the mock shows
//    as fallback and the client raises the failure toast on mount (SPEC 12).
//  - mockMode: dev:mock environment (SPEC 14) — the in-memory list starts
//    from the mocks and the modal saves client-side (SPEC 05), no DB at all.
export function KidsScreen({
  kids = [],
  rooms = [],
  connectionLost = false,
  mockMode = false,
}: {
  kids?: Kid[];
  rooms?: RoomOption[];
  connectionLost?: boolean;
  mockMode?: boolean;
}) {
  const { showToast } = useToast();
  // In-memory additions of the mock environment SPEC 05: they antepone to the
  // mocks and vanish on reload (no persistence there).
  const [addedKids, setAddedKids] = useState<Kid[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!mockMode && connectionLost) {
      showToast("Fallo de conexión al cargar los niños.", "error");
    }
  }, [mockMode, connectionLost, showToast]);

  const handleSaveKid = (draft: KidDraft) => {
    setAddedKids((current) => {
      const nextId =
        [...current, ...mockKids].reduce(
          (max, kid) => Math.max(max, Number(kid.id)),
          0,
        ) + 1;
      return [createKidFromForm(draft, nextId), ...current];
    });
  };

  // Without a healthy DB read the modal degrades to the mock room names
  // (no uuid): an attempt to save fails with an honest error toast.
  const roomOptions: RoomOption[] = connectionLost
    ? ROOMS.map((name) => ({ id: "", name }))
    : rooms;

  // Single source of truth per mode: server prop (real), in-memory mock
  // list (mock env), or the mock fallback on a failed read.
  const kidList: Kid[] = mockMode
    ? [...addedKids, ...mockKids]
    : connectionLost
      ? mockKids
      : kids;

  return (
    <div className="mx-auto w-full max-w-220 px-5 pb-20 pt-24.5 md:px-10 md:pt-8.5">
      <PageHeader
        eyebrow="GESTIÓN"
        title="Niños"
        action={<AddKidButton onClick={() => setModalOpen(true)} />}
      />

      {kidList.length === 0 ? (
        <KidsEmptyState />
      ) : (
        <KidList kids={kidList} navigable={!connectionLost} />
      )}

      {modalOpen && (
        <AddKidModal
          rooms={roomOptions}
          mockMode={mockMode}
          onSave={mockMode ? handleSaveKid : undefined}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
