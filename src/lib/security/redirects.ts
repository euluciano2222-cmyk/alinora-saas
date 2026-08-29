const fallbackRedirectPath = "/dashboard";

const allowedRedirectPrefixes = [
  "/dashboard",
  "/portal",
  "/convite",
  "/atualizar-senha",
];

function isAllowedPath(pathname: string) {
  return allowedRedirectPrefixes.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`),
  );
}

export function getSafeInternalPath(
  value: string | null | undefined,
  fallback = fallbackRedirectPath,
) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  if (
    !normalizedValue.startsWith("/") ||
    normalizedValue.startsWith("//") ||
    normalizedValue.includes("\\")
  ) {
    return fallback;
  }

  try {
    const trustedBaseUrl = new URL(
      "https://alinora.internal",
    );

    const destination = new URL(
      normalizedValue,
      trustedBaseUrl,
    );

    if (
      destination.origin !==
      trustedBaseUrl.origin
    ) {
      return fallback;
    }

    let decodedPathname: string;

    try {
      decodedPathname = decodeURIComponent(
        destination.pathname,
      );
    } catch {
      return fallback;
    }

    if (
      decodedPathname.includes("\\") ||
      decodedPathname.startsWith("//") ||
      !isAllowedPath(destination.pathname)
    ) {
      return fallback;
    }

    return `${destination.pathname}${destination.search}`;
  } catch {
    return fallback;
  }
}