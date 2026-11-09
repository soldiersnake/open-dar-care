"use client";

import { useEffect, useState } from "react";
import { AddKidModal } from "@/components/kids/add-kid-modal";
import { KidList } from "@/components/kids/kid-list";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/components/shared/toast-provider";
import { kids as mockKids, ROOMS, type Kid, type RoomOption } from "@/lib/kids-data";

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
//  - kids + rooms: healthy DB read, list is the single source of truth.
//  - connectionLost: server read failed (or dev `?fail=1`); the mock shows
//    as fallback and the client raises the failure toast on mount (SPEC 12).
export function KidsScreen({
  kids = [],
  rooms = [],
  connectionLost = false,
}: {
  kids?: Kid[];
  rooms?: RoomOption[];
  connectionLost?: boolean;
}) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (connectionLost) {
      showToast("Fallo de conexión al cargar los niños.", "error");
    }
  }, [connectionLost, showToast]);

  const kidList = connectionLost ? mockKids : kids;
  // Without a healthy DB read the modal degrades to the mock room names
  // (no uuid): an attempt to save fails with an honest error toast.
  const roomOptions: RoomOption[] = connectionLost
    ? ROOMS.map((name) => ({ id: "", name }))
    : rooms;

  return (
    <div className="mx-auto w-full max-w-220 px-5 pb-20 pt-24.5 md:px-10 md:pt-8.5">
      <PageHeader
        eyebrow="GESTIÓN"
        title="Niños"
        action={<AddKidButton onClick={() => setModalOpen(true)} />}
      />

      {kidList.length === 0 ? <KidsEmptyState /> : <KidList kids={kidList} />}

      {modalOpen && (
        <AddKidModal rooms={roomOptions} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
