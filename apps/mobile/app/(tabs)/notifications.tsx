import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  EmptyState,
  ErrorNotice,
  Loading,
  text,
} from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';
import type { Notification } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function NotificationsScreen() {
  const { data, error, loading, reload } = useApi<{ items: Notification[] }>(
    '/notifications',
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  async function markRead(path: string) {
    setActionError(null);
    setBusy(true);
    try {
      await api.patch(path, {});
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) return <Loading />;

  const unread = data?.items.filter((item) => item.readAt === null).length ?? 0;

  return (
    <FlatList
      data={data?.items ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={loading && data !== null}
          onRefresh={() => void reload()}
          tintColor={colors.brand}
        />
      }
      ListHeaderComponent={
        <View style={styles.intro}>
          {error ? <ErrorNotice message={error} /> : null}
          {actionError ? <ErrorNotice message={actionError} /> : null}
          {unread > 0 ? (
            <Button
              label={`Mark all ${unread} as read`}
              variant="outline"
              busy={busy}
              onPress={() => void markRead('/notifications/read-all')}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={<EmptyState title="You're all caught up." />}
      renderItem={({ item }) => {
        const isUnread = item.readAt === null;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isUnread }}
            disabled={!isUnread || busy}
            onPress={() => void markRead(`/notifications/${item.id}/read`)}
            style={[styles.item, isUnread && styles.unread]}
          >
            <Text style={text.heading}>{item.title}</Text>
            {item.message ? <Text style={text.body}>{item.message}</Text> : null}
            <Text style={text.muted}>
              {formatDate(item.createdAt)}
              {isUnread ? ' · Tap to mark read' : ''}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, gap: space.md },
  intro: { gap: space.md },
  item: {
    minHeight: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.xs,
  },
  unread: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
});
