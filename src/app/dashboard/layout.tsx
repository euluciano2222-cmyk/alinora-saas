import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/Dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/server";

type DashboardLayoutProps = {
  children: ReactNode;
};

type OrganizationRelation =
  | {
      name: string;
    }
  | Array<{
      name: string;
    }>
  | null;

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/login");
  }

  const userId = String(claims.sub);

  const [profileResult, membershipResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .maybeSingle(),

      supabase
        .from("organization_members")
        .select(
          "organization_id, organizations(name)",
        )
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle(),
    ]);

  const profile = profileResult.data;
  const membership = membershipResult.data;

  const email: string =
    typeof profile?.email === "string"
      ? profile.email
      : typeof claims.email === "string"
        ? claims.email
        : "usuario@alinora.com";

  const fallbackName = email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map(
      (part: string) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase(),
    )
    .join(" ");

  const displayName =
    typeof profile?.full_name === "string" &&
    profile.full_name.trim()
      ? profile.full_name.trim()
      : fallbackName || "Conta Alinora";

  const organizationRelation =
    membership?.organizations as
      | OrganizationRelation
      | undefined;

  const organizationName = Array.isArray(
    organizationRelation,
  )
    ? organizationRelation[0]?.name ?? null
    : organizationRelation?.name ?? null;

  return (
    <DashboardShell
      displayName={displayName}
      email={email}
      organizationName={organizationName}
    >
      {children}
    </DashboardShell>
  );
}