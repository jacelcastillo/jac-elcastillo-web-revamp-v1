import { Container } from "@/components/atoms/Container";
import { RISK_SITE_URL, type RiskAlert } from "@/lib/alert";

const levels: Record<RiskAlert["nivel"], { label: string; strip: string }> = {
  amarilla: { label: "Alerta amarilla", strip: "bg-sun text-ink" },
  naranja: { label: "Alerta naranja", strip: "bg-alert-orange text-ink" },
  roja: { label: "Alerta roja", strip: "bg-flag-red text-white" },
};

export function RiskAlertBanner({ alert }: { alert: RiskAlert }) {
  const { label, strip } = levels[alert.nivel];
  return (
    <section aria-label="Alerta de gestión del riesgo" className={strip}>
      <Container
        size="wide"
        className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      >
        <div>
          <p className="font-semibold">
            <span className="uppercase tracking-[0.14em]">{label}</span>
            {" "}
            <span>{alert.titulo}</span>
          </p>
          {alert.descripcion && <p className="text-sm">{alert.descripcion}</p>}
        </div>
        <a
          href={RISK_SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
        >
          Ver qué hacer
        </a>
      </Container>
    </section>
  );
}
