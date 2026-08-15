import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get(
    "type",
  ) as EmailOtpType | null;

  const nextPath = getSafeNextPath(
    requestUrl.searchParams.get("next"),
  );

  const supabase = await createClient();

  let confirmationError = null;

  if (code) {
    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    confirmationError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
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
    return NextResponse.redirect(
      new URL(nextPath, requestUrl.origin),
    );
  }

  const loginUrl = new URL("/login", requestUrl.origin);

  loginUrl.searchParams.set(
    "confirmation",
    "error",
  );

  return NextResponse.redirect(loginUrl);
}