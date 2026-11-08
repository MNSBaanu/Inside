import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Loading } from '@/components/ui';
import { useSession } from '@/lib/auth/session';
import { colors } from '@/lib/theme';

export default function TabsLayout() {
  const { status } = useSession();
  if (status === 'loading') return <Loading />;
  if (status === 'unauthenticated') return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        tabBarStyle: { backgroundColor: colors.surface },
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.ink,
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="projects" options={{ title: 'Projects' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
