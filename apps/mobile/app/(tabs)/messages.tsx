import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorNotice,
  Loading,
  text,
} from '@/components/ui';
import { formatDate } from '@/lib/utils/format';
import { useSession } from '@/lib/auth/session';
import { colors, space } from '@/lib/theme';
import type { ProjectListItem } from '@/lib/types';
import { useApi } from '@/lib/api/use-api';

export default function MessagesScreen() {
  const { user } = useSession();
  const { data, error, loading, reload } = useApi<{ items: ProjectListItem[] }>(
    '/projects',
  );

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  if (loading && !data) return <Loading />;

  const conversations = [...(data?.items ?? [])].sort((a, b) =>
    (b.lastMessage?.sentAt ?? '').localeCompare(a.lastMessage?.sentAt ?? ''),
  );

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={loading && data !== null}
          onRefresh={() => void reload()}
          tintColor={colors.brand}
        />
      }
      ListHeaderComponent={error ? <ErrorNotice message={error} /> : null}
      ListEmptyComponent={
        <EmptyState
          title="No conversations yet."
          description="Every project has its own message thread."
        />
      }
      renderItem={({ item }) => {
        const other =
          item.clientId === user?.id ? item.designer?.name : item.client?.name;
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/project/${item.id}?tab=Messages`)}
          >
            <Card>
              <View style={styles.header}>
                <Text style={[text.heading, styles.title]}>{item.title}</Text>
                {item.unreadCount > 0 ? (
                  <Badge label={`${item.unreadCount} new`} tone="highlight" />
                ) : null}
              </View>
              {other ? <Text style={text.muted}>With {other}</Text> : null}
              <Text style={text.body} numberOfLines={2}>
                {item.lastMessage?.content ?? 'No messages yet.'}
              </Text>
              {item.lastMessage ? (
                <Text style={text.muted}>{formatDate(item.lastMessage.sentAt)}</Text>
              ) : null}
            </Card>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, gap: space.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  title: { flex: 1 },
});
