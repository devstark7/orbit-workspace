# Orbit — Make space for great work

A full-stack project workspace with a considered interface and real collaboration underneath. Orbit brings projects, tasks, people, and progress into one focused place.

**React 19 · Vite · Express · MongoDB · Motion · dnd-kit**

![Orbit project board](docs/screenshots/board.png)

[Overview](docs/screenshots/overview.png) · [Mobile board](docs/screenshots/mobile-board.png) · [Welcome screen](docs/screenshots/welcome.png)

> Frontend and backend source live in this repository. No paid API, external design asset, or account is needed to try the local demo.

## Try it in two commands

Requires **Node.js 22.12+ (Node 24 recommended)** and npm.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173** and choose **Explore the live demo**. Orbit creates a private workspace with fictional teammates, three projects, fifteen tasks, and activity history. Every demo session gets separate data.

On first use, `mongodb-memory-server` downloads an official MongoDB binary. Internet is required for that first download. The local database is temporary: **stopping the API resets its data**. Demo records also have a 24-hour expiration in persistent databases. See persistent setup below before using real work.

## What you can do

- **Get perspective:** an overview with project progress, task counts, overdue work, and a completion chart calculated from real task timestamps.
- **Move work forward:** drag cards between board columns, or use the status selector for keyboard access. Switch between board and table layouts.
- **Keep context close:** create and edit projects and tasks, assign project members, set due dates and priorities, and discuss work in task comments.
- **Find your next step:** search the workspace with `Ctrl/⌘ K`, create a task with `N`, filter by priority or status, and export the visible task list to CSV.
- **Work together:** project owners can add an existing account by email. Invitations do not send emails. Members collaborate within their projects; server checks protect every project and task route.
- **Find your rhythm:** a focus/break timer, compact layout, reduced-motion preference, and responsive navigation.
- **Stay in the loop:** a server-persisted activity feed records project, task, and comment changes.

## The craft

Orbit uses a deep green frame, warm neutral canvas, lime details, locally hosted variable type, and custom CSS orbital illustrations. The artwork is code, not a stock image. Motion supports orientation: page entrances, project hover, animated progress, and draggable cards. System reduced-motion preferences are respected.

Dialogs contain keyboard focus and restore it on close. Buttons have accessible names, forms have labels, status is expressed with words as well as color, and the board has a keyboard alternative. The layout adapts to narrow screens with a collapsible sidebar and horizontally scrollable board and tables.

## Persistent database setup

Copy the example configuration:

```powershell
Copy-Item backend/.env.example backend/.env
```

Set `MONGO_URI` to a MongoDB replica set or your MongoDB Atlas connection string. Orbit requires transaction support and rejects standalone MongoDB at startup. Do not commit `.env`.

| Variable        | Development                                  | Production                                                  |
| --------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `MONGO_URI`     | Optional; uses temporary MongoDB when absent | Required, persistent database                               |
| `JWT_SECRET`    | Generated in memory at startup when absent   | Required, random string of at least 32 characters           |
| `CLIENT_ORIGIN` | `http://127.0.0.1:5173`                      | Exact HTTPS URL of the deployed app, with no trailing slash |
| `PORT`          | `5000`                                       | Hosting provider port                                       |
| `HOST`          | `127.0.0.1`                                  | `0.0.0.0` for containers and hosted services                |
| `NODE_ENV`      | Unset                                        | `production`                                                |
| `ENABLE_DEMO`   | Demo enabled                                 | Set `true` explicitly to enable demo sessions               |
| `TRUST_PROXY`   | Unset                                        | `1` only behind one trusted reverse proxy                   |

Generate a production signing secret locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` and enter it directly in your hosting provider’s secret settings. Never place it in GitHub source or a screenshot.

For persistent local MongoDB without Atlas:

```sh
docker compose up -d
```

Wait for `docker compose ps` to report healthy. Set `MONGO_URI=mongodb://127.0.0.1:27017/orbit?replicaSet=rs0&directConnection=true` in `backend/.env`, then run `npm run dev`. The supplied single-node replica set is for local development; use a managed replica set for production.

## Production

```sh
npm ci
npm run build
npm start
```

The Express server serves `frontend/dist` and `/api` from **one origin**. Production requires HTTPS because the session cookie is Secure. A private preview must not be mistaken for a recruiter-accessible deployment.

`render.yaml` is a deployment blueprint. Supply your MongoDB connection string and exact deployed `CLIENT_ORIGIN`; it generates a signing secret. Cloud deployment is a separate operation and may incur hosting costs. A blueprint is not evidence of an active deployment.

## Verification

```sh
npm test
npm run build
npm run format:check
```

- API integration tests use a real temporary MongoDB instance and Supertest cookie agents.
- Regression cases cover public admin escalation, project-ID task disclosure, cross-project writes, invalid assignments, member/owner permissions, session revocation, input validation, and isolated demo sessions.
- Fault-injection tests verify rollback when activity writes or project deletion fail. Retry tests verify that simultaneous duplicate task submissions create one task and one activity record.
- Frontend logic tests cover composed filters, overdue boundaries, completion series, empty-state summaries, CSV escaping, and avatar initials.
- Deadline regressions run in five timezones, including negative offsets, UTC+14, India, and a daylight-saving boundary. Due dates are calendar days; completion times remain actual instants.

See [verification notes](docs/VERIFICATION.md) for the exact checks and limits of the delivered version.

## Inside the project

```text
backend/
  app.js                 Express middleware, route composition, error boundary
  server.js              Database-first startup and graceful shutdown
  controllers/           Explicit business actions
  lib/                   Shared validation and membership authorization
  models/                Mongoose schemas and indexes
  seed.js                Fictional, isolated demo workspace generator
  tests/                 API regression tests against MongoDB
frontend/
  src/OrbitApp.jsx        Workspace state, server actions, navigation
  src/components/        Overview, sidebar, settings, command palette, board, dialogs
  src/lib/               Fetch client and pure task/statistics functions
  src/orbit.css          Explicit layer order and feature stylesheet imports
  src/styles/            Base, workspace, dialog, welcome, typography, responsive styles
  tests/                 Domain behavior tests
docs/
  ARCHITECTURE.md         Data flow, permissions, and deliberate tradeoffs
  INTERVIEW_GUIDE.md      Walkthrough prompts for explaining the work
```

## Security and limits

- Passwords use bcrypt. Public signup always creates a Member; client-supplied roles are ignored.
- JWT sessions are held in HTTP-only, SameSite cookies. Logout invalidates that user’s existing sessions.
- Every task operation checks membership in its parent project. Platform role does not bypass project ownership.
- Helmet security headers, same-origin write checks, request limits, bounded input, and explicit field allowlists are included.
- Demo sessions are rate limited and expire. Demo teammates are fictional and cannot be used to invite real users.
- Rate limits are process-local; a multi-instance deployment should use a shared limiter store. There is no email verification, password reset service, WebSocket sync, or production monitoring integration.
- This is a portfolio implementation, not a promise of enterprise hardening or hiring success. See the architecture notes for operational tradeoffs.

## Origin and authorship

Orbit evolves the account owner’s earlier `Devcomplexity/team-task-manager` project. It retains the React/Express/MongoDB concept, while replacing the interface, build tooling, authentication flow, and permission handling. The new repository is a source import followed by a documented rebuild, not a preserved copy of the old commit history. Fictional demo data illustrates the product; it does not represent clients, usage metrics, or paid work.
