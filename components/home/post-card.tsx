import type { JSX } from "react";
import type { Post } from "@/lib/feed-data";

const categoryLabels: Record<Post["category"], string> = {
  achievement: "LOGRO",
  activity: "ACTIVIDAD",
  announcement: "ANUNCIO",
};

const categoryBadgeClasses: Record<Post["category"], string> = {
  achievement: "bg-badge-achievement text-badge-achievement-ink",
  activity: "bg-badge-activity text-badge-activity-ink",
  announcement: "bg-badge-announcement text-badge-announcement-ink",
};

const categoryDotClasses: Record<Post["category"], string> = {
  achievement: "bg-badge-achievement-ink",
  activity: "bg-badge-activity-ink",
  announcement: "bg-badge-announcement-ink",
};

const avatarByCategory: Record<Post["category"], { bg: string; ink: string }> = {
  achievement: { bg: "bg-avatar-kids", ink: "text-avatar-kids-ink" },
  activity: { bg: "bg-avatar-kids", ink: "text-avatar-kids-ink" },
  announcement: { bg: "bg-badge-announcement", ink: "text-badge-announcement-ink" },
};

function megaphoneGlyph(): JSX.Element {
  return (
    <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
  );
}

export function PostCard({ post }: { post: Post }) {
  const avatarClasses = avatarByCategory[post.category];

  return (
    <article className="rounded-[20px] border border-line bg-panel px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <div className="mb-3.5 flex items-center gap-3">
        <div
          className={`flex h-11 w-11 flex-none items-center justify-center rounded-full font-display text-[17px] font-semibold ${avatarClasses.bg} ${avatarClasses.ink}`}
        >
          {post.category === "announcement" ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {megaphoneGlyph()}
            </svg>
          ) : (
            post.authorInitials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.name}
          </div>
          <div className="text-[12.5px] text-muted">
            {post.time} · {post.postedBy}
          </div>
        </div>
        <div
          className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 ${categoryBadgeClasses[post.category]}`}
        >
          <span className={`h-2 w-2 rounded-full ${categoryDotClasses[post.category]}`} />
          <span className="text-xs font-extrabold tracking-[0.5px]">
            {categoryLabels[post.category]}
          </span>
        </div>
      </div>

      <div className="mb-2.5 text-[12.5px] text-muted">
        Para: {post.recipients}
      </div>
      <p className="m-0 text-[15.5px] leading-[1.55] text-ink-soft">
        {post.text}
      </p>

      {post.photoCaption && (
        <a
          href="#"
          className="mt-3.5 flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-photo-line bg-photo-bg text-photo-ink"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
          </svg>
          <span className="text-[13.5px]">{post.photoCaption}</span>
        </a>
      )}

      <div className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-3.5">
        <span className="flex items-center gap-[7px] text-sm font-bold text-accent-bright">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="#E0654A"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {post.likes}
        </span>
        <a
          href="#"
          className="flex items-center gap-[7px] text-sm font-bold text-muted-soft"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
          </svg>
          {post.comments}
        </a>
        <span className="flex-1" />
        <a
          href="#"
          className="text-sm font-extrabold text-accent-edit"
        >
          Editar
        </a>
      </div>
    </article>
  );
}
