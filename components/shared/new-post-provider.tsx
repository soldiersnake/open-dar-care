"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Toast, type ToastVariant } from "@/components/shared/toast";
import {
  createPostFromForm,
  posts as mockPosts,
  type Post,
  type PostDraft,
} from "@/lib/feed-data";

type ActiveToast = {
  key: number; // remounts the Toast so consecutive messages restart the 3s timer
  variant: ToastVariant;
  message: string;
};

type NewPostContextValue = {
  newPosts: Post[]; // newest first; the feed prepends them to the mock
  addPost: (draft: PostDraft) => void;
  showToast: (message: string, variant?: ToastVariant) => void;
};

const NewPostContext = createContext<NewPostContextValue | null>(null);

export function useNewPostContext(): NewPostContextValue {
  const value = useContext(NewPostContext);
  if (!value) {
    throw new Error("useNewPostContext must be used within NewPostProvider");
  }
  return value;
}

export function NewPostProvider({ children }: { children: ReactNode }) {
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const [toast, setToast] = useState<ActiveToast | null>(null);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      setToast((current) => ({
        key: (current?.key ?? 0) + 1,
        variant,
        message,
      }));
    },
    [],
  );

  const addPost = useCallback((draft: PostDraft) => {
    setNewPosts((current) => [
      createPostFromForm(draft, mockPosts.length + current.length),
      ...current,
    ]);
  }, []);

  return (
    <NewPostContext.Provider value={{ newPosts, addPost, showToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.key}
          variant={toast.variant}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </NewPostContext.Provider>
  );
}
