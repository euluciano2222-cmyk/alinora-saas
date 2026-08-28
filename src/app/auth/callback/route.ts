import type { EmailOtpType } from "@supabase/supabase-js";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { getSafeInternalPath } from "@/lib/security/redirects";
import { createClient } from "@/lib/supabase/server";

const allowedOtpTypes = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function getSafeOtpType(
  value: string | null,
): EmailOtpType | null {
  if (
    !value ||
    !allowedOtpTypes.has(value)
  ) {
    return null;
  }

  return value as EmailOtpType;
}

export async function GET(
  request: NextRequest,
) {
  const supabase = await createClient();

  const code =
    request.nextUrl.searchParams.get("code");

  const tokenHash =
    request.nextUrl.searchParams.get(
      "token_hash",
    );

  const type = getSafeOtpType(
    request.nextUrl.searchParams.get("type"),
  );

  const nextPath = getSafeInternalPath(
    request.nextUrl.searchParams.get("next"),
  );

  let authenticated = false;

  if (code) {
    const { error } =
      await supabase.auth.exchangeCodeForSession(
        code,
      );

    authenticated = !error;
  } else if (tokenHash && type) {
    const { error } =
      await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

    authenticated = !error;
  }

  if (authenticated) {
    const destinationUrl = new URL(
      nextPath,
      request.nextUrl.origin,
    );

    return NextResponse.redirect(
      destinationUrl,
    );
  }

  const errorDestination =
    request.nextUrl.clone();

  errorDestination.pathname =
    "/recuperar-senha";

  errorDestination.search = "";

  errorDestination.searchParams.set(
    "erro",
    "link-invalido",
  );

  return NextResponse.redirect(
    errorDestination,
  );
}