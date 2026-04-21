import { useState } from 'react'
import { Link } from 'react-router-dom'

import { API_BASE_URL } from '../config'

type JDKeywordResponse = {
  keywords: string[]
  required_keywords: string[]
  preferred_keywords: string[]
  boolean_query: string
}

const VERSION_LABELS = {
  v1: 'V1 Pattern',
  v2: 'V2 Stop-word',
  v3: 'V3 spaCy',
} as const

export function JdKeywordsPage() {
  const [rawText, setRawText] = useState('')
  const [showConvertedString, setShowConvertedString] = useState(false)
  const [result, setResult] = useState<JDKeywordResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState<'v1' | 'v2' | 'v3'>('v3')

  const trimmedRawText = rawText.trim()
  const convertedString = trimmedRawText ? JSON.stringify(trimmedRawText) : ''

  function handleRawChange(value: string) {
    setRawText(value)
    setError('')
    if (result) {
      setResult(null)
    }
  }

  async function handleGetKeywords() {
    if (!trimmedRawText) return

    setError('')
    setResult(null)
    setIsLoading(true)

    try {
      const url = `${API_BASE_URL}/api/v1/ats/jd-keywords${version === 'v2' ? '-v2' : version === 'v3' ? '-v3' : ''}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: trimmedRawText }),
      })

      if (!response.ok) throw new Error(`Request failed with status ${response.status}`)

      const data = (await response.json()) as JDKeywordResponse
      setResult(data)
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'Failed to fetch'
          ? `API is not reachable on ${API_BASE_URL}`
          : err instanceof Error
            ? err.message
            : 'Failed to extract keywords',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <nav className="navbar">
        <div>
          <p className="brand">HireMail ATS</p>
          <h1>JD Keyword Extractor</h1>
        </div>
        <div className="nav-actions">
          <p className="nav-copy">Paste a job description and extract keywords.</p>
          <label className="version-select-wrap">
            <span className="summary-label">Version</span>
            <select
              className="version-select"
              value={version}
              onChange={(event) => {
                setVersion(event.target.value as 'v1' | 'v2' | 'v3')
                setResult(null)
              }}
            >
              <option value="v3">{VERSION_LABELS.v3}</option>
              <option value="v2">{VERSION_LABELS.v2}</option>
              <option value="v1">{VERSION_LABELS.v1}</option>
            </select>
          </label>
          <Link className="ghost-link" to="/">
            Resume Scorer
          </Link>
          <Link className="ghost-link" to="/json-score">
            JSON Scorer
          </Link>
        </div>
      </nav>

      <main className="content">
        <div className="jd-keywords-grid">
          <div className="jd-left-col">
            <article className="panel input-panel jd-box">
              <div className="panel-header">
                <div>
                  <h2>Paste Job Description</h2>
                </div>
                <label className="toggle-control">
                  <input
                    type="checkbox"
                    checked={showConvertedString}
                    onChange={(event) => setShowConvertedString(event.target.checked)}
                  />
                  <span>Show JD String Preview</span>
                </label>
              </div>

              <textarea
                className="json-box jd-textarea"
                placeholder="Paste the full raw job description text here..."
                value={rawText}
                onChange={(event) => handleRawChange(event.target.value)}
              />

              <div className="jd-actions-row">
                <button
                  type="button"
                  className="submit-button jd-submit-button"
                  disabled={!trimmedRawText || isLoading}
                  onClick={handleGetKeywords}
                >
                  {isLoading ? 'Extracting...' : 'Get Keywords'}
                </button>
              </div>

              {error ? <p className="error-text" style={{ marginTop: 12 }}>{error}</p> : null}

              {showConvertedString ? (
                <div className="jd-preview-block">
                  <div className="panel-header">
                    <div>
                      <h2>JD as String</h2>
                    </div>
                  </div>

                  {convertedString ? (
                    <pre className="json-log jd-string-preview">{convertedString}</pre>
                  ) : (
                    <div className="jd-empty-state">
                      <p>String preview will appear here after you paste the job description.</p>
                    </div>
                  )}
                </div>
              ) : null}
            </article>
          </div>

          <article className="panel jd-results-panel">
            <div className="panel-header">
              <div>
                <h2>Extracted Keywords</h2>
              </div>
              {result ? (
                <span className="job-badge">{result.keywords.length} keywords</span>
              ) : null}
            </div>

            {!result ? (
              <div className="jd-empty-state">
                <p>Keyword results will appear here after extraction.</p>
              </div>
            ) : (
              <div className="jd-results">
                {result.required_keywords.length > 0 && (
                  <div className="jd-keyword-section">
                    <p className="summary-label">Required Keywords ({result.required_keywords.length})</p>
                    <div className="chip-list" style={{ marginTop: 10 }}>
                      {result.required_keywords.map((kw) => (
                        <span key={kw} className="skill-chip">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.preferred_keywords.length > 0 && (
                  <div className="jd-keyword-section">
                    <p className="summary-label">Preferred Keywords ({result.preferred_keywords.length})</p>
                    <div className="chip-list" style={{ marginTop: 10 }}>
                      {result.preferred_keywords.map((kw) => (
                        <span key={kw} className="skill-chip skill-chip-muted">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.boolean_query && (
                  <div className="jd-keyword-section">
                    <p className="summary-label">Boolean Query</p>
                    <pre className="json-log" style={{ marginTop: 10, borderRadius: 14 }}>
                      {result.boolean_query}
                    </pre>
                  </div>
                )}

                {result.keywords.length === 0 && (
                  <p className="generated-job-meta">
                    No keywords extracted. Try a JD with clearer skill requirements like "experience with React" or "proficient in Python".
                  </p>
                )}
              </div>
            )}
          </article>
        </div>
      </main>
    </div>
  )
}
