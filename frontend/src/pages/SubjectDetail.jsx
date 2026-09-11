import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, MessageSquare, FileText } from 'lucide-react'
import { useApp } from '../context/AppContext'
import DocumentCard from '../components/DocumentCard'
import './SubjectDetail.css'

export default function SubjectDetail() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { subjects, documents, loadingDocs } = useApp()

  const subject = subjects.find(s => s.id === subjectId)
  const subjectDocs = documents.filter(d => d.subject_id === subjectId)

  if (!subject) {
    return (
      <div className="page-container fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Subject not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/subjects')}>
            Back to Subjects
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container fade-in">
      {/* Back */}
      <button className="btn btn-ghost back-btn" onClick={() => navigate('/subjects')}>
        <ArrowLeft size={16} /> Subjects
      </button>

      {/* Header */}
      <div className="subject-detail-header">
        <div className="subject-detail-icon" style={{ background: subject.color + '18' }}>
          <span>{subject.icon}</span>
        </div>
        <div className="subject-detail-info">
          <span className="subject-detail-code">{subject.code}</span>
          <h1>{subject.name}</h1>
          {subject.description && <p>{subject.description}</p>}
        </div>
        <div className="subject-detail-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/ask?subject=${subjectId}`)}
          >
            <MessageSquare size={15} /> Ask AI
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/upload?subject=${subjectId}`)}
          >
            <Upload size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="subject-stats-bar card">
        <div className="subject-stat">
          <span className="subject-stat-value">{subjectDocs.length}</span>
          <span className="subject-stat-label">Documents</span>
        </div>
        <div className="subject-stat-divider" />
        <div className="subject-stat">
          <span className="subject-stat-value">
            {subjectDocs.reduce((a, d) => a + (d.chunk_count || 0), 0)}
          </span>
          <span className="subject-stat-label">Total Chunks</span>
        </div>
        <div className="subject-stat-divider" />
        <div className="subject-stat">
          <span className="subject-stat-value">
            {subjectDocs.filter(d => d.status === 'ready').length}
          </span>
          <span className="subject-stat-label">Ready for Q&A</span>
        </div>
      </div>

      {/* Documents */}
      <div className="section-header" style={{ marginTop: 36 }}>
        <h2>Documents</h2>
        <span className="badge badge-gray">{subjectDocs.length}</span>
      </div>

      {loadingDocs ? (
        <div style={{ display:'flex',gap:10,alignItems:'center',padding:'40px 0',color:'var(--text-tertiary)' }}>
          <div className="spinner" /> Loading documents…
        </div>
      ) : subjectDocs.length === 0 ? (
        <div className="empty-state card" style={{ padding: '60px 40px' }}>
          <div className="empty-state-icon"><FileText size={36} strokeWidth={1} /></div>
          <h3>No documents yet</h3>
          <p>Upload study materials for {subject.name} to enable Q&A.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/upload?subject=${subjectId}`)}>
            <Upload size={15} /> Upload Material
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {subjectDocs.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
        </div>
      )}
    </div>
  )
}
