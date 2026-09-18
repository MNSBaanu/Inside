import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorNotice, Field, text } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, space } from '@/lib/theme';

type AccountRole = 'CLIENT' | 'DESIGNER';

export default function RegisterScreen() {
  const { register } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AccountRole>('CLIENT');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role });
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
          <Text style={text.title}>Create your account.</Text>

          {error ? <ErrorNotice message={error} /> : null}

          <View style={styles.roles}>
            {(['CLIENT', 'DESIGNER'] as const).map((option) => (
              <Button
                key={option}
                label={option === 'CLIENT' ? "I'm a client" : "I'm a designer"}
                variant={role === option ? 'primary' : 'outline'}
                onPress={() => setRole(option)}
                style={styles.role}
              />
            ))}
          </View>

          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            textContentType="name"
          />
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
            hint="At least 8 characters."
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={72}
          />
          <Button
            label="Create account"
            busy={submitting}
            disabled={name.trim().length < 2 || !email || password.length < 8}
            onPress={() => void onSubmit()}
          />
          <Link href="/login" style={styles.link}>
            Already have an account? Sign in
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.xl, gap: space.lg, flexGrow: 1, justifyContent: 'center' },
  roles: { flexDirection: 'row', gap: space.sm },
  role: { flex: 1 },
  link: { color: colors.brand, fontSize: 15, paddingVertical: space.md, textAlign: 'center' },
});
