import { Trash2, FileText, Clock, Layers } from 'lucide-react'
import { formatDate, fileTypeColor, fileTypeIcon, statusColor } from '../utils/helpers'
import { useApp } from '../context/AppContext'
import './DocumentCard.css'

export default function DocumentCard({ doc, showSubject = false }) {
  const { deleteDocument, user } = useApp()
  const isOwner = user?.name === doc.uploaded_by
  const { subjects } = useApp()
  const subject = subjects.find(s => s.id === doc.subject_id)

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${doc.title}"?`)) deleteDocument(doc.id)
  }

  return (
    <div className="doc-card card fade-in">
      <div className="doc-card-header">
        <div
          className="doc-type-badge"
          style={{ color: fileTypeColor(doc.file_type), background: fileTypeColor(doc.file_type) + '18' }}
        >
          <span>{fileTypeIcon(doc.file_type)}</span>
          <span className="doc-type-label">{doc.file_type?.toUpperCase()}</span>
        </div>
        <span className={`badge badge-${statusColor(doc.status)}`}>
          {doc.status === 'ready' ? 'Ready' : doc.status === 'processing' ? 'Processing…' : doc.status}
        </span>
      </div>

      <div className="doc-card-body">
        <h3 className="doc-title">{doc.title}</h3>

        {showSubject && subject && (
          <div className="doc-subject-row">
            <span className="doc-subject-dot" style={{ background: subject.color }} />
            <span className="doc-subject-name">{subject.name}</span>
          </div>
        )}

        <div className="doc-meta">
          <span><Layers size={13} /> {doc.chunk_count ?? '—'} chunks</span>
          <span><Clock size={13} /> {formatDate(doc.uploaded_at)}</span>
        </div>

        {doc.tags?.length > 0 && (
          <div className="doc-tags">
            {doc.tags.slice(0, 3).map(t => (
              <span key={t} className="doc-tag">{t}</span>
            ))}
          </div>
        )}
      </div>

      <div className="doc-card-footer">
        <span className="doc-uploader">by {doc.uploaded_by || 'User'}</span>
        {isOwner && (
          <button className="btn btn-ghost doc-delete" onClick={handleDelete} title="Delete">
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
