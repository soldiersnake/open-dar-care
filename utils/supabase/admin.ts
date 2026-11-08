import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-only client with the secret key: it bypasses RLS. Only for
// server-side code (Server Actions) while tables have no RLS policies yet.
// Never import this from a Client Component — "server-only" makes the
// build fail if it happens, and the key must never reach the browser.
export const createAdminClient = (): SupabaseClient => {
  return createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      persistSession: false,
    },
  });
};
