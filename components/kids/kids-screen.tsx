"use client";

import { useState } from "react";
import { AddKidModal } from "@/components/kids/add-kid-modal";
import { KidList } from "@/components/kids/kid-list";
import { PageHeader } from "@/components/shared/page-header";
import { createKidFromForm, kids as mockKids, type Kid, type KidDraft } from "@/lib/kids-data";

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

export function KidsScreen() {
  const [kidList, setKidList] = useState<Kid[]>(mockKids);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSaveKid = (draft: KidDraft) => {
    setKidList((current) => {
      const nextId = current.reduce((max, kid) => Math.max(max, kid.id), 0) + 1;
      return [createKidFromForm(draft, nextId), ...current];
    });
  };

  return (
    <div className="mx-auto w-full max-w-220 px-5 pb-20 pt-24.5 md:px-10 md:pt-8.5">
      <PageHeader
        eyebrow="GESTIÓN"
        title="Niños"
        action={<AddKidButton onClick={() => setModalOpen(true)} />}
      />

      <KidList kids={kidList} />

      {modalOpen && (
        <AddKidModal onClose={() => setModalOpen(false)} onSave={handleSaveKid} />
      )}
    </div>
  );
}