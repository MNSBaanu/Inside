import { isClerkAPIResponseError } from '@clerk/nextjs/errors';

export function clerkErrorMessage(cause: unknown) {
  if (isClerkAPIResponseError(cause)) {
    const first = cause.errors[0];
    return first?.longMessage ?? first?.message ?? 'Something went wrong.';
  }
  return cause instanceof Error ? cause.message : 'Something went wrong.';
}
