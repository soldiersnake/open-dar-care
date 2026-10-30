import { PostCard } from "@/components/home/post-card";
import { homeHeader, mockUser, posts } from "@/lib/feed-data";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-190 px-5 pb-20 pt-24.5 md:px-10 md:pt-8.5">
      <div className="mb-6">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent">
          {homeHeader.eyebrow}
        </div>
        <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
          {homeHeader.greeting}
        </h1>
        <p className="m-0 mt-1.25 text-[14.5px] text-muted-soft">
          {homeHeader.summary}
        </p>
      </div>

      <a
        href="#"
        className="mb-6 flex items-center gap-3.5 rounded-[18px] border border-line bg-panel px-4.5 py-3.5 shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
      >
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-warm font-display text-base font-semibold text-white">
          {mockUser.initials}
        </div>
        <span className="flex-1 text-[15px] text-muted">
          Compartí un momento…
        </span>
        <span className="flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-cta-bg text-cta-ink">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
      </a>

      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-label">
          PUBLICADO HOY
        </span>
        <span className="h-px flex-1 bg-line-strong" />
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
