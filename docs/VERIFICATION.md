# Verification record

## Automated checks

- API regression suite: **27 tests passed** against a real temporary MongoDB replica set, including fault injection, atomic rollback, and concurrent duplicate submissions.
- Frontend domain suite: **19 tests passed**, including calendar deadlines across five timezones, stable retry keys, and API response failures.
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

## Remaining verification limits

These checks do not establish production uptime, load capacity, cross-browser compatibility, WCAG certification, deployment-provider behavior, or that all possible bugs are eliminated. Docker and cloud configuration are supplied but should be treated as unverified until actually built and deployed.
