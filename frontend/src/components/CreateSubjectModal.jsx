import { useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { subjectColors } from '../utils/helpers'
import './Modal.css'

const ICONS = ['📚','🤖','🧮','💻','🌲','📐','🔬','🧪','🌍','⚡','🎯','📊']

export default function CreateSubjectModal({ onClose }) {
  const { addSubject } = useApp()
  const [form, setForm] = useState({
    name: '', code: '', description: '',
    color: subjectColors[0], icon: '📚',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) return
    setSaving(true)
    await addSubject({ ...form, code: form.code.toUpperCase() })
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Subject</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="label">Subject Name *</label>
              <input
                className="input-field"
                placeholder="e.g. Machine Learning"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
              />
            </div>
            <div className="form-group form-group-sm">
              <label className="label">Code *</label>
              <input
                className="input-field"
                placeholder="ML401"
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                maxLength={8}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              className="input-field"
              placeholder="Brief description…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="label">Icon</label>
            <div className="icon-grid">
              {ICONS.map(ic => (
                <button
                  key={ic} type="button"
                  className={`icon-btn ${form.icon === ic ? 'active' : ''}`}
                  onClick={() => set('icon', ic)}
                >{ic}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="label">Color</label>
            <div className="color-swatches">
              {subjectColors.map(c => (
                <button
                  key={c} type="button"
                  className={`color-swatch ${form.color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => set('color', c)}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
