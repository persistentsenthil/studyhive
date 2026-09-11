import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Upload } from 'lucide-react'
import { useApp } from '../context/AppContext'
import DocumentCard from '../components/DocumentCard'
import './DocumentsPage.css'

export default function DocumentsPage() {
  const navigate = useNavigate()
  const { documents, subjects, loadingDocs } = useApp()
  const [query, setQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = useMemo(() => {
    return documents.filter(d => {
      const matchQ = !query || d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
      const matchS = subjectFilter === 'all' || d.subject_id === subjectFilter
      const matchT = typeFilter === 'all' || d.file_type === typeFilter
      return matchQ && matchS && matchT
    })
  }, [documents, query, subjectFilter, typeFilter])

  const types = [...new Set(documents.map(d => d.file_type).filter(Boolean))]

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p>All study materials uploaded by you and your peers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/upload')}>
          <Upload size={16} /> Upload
        </button>
      </div>

      {/* Filters */}
      <div className="docs-filters">
        <div className="docs-search-wrap">
          <Search size={15} className="docs-search-icon" />
          <input
            className="docs-search"
            placeholder="Search documents or tags…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          <Filter size={14} style={{ color:'var(--text-tertiary)', flexShrink:0 }} />

          <select
            className="filter-select"
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="docs-count">
        <span>{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
        {(query || subjectFilter !== 'all' || typeFilter !== 'all') && (
          <button
            className="btn btn-ghost"
            style={{ fontSize:'0.8rem', padding:'4px 10px' }}
            onClick={() => { setQuery(''); setSubjectFilter('all'); setTypeFilter('all') }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {loadingDocs ? (
        <div className="loading-state">
          <div className="spinner" /> Loading documents…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3>{query ? 'No matches found' : 'No documents yet'}</h3>
          <p>{query ? 'Try different search terms.' : 'Be the first to upload a study material!'}</p>
          {!query && (
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>
              <Upload size={15} /> Upload Material
            </button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(doc => (
            <DocumentCard key={doc.id} doc={doc} showSubject />
          ))}
        </div>
      )}
    </div>
  )
}
