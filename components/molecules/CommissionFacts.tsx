import { Tag } from "@/components/atoms/Tag";
import { COMMISSION_TONES, UNVERIFIED } from "@/lib/commissions";
import type { Commission } from "@/lib/types";

type CommissionFactsProps = { commission: Commission };

export function CommissionFacts({ commission }: CommissionFactsProps) {
  const { status, basis } = commission;
  return (
    <dl className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted">Estado</dt>
        <dd>
          <Tag tone={COMMISSION_TONES[status.slug]}>{status.name}</Tag>
        </dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-line pt-3">
        <dt className="text-muted">Fundamento</dt>
        <dd className="text-right font-semibold">{basis || UNVERIFIED}</dd>
      </div>
    </dl>
  );
}
