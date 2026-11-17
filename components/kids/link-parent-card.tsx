"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/shared/badge";
import { LinkParentModal } from "@/components/kids/link-parent-modal";
import { useToast } from "@/components/shared/toast-provider";
import { createInvitation } from "@/actions/invitations";
import {
  createPendingParentFromForm,
  generateInvitationCode,
  type LinkedParent,
  type LinkedParentDraft,
} from "@/lib/kids-data";

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

// Client owner of the linked-parents list, dual-mode (SPEC 14 pattern):
// - mockMode (dev:mock): SPEC 06 behavior — mock rows plus client-side
//   prepends, no POST, no email.
// - Real mode: rows arrive as a server prop (ACTIVA from parent_children,
//   PENDIENTE from live invitations, SPEC 15); "Enviar invitación" calls the
//   createInvitation Server Action, and a success closes the modal, shows the
//   toast and refreshes the server list (router.refresh). A server error
//   (email already linked, email failure) shows inline and keeps the modal
//   open.
export function LinkParentCard({
  parents,
  kidName,
  kidId,
  mockMode = false,
}: {
  parents: LinkedParent[];
  kidName: string;
  kidId: string;
  mockMode?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  // Mock-only state: real mode renders the prop directly (the server is the
  // source of truth, SPEC 14).
  const [mockRows, setMockRows] = useState<LinkedParent[]>(parents);
  const [modalOpen, setModalOpen] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");
  const [serverError, setServerError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const rows = mockMode ? mockRows : parents;

  const openModal = () => {
    // The code is generated in the open handler, never during the initial
    // render: random values must not reach the SSR tree (cacheComponents).
    setInvitationCode(generateInvitationCode());
    setServerError(undefined);
    setModalOpen(true);
  };

  const handleSaveParent = (draft: LinkedParentDraft) => {
    if (mockMode) {
      // Next id over the current rows (mock first, then added ones): the first
      // invited parent matches the spec's "mock max + 1" and ids stay unique.
      setMockRows((current) => {
        const nextId =
          current.reduce((max, parent) => Math.max(max, parent.id), 0) + 1;
        return [createPendingParentFromForm(draft, nextId), ...current];
      });
      return;
    }

    startTransition(async () => {
      const result = await createInvitation({
        childId: kidId,
        fullName: draft.name,
        email: draft.email,
        relation: draft.relation,
        code: invitationCode,
      });

      if (result.ok) {
        setModalOpen(false);
        showToast(`Invitación enviada a ${draft.email.trim()}`);
        // The new PENDIENTE row lives in the DB: the server list re-renders
        // with the refreshed prop (no manual reload).
        router.refresh();
      } else {
        setServerError(result.error);
      }
    });
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
          onSave={handleSaveParent}
          submitting={isPending}
          serverError={serverError}
          closeOnSave={mockMode}
        />
      ) : null}
    </div>
  );
}
