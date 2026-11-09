"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { ToastProvider, useToast } from "@/components/shared/toast-provider";
import {
  createPostFromForm,
  posts as mockPosts,
  type Post,
  type PostDraft,
} from "@/lib/feed-data";

type NewPostContextValue = {
  newPosts: Post[]; // newest first; the feed prepends them to the mock
  addPost: (draft: PostDraft) => void;
  showToast: (message: string, variant?: "success" | "error" | "warning") => void;
};

const NewPostContext = createContext<NewPostContextValue | null>(null);

export function useNewPostContext(): NewPostContextValue {
  const value = useContext(NewPostContext);
  if (!value) {
    throw new Error("useNewPostContext must be used within NewPostProvider");
  }
  return value;
}

// Owns the post state and consumes the generic toast (delegation).
function NewPostState({ children }: { children: ReactNode }) {
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const { showToast } = useToast();

  const addPost = useCallback((draft: PostDraft) => {
    setNewPosts((current) => [
      createPostFromForm(draft, mockPosts.length + current.length),
      ...current,
    ]);
  }, []);

  return (
    <NewPostContext.Provider value={{ newPosts, addPost, showToast }}>
      {children}
    </NewPostContext.Provider>
  );
}

export function NewPostProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <NewPostState>{children}</NewPostState>
    </ToastProvider>
  );
}
