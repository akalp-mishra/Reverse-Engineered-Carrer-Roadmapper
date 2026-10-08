import { config } from 'dotenv'
import express from 'express'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { generateStepAdvice, researchCareerRoadmap } from './context-client.js'

config({ path: '.env.local' })

export const app = express()
const port = Number(process.env.PORT) || 8787
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null
const requestsByUser = new Map()
const adviceRequestsByUser = new Map()
const MAX_REQUESTS_PER_WINDOW = 3
const MAX_ADVICE_REQUESTS_PER_WINDOW = 10
const RATE_WINDOW_MS = 60 * 60 * 1000

app.use(express.json({ limit: '12kb' }))

async function authenticateRequest(request, response) {
  if (!supabase) {
    response.status(503).json({ error: 'Supabase server configuration is missing.' })
    return null
  }

  const authorization = request.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) {
    response.status(401).json({ error: 'Sign in before using roadmap research.' })
    return null
  }

  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      response.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' })
      return null
    }
    return data.user
  } catch {
    response.status(502).json({ error: 'Could not validate your sign-in session. Please try again.' })
    return null
  }
}

function reserveRateLimit(requestsByUserMap, userId, limit) {
  const now = Date.now()
  const recentRequests = (requestsByUserMap.get(userId) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS)
  if (recentRequests.length >= limit) return false
  requestsByUserMap.set(userId, [...recentRequests, now])
  return true
}

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    contextConfigured: Boolean(process.env.CONTEXT_DEV_API_KEY),
    supabaseConfigured: Boolean(supabase),
  })
})

app.post('/api/roadmaps/research', async (request, response) => {
  const user = await authenticateRequest(request, response)
  if (!user) return

  const { role, company = '', background = '', hoursPerWeek = 10 } = request.body || {}
  if (typeof role !== 'string' || role.trim().length < 3 || role.trim().length > 120) {
    return response.status(400).json({ error: 'Enter a career goal between 3 and 120 characters.' })
  }
  if (typeof company !== 'string' || company.length > 120 || typeof background !== 'string' || background.length > 500) {
    return response.status(400).json({ error: 'Company or background details are too long.' })
  }
  if (!Number.isInteger(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 80) {
    return response.status(400).json({ error: 'Study time must be between 1 and 80 hours per week.' })
  }
  if (!reserveRateLimit(requestsByUser, user.id, MAX_REQUESTS_PER_WINDOW)) {
    return response.status(429).json({ error: 'You have reached the roadmap research limit. Please try again later.' })
  }

  try {
    const result = await researchCareerRoadmap({
      role: role.trim(),
      company: company.trim(),
      background: background.trim(),
      hoursPerWeek,
    })
    if (!result?.json_content || !Array.isArray(result.sources)) {
      throw new Error('Context.dev returned an unexpected roadmap response.')
    }
    return response.json({
      roadmap: result.json_content,
      sources: result.sources,
      partial: Boolean(result.partial),
      credits: result.key_metadata?.credits_consumed ?? null,
    })
  } catch (error) {
    const status = typeof error.status === 'number' ? error.status : 502
    console.error('Context.dev roadmap request failed', {
      status,
      requestId: error.request_id || error.error?.request_id || null,
    })
    return response.status(status >= 400 && status < 600 ? status : 502).json({
      error: status === 503
        ? error.message
        : 'Roadmap research failed. Please try again shortly.',
      requestId: error.request_id || error.error?.request_id || null,
    })
  }
})

app.post('/api/roadmaps/advice', async (request, response) => {
  const user = await authenticateRequest(request, response)
  if (!user) return

  const { role, phase, step, kind, context = '' } = request.body || {}
  if (typeof role !== 'string' || role.trim().length < 3 || role.trim().length > 120) {
    return response.status(400).json({ error: 'Career goal must be between 3 and 120 characters.' })
  }
  if (typeof phase !== 'string' || phase.trim().length < 1 || phase.length > 160) {
    return response.status(400).json({ error: 'Roadmap phase must be between 1 and 160 characters.' })
  }
  if (typeof step !== 'string' || step.trim().length < 1 || step.length > 200) {
    return response.status(400).json({ error: 'Roadmap step must be between 1 and 200 characters.' })
  }
  if (!['skill', 'milestone'].includes(kind)) {
    return response.status(400).json({ error: 'Step type must be skill or milestone.' })
  }
  if (typeof context !== 'string' || context.length > 1200) {
    return response.status(400).json({ error: 'Roadmap context must be 1200 characters or less.' })
  }
  if (!reserveRateLimit(adviceRequestsByUser, user.id, MAX_ADVICE_REQUESTS_PER_WINDOW)) {
    return response.status(429).json({ error: 'You have reached the step-advice limit. Please try again later.' })
  }

  try {
    const result = await generateStepAdvice({
      role: role.trim(),
      phase: phase.trim(),
      step: step.trim(),
      kind,
      context: context.trim(),
    })
    if (!result?.json_content || !Array.isArray(result.sources)) {
      throw new Error('Context.dev returned an unexpected step-advice response.')
    }
    return response.json({
      advice: result.json_content,
      sources: result.sources,
      partial: Boolean(result.partial),
      credits: result.key_metadata?.credits_consumed ?? null,
    })
  } catch (error) {
    const status = typeof error.status === 'number' ? error.status : 502
    console.error('Context.dev step-advice request failed', {
      status,
      requestId: error.request_id || error.error?.request_id || null,
    })
    return response.status(status >= 400 && status < 600 ? status : 502).json({
      error: status === 503
        ? error.message
        : 'Step advice failed. Please try again shortly.',
      requestId: error.request_id || error.error?.request_id || null,
    })
  }
})

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found.' })
})

const distDirectory = join(process.cwd(), 'dist')
if (existsSync(distDirectory)) {
  app.use(express.static(distDirectory))
  app.get(/^(?!\/api).*/, (_request, response) => response.sendFile(join(distDirectory, 'index.html')))
}

if (!process.env.VERCEL) {
  app.listen(port, process.env.HOST || '0.0.0.0', () => {
    console.log(`CareerX API server listening on http://127.0.0.1:${port}`)
  })
}
