import { Redirect } from 'expo-router';
import { Loading } from '@/components/ui';
import { useSession } from '@/lib/auth/session';

export default function Index() {
  const { status } = useSession();
  if (status === 'loading') return <Loading />;
  return <Redirect href={status === 'authenticated' ? '/projects' : '/login'} />;
}
