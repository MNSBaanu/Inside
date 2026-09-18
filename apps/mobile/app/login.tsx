import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorNotice, Field, text } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, space } from '@/lib/theme';

export default function LoginScreen() {
  const { login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/projects');
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>
            Inside<Text style={{ color: colors.brand }}>.</Text>
          </Text>
          <Text style={text.title}>Welcome back.</Text>
          <Text style={text.muted}>
            Your projects, stages and messages, wherever you are.
          </Text>

          {error ? <ErrorNotice message={error} /> : null}

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
          />
          <Button
            label="Sign in"
            busy={submitting}
            disabled={!email || password.length < 8}
            onPress={() => void onSubmit()}
          />
          <Link href="/register" style={styles.link}>
            New to Inside? Create an account
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.xl, gap: space.lg, flexGrow: 1, justifyContent: 'center' },
  brand: { fontSize: 28, fontWeight: '700', color: colors.ink },
  link: { color: colors.brand, fontSize: 15, paddingVertical: space.md, textAlign: 'center' },
});
