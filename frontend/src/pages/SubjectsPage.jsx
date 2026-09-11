import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SubjectCard from '../components/SubjectCard'
import CreateSubjectModal from '../components/CreateSubjectModal'
import './SubjectsPage.css'

export default function SubjectsPage() {
  const { subjects, loadingSubjects } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.code.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1>Subjects</h1>
          <p>Organize your study materials by subject or course.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Subject
        </button>
      </div>

      {/* Search */}
      <div className="subjects-search-wrap">
        <Search size={16} className="subjects-search-icon" />
        <input
          className="subjects-search"
          placeholder="Search subjects…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loadingSubjects ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading subjects…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>{query ? 'No matches' : 'No subjects yet'}</h3>
          <p>{query ? 'Try a different search.' : 'Create a subject to start organizing your materials.'}</p>
          {!query && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Create Subject
            </button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(s => <SubjectCard key={s.id} subject={s} />)}
        </div>
      )}

      {showModal && <CreateSubjectModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
