import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/format';
import { colors, radius, space } from '@/lib/theme';
import type { Message } from '@/lib/types';
import { pickAndUpload, type UploadedFile } from '@/lib/api/upload';
import { useApi } from '@/lib/api/use-api';
import { Button, EmptyState, ErrorNotice, Loading, text } from '../../ui';

export function MessageThread({
  projectId,
  currentUserId,
}: {
  projectId: string;
  currentUserId: string;
}) {
  const { data, error, loading, reload } = useApi<{
    items: Message[];
    total?: number;
  }>(`/projects/${projectId}/messages`);

  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);
  const [sending, setSending] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [older, setOlder] = useState<Message[]>([]);
  const [olderPage, setOlderPage] = useState(2);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const markingRef = useRef(false);

  const shown = [...older, ...(data?.items ?? [])].filter(
    (message, index, all) =>
      all.findIndex((other) => other.id === message.id) === index,
  );
  const hasOlder =
    (data?.total ?? 0) > (data?.items.length ?? 0) + older.length;
  const unreadForMe = shown.some(
    (message) => message.receiverId === currentUserId && !message.isRead,
  );

  useEffect(() => {
    if (!unreadForMe || markingRef.current) return;
    markingRef.current = true;
    void api
      .patch(`/projects/${projectId}/messages/read-all`, {})
      .then(() => reload())
      .catch(() => undefined)
      .finally(() => {
        markingRef.current = false;
      });
  }, [unreadForMe, projectId, reload]);

  // Poll while the app is in the foreground.
  useEffect(() => {
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void reload();
    }, 15000);
    return () => clearInterval(timer);
  }, [reload]);

  async function attach() {
    setActionError(null);
    setAttaching(true);
    try {
      const file = await pickAndUpload('attachments');
      if (file) setAttachment(file);
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setAttaching(false);
    }
  }

  async function send() {
    if (!content.trim() && !attachment) return;
    setActionError(null);
    setSending(true);
    try {
      await api.post(`/projects/${projectId}/messages`, {
        content: content.trim() || attachment?.fileName,
        ...(attachment
          ? {
              attachmentUrl: attachment.url,
              attachmentType: attachment.fileName
                .split('.')
                .pop()
                ?.slice(0, 100),
            }
          : {}),
      });
      setContent('');
      setAttachment(null);
      await reload();
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  }

  async function loadOlder() {
    setLoadingOlder(true);
    try {
      const page = await api.get<{ items: Message[] }>(
        `/projects/${projectId}/messages?page=${olderPage}`,
      );
      setOlder((current) => [...page.items, ...current]);
      setOlderPage((value) => value + 1);
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setLoadingOlder(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => {
          if (older.length === 0) scrollRef.current?.scrollToEnd();
        }}
      >
        {error ? <ErrorNotice message={error} /> : null}
        {hasOlder ? (
          <Button
            label="Load older messages"
            variant="ghost"
            busy={loadingOlder}
            onPress={() => void loadOlder()}
          />
        ) : null}
        {loading && !data ? (
          <Loading />
        ) : shown.length === 0 ? (
          <EmptyState
            title="No messages yet."
            description="Everything you agree here stays attached to the project."
          />
        ) : (
          shown.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <View
                key={message.id}
                style={[styles.bubble, mine ? styles.mine : styles.theirs]}
              >
                <Text style={mine ? styles.mineText : text.body}>
                  {message.content}
                </Text>
                {message.attachmentUrl?.startsWith('https://') ? (
                  <Text
                    accessibilityRole="link"
                    onPress={() =>
                      void Linking.openURL(message.attachmentUrl as string)
                    }
                    style={[styles.link, mine && styles.mineText]}
                  >
                    {message.attachmentType
                      ? `Attachment (${message.attachmentType})`
                      : 'Attachment'}
                  </Text>
                ) : null}
                <Text style={[styles.meta, mine && styles.mineMeta]}>
                  {formatDate(message.sentAt)}
                  {mine && message.isRead ? ' · Read' : ''}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.composer}>
        {actionError ? <ErrorNotice message={actionError} /> : null}
        {attachment ? (
          <Text style={text.muted}>Attached: {attachment.fileName}</Text>
        ) : null}
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Write a message…"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={4000}
          accessibilityLabel="Message"
          style={styles.input}
        />
        <View style={styles.row}>
          <Button
            label={attachment ? 'Change file' : 'Attach'}
            variant="outline"
            busy={attaching}
            onPress={() => void attach()}
          />
          <Button
            label="Send"
            busy={sending}
            disabled={!content.trim() && !attachment}
            onPress={() => void send()}
            style={styles.send}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messages: { padding: space.lg, gap: space.md },
  bubble: {
    maxWidth: '85%',
    borderRadius: radius.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.xs,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.brand },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.sand },
  mineText: { color: colors.canvas, fontSize: 15 },
  link: { textDecorationLine: 'underline', color: colors.brand, fontSize: 14 },
  meta: { fontSize: 12, color: colors.muted },
  mineMeta: { color: colors.brandSoft },
  composer: {
    gap: space.sm,
    padding: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  input: {
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontSize: 16,
    color: colors.ink,
  },
  row: { flexDirection: 'row', gap: space.sm },
  send: { flex: 1 },
});
