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
  const requestUrl = new URL(request.url);

  const code =
    requestUrl.searchParams.get("code");

  const tokenHash =
    requestUrl.searchParams.get(
      "token_hash",
    );

  const type = getSafeOtpType(
    requestUrl.searchParams.get("type"),
  );

  const nextPath = getSafeInternalPath(
    requestUrl.searchParams.get("next"),
  );

  const supabase = await createClient();

  let confirmationError: Error | null =
    null;

  if (code) {
    const { error } =
      await supabase.auth.exchangeCodeForSession(
        code,
      );

    confirmationError = error;
  } else if (tokenHash && type) {
    const { error } =
      await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

    confirmationError = error;
  } else {
    confirmationError = new Error(
      "Os dados de confirmação estão incompletos.",
    );
  }

  if (!confirmationError) {
    const destinationUrl = new URL(
      nextPath,
      requestUrl.origin,
    );

    return NextResponse.redirect(
      destinationUrl,
    );
  }

  const loginUrl = new URL(
    "/login",
    requestUrl.origin,
  );

  loginUrl.searchParams.set(
    "confirmation",
    "error",
  );

  return NextResponse.redirect(loginUrl);
}