# Context.dev conventions

- Keep `CONTEXT_DEV_API_KEY` in the server environment or ignored `.env.local`. Never expose it to browser code or use a `VITE_` prefix.
- Route Context.dev traffic through `server/context-client.js`; Express exposes the authenticated feature at `POST /api/roadmaps/research`.
- Use the official `context.dev` JavaScript SDK for supported endpoints. Do not scatter direct Context.dev requests through React components.
- Current endpoint: `POST https://api.context.dev/v1/web/answers`, used for sourced, structured career roadmap research in fast mode.
- Step coaching is also sent through `server/context-client.js` to the Answers endpoint. The authenticated Express route is `POST /api/roadmaps/advice`; advice is generated only after an explicit user request and returns a project, GitHub search suggestion, next actions, interview questions, and source URLs.
- The generated roadmap map is interactive: it supports pointer panning and zoom controls/wheel zoom. Known skills are hidden from the active route, connectors are recomputed, and the selection is persisted in browser local storage per saved roadmap.
- Roadmaps are persisted in Supabase: `roadmaps` stores the goal and overview; `roadmap_nodes` stores each section type once per roadmap, with all phases stored together in the `phase` row, plus roles, timeline, first-90-days guidance, caveats, and sources. The dashboard loads up to 50 saved rows with associated node content and prefers the newest row with detailed phases. Older rows with only `skills` are rendered as a fallback skill path and explicitly identified as missing the original research timeline. The graph root is the career goal, with phase/skill dependencies directed toward the target-role node.
- Dashboard workspace navigation must stay functional: Roadmap renders the selected saved DAG, full journey, timeline, roles, and sources; My learning and Projects expose completion toggles derived from that roadmap; My progress summarizes saved-roadmap completions and active days. Completion and active-day tracking use browser local storage scoped by Supabase user ID (and roadmap ID for completion).
- Roadmap downloads use `src/lib/roadmap-document.js` and the `docx` package to create a complete `.docx` from the saved roadmap data. Keep document generation client-side and include all saved phases, timeline, skills, projects, milestones, roles, plans, assumptions, caveats, and sources.
- Use Playwrite CA for large/medium `h1` and `h2` headings only. Body text and smaller headings retain their established typefaces.
- Research requests are limited to 3 per user per hour; step-advice requests are limited to 10 per user per hour. Fast Answers requests typically cost 10 credits each.
- Endpoint reference: https://docs.context.dev/api-reference/web-extraction/answers
- JavaScript SDK guide: https://docs.context.dev/sdks/typescript
- Answers guide: https://docs.context.dev/answers/overview
- Respect retryable API failures: honor `Retry-After` on 429 and use bounded retries for 408, network failures, and 5xx. Keep automated tests off the live API.
