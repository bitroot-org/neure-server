## TeamLife board (MCP)

Tasks for this project live on the Bitroot TeamLife board, exposed through the
`teamlife` MCP server. Keep it in sync as you work — the team watches it live.

- **Find work:** `list_tasks` — always take task IDs from here, never invent one.
- **Before you start:** `start_work(taskId, note)` — moves the card to In Progress.
- **While working:** `add_comment(taskId, body)` for progress (body is markdown);
  `add_screenshot(taskId, imageBase64)` to attach evidence for any UI work.
- **When finished:** `update_task(taskId, status)` — `review` if a human should
  look, `done` if it's self-evidently complete.

Never leave a task In Progress without a comment saying what's blocking it.
Everything you do is recorded on the board as Bit2 and is visible to the team.
