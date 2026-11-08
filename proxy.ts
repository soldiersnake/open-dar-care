import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

// The `middleware` file convention is deprecated in Next.js 16 and renamed
// to `proxy`. This file refreshes Supabase auth sessions on every matched
// request.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images and other public files (svg, png, jpg, jpeg, gif, webp, ico)
     *
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
