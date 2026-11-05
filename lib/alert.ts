export type RiskAlert = {
  nivel: "amarilla" | "naranja" | "roja";
  titulo: string;
  descripcion: string;
};

export const RISK_SITE_URL = "https://gestiondelriesgo.jacelcastillo.com.co/";

const LEVELS: readonly string[] = ["amarilla", "naranja", "roja"];

export function toRiskAlert(json: unknown): RiskAlert | null {
  if (typeof json !== "object" || json === null) return null;
  const alerta = (json as { alerta?: unknown }).alerta;
  if (typeof alerta !== "object" || alerta === null) return null;
  const { nivel, titulo, descripcion } = alerta as Record<string, unknown>;
  if (typeof nivel !== "string" || !LEVELS.includes(nivel)) return null;
  const title = typeof titulo === "string" ? titulo.trim() : "";
  if (!title) return null;
  return {
    nivel: nivel as RiskAlert["nivel"],
    titulo: title,
    descripcion: typeof descripcion === "string" ? descripcion.trim() : "",
  };
}
