import ContextDev from 'context.dev'

const answerFormat = {
  career_overview: '',
  total_timeline: '',
  assumptions: [''],
  entry_level_positions: [
    {
      title: '',
      fit: '',
      requirements: [''],
    },
  ],
  phases: [
    {
      phase: '',
      duration: '',
      objective: '',
      skills: [
        {
          name: '',
          level: 'Beginner | Intermediate | Advanced',
          priority: '',
          rationale: '',
        },
      ],
      projects: [
        {
          title: '',
          description: '',
        },
      ],
      milestones: [''],
    },
  ],
  first_90_days: [''],
  caveats: [''],
}

const stepAdviceFormat = {
  weekend_project: {
    title: '',
    goal: '',
    tasks: [''],
    acceptance_criteria: [''],
  },
  github_suggestion: {
    search_query: '',
    url: '',
    guidance: '',
  },
  interview_questions: [''],
  next_actions: [''],
  estimated_time: '',
  cautions: [''],
}

function getStatus(error) {
  return typeof error?.status === 'number' ? error.status : null
}

function getRetryAfterMs(error) {
  const header = error?.headers?.get?.('retry-after')
  if (!header) return null
  const seconds = Number(header)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const dateMs = Date.parse(header)
  return Number.isNaN(dateMs) ? null : Math.max(0, dateMs - Date.now())
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function researchCareerRoadmap({ role, company, background, hoursPerWeek }) {
  const apiKey = process.env.CONTEXT_DEV_API_KEY
  if (!apiKey) {
    const error = new Error('Context.dev is not configured. Add CONTEXT_DEV_API_KEY to .env.local and restart the server.')
    error.status = 503
    throw error
  }

  const client = new ContextDev({ apiKey, timeout: 60_000, maxRetries: 0 })
  const task = [
    `Research a detailed, evidence-based career roadmap for becoming a ${role}${company ? ` at ${company}` : ''}.`,
    `The learner can study approximately ${hoursPerWeek} hours per week.`,
    background ? `Their current background: ${background}` : 'Assume the learner is early-career and state any assumptions.',
    'Use current job-market evidence and credible sources. Break the path into logical, ordered phases with realistic durations that add up to the total timeline.',
    'For every phase include the objective, skills with a short rationale, a practical portfolio project, and measurable milestones. For every skill set level to exactly Beginner, Intermediate, or Advanced. Assign prerequisite skills to earlier levels. Skills at the same level can be learned in parallel.',
    'Identify realistic entry-level job titles and the skills/employers expect for those roles. Give a practical first-90-days plan.',
    'Distinguish typical requirements from role-specific preferences; do not invent precise guarantees. Cite current evidence with source URLs in the response sources.',
  ].join('\n')

  for (let attempt = 0; attempt <= 2; attempt += 1) {
    try {
      return await client.web.answers({
        mode: 'fast',
        task,
        json_format: answerFormat,
        timeoutOpts: { milliseconds: 30_000, behavior: 'return-partial' },
      })
    } catch (error) {
      const status = getStatus(error)
      const retryable = status === null || status === 408 || status === 429 || status >= 500
      if (!retryable || attempt === 2) throw error
      const delayMs = status === 429
        ? getRetryAfterMs(error) ?? 1000 * (attempt + 1)
        : 500 * (2 ** attempt)
      await sleep(delayMs)
    }
  }

  throw new Error('Context.dev roadmap research failed after bounded retries.')
}

export async function generateStepAdvice({ role, phase, step, kind, context }) {
  const apiKey = process.env.CONTEXT_DEV_API_KEY
  if (!apiKey) {
    const error = new Error('Context.dev is not configured. Add CONTEXT_DEV_API_KEY to .env.local and restart the server.')
    error.status = 503
    throw error
  }

  const client = new ContextDev({ apiKey, timeout: 60_000, maxRetries: 0 })
  const task = [
    `Give a learner highly specific, practical advice for this ${kind} in their career roadmap toward ${role}.`,
    `Roadmap phase: ${phase}.`,
    `Selected step: ${step}.`,
    `Relevant roadmap context: ${context || 'No additional context provided.'}`,
    'Return an achievable weekend project with a title, goal, sequenced tasks, and objective acceptance criteria.',
    'Suggest a GitHub repository discovery URL based on a real, valid GitHub search query; do not invent a repository or claim it is maintained unless verified.',
    'Write three focused interview questions and concise next actions. Keep every suggestion directly tied to the selected step.',
    'Prefer credible, current sources. State uncertainty rather than inventing facts, and cite source URLs.',
  ].join('\n')

  for (let attempt = 0; attempt <= 2; attempt += 1) {
    try {
      return await client.web.answers({
        mode: 'fast',
        task,
        json_format: stepAdviceFormat,
        timeoutOpts: { milliseconds: 30_000, behavior: 'return-partial' },
      })
    } catch (error) {
      const status = getStatus(error)
      const retryable = status === null || status === 408 || status === 429 || status >= 500
      if (!retryable || attempt === 2) throw error
      const delayMs = status === 429
        ? getRetryAfterMs(error) ?? 1000 * (attempt + 1)
        : 500 * (2 ** attempt)
      await sleep(delayMs)
    }
  }

  throw new Error('Context.dev step advice failed after bounded retries.')
}
