# Verification record

## Automated checks

- API regression suite: **20 tests passed** against a real temporary MongoDB instance.
- Frontend domain suite: **6 tests passed** for filters, date boundaries, summaries, chart data, CSV escaping, and initials.
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

Screenshots in `docs/screenshots/` are actual app captures using fictional demo data. The pointer-drag gesture itself has not been independently verified; keyboard-accessible task status changes were verified. Production deployment and a real multi-user team session were not exercised.

## Limits

These checks do not establish production uptime, load capacity, cross-browser compatibility, WCAG certification, deployment-provider behavior, or that all possible bugs are eliminated. Docker and cloud configuration are supplied but should be treated as unverified until actually built and deployed.
