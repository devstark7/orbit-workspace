# Explain the work, honestly

Do not memorize claims you cannot demonstrate. Walk through the actual source and reproduce a few behaviors before submitting.

## A two-minute product walkthrough

1. Start the private demo and explain that the teammates and activity are fictional.
2. Show overview numbers and trace one to `summarize` or `completionSeries`.
3. Open a project, create a task, assign it, drag it to In Progress, and post a comment.
4. Complete it and show the updated project progress and activity.
5. Search with Ctrl/⌘ K, switch board/table, export CSV, and show the narrow-screen layout.

## Be able to trace one request

For a task update: React action → fetch client → same-origin middleware → cookie verification → task lookup → parent-project membership check → validated field assignments → MongoDB save → audit record → refreshed UI.

## Questions worth practicing

- Why must permission checks live on the server even when buttons are hidden?
- What was wrong with allowing signup to accept `role`?
- How did a `projectId` query bypass the original task-list restriction?
- Why choose HTTP-only cookies? What do SameSite, Secure, origin validation, and XSS protections each do?
- Why does bcrypt have a byte-length limit, and why is email normalized?
- What happens if a drag request fails or the user drags the same task twice quickly?
- How does a completion timestamp differ from an update timestamp?
- Why is the temporary database useful for review, and unsafe as a persistence strategy?
- Which indexes help project-scoped access? What would you change for thousands of tasks?
- What would a transaction protect during cascading deletion?
- Which limitations remain: realtime sync, shared rate limiting, pagination, email flows, monitoring?

## Demonstrate, do not overstate

The tests show the exercised behaviors, not proof that no bugs exist. A successful local build is not proof of a deployed service. A deployment file is not a live URL. Explain your use of development tools and assistance truthfully and make sure you can edit and debug the resulting code yourself.
