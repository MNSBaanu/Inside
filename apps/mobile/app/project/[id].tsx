import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageThread } from '@/components/message-thread';
import { PaymentList, ProjectHistory } from '@/components/project-panels';
import { StageList } from '@/components/stage-list';
import { ErrorNotice, Loading, StatusBadge, text } from '@/components/ui';
import { formatDate, titleCase } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors, radius, space } from '@/lib/theme';
import type { Project, ProjectStage } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const segments = ['Stages', 'Messages', 'Payments', 'History'] as const;
type Segment = (typeof segments)[number];

export default function ProjectScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { user } = useSession();
  const project = useApi<{ project: Project }>(`/projects/${id}`);
  const stages = useApi<{ items: ProjectStage[] }>(`/projects/${id}/stages`);
  const [segment, setSegment] = useState<Segment>(
    tab === 'Messages' ? 'Messages' : 'Stages',
  );

  if (project.loading && !project.data) return <Loading />;
  if (project.error || !project.data) {
    return (
      <View style={styles.padded}>
        <ErrorNotice message={project.error ?? 'Project not found'} />
      </View>
    );
  }

  const item = project.data.project;
  const isClient = user?.id === item.clientId;
  const isDesigner = user?.id === item.designerId;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, title: item.title }} />

      <View style={styles.summary}>
        <View style={styles.row}>
          <Text style={text.body}>
            {titleCase(item.currentStage)} stage · Started{' '}
            {formatDate(item.startedAt)}
          </Text>
          <StatusBadge status={item.status} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segments}
        >
          {segments.map((name) => (
            <Pressable
              key={name}
              accessibilityRole="tab"
              accessibilityState={{ selected: segment === name }}
              onPress={() => setSegment(name)}
              style={[styles.segment, segment === name && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  segment === name && styles.segmentTextActive,
                ]}
              >
                {name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {segment === 'Messages' && user ? (
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <MessageThread projectId={item.id} currentUserId={user.id} />
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.padded}
          refreshControl={
            <RefreshControl
              refreshing={stages.loading && stages.data !== null}
              onRefresh={() => {
                void stages.reload();
                void project.reload();
              }}
              tintColor={colors.brand}
            />
          }
        >
          {segment === 'Stages' ? (
            stages.error ? (
              <ErrorNotice message={stages.error} />
            ) : stages.data ? (
              <StageList
                stages={stages.data.items}
                currentStage={item.currentStage}
                projectActive={item.status === 'ACTIVE'}
                isClient={isClient}
                isDesigner={isDesigner}
                onChanged={() => {
                  void stages.reload();
                  void project.reload();
                }}
              />
            ) : (
              <Loading />
            )
          ) : null}
          {segment === 'Payments' ? <PaymentList projectId={item.id} /> : null}
          {segment === 'History' ? <ProjectHistory projectId={item.id} /> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  padded: { padding: space.lg, gap: space.md },
  summary: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  segments: { gap: space.sm, paddingBottom: space.md },
  segment: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.sand,
  },
  segmentActive: { backgroundColor: colors.brand },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  segmentTextActive: { color: colors.surface },
});
