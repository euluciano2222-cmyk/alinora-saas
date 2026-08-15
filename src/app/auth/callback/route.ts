import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getSafeDestination(value: string | null) {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const code = request.nextUrl.searchParams.get("code");
  const tokenHash =
    request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get(
    "type",
  ) as EmailOtpType | null;

  const next = getSafeDestination(
    request.nextUrl.searchParams.get("next"),
  );

  let authenticated = false;

  if (code) {
    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    authenticated = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    authenticated = !error;
  }

  if (authenticated) {
    const destination = request.nextUrl.clone();

    destination.pathname = next;
    destination.search = "";

    return NextResponse.redirect(destination);
  }

  const errorDestination = request.nextUrl.clone();

  errorDestination.pathname = "/recuperar-senha";
  errorDestination.search = "";
  errorDestination.searchParams.set(
    "erro",
    "link-invalido",
  );

  return NextResponse.redirect(errorDestination);
}