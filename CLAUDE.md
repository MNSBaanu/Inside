# Inside — working agreements

## Verify after every change

After each set of code changes, run the checks for the affected package before
considering the work done. Do not defer verification to the end of a task.

```bash
pnpm typecheck   # tsc --noEmit across the workspace
pnpm lint        # eslint across the workspace
pnpm build       # turbo build — catches what the others miss
```

Scope to one package where possible, e.g. `pnpm --filter web build`.

For `apps/web`, `next build` runs linting and type validation as part of the
build, so a passing build covers all three.

Fix any failure before reporting the change as complete.

## Stack

| Layer | Tech |
|-------|------|
| API | NestJS 11, Prisma, PostgreSQL |
| Web | Next.js 15, React 19, Clerk 7, TypeScript, Tailwind CSS |
| Monorepo | pnpm workspaces + Turborepo |
