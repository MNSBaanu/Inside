import { createClerkClient } from '@clerk/backend';

/** The registration tests' throwaway addresses, e.g. pw-1795700000000+clerk_test@example.com. */
const TEST_SIGN_UP = /^(pw|journey)-\d+\+clerk_test@example\.com$/;

/**
 * Removes the Clerk users the registration tests created. Clerk development
 * instances hold at most 100 users, so leftovers would soon block sign-up.
 */
export default async function globalTeardown() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return;
  const clerk = createClerkClient({ secretKey });

  for (const prefix of ['pw-', 'journey-']) {
    const { data } = await clerk.users.getUserList({ query: prefix, limit: 100 });
    for (const user of data) {
      const emails = user.emailAddresses.map((email) => email.emailAddress);
      if (emails.length > 0 && emails.every((email) => TEST_SIGN_UP.test(email))) {
        await clerk.users.deleteUser(user.id);
      }
    }
  }
}
