'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { StatusPill } from '@/components/layout/status-pill';
import { formatApiError } from '@/lib/api/auth';
import { listBlocks, blockUser, unblockUser, type Block } from '@/lib/api/blocks';
import { listMyReports } from '@/lib/api/reports';
import type { Report } from '@/lib/api/types';

export function SafetyPanel() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [blockId, setBlockId] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const [blockData, reportData] = await Promise.all([
      listBlocks(),
      listMyReports(),
    ]);
    setBlocks(blockData.items);
    setReports(reportData.items);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
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

  async function onBlock(event: React.FormEvent) {
    event.preventDefault();
    setBlocking(true);
    setError(null);
    setMessage(null);
    try {
      await blockUser(blockId.trim(), blockReason.trim() || undefined);
      setBlockId('');
      setBlockReason('');
      setMessage('User blocked.');
      await refresh();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBlocking(false);
    }
  }

  async function onUnblock(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await unblockUser(id);
      setBlocks((prev) => prev.filter((item) => item.blockedId !== id));
      setMessage('User unblocked.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account · Safety"
        title="Trust & safety"
        description="Block people you no longer want to interact with, and track reports you have filed."
      />

      <p className="text-sm text-muted-foreground">
        <Link href="/profile" className="underline-offset-4 hover:underline">
          ← Back to profile
        </Link>
      </p>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-heading text-2xl tracking-tight">Blocked users</h2>
        <form onSubmit={onBlock} className="surface-panel space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="blockedId">User id to block</Label>
            <Input
              id="blockedId"
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
              required
              placeholder="UUID of the user"
            />
            <p className="text-xs text-muted-foreground">
              Use Block on a portfolio or project when you have the person in
              context — or paste their user id here.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="blockReason">Reason (optional)</Label>
            <Input
              id="blockReason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              maxLength={500}
            />
          </div>
          <Button type="submit" size="sm" disabled={blocking}>
            {blocking ? 'Blocking…' : 'Block user'}
          </Button>
        </form>

        {!loading && blocks.length === 0 ? (
          <EmptyState
            title="No one blocked"
            description="Blocked users cannot message you on shared projects."
          />
        ) : null}

        <ul className="space-y-3">
          {blocks.map((item) => (
            <li
              key={item.id}
              className="surface-panel flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-medium">
                  {item.blocked?.name ?? item.blockedId}
                </p>
                {item.reason ? (
                  <p className="text-sm text-muted-foreground">{item.reason}</p>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyId === item.blockedId}
                onClick={() => void onUnblock(item.blockedId)}
              >
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl tracking-tight">My reports</h2>
        {!loading && reports.length === 0 ? (
          <EmptyState
            title="No reports filed"
            description="You can report a designer from their portfolio or a project workspace."
          />
        ) : null}
        <ul className="space-y-3">
          {reports.map((item) => (
            <li key={item.id} className="surface-panel space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill value={item.status} />
                <StatusPill value={item.targetType} />
                <span className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm font-medium">{item.reason}</p>
              {item.details ? (
                <p className="text-sm text-muted-foreground">{item.details}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
