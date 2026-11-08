'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ErrorNotice } from '@/components/ui/feedback';
import { Field, Textarea } from '@/components/ui/field';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';

export type BriefSuggestion = {
  rooms: string[];
  styles: string[];
  budgetRange: string;
  description: string;
};

const MIN_LENGTH = 20;

export function BriefAssistant({
  onSuggest,
}: {
  onSuggest: (suggestion: BriefSuggestion) => void;
}) {
  const { data } = useApi<{ enabled: boolean }>('/briefs/assistant');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!data?.enabled) return null;

  async function suggest() {
    setError(null);
    setDone(false);
    setBusy(true);
    try {
      const suggestion = await api.post<BriefSuggestion>('/briefs/assistant', {
        text: text.trim(),
      });
      onSuggest(suggestion);
      setDone(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-12">
      <CardHeader
        title="Describe it in your own words"
        description="Write a few sentences about the space and we will fill in the form below. You can change anything afterwards."
      />
      <div className="flex flex-col gap-6">
        {error ? <ErrorNotice message={error} /> : null}
        <Field
          label="Your space"
          htmlFor="assistant-text"
          hint="For example: our living room feels dark. We like calm, natural materials, have about 600,000 to spend, and want to keep the teak cabinet."
        >
          <Textarea
            id="assistant-text"
            maxLength={1500}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setDone(false);
            }}
            placeholder="Tell us about the room, what you like and what you want to keep."
          />
        </Field>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            onClick={suggest}
            disabled={busy || text.trim().length < MIN_LENGTH}
          >
            {busy ? 'Working…' : 'Fill in the form for me'}
          </Button>
          {done ? (
            <p role="status" className="text-sm text-muted">
              Done. Check the details below and edit anything that is not right.
            </p>
          ) : text.trim().length < MIN_LENGTH ? (
            <p className="text-sm text-muted">
              Write at least {MIN_LENGTH} characters.
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
