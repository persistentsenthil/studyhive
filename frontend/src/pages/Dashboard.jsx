import { useNavigate } from 'react-router-dom'
import { FileText, Layers, MessageSquare, Upload, TrendingUp, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDate } from '../utils/helpers'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { subjects, documents,user } = useApp()

  const readyDocs = documents.filter(d => d.status === 'ready')
  const recentDocs = [...documents].sort(
    (a,b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
  ).slice(0, 4)

  const stats = [
    { label: 'Subjects', value: subjects.length, icon: Layers, color: '#0071e3', action: () => navigate('/subjects') },
    { label: 'Documents', value: documents.length, icon: FileText, color: '#34c759', action: () => navigate('/documents') },
    { label: 'Ready for Q&A', value: readyDocs.length, icon: MessageSquare, color: '#ff9f0a', action: () => navigate('/ask') },
  ]

  return (
    <div className="page-container fade-in">
      {/* Header */}

      <div className="dashboard-hero">
        <div>
          <p className="dashboard-greeting">Good morning 👋</p>
          <h1>{user.name}</h1>
          <p className="dashboard-sub">
            What are you studying today? Browse your study materials or ask the AI anything about your uploaded documents.
          </p>
        </div>
        <button className="btn btn-primary dashboard-cta" onClick={() => navigate('/upload')}>
          <Upload size={16} />
          Upload Material
        </button>
      </div>
      <div className="banner"></div>
      
      {/* Stats */}
      <div className="dashboard-stats">
        {stats.map(({ label, value, icon: Icon, color, action }) => (
          <button key={label} className="stat-card card" onClick={action}>
            <div className="stat-icon" style={{ background: color + '15', color }}>
              <Icon size={20} />
            </div>
            <div className="stat-body">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
            <TrendingUp size={14} className="stat-trend" />
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Documents */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Recent Documents</h2>
            <button className="btn btn-ghost" onClick={() => navigate('/documents')}>
              View all
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">📂</div>
              <h3>No documents yet</h3>
              <p>Upload your first study material to get started.</p>
              <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                <Upload size={15} /> Upload Now
              </button>
            </div>
          ) : (
            <div className="recent-docs-list">
              {recentDocs.map(doc => {
                const sub = subjects.find(s => s.id === doc.subject_id)
                return (
                  <div key={doc.id} className="recent-doc-row card">
                    <div className="recent-doc-icon" style={{ background: (sub?.color || '#6e6e73') + '18' }}>
                      <FileText size={16} style={{ color: sub?.color || '#6e6e73' }} />
                    </div>
                    <div className="recent-doc-info">
                      <span className="recent-doc-title">{doc.title}</span>
                      <span className="recent-doc-meta">
                        {sub?.name || 'Unknown'} · {doc.file_type?.toUpperCase()}
                      </span>
                    </div>
                    <span className="recent-doc-time">
                      <Clock size={12} /> {formatDate(doc.uploaded_at)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Subjects overview */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Subjects</h2>
            <button className="btn btn-ghost" onClick={() => navigate('/subjects')}>
              Manage
            </button>
          </div>

          {subjects.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">📚</div>
              <h3>No subjects yet</h3>
              <p>Create your first subject to organize materials.</p>
              <button className="btn btn-primary" onClick={() => navigate('/subjects')}>
                Create Subject
              </button>
            </div>
          ) : (
            <div className="subject-list">
              {subjects.slice(0, 5).map(sub => (
                <button
                  key={sub.id}
                  className="subject-row card"
                  onClick={() => navigate(`/subjects/${sub.id}`)}
                >
                  <div className="subject-row-icon" style={{ background: sub.color + '18' }}>
                    <span style={{ fontSize: '1rem' }}>{sub.icon}</span>
                  </div>
                  <div className="subject-row-info">
                    <span className="subject-row-name">{sub.name}</span>
                    <span className="subject-row-code">{sub.code}</span>
                  </div>
                  <span className="subject-row-count">{sub.document_count} docs</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick Ask CTA */}
      <div className="quick-ask-banner card" onClick={() => navigate('/ask')}>
        <div className="quick-ask-content">
          <div className="quick-ask-icon">✨</div>
          <div>
            <h3>Ask AI anything</h3>
            <p>Get precise answers from your study materials using RAG-powered search.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/ask')}>
          <MessageSquare size={15} /> Open Q&A
        </button>
      </div>
    </div>
  )
}
