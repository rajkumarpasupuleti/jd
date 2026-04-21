import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { mockJobs } from '../data/mockJobs'

type UploadScoreResponse = {
  grouped_resume: Record<string, unknown>
  raw_resume: Record<string, unknown>
  resume_quality: Record<string, unknown>
  raw_ai_job: Record<string, unknown>
  normalized_resume: {
    name: string
    skills: string[]
    experience: Array<{ years: number }>
    summary: string
  }
  normalized_job: Record<string, unknown>
  result: {
    final_score: number
    grade: string
    breakdown: {
      skills: {
        score: number
        matched_required: string[]
        missing_required: string[]
        matched_preferred: string[]
      }
      experience: {
        score: number
        candidate_years: number
        required_years: number
        note: string
      }
      education: {
        score: number
        candidate_degree: string
        required_degree: string
        note: string
      }
      keywords: {
        score: number
        tfidf_similarity: number
        matched_keywords: string[]
        missing_keywords: string[]
      }
    }
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const UPLOAD_SCORE_URL = `${API_BASE_URL}/api/v1/ats/upload-score`

function JsonLogBlock(props: {
  title: string
  subtitle: string
  payload: unknown
  defaultOpen?: boolean
}) {
  const { title, subtitle, payload, defaultOpen = false } = props

  return (
    <details className="log-block" open={defaultOpen}>
      <summary className="log-summary">
        <div>
          <p className="summary-label">{title}</p>
          <p className="log-subtitle">{subtitle}</p>
        </div>
      </summary>
      <pre className="json-log">{JSON.stringify(payload, null, 2)}</pre>
    </details>
  )
}

export function LandingPage() {
  const [selectedJobId, setSelectedJobId] = useState<string>(mockJobs[0]?.id ?? '')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadScoreResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const selectedJob = useMemo(
    () => mockJobs.find((job) => job.id === selectedJobId) ?? null,
    [selectedJobId],
  )

  async function handleContinue() {
    if (!resumeFile || !selectedJob) {
      return
    }

    setError('')
    setUploadResult(null)
    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append('resume_file', resumeFile)
      formData.append('title', selectedJob.title)
      formData.append('company', selectedJob.company)
      formData.append('location', selectedJob.location)
      formData.append('work_mode', selectedJob.workMode)
      formData.append('employment_type', selectedJob.employmentType)
      formData.append('summary', selectedJob.summary)

      const response = await fetch(UPLOAD_SCORE_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload scoring failed with status ${response.status}`)
      }

      const data = (await response.json()) as UploadScoreResponse
      setUploadResult(data)
    } catch (submitError) {
      const message =
        submitError instanceof Error && submitError.message === 'Failed to fetch'
          ? `API is not reachable on ${API_BASE_URL}`
          : submitError instanceof Error
            ? submitError.message
            : 'Unable to score uploaded resume'

      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="page-shell">
      <nav className="navbar">
        <div>
          <p className="brand">HireMail ATS</p>
          <h1>Resume Match</h1>
        </div>
        <div className="nav-actions">
          <p className="nav-copy">Upload a resume and match it against a selected job.</p>
          <Link className="ghost-link" to="/jd-keywords">
            JD Keywords
          </Link>
          <Link className="ghost-link" to="/json-score">
            JSON Scorer
          </Link>
        </div>
      </nav>

      <main className="content">
        <section className="landing-grid">
          <article className="panel upload-panel">
            <div className="section-title">
              <h2>Upload resume against a job</h2>
            </div>

            <label className="upload-dropzone" htmlFor="resume-upload">
              <input
                id="resume-upload"
                type="file"
                accept=".pdf"
                className="file-input"
                onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              />
              <span className="upload-title">Choose resume file</span>
              <span className="upload-text">
                Supported format: text-based PDF only.
              </span>
            </label>

            <div className="selection-summary">
              <div className="summary-card">
                <p className="summary-label">Selected resume</p>
                <strong>{resumeFile?.name ?? 'No file selected'}</strong>
              </div>
              <div className="summary-card">
                <p className="summary-label">Selected job</p>
                <strong>{selectedJob ? selectedJob.title : 'No job selected'}</strong>
              </div>
            </div>

            <div className="next-step-card">
              <button
                type="button"
                className="submit-button"
                disabled={!resumeFile || !selectedJob}
                onClick={handleContinue}
              >
                {isGenerating ? 'Parsing Resume And Scoring...' : 'Continue With Selected Job'}
              </button>
              {error ? <p className="error-text flow-error">{error}</p> : null}
            </div>

            {uploadResult ? (
              <>
                <div className="landing-score-card">
                  <p className="summary-label">ATS result</p>
                  <div className="landing-score-row">
                    <div className="landing-score-pill">
                      <span className="landing-score-value">
                        {uploadResult.result.final_score.toFixed(2)}%
                      </span>
                      <span className="landing-score-caption">Final score</span>
                    </div>
                    <div className="landing-score-text">
                      <p className="summary-label">Remark</p>
                      <h3>{uploadResult.result.grade}</h3>
                      <p>
                        Candidate {uploadResult.normalized_resume.name || resumeFile?.name || 'Uploaded resume'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="generated-job-card">
                  <p className="summary-label">ATS score details</p>
                  <div className="ats-detail-grid">
                    <div className="ats-detail-block">
                      <div className="ats-detail-header">
                        <h3>Skills</h3>
                        <span>{uploadResult.result.breakdown.skills.score}%</span>
                      </div>
                      <p className="generated-job-meta">
                        Matched required: {uploadResult.result.breakdown.skills.matched_required.length}
                      </p>
                      <div className="chip-list">
                        {uploadResult.result.breakdown.skills.matched_required.map((skill) => (
                          <span key={skill} className="skill-chip">
                            {skill}
                          </span>
                        ))}
                        {uploadResult.result.breakdown.skills.missing_required.map((skill) => (
                          <span key={skill} className="skill-chip skill-chip-danger">
                            Missing: {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="ats-detail-block">
                      <div className="ats-detail-header">
                        <h3>Experience</h3>
                        <span>{uploadResult.result.breakdown.experience.score}%</span>
                      </div>
                      <p className="generated-job-description">
                        {uploadResult.result.breakdown.experience.note}
                      </p>
                      <p className="generated-job-meta">
                        Candidate: {uploadResult.result.breakdown.experience.candidate_years} yrs • Required: {uploadResult.result.breakdown.experience.required_years} yrs
                      </p>
                    </div>

                    <div className="ats-detail-block">
                      <div className="ats-detail-header">
                        <h3>Education</h3>
                        <span>{uploadResult.result.breakdown.education.score}%</span>
                      </div>
                      <p className="generated-job-description">
                        {uploadResult.result.breakdown.education.note}
                      </p>
                      <p className="generated-job-meta">
                        Candidate: {uploadResult.result.breakdown.education.candidate_degree || 'Not found'} • Required: {uploadResult.result.breakdown.education.required_degree || 'Not specified'}
                      </p>
                    </div>

                    <div className="ats-detail-block">
                      <div className="ats-detail-header">
                        <h3>Keywords</h3>
                        <span>{uploadResult.result.breakdown.keywords.score}%</span>
                      </div>
                      <p className="generated-job-meta">
                        TF-IDF similarity: {uploadResult.result.breakdown.keywords.tfidf_similarity}%
                      </p>
                      <div className="chip-list">
                        {uploadResult.result.breakdown.keywords.matched_keywords.slice(0, 10).map((keyword) => (
                          <span key={keyword} className="skill-chip skill-chip-muted">
                            {keyword}
                          </span>
                        ))}
                        {uploadResult.result.breakdown.keywords.missing_keywords.slice(0, 6).map((keyword) => (
                          <span key={keyword} className="skill-chip skill-chip-danger">
                            Missing: {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="generated-job-card">
                  <p className="summary-label">Parsed resume summary</p>
                  <h3>{uploadResult.normalized_resume.name || resumeFile?.name}</h3>
                  <p className="generated-job-meta">
                    {uploadResult.normalized_resume.experience.length} experience entries •{' '}
                    {uploadResult.normalized_resume.skills.length} detected skills
                  </p>
                  <p className="generated-job-description">
                    {uploadResult.normalized_resume.summary || 'No summary extracted from resume.'}
                  </p>
                </div>

                <div className="generated-job-card">
                  <p className="summary-label">Flow debug logs</p>
                  <div className="log-grid">
                    <JsonLogBlock
                      title="Resume quality"
                      subtitle="PDF text/selectable quality check before AI formatting"
                      payload={uploadResult.resume_quality}
                      defaultOpen
                    />
                    <JsonLogBlock
                      title="Grouped resume"
                      subtitle="Raw grouped sections extracted from uploaded PDF"
                      payload={uploadResult.grouped_resume}
                    />
                    <JsonLogBlock
                      title="Raw parsed resume"
                      subtitle="Gemini-formatted resume JSON from grouped PDF data"
                      payload={uploadResult.raw_resume}
                    />
                    <JsonLogBlock
                      title="Normalized resume"
                      subtitle="Resume molded into ATS scoring schema"
                      payload={uploadResult.normalized_resume}
                    />
                    <JsonLogBlock
                      title="Raw AI job"
                      subtitle="Gemini-generated job requirement JSON"
                      payload={uploadResult.raw_ai_job}
                    />
                    <JsonLogBlock
                      title="Normalized job"
                      subtitle="Job molded into ATS scoring schema"
                      payload={uploadResult.normalized_job}
                    />
                    <JsonLogBlock
                      title="Final score result"
                      subtitle="Score payload returned by ATS engine"
                      payload={uploadResult.result}
                    />
                  </div>
                </div>
              </>
            ) : null}
          </article>

          <article className="panel jobs-panel">
            <div className="section-title">
              <h2>Select a job</h2>
            </div>

            <div className="jobs-list">
              {mockJobs.map((job) => {
                const isSelected = job.id === selectedJobId

                return (
                  <button
                    key={job.id}
                    type="button"
                    className={`job-card ${isSelected ? 'job-card-selected' : ''}`}
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <div className="job-card-top">
                      <div>
                        <h3>{job.title}</h3>
                        <p>{job.company}</p>
                      </div>
                      <span className="job-badge">{job.workMode}</span>
                    </div>
                    <p className="job-meta">
                      {job.location} • {job.employmentType}
                    </p>
                    <p className="job-summary">{job.summary}</p>
                  </button>
                )
              })}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
