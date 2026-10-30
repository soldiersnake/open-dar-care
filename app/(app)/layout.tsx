import { Sidebar } from "@/components/shared/sidebar";

// Fullscreen pages (login, activar-cuenta) live in app/(auth);
// this layout owns the 248px sidebar shell for the staff routes.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg md:h-screen md:overflow-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
