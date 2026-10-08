import { useCallback, useEffect, useRef, useState } from 'react'
import landingArt from './assets/landing-art.jpg'
import roadmapArt from './assets/roadmap-art.jpg'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { downloadRoadmapDocument } from './lib/roadmap-document'
import './App.css'

const paths = [
  { icon: 'spark', title: 'Full Stack Developer', meta: '6 months · 12 skills', color: 'violet' },
  { icon: 'globe', title: 'Climate Tech Analyst', meta: '4 months · 8 skills', color: 'cyan' },
  { icon: 'chart', title: 'Product Designer', meta: '8 months · 10 skills', color: 'pink' },
]

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCurrentStreak(dates) {
  const activeDates = new Set(dates)
  const today = new Date()
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (!activeDates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (activeDates.has(localDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function recordActiveDay(userId) {
  const activityKey = `careerx:login-days:${userId}`
  const previousDates = JSON.parse(localStorage.getItem(activityKey) || '[]')
  const activeDates = [...new Set([...previousDates, localDateKey()])].sort().slice(-90)
  localStorage.setItem(activityKey, JSON.stringify(activeDates))
  return activeDates
}

function readCompletedItems(userId, roadmapId) {
  if (!userId || !roadmapId) return []
  return JSON.parse(localStorage.getItem(`careerx:progress:${userId}:${roadmapId}`) || '[]')
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const shapes = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.1L12 19l-1.9-5.9L4 11l6.1-2.2L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    chart: <><path d="M4 19V5m0 14h17" /><path d="m7 15 4-4 3 2 5-6" /></>,
    grid: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    play: <path d="m8 5 11 7-11 7V5Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  }
  return <svg {...common}>{shapes[name] || shapes.spark}</svg>
}

function Brand({ onClick }) {
  return <button className="brand" onClick={onClick} aria-label="CareerX home"><span className="brand-mark"><Icon name="spark" size={20} /></span><span>career<span className="brand-x">x</span></span></button>
}

function SiteNav({ navigate, active = '' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const go = (path) => { setMenuOpen(false); navigate(path) }
  return (
    <header className="site-nav">
      <div className="nav-inner">
        <Brand onClick={() => go('/')} />
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Icon name={menuOpen ? 'close' : 'menu'} /></button>
        <nav className={menuOpen ? 'nav-links is-open' : 'nav-links'}>
          <button className={active === 'roadmap' ? 'nav-link selected' : 'nav-link'} onClick={() => go('/roadmap')}>Build a roadmap</button>
          <button className={active === 'explore' ? 'nav-link selected' : 'nav-link'} onClick={() => go('/explore')}>Explore</button>
          <button className={active === 'how' ? 'nav-link selected' : 'nav-link'} onClick={() => go('/#how-it-works')}>How it works</button>
          <button className="nav-link" onClick={() => go('/dashboard')}>Dashboard</button>
        </nav>
        <div className="nav-actions">
          <button className="nav-signin" onClick={() => go('/auth')}>Sign in</button>
          <button className="button button-small" onClick={() => go('/auth')}>Get started <Icon name="arrow" size={15} /></button>
        </div>
      </div>
    </header>
  )
}

function Footer({ navigate }) {
  return <footer className="footer"><Brand onClick={() => navigate('/')} /><span>Make your next move your best one.</span><span>© 2026 CareerX</span></footer>
}

function LandingPage({ navigate }) {
  return (
    <div className="marketing-page">
      <SiteNav navigate={navigate} />
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR CAREER, REVERSE ENGINEERED</div>
            <h1>Build a career<br />that <span className="gradient-text">moves you.</span></h1>
            <p className="hero-description">Turn the work you want into a clear, personal roadmap. Discover the skills, projects, and milestones that get you there.</p>
            <div className="hero-actions">
              <button className="button" onClick={() => navigate('/roadmap')}>Build my roadmap <Icon name="arrow" /></button>
              <button className="text-button" onClick={() => navigate('/explore')}><span className="play-circle"><Icon name="play" size={13} /></span> Explore career paths</button>
            </div>
            <div className="hero-proof"><div className="avatar-stack"><span>JD</span><span>AM</span><span>SK</span><span>+</span></div><div><strong>2,400+</strong><span>careers mapped this month</span></div><span className="proof-divider" /><div className="stars">★★★★★<small> Built for your next chapter</small></div></div>
          </div>
          <div className="hero-visual">
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="hero-image-wrap"><img src={landingArt} alt="Iridescent, futuristic portrait against a vivid violet background" /></div>
            <div className="floating-card skill-card"><span className="mini-icon mini-violet"><Icon name="spark" size={16} /></span><div><small>YOUR NEXT SKILL</small><strong>Product thinking</strong></div><span className="card-check"><Icon name="check" size={14} /></span></div>
            <div className="floating-card progress-card"><div className="ring-progress"><span>68%</span></div><div><small>ROADMAP PROGRESS</small><strong>You're on your way</strong><span className="tiny-muted">4 milestones completed</span></div></div>
            <div className="hero-image-glow" />
          </div>
        </section>
        <section className="trusted-row"><span>THE FUTURE IS YOURS TO DESIGN</span><div><span>✳︎ Skill-first</span><span>◉ Human-centered</span><span>⌁ AI-powered</span><span>✦ Built for momentum</span></div></section>
        <section id="how-it-works" className="how-section">
          <div className="section-heading"><div className="eyebrow">A BETTER WAY FORWARD</div><h2>Less guessing.<br /><span className="gradient-text">More becoming.</span></h2><p>Career growth shouldn't feel like wandering in the dark. Get a plan that connects where you are to where you want to be.</p></div>
          <div className="steps-grid">{[{ num: '01', icon: 'target', title: 'Name your next move', text: 'Tell us what kind of work energizes you and what you already bring to the table.' }, { num: '02', icon: 'spark', title: 'See the whole picture', text: 'Get a practical, personalized map of skills, projects, and roles to aim for.' }, { num: '03', icon: 'chart', title: 'Build real momentum', text: 'Track your progress, adjust as you grow, and take the next right step.' }].map((step) => <article className="step-card" key={step.num}><span className="step-num">{step.num}</span><span className="step-icon"><Icon name={step.icon} /></span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
          <div className="bottom-cta"><div><div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h2>Make your ambition<br />a real plan.</h2></div><button className="button" onClick={() => navigate('/roadmap')}>Start for free <Icon name="arrow" /></button></div>
        </section>
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}

function ExplorePage({ navigate }) {
  return (
    <div className="marketing-page">
      <SiteNav navigate={navigate} active="explore" />
      <main>
        <section className="explore-hero">
          <img className="explore-art" src={roadmapArt} alt="Prismatic crystal shards on a deep midnight background" />
          <div className="explore-shade" />
          <div className="explore-copy"><div className="eyebrow"><span className="eyebrow-dot" /> EXPLORE WHAT'S POSSIBLE</div><h1>Your next chapter<br />is <span className="gradient-text">closer than you think.</span></h1><p>Every career is a collection of skills, choices, and unexpected turns. Find a direction that feels like yours—and see exactly how to get there.</p><button className="button" onClick={() => navigate('/roadmap')}>Find your path <Icon name="arrow" /></button></div>
          <div className="explore-caption"><Icon name="spark" size={16} /> A little clarity changes everything.</div>
        </section>
        <section className="paths-section">
          <div className="paths-header"><div><div className="eyebrow">START WITH A DIRECTION</div><h2>Paths worth exploring</h2></div><button className="quiet-link" onClick={() => navigate('/dashboard')}>See your dashboard <Icon name="arrow" size={15} /></button></div>
          <div className="path-cards">{paths.map((path, index) => <article className="path-card" key={path.title}><div className={`path-icon ${path.color}`}><Icon name={path.icon} /></div><span className="path-index">0{index + 1}</span><h3>{path.title}</h3><p>Follow a clear, skill-by-skill plan built around the work you want to do.</p><div className="path-meta"><span><Icon name="clock" size={14} />{path.meta}</span><button onClick={() => navigate('/roadmap')} aria-label={`Explore ${path.title}`}><Icon name="arrow" size={16} /></button></div></article>)}</div>
        </section>
        <section className="quote-band"><span className="quote-mark">“</span><blockquote>Clarity isn't having every answer.<br />It's knowing what to do next.</blockquote><span className="quote-byline">THE CAREERX WAY</span></section>
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}

function RoadmapBuilderPage({ navigate }) {
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [background, setBackground] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saveWarning, setSaveWarning] = useState('')
  const [result, setResult] = useState(null)

  const generate = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSaveWarning('')
    setResult(null)

    try {
      if (!supabase) throw new Error('Supabase is not configured. Add its URL and publishable key to .env.local.')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) {
        setError('Sign in to research and save your personalized roadmap.')
        return
      }

      const response = await fetch('/api/roadmaps/research', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, company, background, hoursPerWeek: Number(hoursPerWeek) }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Roadmap research failed.')
      setResult(payload)

      try {
        const roadmapId = await saveRoadmap(payload.roadmap, { role, hoursPerWeek }, payload.sources || [])
        setResult({ ...payload, role, roadmapId })
        navigate('/dashboard')
      } catch (saveError) {
        setResult({ ...payload, role })
        setSaveWarning(`The research is ready, but we couldn't save it to your account: ${saveError.message}`)
      }
    } catch (requestError) {
      setError(requestError.message || 'Roadmap research failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const saveRoadmap = async (roadmap, form, sources) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('Your session expired. Please sign in again.')
    const { data: profile, error: profileError } = await supabase
      .from('roadmaps')
      .select('username')
      .eq('user_id', user.id)
      .not('username', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (profileError) throw profileError

    const phases = Array.isArray(roadmap.phases) ? roadmap.phases : []
    const skills = [...new Set(phases.flatMap((phase) => Array.isArray(phase.skills)
      ? phase.skills.map((skill) => typeof skill === 'string' ? skill : skill?.name).filter(Boolean)
      : []))]
    const { data: savedRoadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .insert({
        user_id: user.id,
        username: profile?.username || null,
        role_name: form.role.trim(),
        summary: roadmap.career_overview || '',
        skills,
      })
      .select('id')
      .single()
    if (roadmapError) throw roadmapError

    const nodes = [
      ...phases.map((phase) => ({ roadmap_id: savedRoadmap.id, section_type: 'phase', content: phase })),
      { roadmap_id: savedRoadmap.id, section_type: 'entry_level_positions', content: roadmap.entry_level_positions || [] },
      { roadmap_id: savedRoadmap.id, section_type: 'timeline', content: { total_timeline: roadmap.total_timeline, hours_per_week: form.hoursPerWeek, assumptions: roadmap.assumptions || [] } },
      { roadmap_id: savedRoadmap.id, section_type: 'first_90_days', content: roadmap.first_90_days || [] },
      { roadmap_id: savedRoadmap.id, section_type: 'caveats', content: roadmap.caveats || [] },
      { roadmap_id: savedRoadmap.id, section_type: 'sources', content: sources },
    ]
    const { error: nodesError } = await supabase.from('roadmap_nodes').insert(nodes)
    if (nodesError) throw nodesError
    return savedRoadmap.id
  }

  const roadmap = result?.roadmap
  return (
    <div className="marketing-page">
      <SiteNav navigate={navigate} active="roadmap" />
      <main className="roadmap-builder-page">
        <div className="builder-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> CAREER RESEARCH, GROUNDED IN THE LIVE WEB</div>
          <h1>Turn a career goal into<br /><span className="gradient-text">a roadmap you can follow.</span></h1>
          <p>Get researched career phases, prioritized skills, entry-level roles, realistic timing, and sources—tailored to you.</p>
        </div>
        <div className="builder-layout">
          <form className="builder-form panel" onSubmit={generate}>
            <div className="eyebrow">MAKE IT YOURS</div>
            <h2>Where do you want to go?</h2>
            <label htmlFor="career-goal">Career goal</label>
            <input id="career-goal" value={role} onChange={(event) => setRole(event.target.value)} minLength={3} maxLength={120} placeholder="e.g. Product designer" required />
            <label htmlFor="target-company">Company or industry</label>
            <input id="target-company" value={company} onChange={(event) => setCompany(event.target.value)} maxLength={120} placeholder="e.g. climate tech, healthcare, or a company name" />
            <label htmlFor="career-background">Your current experience <span>optional</span></label>
            <textarea id="career-background" value={background} onChange={(event) => setBackground(event.target.value)} maxLength={500} rows={4} placeholder="Skills, education, projects, or work experience to build on" />
            <label htmlFor="weekly-hours">Time you can spend each week</label>
            <select id="weekly-hours" value={hoursPerWeek} onChange={(event) => setHoursPerWeek(event.target.value)}>
              {[5, 10, 15, 20, 30, 40].map((hours) => <option value={hours} key={hours}>{hours} hours per week</option>)}
            </select>
            {error && <div className="form-message error-message" role="alert">{error} {error.startsWith('Sign in') && <button type="button" className="form-inline-link" onClick={() => navigate('/auth')}>Sign in</button>}</div>}
            <button className="button button-wide builder-submit" type="submit" disabled={loading}><Icon name="spark" size={16} />{loading ? 'Researching the career path…' : 'Research my roadmap'}{!loading && <Icon name="arrow" size={16} />}</button>
            <small className="builder-note">Research uses Context.dev web answers and returns evidence links. Up to 3 research runs per hour.</small>
          </form>
          <section className="builder-results" aria-live="polite">
            {!roadmap && <div className="builder-empty panel"><span className="step-icon"><Icon name="target" size={20} /></span><h2>Your path, step by step.</h2><p>Tell us what role you're aiming for. We'll research the skills, phases, projects, and entry-level opportunities that can help you get there.</p><div className="empty-list"><span><Icon name="check" size={14} /> Logical learning phases</span><span><Icon name="check" size={14} /> Job-ready skills and projects</span><span><Icon name="check" size={14} /> Realistic timeline and sources</span></div></div>}
            {roadmap && <RoadmapResults roadmap={roadmap} role={result.role || role} roadmapId={result.roadmapId} sources={result.sources || []} partial={result.partial} credits={result.credits} />}
          </section>
        </div>
        {saveWarning && <div className="form-message error-message builder-save-warning" role="alert">{saveWarning}</div>}
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}

function RoadmapResults({ roadmap, role, roadmapId, sources, partial, credits }) {
  const phases = Array.isArray(roadmap.phases) ? roadmap.phases : []
  const roles = Array.isArray(roadmap.entry_level_positions) ? roadmap.entry_level_positions : []
  const list = (value) => Array.isArray(value) ? value : []
  const safeSources = sources.filter((source) => {
    try {
      return ['https:', 'http:'].includes(new URL(source).protocol)
    } catch {
      return false
    }
  })
  return (
    <div className="roadmap-results">
      <section className="result-overview panel">
        <div className="result-overview-top"><div><div className="eyebrow">YOUR RESEARCHED ROADMAP</div><h2>{roadmap.total_timeline || 'A practical path forward'}</h2></div>{credits !== null && <span className="credits-pill">{credits} credits</span>}</div>
        {partial && <div className="partial-notice">This is a partial result. Run the research again for a complete answer.</div>}
        <p>{roadmap.career_overview || 'Research-backed guidance for your target career.'}</p>
        {list(roadmap.assumptions).length > 0 && <div className="assumption-box"><strong>Planning assumptions</strong>{list(roadmap.assumptions).map((item, index) => <span key={index}>{item}</span>)}</div>}
        {roadmapId && <a className="saved-roadmap-link" href="/dashboard">Open this saved roadmap in your dashboard <Icon name="arrow" size={13} /></a>}
      </section>
      <InteractiveRoadmap key={roadmapId || role} roadmap={roadmap} role={role} roadmapId={roadmapId} />
      <section className="result-section">
        <div className="result-section-heading"><span className="eyebrow">THE JOURNEY</span><h2>Build capability in phases</h2></div>
        <div className="journey-accordion">{phases.map((phase, index) => <details className="journey-phase panel" key={`${phase.phase}-${index}`}><summary><span className="phase-number">0{index + 1}</span><span className="journey-summary-copy"><strong>{phase.phase || `Phase ${index + 1}`}</strong><small>{phase.duration} · {list(phase.skills).length} skills · {list(phase.milestones).length} milestones</small></span><span className="journey-expand">Details <span>⌄</span></span></summary><div className="journey-phase-content"><p>{phase.objective}</p><div className="result-detail-grid"><div><strong>Skills to build</strong><ul>{list(phase.skills).map((skill, skillIndex) => <li key={skillIndex}><b>{typeof skill === 'string' ? skill : skill?.name}</b>{typeof skill === 'object' && skill?.rationale && <small>{skill.rationale}</small>}{typeof skill === 'object' && skill?.priority && <em>{skill.priority}</em>}</li>)}</ul></div><div><strong>Portfolio projects</strong>{list(phase.projects).map((project, projectIndex) => <div className="project-suggestion" key={projectIndex}><b>{typeof project === 'string' ? project : project?.title}</b>{typeof project === 'object' && <small>{project?.description}</small>}</div>)}<strong className="milestone-label">Milestones</strong><ul>{list(phase.milestones).map((item, milestoneIndex) => <li key={milestoneIndex}>{item}</li>)}</ul></div></div></div></details>)}</div>
      </section>
      <section className="result-section entry-role-section">
        <div className="result-section-heading"><span className="eyebrow">GETTING YOUR FOOT IN THE DOOR</span><h2>Entry-level roles to target</h2></div>
        <div className="entry-role-grid">{roles.map((item, index) => <article className="entry-role-card panel" key={`${item.title}-${index}`}><h3>{item.title}</h3><p>{item.fit}</p>{list(item.requirements).length > 0 && <div className="role-requirements">{list(item.requirements).map((requirement, requirementIndex) => <span key={requirementIndex}>{requirement}</span>)}</div>}</article>)}</div>
      </section>
      {list(roadmap.first_90_days).length > 0 && <section className="result-section"><div className="result-section-heading"><span className="eyebrow">START SMALL, START NOW</span><h2>Your first 90 days</h2></div><ol className="ninety-day-list">{list(roadmap.first_90_days).map((item, index) => <li className="panel" key={index}><span>0{index + 1}</span>{item}</li>)}</ol></section>}
      {list(roadmap.caveats).length > 0 && <section className="result-section caveats-box"><strong>Keep in mind</strong>{list(roadmap.caveats).map((item, index) => <p key={index}>{item}</p>)}</section>}
      <section className="result-sources"><div><span className="eyebrow">SOURCES</span><h2>Follow the evidence</h2></div>{safeSources.map((source, index) => <a href={source} target="_blank" rel="noreferrer" key={`${source}-${index}`}>{source}<Icon name="arrow" size={13} /></a>)}</section>
    </div>
  )
}

function InteractiveRoadmap({ roadmap, role, roadmapId, large = false }) {
  const phases = Array.isArray(roadmap.phases) ? roadmap.phases : []
  const storageKey = `careerx-known-skills:${roadmapId || role}`
  const [knownSkills, setKnownSkills] = useState(() => {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || '[]')
    return Array.isArray(saved) ? saved : []
  })
  const [selectedNode, setSelectedNode] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState(null)
  const mapViewportRef = useRef(null)
  const [advice, setAdvice] = useState(null)
  const [adviceSources, setAdviceSources] = useState([])
  const [adviceError, setAdviceError] = useState('')
  const [adviceLoading, setAdviceLoading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(knownSkills))
  }, [knownSkills, storageKey])

  const allNodes = phases.flatMap((phase, phaseIndex) => {
    const phaseName = phase.phase || `Phase ${phaseIndex + 1}`
    const skills = Array.isArray(phase.skills) ? phase.skills : []
    const milestones = Array.isArray(phase.milestones) && phase.milestones.length
      ? phase.milestones
      : [phase.objective || `Complete ${phaseName}`]
    return [
      ...skills.map((skill, index) => {
        const name = typeof skill === 'string' ? skill : skill?.name || 'Core skill'
        const key = name.trim().toLowerCase()
        return {
          id: `phase-${phaseIndex}-skill-${index}`,
          key,
          title: name,
          kind: 'skill',
          phase: phaseName,
          phaseIndex,
          detail: typeof skill === 'object' ? skill?.rationale || phase.objective : phase.objective,
          phaseContext: `${phase.objective || ''} Skills in this phase: ${skills.map((item) => typeof item === 'string' ? item : item?.name).filter(Boolean).join(', ')}. Projects: ${(phase.projects || []).map((item) => typeof item === 'string' ? item : item?.title).filter(Boolean).join(', ')}.`,
        }
      }),
      ...milestones.map((milestone, index) => ({
        id: `phase-${phaseIndex}-milestone-${index}`,
        key: null,
        title: milestone,
        kind: 'milestone',
        phase: phaseName,
        phaseIndex,
        detail: phase.objective || '',
        phaseContext: `${phase.objective || ''} Skills in this phase: ${skills.map((item) => typeof item === 'string' ? item : item?.name).filter(Boolean).join(', ')}. Projects: ${(phase.projects || []).map((item) => typeof item === 'string' ? item : item?.title).filter(Boolean).join(', ')}.`,
      })),
    ]
  })
  const visibleNodes = allNodes.filter((node) => node.kind !== 'skill' || !knownSkills.includes(node.key))
  const maxRows = Math.max(1, ...phases.map((_, index) => visibleNodes.filter((node) => node.phaseIndex === index).length))
  const canvasHeight = Math.max(380, 120 + maxRows * 130)
  const rootNode = {
    id: 'career-goal',
    kind: 'root',
    title: role,
    phase: 'Your career goal',
    detail: roadmap.total_timeline || 'Your researched target career',
    phaseContext: roadmap.career_overview || '',
    x: 34,
    y: (canvasHeight - 100) / 2,
  }
  const positionedNodes = []
  const phaseNodes = phases.map((phase, phaseIndex) => {
    const phaseSteps = visibleNodes.filter((node) => node.phaseIndex === phaseIndex)
    const phaseX = 340 + phaseIndex * 560
    const firstStepY = 70
    const phaseY = firstStepY + Math.max(0, phaseSteps.length - 1) * 65
    const phaseNode = {
      id: `phase-${phaseIndex}`,
      kind: 'phase',
      title: phase.phase || `Phase ${phaseIndex + 1}`,
      phase: phase.phase || `Phase ${phaseIndex + 1}`,
      detail: `${phase.duration || ''}${phase.objective ? ` · ${phase.objective}` : ''}`,
      phaseContext: `${phase.objective || ''} Skills: ${(phase.skills || []).map((skill) => typeof skill === 'string' ? skill : skill?.name).filter(Boolean).join(', ')}.`,
      phaseIndex,
      x: phaseX,
      y: phaseY,
    }
    positionedNodes.push(phaseNode)
    phaseSteps.forEach((node, rowIndex) => {
      positionedNodes.push({
        ...node,
        x: phaseX + 270,
        y: firstStepY + rowIndex * 130,
      })
    })
    return phaseNode
  })
  const goalNode = {
    id: 'career-target',
    kind: 'goal',
    title: `Ready for ${role}`,
    phase: 'Career target',
    detail: 'Build, demonstrate, and apply your skills.',
    phaseContext: roadmap.career_overview || '',
    x: 340 + phases.length * 560,
    y: (canvasHeight - 100) / 2,
  }
  const canvasWidth = Math.max(640, goalNode.x + 300)
  const nodeEdges = []
  if (phaseNodes.length) nodeEdges.push([rootNode, phaseNodes[0]])
  else nodeEdges.push([rootNode, goalNode])
  phaseNodes.forEach((phaseNode, phaseIndex) => {
    const steps = positionedNodes.filter((node) => node.phaseIndex === phaseIndex && node.kind !== 'phase')
    steps.forEach((step) => nodeEdges.push([phaseNode, step]))
    const nextPhase = phaseNodes[phaseIndex + 1]
    if (nextPhase) {
      if (steps.length) steps.forEach((step) => nodeEdges.push([step, nextPhase]))
      else nodeEdges.push([phaseNode, nextPhase])
    }
    else steps.forEach((step) => nodeEdges.push([step, goalNode]))
  })
  const edges = nodeEdges.map(([from, to]) => {
    const fromWidth = ['root', 'goal'].includes(from.kind) ? 230 : 248
    const startX = from.x + fromWidth
    const startY = from.y + 48
    const endX = to.x
    const endY = to.y + 42
    const bend = Math.max(38, Math.abs(endX - startX) / 2)
    return `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`
  })
  const graphNodes = [rootNode, ...positionedNodes, goalNode]
  const knownLabels = [...new Map(allNodes.filter((node) => node.kind === 'skill' && knownSkills.includes(node.key)).map((node) => [node.key, node.title])).entries()]
  const suggestedGithubUrl = (() => {
    const candidate = advice?.github_suggestion?.url
    try {
      const url = new URL(candidate)
      if (url.protocol === 'https:' && url.hostname === 'github.com') return url.href
    } catch {
      return `https://github.com/search?q=${encodeURIComponent(advice?.github_suggestion?.search_query || selectedNode?.title || role)}&type=repositories`
    }
    return `https://github.com/search?q=${encodeURIComponent(advice?.github_suggestion?.search_query || selectedNode?.title || role)}&type=repositories`
  })()
  const validAdviceSources = adviceSources.filter((source) => {
    try {
      return new URL(source).protocol === 'https:'
    } catch {
      return false
    }
  })
  const toggleKnown = (node) => {
    if (node.kind !== 'skill') return
    setKnownSkills((current) => current.includes(node.key)
      ? current.filter((key) => key !== node.key)
      : [...current, node.key])
    if (selectedNode?.key === node.key) setSelectedNode(null)
  }

  const openNode = (node) => {
    setSelectedNode(node)
    setAdvice(null)
    setAdviceSources([])
    setAdviceError('')
  }

  const requestAdvice = async () => {
    setAdviceLoading(true)
    setAdviceError('')
    setAdvice(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('Your session expired. Sign in again to get step advice.')
      const response = await fetch('/api/roadmaps/advice', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          phase: selectedNode.phase,
          step: selectedNode.title,
          kind: selectedNode.kind === 'skill' ? 'skill' : 'milestone',
          context: selectedNode.phaseContext,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Step advice could not be generated.')
      setAdvice(payload.advice)
      setAdviceSources(Array.isArray(payload.sources) ? payload.sources : [])
    } catch (error) {
      setAdviceError(error.message || 'Step advice could not be generated. Please try again.')
    } finally {
      setAdviceLoading(false)
    }
  }

  const startPan = (event) => {
    if (event.target.closest('.map-node')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({ pointerX: event.clientX, pointerY: event.clientY, panX: pan.x, panY: pan.y })
  }

  const movePan = (event) => {
    if (!drag) return
    setPan({ x: drag.panX + (event.clientX - drag.pointerX) * 0.65, y: drag.panY + (event.clientY - drag.pointerY) * 0.65 })
  }

  const finishPan = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setDrag(null)
  }

  const centerMap = useCallback(() => {
    const viewport = mapViewportRef.current
    if (!viewport) return
    const fitScale = Math.min(1, (viewport.clientWidth - 40) / canvasWidth, (viewport.clientHeight - 40) / canvasHeight)
    const nextZoom = Math.max(0.25, fitScale)
    setZoom(nextZoom)
    setPan({
      x: Math.max(20, (viewport.clientWidth - canvasWidth * nextZoom) / 2),
      y: Math.max(20, (viewport.clientHeight - canvasHeight * nextZoom) / 2),
    })
  }, [canvasHeight, canvasWidth, setPan, setZoom])

  useEffect(() => {
    const frame = window.requestAnimationFrame(centerMap)
    return () => window.cancelAnimationFrame(frame)
  }, [centerMap])

  useEffect(() => {
    const viewport = mapViewportRef.current
    if (!viewport) return undefined
    const handleWheel = (event) => {
      event.preventDefault()
      event.stopPropagation()
      setZoom((value) => Math.max(0.25, Math.min(1.7, value - event.deltaY * 0.0004)))
    }
    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [])

  const downloadRoadmap = async () => {
    setDownloadError('')
    try {
      await downloadRoadmapDocument({ ...roadmap, role })
    } catch (error) {
      setDownloadError(`Couldn't create the Word document: ${error.message}`)
    }
  }

  return (
    <section className={`interactive-roadmap panel${large ? ' dashboard-roadmap-map' : ''}`}>
      <div className="interactive-roadmap-heading">
        <div><div className="eyebrow">YOUR INTERACTIVE PATH</div><h2>Explore each step</h2><p>Career goal → phases → skills and milestones → target role · Drag to pan · Zoom only inside the map</p></div>
        <div className="map-controls"><button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.25, value - 0.08))}>−</button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.7, value + 0.08))}>+</button><button className="recenter-control" aria-label="Recenter roadmap" title="Fit the full roadmap in view" onClick={centerMap}>Recenter</button><button className="download-roadmap-control" aria-label="Download roadmap as a Word document" title="Download roadmap as a Word document" onClick={downloadRoadmap}><Icon name="book" size={14} /></button></div>
      </div>
      {downloadError && <p className="map-download-error" role="alert">{downloadError}</p>}
      <div className={`interactive-map-layout${selectedNode ? ' has-selection' : ''}`}>
        <div ref={mapViewportRef} className="roadmap-map-viewport" onPointerDown={startPan} onPointerMove={movePan} onPointerUp={finishPan} onPointerCancel={finishPan}>
          <div className="roadmap-map" style={{ width: canvasWidth, height: canvasHeight, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
            <svg className="map-connectors" width={canvasWidth} height={canvasHeight} aria-hidden="true">
              {edges.map((path, index) => <path key={index} d={path} className="map-connector" />)}
            </svg>
            {graphNodes.map((node) => (
              <article
                className={`map-node ${node.kind}${selectedNode?.id === node.id ? ' selected' : ''}`}
                key={node.id}
                style={{ left: node.x, top: node.y }}
                onClick={() => openNode(node)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openNode(node) } }}
                tabIndex={0}
                aria-label={`${node.kind}: ${node.title}. Select for advice.`}
              >
                <span className="map-node-icon"><Icon name={['skill', 'phase'].includes(node.kind) ? 'spark' : 'target'} size={15} /></span>
                <span className="map-node-copy"><small>{({ root: 'CAREER GOAL', phase: 'PHASE', skill: 'SKILL', milestone: 'MILESTONE', goal: 'TARGET ROLE' })[node.kind]}</small><strong>{node.title}</strong><span>{node.detail}</span></span>
                {node.kind === 'skill' && <button className="known-toggle" onClick={(event) => { event.stopPropagation(); toggleKnown(node) }}>I know this</button>}
              </article>
            ))}
          </div>
        </div>
        {selectedNode && <aside className="step-advice-panel">
          <button className="advice-close" onClick={() => setSelectedNode(null)} aria-label="Close step advice">×</button>
          <div className="eyebrow">STEP COACH</div><h3>{selectedNode.title}</h3><p>{selectedNode.phase}</p>
          {selectedNode.kind === 'skill' && <button className="known-action" onClick={() => toggleKnown(selectedNode)}>{knownSkills.includes(selectedNode.key) ? 'Restore this skill to the path' : 'Mark as already known'}</button>}
          {!advice && <><p className="advice-intro">Get a focused weekend project, a GitHub discovery link, and interview practice for this exact step.</p><button className="button button-wide" onClick={requestAdvice} disabled={adviceLoading}><Icon name="spark" size={15} />{adviceLoading ? 'Researching advice…' : 'Generate step advice'}</button><small className="advice-credit-note">Uses one fast Context.dev research request.</small></>}
          {adviceError && <div className="form-message error-message" role="alert">{adviceError}</div>}
          {advice && <div className="step-advice-content">
            {advice.estimated_time && <span className="advice-time"><Icon name="clock" size={14} />{advice.estimated_time}</span>}
            {advice.weekend_project && <section><strong>Weekend project · {advice.weekend_project.title}</strong><p>{advice.weekend_project.goal}</p><ol>{(advice.weekend_project.tasks || []).map((task, index) => <li key={index}>{task}</li>)}</ol><div className="advice-acceptance"><b>Done when</b>{(advice.weekend_project.acceptance_criteria || []).map((item, index) => <span key={index}>{item}</span>)}</div></section>}
            {advice.github_suggestion && <section><strong>Explore GitHub</strong><p>{advice.github_suggestion.guidance}</p><a href={suggestedGithubUrl} target="_blank" rel="noreferrer">{advice.github_suggestion.search_query || 'Search relevant repositories'} <Icon name="arrow" size={12} /></a></section>}
            {Array.isArray(advice.next_actions) && advice.next_actions.length > 0 && <section><strong>Your next actions</strong><ol>{advice.next_actions.map((item, index) => <li key={index}>{item}</li>)}</ol></section>}
            {Array.isArray(advice.interview_questions) && advice.interview_questions.length > 0 && <section><strong>Interview practice</strong><ol>{advice.interview_questions.map((item, index) => <li key={index}>{item}</li>)}</ol></section>}
            {Array.isArray(advice.cautions) && advice.cautions.length > 0 && <section><strong>Keep in mind</strong>{advice.cautions.map((item, index) => <p key={index}>{item}</p>)}</section>}
            {validAdviceSources.length > 0 && <section><strong>Sources</strong>{validAdviceSources.map((source, index) => <a key={`${source}-${index}`} href={source} target="_blank" rel="noreferrer">{source}</a>)}</section>}
          </div>}
        </aside>}
      </div>
      <div className="known-skills-row"><strong>Already know ({knownLabels.length})</strong>{knownLabels.length ? knownLabels.map(([key, label]) => <button key={key} onClick={() => setKnownSkills((current) => current.filter((item) => item !== key))}>{label} <span aria-hidden="true">×</span></button>) : <span>Mark a skill as known to skip it and redraw the path.</span>}</div>
    </section>
  )
}

function DashboardPage({ navigate }) {
  const [selected, setSelected] = useState('Roadmap')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [profileError, setProfileError] = useState('')
  const [userId, setUserId] = useState('')
  const [roadmaps, setRoadmaps] = useState([])
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('')
  const [roadmapLoading, setRoadmapLoading] = useState(true)
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const [completedItems, setCompletedItems] = useState([])
  const [streakDates, setStreakDates] = useState([])

  useEffect(() => {
    let active = true
    const loadDashboard = async () => {
      try {
        if (!supabase) throw new Error('Supabase is not configured.')
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError?.name === 'AuthSessionMissingError') {
          if (active) setNeedsSignIn(true)
          return
        }
        if (userError) throw userError
        if (!user) {
          if (active) setNeedsSignIn(true)
          return
        }
        const { data: roadmapRows, error: roadmapError } = await supabase
          .from('roadmaps')
          .select('id, username, role_name, summary, skills, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
        if (roadmapError) throw roadmapError
        const rows = Array.isArray(roadmapRows) ? roadmapRows : []
        const { data: nodeRows, error: nodesError } = rows.length
          ? await supabase
          .from('roadmap_nodes')
          .select('roadmap_id, section_type, content')
          .in('roadmap_id', rows.map((row) => row.id))
          : { data: [], error: null }
        if (nodesError) throw nodesError
        const nodesByRoadmap = new Map()
        for (const node of nodeRows || []) {
          const current = nodesByRoadmap.get(node.roadmap_id) || []
          current.push(node)
          nodesByRoadmap.set(node.roadmap_id, current)
        }
        const preparedRoadmaps = rows.map((row) => {
          const nodes = nodesByRoadmap.get(row.id) || []
          const contents = (type) => nodes.filter((node) => node.section_type === type).map((node) => node.content)
          const timeline = contents('timeline')[0] || {}
          const savedPhases = contents('phase')
          const fallbackSkills = Array.isArray(row.skills) ? row.skills : []
          const phases = savedPhases.length ? savedPhases : (fallbackSkills.length ? [{
          phase: 'Skills from your saved roadmap',
          objective: 'This older roadmap saved its skill list, but not its research phases or timing.',
          skills: fallbackSkills,
          projects: [],
          milestones: [],
          }] : [])
          return {
          id: row.id,
          role: row.role_name || 'Career roadmap',
          career_overview: row.summary || '',
          phases,
          hasDetailedJourney: savedPhases.length > 0,
          total_timeline: timeline.total_timeline || '',
          hours_per_week: timeline.hours_per_week || '',
          assumptions: timeline.assumptions || [],
          entry_level_positions: contents('entry_level_positions')[0] || [],
          first_90_days: contents('first_90_days')[0] || [],
          caveats: contents('caveats')[0] || [],
          sources: contents('sources')[0] || [],
          created_at: row.created_at,
          }
        })
        const preferredRoadmap = preparedRoadmaps.find((roadmap) => roadmap.hasDetailedJourney) || preparedRoadmaps[0]
        const activeDates = recordActiveDay(user.id)
        if (active) {
          setUserId(user.id)
          setUsername(rows[0]?.username || '')
          setEmail(user.email || '')
          setRoadmaps(preparedRoadmaps)
          setSelectedRoadmapId(preferredRoadmap?.id || '')
          setCompletedItems(readCompletedItems(user.id, preferredRoadmap?.id))
          setStreakDates(activeDates)
        }
      } catch (loadError) {
        if (active) setProfileError(`Couldn't load your saved roadmap data: ${loadError.message}`)
      } finally {
        if (active) setRoadmapLoading(false)
      }
    }
    loadDashboard()
    return () => { active = false }
  }, [])

  const savedRoadmap = roadmaps.find((roadmap) => roadmap.id === selectedRoadmapId) || null
  const toggleItemComplete = (key) => {
    if (!userId || !savedRoadmap?.id) return
    const storageKey = `careerx:progress:${userId}:${savedRoadmap.id}`
    setCompletedItems((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }

  const firstName = username.trim().split(/\s+/)[0] || 'there'
  const skills = (savedRoadmap?.phases || []).flatMap((phase, phaseIndex) => (phase.skills || []).map((skill, index) => ({
    key: `skill:${phaseIndex}:${index}`,
    name: typeof skill === 'string' ? skill : skill?.name || 'Skill',
    rationale: typeof skill === 'object' ? skill?.rationale : '',
    phase: phase.phase || `Phase ${phaseIndex + 1}`,
  })))
  const projects = (savedRoadmap?.phases || []).flatMap((phase, phaseIndex) => (phase.projects || []).map((project, index) => ({
    key: `project:${phaseIndex}:${index}`,
    name: typeof project === 'string' ? project : project?.title || 'Portfolio project',
    description: typeof project === 'object' ? project?.description : '',
    phase: phase.phase || `Phase ${phaseIndex + 1}`,
  })))
  const doneSkills = skills.filter((skill) => completedItems.includes(skill.key)).length
  const doneProjects = projects.filter((project) => completedItems.includes(project.key)).length
  const activeWeek = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return { date: localDateKey(date), label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).slice(0, 1) }
  })
  const currentStreak = getCurrentStreak(streakDates)
  const savedSources = (savedRoadmap?.sources || []).filter((source) => {
    try {
      return ['https:', 'http:'].includes(new URL(source).protocol)
    } catch {
      return false
    }
  })
  const researchSavedRoadmap = () => {
    navigate('/roadmap')
  }
  const logout = async () => {
    if (!supabase) return
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setProfileError(`Couldn't sign out: ${signOutError.message}`)
      return
    }
    navigate('/auth')
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Brand onClick={() => navigate('/')} />
        <div className="workspace-label">WORKSPACE</div>
        <nav className="dashboard-nav">{[{ icon: 'grid', label: 'Roadmap' }, { icon: 'book', label: 'My learning' }, { icon: 'target', label: 'Projects' }, { icon: 'chart', label: 'My progress' }].map((item) => <button key={item.label} className={selected === item.label ? 'dash-nav-item current' : 'dash-nav-item'} onClick={() => setSelected(item.label)}><Icon name={item.icon} size={17} />{item.label}</button>)}</nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-goal"><div className="goal-icon"><Icon name="spark" size={17} /></div><div><strong>Keep your momentum</strong><p>One small step is still a step.</p></div><div className="sidebar-progress"><span style={{ width: `${Math.min(100, (activeWeek.filter((day) => streakDates.includes(day.date)).length / 7) * 100)}%` }} /></div><small>{activeWeek.filter((day) => streakDates.includes(day.date)).length} active days this week</small></div>
        <div className="profile-button"><span className="profile-details"><strong>{username || 'Your profile'}</strong><small title={email}>{email || 'Signed-in account'}</small></span><button className="logout-button" onClick={logout}>Log out</button></div>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-topbar"><div className="crumbs">Workspace <span>/</span> <strong>{selected}</strong></div><div className="topbar-right"><span className="topbar-email" title={email}>{email}</span><button className="logout-button" onClick={logout}>Log out</button></div></div>
        <div className="dash-content">
          <div className="dash-welcome"><div><span className="eyebrow">YOUR CAREER WORKSPACE</span><h1>Good afternoon, {firstName} <span className="wave">✦</span></h1><p>Your saved career plan, ready for your next step.</p>{needsSignIn && <p className="profile-load-error">Sign in to see the roadmap saved to your account. <button className="form-inline-link" onClick={() => navigate('/auth')}>Sign in</button></p>}{profileError && <p className="profile-load-error" role="alert">{profileError}</p>}</div><button className="button button-small" onClick={() => navigate('/roadmap')}><Icon name="spark" size={15} /> Build a roadmap</button></div>
          {roadmapLoading && <div className="dashboard-roadmap-empty">Loading your saved roadmaps…</div>}
          {!roadmapLoading && needsSignIn && <div className="dashboard-roadmap-empty"><h3>Sign in to open your workspace</h3><p>Your saved career plans are connected to your account.</p><button className="button button-small" onClick={() => navigate('/auth')}>Sign in</button></div>}
          {!roadmapLoading && !needsSignIn && selected === 'Roadmap' && <>
          <div className="roadmap-toolbar">
            <label htmlFor="saved-roadmap-select">Saved roadmaps</label>
            <select id="saved-roadmap-select" value={selectedRoadmapId} onChange={(event) => { setSelectedRoadmapId(event.target.value); setCompletedItems(readCompletedItems(userId, event.target.value)) }}>
              {roadmaps.map((roadmap) => <option key={roadmap.id} value={roadmap.id}>{roadmap.role}{roadmap.hasDetailedJourney ? '' : ' · saved skills only'}</option>)}
            </select>
            <button className="button button-small" onClick={researchSavedRoadmap}>{savedRoadmap?.hasDetailedJourney ? 'New roadmap' : 'Rebuild this roadmap'} <Icon name="arrow" size={13} /></button>
          </div>
          <div className="dash-grid">
            <section className="roadmap-panel panel">
              <div className="panel-heading"><div><div className="eyebrow">YOUR SAVED CAREER ROADMAP</div><h2>{savedRoadmap?.role || 'Your roadmap'} <span className="edit-mark">↗</span></h2><p>{savedRoadmap?.total_timeline || 'Your learning path, connected to your career goal.'}</p></div></div>
              {roadmapLoading ? <div className="dashboard-roadmap-empty">Loading your saved roadmap…</div> : savedRoadmap?.phases?.length
                ? <InteractiveRoadmap key={savedRoadmap.id} roadmap={savedRoadmap} role={savedRoadmap.role} roadmapId={savedRoadmap.id} large />
                : <div className="dashboard-roadmap-empty"><h3>No journey details are visible for this roadmap yet</h3><p>Run <code>20261008135800_roadmap_nodes_owner_policies.sql</code> in Supabase SQL Editor and refresh. If the phases are still missing, rebuild this roadmap to save its full DAG and timeline.</p><button className="button button-small" onClick={researchSavedRoadmap}>Rebuild this roadmap <Icon name="arrow" size={13} /></button></div>}
            </section>
            <aside className="right-column dashboard-roadmap-support">
              <section className="panel progress-panel"><div className="panel-small-title"><span>ROADMAP AT A GLANCE</span></div><div className="dashboard-stat"><strong>{savedRoadmap?.phases?.length || 0}</strong><span>learning phases</span></div><div className="dashboard-stat"><strong>{skills.length}</strong><span>skills to build</span></div><div className="dashboard-stat"><strong>{savedRoadmap?.phases?.reduce((sum, phase) => sum + (Array.isArray(phase.milestones) ? phase.milestones.length : 0), 0) || 0}</strong><span>milestones</span></div>{savedRoadmap?.sources?.length > 0 && <p className="dashboard-source-count">{savedRoadmap.sources.length} research sources saved with your plan</p>}</section>
              <section className="panel today-panel"><div className="panel-small-title"><span>HOW TO USE YOUR MAP</span></div><div className="dashboard-guide-step"><span>01</span><p>Click any phase, skill, or milestone for focused advice.</p></div><div className="dashboard-guide-step"><span>02</span><p>Mark skills you already know to simplify your path.</p></div><div className="dashboard-guide-step"><span>03</span><p>Pan or zoom inside the map to explore the full route.</p></div></section>
              <section className="streak-card"><div className="streak-flame">✦</div><div><strong>{currentStreak}-day login streak</strong><p>Days you visited CareerX while signed in.</p></div><div className="streak-days">{activeWeek.map((day) => <span className={streakDates.includes(day.date) ? 'day-complete' : ''} key={day.date}>{streakDates.includes(day.date) ? '✓' : day.label}</span>)}</div></section>
            </aside>
          </div>
          <section className="dashboard-journey panel">
            <div className="panel-heading"><div><div className="eyebrow">THE JOURNEY</div><h2>Phases & timeline</h2><p>{savedRoadmap?.total_timeline || 'Timeline wasn’t saved with this roadmap.'}{savedRoadmap?.hours_per_week ? ` · ${savedRoadmap.hours_per_week} hours/week` : ''}</p></div></div>
            {savedRoadmap?.hasDetailedJourney
              ? <div className="journey-accordion">{savedRoadmap.phases.map((phase, index) => <details className="journey-phase panel" key={`${phase.phase}-${index}`}><summary><span className="phase-number">0{index + 1}</span><span className="journey-summary-copy"><strong>{phase.phase || `Phase ${index + 1}`}</strong><small>{phase.duration || 'Duration not provided'} · {(phase.skills || []).length} skills · {(phase.milestones || []).length} milestones</small></span><span className="journey-expand">Details <span>⌄</span></span></summary><div className="journey-phase-content"><p>{phase.objective}</p><div className="result-detail-grid"><div><strong>Skills to build</strong><ul>{(phase.skills || []).map((skill, skillIndex) => <li key={skillIndex}>{typeof skill === 'string' ? skill : skill?.name}{typeof skill === 'object' && skill?.rationale && <small>{skill.rationale}</small>}</li>)}</ul></div><div><strong>Portfolio projects</strong>{(phase.projects || []).map((project, projectIndex) => <div className="project-suggestion" key={projectIndex}><b>{typeof project === 'string' ? project : project?.title}</b>{typeof project === 'object' && project?.description && <small>{project.description}</small>}</div>)}<strong className="milestone-label">Milestones</strong><ul>{(phase.milestones || []).map((milestone, milestoneIndex) => <li key={milestoneIndex}>{milestone}</li>)}</ul></div></div></div></details>)}</div>
              : <div className="legacy-roadmap-note">Detailed phases and timing aren’t visible for this saved roadmap. First apply <code>20261008135800_roadmap_nodes_owner_policies.sql</code> in Supabase SQL Editor and refresh; if they’re still missing, research this goal again. <button className="quiet-link" onClick={researchSavedRoadmap}>Rebuild this roadmap <Icon name="arrow" size={13} /></button></div>}
            {savedRoadmap?.career_overview && <p className="dashboard-overview">{savedRoadmap.career_overview}</p>}
          </section>
          <div className="lower-grid">
            <section className="panel lower-panel"><div className="lower-panel-heading"><div><div className="eyebrow">ENTRY-LEVEL ROLES</div><h3>{savedRoadmap?.entry_level_positions?.length ? 'Where to start' : 'Research summary'}</h3></div></div>{savedRoadmap?.entry_level_positions?.length ? savedRoadmap.entry_level_positions.map((item, index) => <p key={index}><strong>{item.title}</strong>{item.fit ? ` — ${item.fit}` : ''}</p>) : <p>{savedRoadmap?.career_overview || 'Research a career goal to get a personalized roadmap with phases, skills, projects, and milestones.'}</p>}</section>
            <section className="panel lower-panel compare-panel"><div className="eyebrow">SAVED RESEARCH</div><h3>{savedSources.length ? `${savedSources.length} evidence sources` : 'Ground your next step in evidence'}</h3><div className="compare-links">{savedSources.map((source, index) => <a href={source} target="_blank" rel="noreferrer" key={`${source}-${index}`}>{new URL(source).hostname} <Icon name="arrow" size={14} /></a>)}</div></section>
          </div>
          </>}
          {!roadmapLoading && !needsSignIn && selected === 'My learning' && <section className="workspace-section panel">
          <div className="panel-heading"><div><div className="eyebrow">MY LEARNING</div><h2>Skills to build</h2><p>{doneSkills} of {skills.length} skills marked complete for {savedRoadmap?.role || 'your roadmap'}.</p></div></div>
          {skills.length ? <div className="workspace-item-list">{skills.map((skill) => <article className="workspace-item" key={skill.key}><button className={completedItems.includes(skill.key) ? 'completion-toggle is-complete' : 'completion-toggle'} onClick={() => toggleItemComplete(skill.key)} aria-label={`${completedItems.includes(skill.key) ? 'Mark incomplete' : 'Mark complete'}: ${skill.name}`}>{completedItems.includes(skill.key) ? '✓' : ''}</button><div><strong>{skill.name}</strong><span>{skill.phase}</span>{skill.rationale && <p>{skill.rationale}</p>}</div></article>)}</div> : <div className="dashboard-roadmap-empty"><h3>No saved skill list</h3><p>Research a roadmap to add skills to your learning list.</p><button className="button button-small" onClick={() => navigate('/roadmap')}>Build a roadmap</button></div>}
          </section>}
          {!roadmapLoading && !needsSignIn && selected === 'Projects' && <section className="workspace-section panel">
          <div className="panel-heading"><div><div className="eyebrow">PORTFOLIO BUILDER</div><h2>Projects from your roadmap</h2><p>{doneProjects} of {projects.length} projects marked complete.</p></div></div>
          {projects.length ? <div className="workspace-item-list">{projects.map((project) => <article className="workspace-item" key={project.key}><button className={completedItems.includes(project.key) ? 'completion-toggle is-complete' : 'completion-toggle'} onClick={() => toggleItemComplete(project.key)} aria-label={`${completedItems.includes(project.key) ? 'Mark incomplete' : 'Mark complete'}: ${project.name}`}>{completedItems.includes(project.key) ? '✓' : ''}</button><div><strong>{project.name}</strong><span>{project.phase}</span>{project.description && <p>{project.description}</p>}</div></article>)}</div> : <div className="dashboard-roadmap-empty"><h3>No project ideas saved</h3><p>Research a roadmap with project suggestions to build a personalized portfolio plan.</p><button className="button button-small" onClick={() => navigate('/roadmap')}>Build a roadmap</button></div>}
          </section>}
          {!roadmapLoading && !needsSignIn && selected === 'My progress' && <section className="workspace-section panel">
          <div className="panel-heading"><div><div className="eyebrow">MY PROGRESS</div><h2>Your momentum, at a glance</h2><p>Completion is tracked separately for each saved roadmap in this browser.</p></div></div>
          <div className="progress-overview-grid"><div className="progress-overview-card"><strong>{currentStreak}</strong><span>day login streak</span></div><div className="progress-overview-card"><strong>{doneSkills}/{skills.length}</strong><span>skills completed</span></div><div className="progress-overview-card"><strong>{doneProjects}/{projects.length}</strong><span>projects completed</span></div><div className="progress-overview-card"><strong>{roadmaps.length}</strong><span>saved roadmaps</span></div></div>
          <div className="activity-week"><h3>Signed-in activity · last 7 days</h3><div>{activeWeek.map((day) => <span className={streakDates.includes(day.date) ? 'day-complete' : ''} key={day.date}><i>{streakDates.includes(day.date) ? '✓' : '·'}</i>{day.label}</span>)}</div></div>
          </section>}
        </div>
      </main>
    </div>
  )
}

function AuthPage({ navigate }) {
  const [mode, setMode] = useState('signup')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return undefined
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setMode('update')
      if (event === 'SIGNED_IN' && session?.user?.id) recordActiveDay(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured yet. Add your project URL and publishable key to .env.local.')
      return
    }
    setLoading(true)
    try {
      const response = mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email, password })
          : mode === 'update'
            ? await supabase.auth.updateUser({ password })
            : await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` })
      if (response.error) throw response.error
      if (mode === 'reset') {
        setMessage('If an account exists for this email, a password reset link will arrive shortly.')
      } else if (mode === 'update') {
        setMode('signin')
        setMessage('Your password has been updated. Sign in with your new password.')
      } else if (mode === 'signup' && !response.data.session) {
        setMessage('Supabase is still requiring email confirmation. In your Supabase project, turn off Authentication → Sign In / Providers → Email → Confirm email to allow new accounts to sign in immediately.')
      } else if (mode === 'signup') {
        const { error: roadmapError } = await supabase.from('roadmaps').insert({
          user_id: response.data.user.id,
          username: username.trim(),
          role_name: 'Career roadmap',
          summary: 'Your personalized career journey starts here.',
          skills: [],
        })
        if (roadmapError) {
          setError(`Your account was created, but we couldn't save your name to the roadmaps table: ${roadmapError.message}`)
          return
        }
        navigate('/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (authError) {
      setError(authError.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-art"><img src={landingArt} alt="" /><div className="auth-art-overlay" /><Brand onClick={() => navigate('/')} /><div className="auth-quote"><span className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</span><h2>Your future isn't<br />a mystery. It's a map.</h2><p>Make the next move with confidence.</p></div><span className="auth-art-foot">CAREERX · BUILT FOR WHAT'S NEXT</span></div>
      <main className="auth-main"><button className="auth-back" onClick={() => navigate('/')}><span>←</span> Back to home</button><div className="auth-card"><div className="auth-heading"><div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h1>{mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : mode === 'update' ? 'Choose a new password' : 'Welcome back'}</h1><p>{mode === 'signup' ? 'Build a career plan that feels like yours.' : mode === 'reset' ? 'We’ll send you a secure link to get back in.' : mode === 'update' ? 'Make it strong and memorable.' : 'Pick up where your ambition left off.'}</p></div>{mode !== 'reset' && mode !== 'update' && <div className="auth-tabs"><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setMessage('') }}>Create account</button><button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(''); setMessage('') }}>Sign in</button></div>}
          <form className="auth-form" onSubmit={handleSubmit}>{mode === 'signup' && <><label htmlFor="username">Your name</label><input id="username" type="text" autoComplete="name" placeholder="How should we call you?" minLength={2} maxLength={80} value={username} onChange={(event) => setUsername(event.target.value)} required /></>}{mode !== 'update' && <><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></>}{mode !== 'reset' && <><label htmlFor="password">{mode === 'update' ? 'New password' : 'Password'}</label><input id="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />{mode !== 'update' && <div className="auth-options"><label className="remember-check"><input type="checkbox" /> <span>Keep me signed in</span></label>{mode === 'signin' && <button type="button" className="forgot-button" onClick={() => { setMode('reset'); setError(''); setMessage('') }}>Forgot password?</button>}</div>}</>}{error && <div className="form-message error-message" role="alert">{error}</div>}{message && <div className="form-message success-message" role="status">{message}</div>}<button className="button button-wide auth-submit" type="submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'signup' ? 'Create my account' : mode === 'reset' ? 'Send reset link' : mode === 'update' ? 'Update password' : 'Sign in'} {!loading && <Icon name="arrow" size={16} />}</button></form>
          <div className="auth-terms"><Icon name="lock" size={14} /> Your data stays yours. Always.</div><div className="auth-switch">{mode === 'signup' ? <>Already have an account? <button onClick={() => { setMode('signin'); setError('') }}>Sign in</button></> : mode === 'reset' || mode === 'update' ? <>Remembered your password? <button onClick={() => { setMode('signin'); setError(''); setMessage('') }}>Back to sign in</button></> : <>New to CareerX? <button onClick={() => { setMode('signup'); setError('') }}>Create an account</button></>}</div>
        </div><div className="auth-bottom">© 2026 CareerX <span>·</span> <button onClick={() => navigate('/')}>Privacy</button> <span>·</span> <button onClick={() => navigate('/')}>Terms</button></div></main>
    </div>
  )
}

function App() {
  const [route, setRoute] = useState(window.location.pathname)
  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  const navigate = (path) => {
    const [pathname, hash] = path.split('#')
    const nextPath = pathname || '/'
    window.history.pushState({}, '', `${nextPath}${hash ? `#${hash}` : ''}`)
    setRoute(nextPath)
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }))
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  if (route === '/auth') return <AuthPage navigate={navigate} />
  if (route === '/dashboard') return <DashboardPage navigate={navigate} />
  if (route === '/explore') return <ExplorePage navigate={navigate} />
  if (route === '/roadmap') return <RoadmapBuilderPage navigate={navigate} />
  return <LandingPage navigate={navigate} />
}

export default App
