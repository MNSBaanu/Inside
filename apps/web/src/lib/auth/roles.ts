import type { GatePayload } from '@/lib/auth/session';

export function homePathForGate(gate: GatePayload): string {
  if (gate.role === 'ADMIN') return '/admin';
  if (gate.activeRole === 'DESIGNER') return '/designer';
  return '/client';
}

export function canAccessArea(
  gate: GatePayload,
  area: 'client' | 'designer' | 'admin',
): boolean {
  if (area === 'admin') return gate.role === 'ADMIN';
  if (area === 'designer') {
    return gate.role === 'DESIGNER' && gate.activeRole === 'DESIGNER';
  }
  return gate.activeRole === 'CLIENT';
}

export function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email')
  );
}
