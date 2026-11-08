import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { titleCase } from '@/lib/utils/format';
import { colors, radius, space } from '@/lib/theme';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  busy,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
}) {
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.surface : colors.brand}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' ? styles.onPrimary : styles.onOutline,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  ...input
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...input}
        style={[styles.input, input.multiline && styles.multiline, input.style]}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const tones: Record<string, { bg: string; fg: string }> = {
  neutral: { bg: colors.sand, fg: colors.ink },
  brand: { bg: colors.brandSoft, fg: colors.brand },
  highlight: { bg: colors.highlightSoft, fg: colors.warning },
  support: { bg: colors.supportSoft, fg: colors.support },
};

const statusTone: Record<string, keyof typeof tones> = {
  ACTIVE: 'brand',
  IN_PROGRESS: 'brand',
  APPROVED: 'brand',
  COMPLETED: 'brand',
  RELEASED: 'brand',
  PAID: 'brand',
  SUBMITTED: 'highlight',
  ON_HOLD: 'highlight',
  PENDING: 'neutral',
  REJECTED: 'support',
  CANCELLED: 'support',
  FAILED: 'support',
};

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: keyof typeof tones;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: tones[tone].bg }]}>
      <Text style={[styles.badgeText, { color: tones[tone].fg }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge label={titleCase(status)} tone={statusTone[status] ?? 'neutral'} />;
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.muted}>{description}</Text> : null}
    </View>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" style={styles.error}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.brand} />
    </View>
  );
}

export const text = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  heading: { fontSize: 18, fontWeight: '600', color: colors.ink },
  body: { fontSize: 15, color: colors.ink },
  muted: { fontSize: 14, color: colors.muted },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
  },
});

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.brand },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  buttonText: { fontSize: 15, fontWeight: '600' },
  onPrimary: { color: colors.surface },
  onOutline: { color: colors.brand },
  field: { gap: space.sm },
  label: text.label,
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  hint: text.muted,
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  empty: { paddingVertical: space.xxl, alignItems: 'center', gap: space.sm },
  emptyTitle: text.heading,
  muted: { ...text.muted, textAlign: 'center' },
  error: {
    backgroundColor: colors.supportSoft,
    borderRadius: radius.card,
    padding: space.md,
  },
  errorText: { color: colors.error, fontSize: 14 },
  loading: { flex: 1, padding: space.xxl, alignItems: 'center' },
});
