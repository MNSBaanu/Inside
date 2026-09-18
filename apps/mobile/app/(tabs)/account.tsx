import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, ErrorNotice, text } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { titleCase } from '@/lib/format';
import { useSession } from '@/lib/session';
import { space } from '@/lib/theme';

export default function AccountScreen() {
  const { user, logout, switchRole } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function changeRole(role: 'CLIENT' | 'DESIGNER') {
    setError(null);
    setBusy(true);
    try {
      await switchRole(role);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await logout();
    router.replace('/login');
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {error ? <ErrorNotice message={error} /> : null}

      <Card>
        <Text style={text.title}>{user.name}</Text>
        <Text style={text.muted}>{user.email}</Text>
        <View style={styles.badges}>
          <Badge label={titleCase(user.role)} />
          {user.isVerified ? <Badge label="Verified" tone="brand" /> : null}
          {!user.emailVerified ? (
            <Badge label="Email not verified" tone="highlight" />
          ) : null}
        </View>
      </Card>

      {user.role === 'DESIGNER' ? (
        <Card>
          <Text style={text.heading}>Working as</Text>
          <Text style={text.muted}>
            Switch to client mode to hire other designers.
          </Text>
          <View style={styles.row}>
            {(['DESIGNER', 'CLIENT'] as const).map((role) => (
              <Button
                key={role}
                label={titleCase(role)}
                variant={user.activeRole === role ? 'primary' : 'outline'}
                disabled={busy || user.activeRole === role}
                onPress={() => void changeRole(role)}
                style={styles.flex}
              />
            ))}
          </View>
        </Card>
      ) : null}

      <Text style={text.muted}>
        Profile, portfolio, verification and payments are managed on the web
        app.
      </Text>

      <Button label="Sign out" variant="outline" onPress={() => void signOut()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
