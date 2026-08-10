'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminBadge } from '@/components/admin/admin-badge';
import { EmptyState } from '@/components/layout/empty-state';
import { FilterChips } from '@/components/layout/filter-chips';
import { PageHeader } from '@/components/layout/page-header';
import { formatApiError } from '@/lib/api/auth';
import { listAdminUsers, reactivateUser, suspendUser } from '@/lib/api/admin';
import type { AdminUser } from '@/lib/api/types';

const ROLE_FILTERS = ['CLIENT', 'DESIGNER', 'ADMIN'] as const;

export function AdminUsers() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listAdminUsers();
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((user) => {
      if (role && user.role !== role) return false;
      if (!term) return true;
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    });
  }, [items, query, role]);

  async function onToggleStatus(user: AdminUser) {
    const suspending = user.status === 'ACTIVE';
    if (
      suspending &&
      !window.confirm(`Suspend ${user.name}? This also revokes their sessions.`)
    ) {
      return;
    }
    setBusyId(user.id);
    setError(null);
    try {
      const data = suspending
        ? await suspendUser(user.id)
        : await reactivateUser(user.id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, status: data.user.status } : item,
        ),
      );
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · Accounts"
        title="Users"
        description="Suspend accounts that break the rules, or restore access after review."
      />

      <div className="surface-panel space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="user-search">Search</Label>
          <Input
            id="user-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or email"
          />
        </div>
        <FilterChips
          label="Role"
          options={ROLE_FILTERS}
          value={role}
          onChange={setRole}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <EmptyState
          title="No users match"
          description="Clear the search or pick a different role."
        />
      ) : null}

      {filtered.length > 0 ? (
        <div className="surface-panel overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">Platform users</caption>
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">
                  User
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Role
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Joined
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AdminBadge value={user.role} />
                      {user.isVerified ? (
                        <span className="text-xs text-muted-foreground">
                          Verified
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <AdminBadge value={user.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant={user.status === 'ACTIVE' ? 'destructive' : 'outline'}
                      disabled={busyId === user.id}
                      onClick={() => onToggleStatus(user)}
                    >
                      {busyId === user.id
                        ? 'Working…'
                        : user.status === 'ACTIVE'
                          ? 'Suspend'
                          : 'Reactivate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
