import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Secure auth check, to be called close to the data (layouts, pages,
// Server Actions). Never trust the session cookie without verification:
// getClaims() validates the JWT signature on every call.
export const getCurrentUser = cache(async () => {
  // Request-time access: @supabase/auth-js reads Date.now() internally
  // (token expiry math), which cacheComponents flags during prerendering.
  await connection();

  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  return data.claims;
});

export type SessionUserProfile = {
  fullName: string;
  avatarUrl: string | null;
  role: "staff" | "parent" | "admin";
  daycareName: string;
};

// Profile of the signed-in user (public.users + own daycare name), memoized
// within a render pass. Requires the self-select policies of migration 0006.
export const getCurrentUserProfile = cache(async (): Promise<SessionUserProfile> => {
  const claims = await getCurrentUser();
  const supabase = createClient(await cookies());

  const { data } = await supabase
    .from("users")
    .select("full_name, avatar_url, role, daycares(name)")
    .eq("id", claims.sub)
    .single<{ full_name: string; avatar_url: string | null; role: "staff" | "parent" | "admin"; daycares: { name: string } | { name: string }[] | null }>();

  if (!data) {
    // Defensive fallback: the Auth user exists but has no profile row.
    const meta = claims.user_metadata as { full_name?: string } | undefined;
    return {
      fullName: meta?.full_name ?? claims.email ?? "Usuario",
      avatarUrl: null,
      role: "staff",
      daycareName: "",
    };
  }

  const daycareRelation = Array.isArray(data.daycares) ? data.daycares[0] : data.daycares;

  return {
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    role: data.role,
    daycareName: daycareRelation?.name ?? "",
  };
});
