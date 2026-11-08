import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Optimistic auth check only (cookies, no database queries):
// `/`, `/kids` and `/kids/:id` belong to the staff app.
const STAFF_PATH_PATTERN = /^\/(?:|kids(?:\/[^/]+)?)$/;
const LOGIN_PATH = "/login";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const updateSession = async (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  // IMPORTANT: do not run any code between createServerClient and
  // supabase.auth.getClaims() — this call refreshes expired auth tokens
  // and writes the new ones to the request and response cookies.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);

  // The secure auth check lives in utils/supabase/dal.ts; this proxy only
  // pre-filters unauthenticated requests based on the verified claims.
  const path = request.nextUrl.pathname;

  if (!isAuthenticated && STAFF_PATH_PATTERN.test(path)) {
    return redirectResponse("/login", request, supabaseResponse);
  }

  if (isAuthenticated && path === LOGIN_PATH) {
    return redirectResponse("/", request, supabaseResponse);
  }

  // IMPORTANT: do not run any code between getClaims and the return, this is
  // needed to keep the refreshed session available in Server Components.
  return supabaseResponse
};

// Redirect taking the (possibly refreshed) session cookies and cache
// headers along, as recommended by the Supabase SSR guide.
const redirectResponse = (
  path: string,
  request: NextRequest,
  supabaseResponse: NextResponse,
) => {
  const redirectResponse = NextResponse.redirect(new URL(path, request.nextUrl));
  for (const cookie of supabaseResponse.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = supabaseResponse.headers.get(header);
    if (value) redirectResponse.headers.set(header, value);
  }
  return redirectResponse;
};
