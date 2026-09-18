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
  StatusBadge,
  text,
} from '@/components/ui';
import { titleCase } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, space } from '@/lib/theme';
import type { ProjectListItem } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function ProjectsScreen() {
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
          <Text style={text.muted}>
            {user?.activeRole === 'DESIGNER'
              ? 'Projects you are designing.'
              : 'Projects you have hired for.'}
          </Text>
          {error ? <ErrorNotice message={error} /> : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No projects yet."
          description="Projects appear here once a proposal is accepted."
        />
      }
      renderItem={({ item }) => {
        const other =
          item.clientId === user?.id ? item.designer?.name : item.client?.name;
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/project/${item.id}`)}
          >
            <Card>
              <View style={styles.header}>
                <Text style={[text.heading, styles.title]}>{item.title}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={text.muted}>
                {titleCase(item.currentStage)} stage
                {other ? ` · with ${other}` : ''}
              </Text>
              {item.unreadCount > 0 ? (
                <Badge
                  label={`${item.unreadCount} unread message${item.unreadCount === 1 ? '' : 's'}`}
                  tone="highlight"
                />
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
  intro: { gap: space.md, marginBottom: space.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  title: { flex: 1 },
});
