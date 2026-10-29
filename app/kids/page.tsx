import { KidList } from "@/components/kids/kid-list";
import { PageHeader } from "@/components/shared/page-header";
import { Sidebar } from "@/components/shared/sidebar";

function AddKidButton() {
  return (
    <a
      href="#"
      className="flex items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4.5 py-2.75 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
    >
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
      Agregar niño
    </a>
  );
}

export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-bg md:h-screen md:overflow-hidden">
      <Sidebar />

      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <div className="mx-auto w-full max-w-220 px-5 pb-20 pt-24.5 md:px-10 md:pt-8.5">
          <PageHeader
            eyebrow="GESTIÓN"
            title="Niños"
            action={<AddKidButton />}
          />

          <KidList />
        </div>
      </main>
    </div>
  );
}
