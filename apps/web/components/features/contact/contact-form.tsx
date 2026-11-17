'use client';

import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { ErrorNotice } from '@/components/ui/feedback';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { api, errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';

export const CONTACT_TOPICS = [
  { value: 'GENERAL', label: 'General question' },
  { value: 'SUPPORT', label: 'Help with my account or a project' },
  { value: 'PARTNERSHIP', label: 'Designers and partnerships' },
  { value: 'FEEDBACK', label: 'Feedback' },
];

export function ContactForm() {
  const { user } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('GENERAL');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.name);
    setEmail((current) => current || user.email);
  }, [user]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSending(true);
    try {
      await api.post(
        '/contact',
        { name, email, topic, message },
        { auth: false },
      );
      setSent(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className={cn(cardSurface, 'flex flex-col items-start gap-3 p-6 md:p-8')} role="status">
        <CheckCircle2 aria-hidden className="h-8 w-8 text-brand" />
        <h2 className="font-display text-2xl font-semibold">Message sent.</h2>
        <p className="text-muted">
          Thanks, {name.split(' ')[0]}. We usually reply within one working day
          at {email}.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => {
            setMessage('');
            setSent(false);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(cardSurface, 'flex flex-col gap-5 p-6 md:p-8')}
    >
      {error ? <ErrorNotice message={error} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="contact-name">
          <Input
            id="contact-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
        </Field>
        <Field label="Email" htmlFor="contact-email">
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={254}
            autoComplete="email"
          />
        </Field>
      </div>
      <Field label="Topic" htmlFor="contact-topic">
        <Select
          id="contact-topic"
          value={topic}
          onChange={setTopic}
          options={CONTACT_TOPICS}
        />
      </Field>
      <Field label="Message" htmlFor="contact-message" hint="At least 10 characters.">
        <Textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          minLength={10}
          maxLength={5000}
          rows={6}
        />
      </Field>
      <Button type="submit" disabled={sending} className="self-start">
        {sending ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
