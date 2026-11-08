import { Sidebar } from "@/components/shared/sidebar";
import { NewPostProvider } from "@/components/shared/new-post-provider";
import { getCurrentUserProfile } from "@/utils/supabase/dal";

// Session is per-user: these staff routes block on the server while the
// auth claim is verified (see Authentication with Cache Components).
export const instant = false;

// Fullscreen pages (login, activar-cuenta) live in app/(auth);
// this layout owns the 248px sidebar shell for the staff routes.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Secure auth check: no session means no staff app (the proxy does
  // the optimistic redirect; this check runs close to the data).
  const profile = await getCurrentUserProfile();

  return (
    <div className="flex min-h-screen bg-bg md:h-screen md:overflow-hidden">
      <NewPostProvider>
        <Sidebar user={profile} />
        <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
          {children}
        </main>
      </NewPostProvider>
    </div>
  );
}
