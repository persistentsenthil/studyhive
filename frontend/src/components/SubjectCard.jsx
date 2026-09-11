import { useNavigate } from 'react-router-dom'
import { Trash2, FileText, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './SubjectCard.css'

export default function SubjectCard({ subject }) {
  const navigate = useNavigate()
  const { deleteSubject } = useApp()

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${subject.name}"?`)) deleteSubject(subject.id)
  }

  return (
    <div
      className="subject-card card fade-in"
      onClick={() => navigate(`/subjects/${subject.id}`)}
    >
      // Removed Trash2 imports and delete button from SubjectCard top container
<div className="subject-card-top">
  <div className="subject-icon-wrap" style={{ background: subject.color + '18' }}>
    <span className="subject-icon">{subject.icon || '📚'}</span>
  </div>
</div>

      <div className="subject-card-body">
        <div className="subject-code">{subject.code}</div>
        <h3 className="subject-name">{subject.name}</h3>
        {subject.description && (
          <p className="subject-desc">{subject.description}</p>
        )}
      </div>

      <div className="subject-card-footer">
        <span className="subject-doc-count">
          <FileText size={13} />
          {subject.document_count ?? 0} documents
        </span>
        <div className="subject-arrow" style={{ color: subject.color }}>
          <ChevronRight size={16} />
        </div>
      </div>

      <div className="subject-card-accent" style={{ background: subject.color }} />
    </div>
  )
}
