import { createClerkClient } from '@clerk/backend';
import { clerkSetup } from '@clerk/testing/playwright';
import { PASSWORD, accounts } from './helpers';

/** Gives every seeded account the tests sign in as a matching user in the Clerk dev instance. */
export default async function globalSetup() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  await clerkSetup({ publishableKey, secretKey });

  const clerk = createClerkClient({ secretKey });
  for (const email of Object.values(accounts)) {
    const { data } = await clerk.users.getUserList({ emailAddress: [email] });
    if (data.length > 0) continue;
    await clerk.users.createUser({
      emailAddress: [email],
      password: PASSWORD,
      skipPasswordChecks: true,
    });
  }
}
