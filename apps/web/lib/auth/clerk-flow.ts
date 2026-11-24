import type { useRouter } from 'next/navigation';

type Router = ReturnType<typeof useRouter>;

export function clerkErrorMessage(cause: unknown) {
  if (cause && typeof cause === 'object') {
    const { errors, longMessage, message } = cause as {
      errors?: { longMessage?: string; message?: string }[];
      longMessage?: string;
      message?: string;
    };
    const first = errors?.[0];
    const text = first?.longMessage ?? first?.message ?? longMessage ?? message;
    if (text) return text;
  }
  return 'Something went wrong.';
}

/** Navigate callback for Clerk's finalize(): goes to `path` once the session is active. */
export function navigateTo(router: Router, path: string) {
  return ({
    session,
    decorateUrl,
  }: {
    session?: { currentTask?: unknown } | null;
    decorateUrl: (url: string) => string;
  }) => {
    if (session?.currentTask) return;
    const url = decorateUrl(path);
    if (url.startsWith('http')) window.location.href = url;
    else router.push(url);
  };
}
