import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { getSafeInternalPath } from "@/lib/security/redirects";

function copyCookies(
  source: NextResponse,
  destination: NextResponse,
): NextResponse {
  source.cookies
    .getAll()
    .forEach((cookie) => {
      destination.cookies.set(cookie);
    });

  return destination;
}

function matchesRoutePrefix(
  pathname: string,
  prefix: string,
) {
  return (
    pathname === prefix ||
    pathname.startsWith(`${prefix}/`)
  );
}

function isProtectedPath(
  pathname: string,
) {
  return (
    matchesRoutePrefix(
      pathname,
      "/dashboard",
    ) ||
    matchesRoutePrefix(
      pathname,
      "/portal",
    ) ||
    matchesRoutePrefix(
      pathname,
      "/convite",
    )
  );
}

export async function updateSession(
  request: NextRequest,
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });

  const supabase = createServerClient(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(
          cookiesToSet,
          responseHeaders,
        ) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value,
              );
            },
          );

          supabaseResponse =
            NextResponse.next({
              request,
            });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              supabaseResponse.cookies.set(
                name,
                value,
                options,
              );
            },
          );

          Object.entries(
            responseHeaders,
          ).forEach(([name, value]) => {
            supabaseResponse.headers.set(
              name,
              value,
            );
          });
        },
      },
    },
  );

  const { data, error } =
    await supabase.auth.getClaims();

  const claims =
    error ? null : data?.claims;

  const pathname =
    request.nextUrl.pathname;

  if (
    !claims &&
    isProtectedPath(pathname)
  ) {
    const loginUrl =
      request.nextUrl.clone();

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

  if (
    claims &&
    matchesRoutePrefix(
      pathname,
      "/login",
    )
  ) {
    const nextPath =
      getSafeInternalPath(
        request.nextUrl.searchParams.get(
          "next",
        ),
      );

    const destinationUrl = new URL(
      nextPath,
      request.nextUrl.origin,
    );

    return copyCookies(
      supabaseResponse,
      NextResponse.redirect(
        destinationUrl,
      ),
    );
  }

  return supabaseResponse;
}