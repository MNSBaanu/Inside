import { StyleSheet, Text, View } from 'react-native';
import { formatDate, formatMoney, titleCase } from '@/lib/utils/format';
import { space } from '@/lib/theme';
import type { ActivityEntry, MilestonePayment } from '@/lib/types';
import { useApi } from '@/lib/api/use-api';
import {
  Card,
  EmptyState,
  ErrorNotice,
  Loading,
  StatusBadge,
  text,
} from '../../ui';

export function PaymentList({ projectId }: { projectId: string }) {
  const { data, error, loading } = useApi<{ items: MilestonePayment[] }>(
    `/projects/${projectId}/payments`,
  );

  if (loading && !data) return <Loading />;
  if (error) return <ErrorNotice message={error} />;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="No milestone payments yet."
        description="A milestone is created when the client approves a stage."
      />
    );
  }

  return (
    <View style={styles.list}>
      {data.items.map((payment) => (
        <Card key={payment.id}>
          <View style={styles.header}>
            <Text style={text.heading}>{formatMoney(payment.amount)}</Text>
            <StatusBadge status={payment.status} />
          </View>
          <Text style={text.muted}>
            {payment.paidAt ? `Paid ${formatDate(payment.paidAt)}` : 'Not paid yet'}
            {payment.releasedAt
              ? ` · Released ${formatDate(payment.releasedAt)}`
              : ''}
          </Text>
        </Card>
      ))}
      <Text style={text.muted}>Paying and releasing happen on the web app.</Text>
    </View>
  );
}

function describe(entry: ActivityEntry) {
  const name = entry.metadata?.name;
  const version = entry.metadata?.version;
  return [
    titleCase(entry.action),
    typeof name === 'string' ? titleCase(name) : null,
    typeof version === 'number' ? `v${version}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function ProjectHistory({ projectId }: { projectId: string }) {
  const { data, error, loading } = useApi<{ items: ActivityEntry[] }>(
    `/projects/${projectId}/activity`,
  );

  if (loading && !data) return <Loading />;
  if (error) return <ErrorNotice message={error} />;
  if (!data || data.items.length === 0) {
    return <EmptyState title="No activity yet." />;
  }

  return (
    <View style={styles.list}>
      {data.items.map((entry) => {
        const reason = entry.metadata?.reason;
        return (
          <Card key={entry.id}>
            <Text style={text.heading}>{describe(entry)}</Text>
            <Text style={text.muted}>
              {entry.user?.name ?? 'System'} · {formatDate(entry.createdAt)}
            </Text>
            {typeof reason === 'string' ? (
              <Text style={text.body}>{reason}</Text>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
});
