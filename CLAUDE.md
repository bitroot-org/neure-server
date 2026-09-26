## TeamLife board (MCP)

Tasks for this project live on the Bitroot TeamLife board, exposed through the
`teamlife` MCP server. Keep it in sync as you work — the team watches it live.

- **Find work:** `list_tasks` — always take task IDs from here, never invent one.
- **Before you start:** `start_work(taskId, note)` — moves the card to In Progress.
- **While working:** `add_comment(taskId, body)` for progress (body is markdown);
  `add_screenshot(taskId, imageBase64)` to attach evidence for any UI work. If you
  have real tokensUsed / costUsd figures for this unit of work, pass them too — they
  show on the card labeled "self-reported". Use kind:"thinking" for an internal
  reasoning note that shouldn't show in the main activity trail.
- **When finished:** `update_task(taskId, status)` — `review` if a human should
  look, `done` if it's self-evidently complete.

Never leave a task In Progress without a comment saying what's blocking it.
Everything you do here is recorded under this token's own Bitbot identity and is
visible to the team.
