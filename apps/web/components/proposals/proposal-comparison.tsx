import { formatMoney, titleCase } from '@/lib/format';
import type { Proposal, StageName } from '@/lib/types';

const stages: StageName[] = [
  'PROPOSAL',
  'CONCEPT',
  'DESIGN',
  'REVISION',
  'COMPLETION',
];

export function ProposalComparison({ proposals }: { proposals: Proposal[] }) {
  const rows: { label: string; values: string[]; emphasise?: boolean }[] = [
    {
      label: 'Total',
      values: proposals.map((p) => formatMoney(p.totalAmount)),
      emphasise: true,
    },
    { label: 'Timeline', values: proposals.map((p) => p.timeline) },
    ...stages.map((stage) => ({
      label: titleCase(stage),
      values: proposals.map((p) => {
        const fee = p.stageFees.find((item) => item.name === stage);
        return fee ? formatMoney(fee.fee) : '—';
      }),
    })),
  ];

  return (
    <div className="overflow-x-auto rounded-card border border-hairline bg-surface">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <caption className="sr-only">Proposals side by side</caption>
        <thead>
          <tr className="border-b border-hairline">
            <th scope="col" className="label p-4 text-muted">
              Compare
            </th>
            {proposals.map((p) => (
              <th
                key={p.id}
                scope="col"
                className="p-4 font-display text-base font-semibold"
              >
                {p.designer?.name ?? 'Designer'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-hairline last:border-0">
              <th scope="row" className="p-4 font-normal capitalize text-muted">
                {row.label}
              </th>
              {row.values.map((value, index) => (
                <td
                  key={proposals[index].id}
                  className={
                    row.emphasise
                      ? 'p-4 font-display text-lg font-semibold text-brand'
                      : 'p-4'
                  }
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
