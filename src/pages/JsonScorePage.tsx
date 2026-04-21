import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

const DEFAULT_RESUME_JSON = `{
  "name": "Ariana Patel",
  "email": "ariana.patel@example.com",
  "phone": "(650) 555-0182",
  "skills": [
    "Instructional Design",
    "technical training",
    "short-form training videos",
    "digital learning content",
    "video editing software",
    "learning management systems (LMS)",
    "digital content authoring tools"
  ],
  "experience": [
    {
      "title": "Training Coordinator",
      "company": "Bayview Health Systems",
      "years": 2,
      "description": "Built short-form training videos and digital learning content for health and safety teams."
    },
    {
      "title": "Instructional Design Specialist",
      "company": "Westbridge Learning Lab",
      "years": 2,
      "description": "Created eLearning modules, simulations, and technical training programs."
    }
  ],
  "education": [
    {
      "degree": "Bachelor Of Arts",
      "degree_type": "bachelors",
      "field": "Communication and Instructional Technology",
      "institution": "San Jose State University",
      "year": 2020
    }
  ],
  "certifications": [],
  "summary": "Training coordinator and instructional design specialist with 4 years of experience creating digital learning content and technical training."
}`

const DEFAULT_JOB_JSON = `{
  "title": "Training Coordinator",
  "company": "Stanford University",
  "required_skills": [
    "Best Practices",
    "Instructional Design",
    "technical training",
    "short-form training videos",
    "digital learning content",
    "video editing software",
    "learning management systems (LMS)",
    "digital content authoring tools"
  ],
  "preferred_skills": [
    "health",
    "safety",
    "facilities",
    "security",
    "technical training environments",
    "microlearning principles",
    "accessibility standards for digital content"
  ],
  "experience_years_required": 3,
  "education_required": "bachelors",
  "keywords": [
    "Instructional Design",
    "technical training",
    "short-form training videos",
    "digital learning content",
    "video editing software",
    "LMS",
    "microlearning principles"
  ],
  "description": "Need a training coordinator who can produce short-form training videos, interactive eLearning, and technical training modules."
}`

type AtsResponse = {
  result?: {
    final_score?: number
    grade?: string
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const API_URL = `${API_BASE_URL}/api/v1/ats/score`

export function JsonScorePage() {
  const [resumeJson, setResumeJson] = useState(DEFAULT_RESUME_JSON)
  const [jobJson, setJobJson] = useState(DEFAULT_JOB_JSON)
  const [score, setScore] = useState<number | null>(null)
  const [grade, setGrade] = useState('Waiting for score')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const scoreFill = useMemo(() => {
    const safeScore = Math.max(0, Math.min(100, score ?? 0))
    return `${safeScore}%`
  }, [score])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const resume = JSON.parse(resumeJson)
      const job = JSON.parse(jobJson)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume,
          job,
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = (await response.json()) as AtsResponse
      const finalScore = data.result?.final_score
      const finalGrade = data.result?.grade

      if (typeof finalScore !== 'number' || typeof finalGrade !== 'string') {
        throw new Error('Unexpected API response shape')
      }

      setScore(finalScore)
      setGrade(finalGrade)
    } catch (submitError) {
      let message = 'Unable to compute ATS score'

      if (submitError instanceof Error) {
        message =
          submitError.message === 'Failed to fetch'
            ? `API is not reachable on ${API_BASE_URL}`
            : submitError.message
      }

      setError(message)
      setScore(null)
      setGrade('No result')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <nav className="navbar">
        <div>
          <p className="brand">HireMail ATS</p>
          <h1>Resume vs Job Match</h1>
        </div>
        <div className="nav-actions">
          <p className="nav-copy">Paste resume JSON and job JSON to calculate the ATS match score.</p>
          <Link className="ghost-link" to="/">
            Resume Match
          </Link>
        </div>
      </nav>

      <main className="content">
        <form className="workspace" onSubmit={handleSubmit}>
          <section className="panel input-panel">
            <div className="panel-header">
              <h2>Resume JSON</h2>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setResumeJson(DEFAULT_RESUME_JSON)}
              >
                Reset
              </button>
            </div>
            <textarea
              className="json-box"
              value={resumeJson}
              onChange={(event) => setResumeJson(event.target.value)}
              spellCheck={false}
            />
          </section>

          <section className="panel input-panel">
            <div className="panel-header">
              <h2>Job JSON</h2>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setJobJson(DEFAULT_JOB_JSON)}
              >
                Reset
              </button>
            </div>
            <textarea
              className="json-box"
              value={jobJson}
              onChange={(event) => setJobJson(event.target.value)}
              spellCheck={false}
            />
          </section>

          <aside className="panel score-panel">
            <div
              className="score-ring"
              style={{
                background: `conic-gradient(#ee9a50 ${scoreFill}, rgba(238, 154, 80, 0.16) 0)`,
              }}
            >
              <div className="score-core">
                <span className="score-label">ATS Score</span>
                <strong>{score !== null ? `${score.toFixed(2)}%` : '--'}</strong>
              </div>
            </div>

            <div className="score-meta">
              <p className="grade-label">Remark</p>
              <h3>{grade}</h3>
            </div>

            <button className="submit-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Calculating...' : 'Get ATS Score'}
            </button>

            {error ? <p className="error-text">{error}</p> : null}
          </aside>
        </form>
      </main>
    </div>
  )
}
