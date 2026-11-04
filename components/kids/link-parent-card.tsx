"use client";

import { useState } from "react";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/shared/badge";
import { LinkParentModal } from "@/components/kids/link-parent-modal";
import { generateInvitationCode, type LinkedParent } from "@/lib/kids-data";

function LinkedParentRow({ parent }: { parent: LinkedParent }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar
        initials={parent.name[0]}
        color={parent.avatarColor === "purple" ? "parentPurple" : parent.avatarColor}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-extrabold text-ink">{parent.name}</div>
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

// Client owner of the linked-parents list: mock rows plus those added by the
// link-parent modal (client-side only, no persistence).
export function LinkParentCard({
  parents,
  kidName,
}: {
  parents: LinkedParent[];
  kidName: string;
}) {
  const [rows, setRows] = useState<LinkedParent[]>(parents);
  const [modalOpen, setModalOpen] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");

  const openModal = () => {
    // The code is generated in the open handler, never during the initial
    // render: random values must not reach the SSR tree (cacheComponents).
    setInvitationCode(generateInvitationCode());
    setModalOpen(true);
  };

  return (
    <div className="rounded-2xl border border-line bg-panel px-4.5 py-4">
      <div className="mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-3.5">
        {rows.map((parent) => (
          <LinkedParentRow key={parent.id} parent={parent} />
        ))}
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={openModal}
          className="flex cursor-pointer items-center gap-3 pt-2"
        >
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
        </button>
      </div>

      {modalOpen ? (
        <LinkParentModal
          kidName={kidName}
          invitationCode={invitationCode}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
