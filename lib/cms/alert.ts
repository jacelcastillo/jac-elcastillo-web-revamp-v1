import { toRiskAlert, type RiskAlert } from "../alert.ts";

export async function getRiskAlert(): Promise<RiskAlert | null> {
  try {
    const res = await fetch(new URL("/wp-json/jac-gr/v1/contenido", process.env.WP_URL), {
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 30, tags: ["wordpress"] },
    });
    if (!res.ok || !res.headers.get("content-type")?.includes("json")) return null;
    return toRiskAlert(await res.json());
  } catch {
    return null;
  }
}
