import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

function copyCookies(
  source: NextResponse,
  destination: NextResponse,
): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    destination.cookies.set(cookie);
  });

  return destination;
}

function getSafeNextPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/dashboard";
  }

  return value;
}

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/convite")
  );
}

export async function updateSession(
  request: NextRequest,
) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value);
            },
          );

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              supabaseResponse.cookies.set(
                name,
                value,
                options,
              );
            },
          );

          Object.entries(headers).forEach(
            ([name, value]) => {
              supabaseResponse.headers.set(
                name,
                value,
              );
            },
          );
        },
      },
    },
  );

  const { data } =
    await supabase.auth.getClaims();

  const claims = data?.claims;
  const pathname = request.nextUrl.pathname;

  if (!claims && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );

    return copyCookies(
      supabaseResponse,
      NextResponse.redirect(loginUrl),
    );
  }

  if (claims && pathname.startsWith("/login")) {
    const nextPath = getSafeNextPath(
      request.nextUrl.searchParams.get("next"),
    );

    const destinationUrl =
      request.nextUrl.clone();

    destinationUrl.pathname = nextPath;
    destinationUrl.search = "";

    return copyCookies(
      supabaseResponse,
      NextResponse.redirect(destinationUrl),
    );
  }

  return supabaseResponse;
}