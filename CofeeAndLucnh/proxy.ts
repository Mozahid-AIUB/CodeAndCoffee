import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/offline", "/auth/confirm", "/api/health", "/api/cron"];
const AUTH_PAGES = ["/login", "/register"];

const matches = (path: string, list: string[]) =>
  list.some((p) => path === p || path.startsWith(p + "/"));

/** Refreshes the Supabase session cookie and does the optimistic "signed in?" redirect.
 *  Real authorization (role / active) is re-checked on the server in layouts and actions. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!data.user && !matches(path, PUBLIC_PATHS)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (data.user && matches(path, AUTH_PAGES)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|js|json|txt|webmanifest)$).*)"],
};
