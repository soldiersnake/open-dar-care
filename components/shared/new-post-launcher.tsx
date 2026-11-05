"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { CreatePostModal } from "@/components/shared/create-post-modal";
import { useNewPostContext } from "@/components/shared/new-post-provider";
import type { PostDraft } from "@/lib/feed-data";

// Render-prop launcher shared by all "Nueva publicación" triggers
// (sidebar, drawer and the feed CTA). The trigger stays anywhere in the tree;
// publishing lands on "/" so the prepended post is always visible.
// The modal renders through a portal: the mobile drawer animates with a CSS
// transform, which would otherwise become the fixed overlay's containing block.
export function NewPostLauncher({
  children,
}: {
  children: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { addPost, showToast } = useNewPostContext();
  const pathname = usePathname();
  const router = useRouter();

  const handlePublish = (draft: PostDraft) => {
    addPost(draft);
    showToast("Publicación creada");
    if (pathname !== "/") router.push("/");
  };

  return (
    <>
      {children(() => setOpen(true))}
      {open &&
        createPortal(
          <CreatePostModal
            onClose={() => setOpen(false)}
            onSave={handlePublish}
          />,
          document.body,
        )}
    </>
  );
}
