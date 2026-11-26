'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorNotice } from '@/components/ui/feedback';
import { FileUpload } from '@/components/ui/file-upload';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { api, errorMessage } from '@/lib/api/client';
import { formatMoney, toDateInputValue } from '@/lib/utils/format';

const today = () => toDateInputValue();

/** Admin records a milestone the client paid in cash or by bank transfer. */
export function OfflinePaymentDialog({
  paymentId,
  label,
  amount,
  onClose,
  onRecorded,
}: {
  paymentId: string;
  label: string;
  amount: number;
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [method, setMethod] = useState<'BANK_TRANSFER' | 'CASH'>('BANK_TRANSFER');
  const [paidOn, setPaidOn] = useState(today());
  const [reference, setReference] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post(`/admin/payments/${paymentId}/offline`, {
        method,
        paidOn,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(proofUrl ? { proofUrl } : {}),
      });
      onRecorded();
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Record offline payment"
      description={`${label} · ${formatMoney(amount)}`}
      onClose={busy ? () => {} : onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {error ? <ErrorNotice message={error} /> : null}

        <p className="rounded-lg bg-sand/60 px-4 py-3 text-sm text-muted">
          Only record money you have confirmed. The milestone becomes Paid, the designer
          can start the stage, and the client can no longer pay it by card.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Paid by" htmlFor="offline-method">
            <Select
              id="offline-method"
              value={method}
              options={[
                { value: 'BANK_TRANSFER', label: 'Bank transfer' },
                { value: 'CASH', label: 'Cash' },
              ]}
              onChange={(value) => {
                if (value) setMethod(value as 'BANK_TRANSFER' | 'CASH');
              }}
            />
          </Field>
          <Field label="Date received" htmlFor="offline-date">
            <Input
              id="offline-date"
              type="date"
              required
              max={today()}
              value={paidOn}
              onChange={(event) => setPaidOn(event.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Reference"
          htmlFor="offline-reference"
          hint={method === 'CASH' ? 'Optional, e.g. a receipt number.' : 'Optional, e.g. the bank transfer reference.'}
        >
          <Input
            id="offline-reference"
            maxLength={120}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder={method === 'CASH' ? 'Receipt 0042' : 'BOC transfer 004512'}
          />
        </Field>

        <FileUpload
          folder="attachments"
          accept="image/*,.pdf"
          label="Proof of payment (optional)"
          onUploaded={(file) => setProofUrl(file.url)}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !paidOn}>
            {busy ? 'Recording…' : 'Record payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
