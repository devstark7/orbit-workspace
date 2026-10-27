# Verification record

## Automated checks

- API regression suite: **27 tests passed** against a real temporary MongoDB replica set, including fault injection, atomic rollback, and concurrent duplicate submissions.
- Frontend suite: **21 tests passed**, including calendar deadlines across five timezones, stable retry keys, API response failures, and browser-demo persistence/rollback.
- Vite production build: passed locally on Windows with Node 24.
- npm dependency audit at installation: **0 reported vulnerabilities**. This is a point-in-time registry check, not a comprehensive security audit.

## Browser checks

Verified in local Brave and the in-app Chromium browser:

- Demo sign-in and isolated seeded workspace loading.
- Project creation, followed by task creation with assignment, priority, and due date.
- Task comments, status changes, and saved task/comment persistence after a browser reload.
- Workspace search finding the saved task.
- Board/table switching, priority filtering, and a real CSV download with expected headers and rows.
- Preference toggles, mobile drawer navigation, and the project deletion confirmation screen.
- Mobile layout at 390 × 844 and desktop layout at 1440 × 960. A hidden table label caused page-level horizontal overflow on mobile; this was corrected and rechecked. The task board and tables scroll within their own containers.

Screenshots in `docs/screenshots/` are actual app captures using fictional demo data. Pointer dragging from To do to In Progress was verified in Brave, and the new status survived a browser reload. The refactored settings screen, command palette, and task-creation form were also checked. Production deployment and a real multi-user team session were not exercised.

## Reliability regressions

- **Timezone deadline defect:** fixed with calendar-day semantics. Regression subprocesses run in Los Angeles, New York, Kolkata, Kiritimati, and UTC. The deadline displays on the intended day, remains due through that local day, and becomes overdue the next local day.
- **Partial task save on audit failure:** fixed with transactions that include both the task mutation and its activity record. Fault injection verifies that a failed audit leaves no task behind, and that a retry creates exactly one task. Updates, comments, deletes, project creation/edits, and cascading project deletion also have rollback checks.
- **Ambiguous retry after a successful commit:** identical task request IDs return the existing task; three simultaneous requests are verified to persist one task and one audit event. Reusing an ID for different details is rejected.

## Hosted browser demo

The public interactive preview is hosted at https://orbit-workspace-devstark7.redroot4097.chatgpt.site. It uses a dedicated build flag and local browser storage with fictional seed data. Tests cover task creation, duplicate retries, status changes, comments, persistence across client reloads, cascading project deletion, sample reset, and storage-failure rollback. The same React interface is used by the real API build.

The preview does not run the Express/MongoDB backend or verify production authentication, server authorization, shared collaboration, or database transactions. Run the normal development setup and API test suite to evaluate those layers.

## Operational limits

These checks do not establish production uptime, load capacity, cross-browser compatibility, WCAG certification, deployment-provider behavior, or that all possible bugs are eliminated. Docker and cloud configuration are supplied but should be treated as unverified until actually built and deployed.
