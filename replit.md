# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Social Chat Hornet App

A Hornet-style niche social chat web app.

### Features
- **Explore/Nearby** (`/`): Grid of user profile cards with online indicators, PRO badges
- **Community Feed** (`/feed`): Social posts with likes, create new posts
- **Messages** (`/messages`): Chat conversation list with unread counts
- **Chat** (`/messages/:id`): Full message thread with real-time sending
- **Profile** (`/profile/:id`): Full user profile with block/report actions
- **Settings** (`/settings`): Edit your own profile

### Architecture
- Frontend: React + Vite + Tailwind CSS + shadcn/ui, wouter routing
- Backend: Express 5 API at `/api`
- Database: PostgreSQL with tables: users, conversations, messages, posts, post_likes
- Demo: User ID 1 is the "current user" (Alex Kim)

### Codegen note
The `api-spec/package.json` codegen script patches `lib/api-zod/src/index.ts` after orval runs to avoid duplicate re-exports.
