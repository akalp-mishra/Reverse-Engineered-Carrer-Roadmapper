# CareerX

## What it does

CareerX turns a specific career goal into a research-backed, interactive plan with skills, projects, milestones, entry-level roles, and an estimated timeline. It is intended to make a career transition easier to understand and act on, rather than leaving the learner to piece together a path from scattered advice.

**Problem statement number:** Not included in the supplied brief. Add the assigned number here before submission.

## Done / Left / Plan

### Done

- React landing, career exploration, roadmap research, authentication, and dashboard experiences.
- Supabase email/password authentication and per-user roadmap storage in `roadmaps` and `roadmap_nodes`.
- Context.dev web research for structured career roadmaps and on-demand advice for individual roadmap steps.
- Interactive career DAG with a career-goal root, phase/skill/milestone nodes, pan, zoom, and a Recenter control.
- Skill completion, project tracking, saved-roadmap selection, roadmap journey/timeline, and progress views.
- Download of a saved roadmap as a Word `.docx` document.
- Luxury black-and-gold visual theme with Playwrite CA for large and medium headings.

### Left

- Confirm the deployed app URL and add it here once deployment is complete.
- Test the complete signed-in experience against the intended Supabase project, including saved roadmap node access and older roadmap records.
- Add or extend automated tests for roadmap persistence, dashboard states, account logout, and generated documents.
- Decide whether login activity and skill/project completion should sync between devices. They currently use browser local storage.
- Complete final responsive and accessibility checks on a deployed build.

### Plan for the next 16 hours

1. **Hours 0–3 — Data verification:** apply/verify the Supabase migrations, test sign-in and sign-out, and confirm roadmap nodes load for the signed-in owner.
2. **Hours 3–7 — User-flow QA:** test new research, selecting older roadmaps, DAG navigation/recentering, learning/project completion, and DOCX download across desktop and mobile layouts.
3. **Hours 7–10 — Reliability:** add targeted tests for data-loading and export behavior; address failures and clarify empty/error states.
4. **Hours 10–13 — Deployment:** deploy the Vite/Express app, configure production environment variables, verify the deployed health endpoint and authenticated flows, and record the URL.
5. **Hours 13–16 — Final review:** test a clean account and existing data, review accessibility and AI disclosures, capture any remaining limitations, and update this README with the actual problem-statement number and live URL.

This is a forward-looking work plan, not a claim that those remaining tasks have already been completed.

## Architecture and why

### Application

- **React 19** renders the landing, explore, roadmap builder, authentication, and dashboard interfaces.
- **Vite** provides the local frontend development server and production build.
- **Express 5** provides server-side API routes for career research and step advice. During development, `npm run dev` starts Vite and the API server together.
- API work is request/response based: the browser sends an authenticated request and waits for a result. There is no live Supabase Realtime subscription or background job queue in the current implementation.

### AI and research

- Career research and optional step coaching go through the official **`context.dev` JavaScript SDK** and Context.dev's Answers API, using fast mode for structured, sourced responses.
- Context.dev is used to research current web information and return roadmap fields such as phases, skills, durations, projects, entry-level roles, and sources. A specific underlying model is not identified by this application; do not assume or advertise a model name.
- Context.dev calls are centralized in `server/context-client.js`; `server/index.js` authenticates requests, validates input, and applies per-user rate limits.
- Research and coaching are triggered by explicit user actions. The roadmap form identifies Context.dev research and sources; the step coach explains that generating advice makes a research request. Treat AI output as guidance, check its cited sources, and do not treat estimated career timelines as guarantees.
- The AI API key is read server-side from `CONTEXT_DEV_API_KEY`. It is not a browser-exposed `VITE_` variable.

### Authentication and data

- **Supabase Auth** handles email/password sign-up, sign-in, and sessions.
- **Supabase Postgres** stores each account's researched roadmap in `public.roadmaps`, with its phases, timeline, positions, plans, caveats, and sources in `public.roadmap_nodes`.
- Row-level security policies are intended to restrict each account to its own roadmap records. Apply the project's SQL migrations to the existing tables before using this app.
- Activity streaks and skill/project completion are currently stored in browser `localStorage`, scoped to the signed-in user and roadmap. They are not server-synced and can be lost if browser storage is cleared.
- The dashboard reads saved roadmap records and their nodes when it loads; it does not subscribe to Supabase Realtime.

### Main data flow

1. The user signs in through Supabase Auth.
2. The browser sends a session-authenticated request to the Express research endpoint.
3. Express validates the Supabase session, validates the request, and asks Context.dev for structured research.
4. The browser receives the result and saves the roadmap and associated nodes to Supabase under the signed-in user's ID.
5. The dashboard loads those saved records and renders the interactive DAG and workspace views.

## What we added

Beyond the core goal of generating a career plan, CareerX includes:

- **Interactive DAG visualization:** pan, zoom, node selection, and Recenter make the route easier to explore than a long linear document.
- **Known-skill adjustment:** users can mark skills they already know so the displayed path can be simplified.
- **Step coaching:** an explicit request for a node can generate a focused project, actions, interview practice, and a GitHub search suggestion.
- **Workspace progress tools:** saved-roadmap selection, skill/project completion controls, and recent login-day indicators support continued use.
- **Word export:** users can keep or share a `.docx` copy of a saved roadmap.
- **Source links and caveats:** research sources, assumptions, and limitations are retained alongside the roadmap to help users assess the recommendations.

## How to run it

### Requirements

- Node.js compatible with the installed Vite version and npm.
- A Supabase project with the required `roadmaps` and `roadmap_nodes` tables.
- A Context.dev API key for live roadmap research and step coaching.

### Setup

1. Open a terminal in the application folder (the folder containing this README and `package.json`).
2. Install dependencies:

   ```sh
   npm install
   ```

3. Copy `.env.example` to `.env.local` and set the values:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   CONTEXT_DEV_API_KEY=your-context-dev-api-key
   ```

   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are used by the browser client and server. `CONTEXT_DEV_API_KEY` is server-side only. Do not commit `.env.local` or put the Context.dev key in a `VITE_` variable.

4. In the Supabase SQL Editor, apply these project migrations in order to the existing schema:

   - `supabase/migrations/20261008134500_add_roadmap_username.sql`
   - `supabase/migrations/20261008135800_roadmap_nodes_owner_policies.sql`

   The policies assume the `public.roadmaps` and `public.roadmap_nodes` tables already exist. Confirm the table columns match the application before running migrations in a different Supabase project.

5. Start the development app:

   ```sh
   npm run dev
   ```

   Open `http://127.0.0.1:5173`. The script starts Vite and the Express API server. `GET /api/health` reports whether the server sees the Supabase and Context.dev configuration.

6. Create an account through the app's sign-up page to test authenticated features. There is no shared test login or password in this repository. If testing password sign-in without email confirmation, use the intended email-confirmation setting in Supabase Auth; never publish real user credentials.

### Production checks

```sh
npm run lint
npm run build
```

To serve the built app through Express, run `npm run build` followed by `npm start`. Configure the same environment variables in the deployment platform's secret/environment settings.

**Live URL:** Not deployed yet. Add the production URL here after deployment.

## Tools and AI used

- **UI:** React, React DOM, Vite, CSS, Playwrite CA font served by Google Fonts.
- **Authentication and persistence:** Supabase Auth, Supabase JavaScript client, and Supabase Postgres with row-level security.
- **Server:** Node.js, Express, dotenv.
- **Research and generated advice:** `context.dev` JavaScript SDK and Context.dev Answers API. The application does not configure or claim a named underlying model.
- **Document export:** `docx` JavaScript package, generating Word files in the browser.

CareerX tells users in the roadmap flow that research uses Context.dev and returns evidence links. Generating node-specific advice is a separate, user-triggered research request. AI-generated information can be incomplete or change over time; users should verify sources and use professional judgment.

## Who it is for

CareerX is for students, early-career professionals, and career changers who have a specific target role or industry in mind but need help turning it into a manageable plan. They can return to review their saved roadmap, mark progress, adjust for skills they already know, and get focused guidance on the next milestone.