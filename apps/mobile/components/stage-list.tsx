import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatMoney, titleCase } from '@/lib/format';
import { colors, space } from '@/lib/theme';
import type { Deliverable, ProjectStage } from '@/lib/types';
import { pickAndUpload } from '@/lib/upload';
import { useApi } from '@/lib/use-api';
import {
  Button,
  Card,
  ErrorNotice,
  Field,
  Loading,
  StatusBadge,
  text,
} from './ui';

type StageAction = 'start' | 'submit' | 'approve' | 'reject';

export function StageList({
  stages,
  currentStage,
  projectActive,
  isClient,
  isDesigner,
  onChanged,
}: {
  stages: ProjectStage[];
  currentStage: ProjectStage['name'];
  /** Stage work is only possible while the project is active. */
  projectActive: boolean;
  isClient: boolean;
  isDesigner: boolean;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [openStage, setOpenStage] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const designerCanAct = isDesigner && projectActive;
  const clientCanAct = isClient && projectActive;

  async function act(
    stageId: string,
    action: StageAction,
    body?: { reason: string },
  ) {
    setError(null);
    setPending(stageId);
    try {
      await api.patch(`/stages/${stageId}/${action}`, body);
      if (action === 'reject') {
        setRejecting(null);
        setReason('');
      }
      onChanged();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(null);
    }
  }

  return (
    <View style={styles.list}>
      {error ? <ErrorNotice message={error} /> : null}

      {stages.map((stage) => {
        const busy = pending === stage.id;
        const canSubmit =
          designerCanAct &&
          (stage.status === 'IN_PROGRESS' || stage.status === 'REJECTED');
        return (
          <Card key={stage.id}>
            <View style={styles.header}>
              <Text style={text.heading}>
                {stage.stageOrder}. {titleCase(stage.name)}
              </Text>
              <StatusBadge status={stage.status} />
            </View>
            <Text style={text.muted}>
              {formatMoney(stage.fee)} · Due {formatDate(stage.dueDate)}
            </Text>

            <View style={styles.actions}>
              {designerCanAct &&
              stage.status === 'PENDING' &&
              stage.name === currentStage ? (
                <Button
                  label="Start stage"
                  busy={busy}
                  onPress={() => void act(stage.id, 'start')}
                />
              ) : null}
              {canSubmit ? (
                <Button
                  label={
                    stage.status === 'REJECTED'
                      ? 'Resubmit for review'
                      : 'Submit for review'
                  }
                  busy={busy}
                  onPress={() => void act(stage.id, 'submit')}
                />
              ) : null}
              {clientCanAct && stage.status === 'SUBMITTED' ? (
                <>
                  <Button
                    label="Approve"
                    busy={busy}
                    onPress={() => void act(stage.id, 'approve')}
                  />
                  <Button
                    label="Request changes"
                    variant="outline"
                    disabled={busy}
                    onPress={() =>
                      setRejecting(rejecting === stage.id ? null : stage.id)
                    }
                  />
                </>
              ) : null}
              <Button
                label={openStage === stage.id ? 'Hide files' : 'Files'}
                variant="ghost"
                onPress={() =>
                  setOpenStage(openStage === stage.id ? null : stage.id)
                }
              />
            </View>

            {clientCanAct &&
            rejecting === stage.id &&
            stage.status === 'SUBMITTED' ? (
              <View style={styles.form}>
                <Field
                  label="What needs to change?"
                  hint="The designer sees this in the project history."
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  maxLength={1000}
                />
                <Button
                  label="Send feedback"
                  busy={busy}
                  disabled={reason.trim().length < 2}
                  onPress={() =>
                    void act(stage.id, 'reject', { reason: reason.trim() })
                  }
                />
              </View>
            ) : null}

            {openStage === stage.id ? (
              <StageDeliverables stageId={stage.id} canUpload={canSubmit} />
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

function StageDeliverables({
  stageId,
  canUpload,
}: {
  stageId: string;
  canUpload: boolean;
}) {
  const { data, error, loading, reload } = useApi<{ items: Deliverable[] }>(
    `/stages/${stageId}/deliverables`,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function upload() {
    setUploadError(null);
    setUploading(true);
    try {
      const file = await pickAndUpload('deliverables');
      if (!file) return;
      await api.post(`/stages/${stageId}/deliverables`, {
        fileUrl: file.url,
        fileName: file.fileName,
      });
      await reload();
    } catch (cause) {
      setUploadError(errorMessage(cause));
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.files}>
      {error ? <ErrorNotice message={error} /> : null}
      {uploadError ? <ErrorNotice message={uploadError} /> : null}
      {loading && !data ? <Loading /> : null}

      {data && data.items.length === 0 ? (
        <Text style={text.muted}>No files for this stage yet.</Text>
      ) : null}

      {data?.items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="link"
          onPress={() => {
            if (item.fileUrl.startsWith('https://')) {
              void Linking.openURL(item.fileUrl);
            }
          }}
          style={styles.file}
        >
          <Text style={styles.fileName}>
            v{item.version} · {item.fileName ?? 'Deliverable'}
          </Text>
          <Text style={text.muted}>Uploaded {formatDate(item.uploadedAt)}</Text>
          {item.feedback ? (
            <Text style={text.body}>Feedback: {item.feedback}</Text>
          ) : null}
        </Pressable>
      ))}

      {canUpload ? (
        <Button
          label="Upload a file"
          variant="outline"
          busy={uploading}
          onPress={() => void upload()}
        />
      ) : null}
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
  },
  form: { gap: space.md, marginTop: space.sm },
  files: {
    gap: space.sm,
    marginTop: space.sm,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  file: {
    minHeight: 44,
    backgroundColor: colors.sand,
    borderRadius: 12,
    padding: space.md,
    gap: space.xs,
  },
  fileName: { ...text.body, fontWeight: '600', color: colors.brand },
});
