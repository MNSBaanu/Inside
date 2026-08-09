'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logoutRequest } from '@/lib/api/auth';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    try {
      await logoutRequest();
      router.replace('/login');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={onLogout}
    >
      {pending ? 'Logging out…' : 'Log out'}
    </Button>
  );
}
