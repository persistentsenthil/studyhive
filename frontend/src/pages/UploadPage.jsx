import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, FileText, ArrowLeft } from 'lucide-react'
import api from '../utils/api'
import { useApp } from '../context/AppContext'
import { formatBytes, fileTypeIcon } from '../utils/helpers'
import './UploadPage.css'

const ACCEPTED = { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }

export default function UploadPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultSubject = searchParams.get('subject') || ''
  const { subjects, fetchDocuments, showToast,user } = useApp()

  const [file, setFile] = useState(null)
  const [form, setForm] = useState({ title: '', subject_id: defaultSubject, description: '', tags: '' })
  const [status, setStatus] = useState('idle') // idle | uploading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [progress, setProgress] = useState(0)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) {
      setFile(accepted[0])
      if (!form.title) set('title', accepted[0].name.replace(/\.[^.]+$/, ''))
      setStatus('idle')
    }
  }, [form.title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED, maxFiles: 1, maxSize: 20 * 1024 * 1024,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !form.title) return
    setStatus('uploading'); setProgress(0); setErrorMsg('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', form.title)
    fd.append('subject_id', form.subject_id)
    fd.append('description', form.description)
    fd.append('tags', form.tags)
    fd.append('uploaded_by', user.name)

    // Simulate progress
    const tick = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 300)

    try {
      await api.post('/documents/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      clearInterval(tick); setProgress(100); setStatus('success')
      await fetchDocuments()
      showToast(`"${form.title}" uploaded successfully!`)
      setTimeout(() => navigate('/documents'), 1400)
    } catch (err) {
    clearInterval(tick)
    console.error("Upload failed with error:", err)
    
    // Extract string safely from FastAPI detail array if it exists
    const detail = err.response?.data?.detail;
    const errorString = typeof detail === 'string' 
      ? detail 
      : JSON.stringify(detail) || "Upload failed. Check backend logs.";
      
    setErrorMsg(errorString)
    setStatus('error')
  }
  }

  const reset = () => { setFile(null); setStatus('idle'); setProgress(0); setForm(f => ({ ...f, title: '' })) }

  const canSubmit = file && form.title && status !== 'uploading'

  return (
    <div className="page-container fade-in">
      <button className="btn btn-ghost back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="page-header">
        <div>
          <h1>Upload Material</h1>
          <p>Share notes, slides, or textbook excerpts with your study group.</p>
        </div>
      </div>

      <div className="upload-layout">
        {/* Left: Drop zone */}
        <div className="upload-left">
          {!file ? (
            <div
              {...getRootProps()}
              className={`dropzone card ${isDragActive ? 'drag-active' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="dropzone-content">
                <div className="dropzone-icon">
                  <Upload size={28} strokeWidth={1.5} />
                </div>
                <h3>Drop your file here</h3>
                <p>or click to browse</p>
                <div className="dropzone-formats">
                  <span className="badge badge-gray">PDF</span>
                  <span className="badge badge-gray">DOCX</span>
                  <span className="badge badge-gray">TXT</span>
                  <span style={{fontSize:'0.75rem',color:'var(--text-tertiary)'}}>· max 20 MB</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="file-preview card">
              {status === 'success' ? (
                <div className="upload-success">
                  <CheckCircle size={40} strokeWidth={1.5} style={{ color: 'var(--success)' }} />
                  <h3>Uploaded!</h3>
                  <p>Your document is being indexed for Q&A.</p>
                </div>
              ) : (
                <>
                  <div className="file-info">
                    <span className="file-icon">{fileTypeIcon(file.name.split('.').pop())}</span>
                    <div>
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{formatBytes(file.size)}</div>
                    </div>
                    {status !== 'uploading' && (
                      <button className="btn btn-ghost remove-file" onClick={reset}>
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {status === 'uploading' && (
                    <div className="upload-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="progress-label">Processing… {progress}%</span>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="upload-error">
                      <AlertCircle size={16} /> {errorMsg}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tips */}
          <div className="upload-tips card">
            <h3>📌 Tips for best results</h3>
            <ul>
              <li>Use descriptive titles so others can find your material easily.</li>
              <li>Add relevant tags to improve search and filtering.</li>
              <li>PDF files with selectable text work best for Q&A.</li>
              <li>Smaller, focused documents produce more accurate AI answers.</li>
            </ul>
          </div>
        </div>

        {/* Right: Form */}
        <form className="upload-form card" onSubmit={handleSubmit}>
          <h2 className="upload-form-title">Document Details</h2>

          <div className="form-group">
            <label className="label">Title *</label>
            <input
              className="input-field"
              placeholder="e.g. Introduction to Neural Networks"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
  <label className="label">Subject *</label>
  <select
    className="input-field"
    value={form.subject_id}
    onChange={e => set('subject_id', e.target.value)}
    required
  >
    <option value="">Select a subject…</option>
    {subjects.map(s => (
      <option key={s.id} value={s.id}>{s.icon} {s.name} ({s.code})</option>
    ))}
    <option value="OTHER">+ Other (Create New Subject)</option>
  </select>
</div>

{form.subject_id === 'OTHER' && (
  <div className="form-group">
    <label className="label">New Subject Name *</label>
    <input
      className="input-field"
      placeholder="e.g. Quantum Computing"
      value={form.newSubjectName}
      onChange={e => set('newSubjectName', e.target.value)}
      required
    />
  </div>
)}

          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              className="input-field"
              placeholder="What's in this document? (optional)"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="label">Tags</label>
            <input
              className="input-field"
              placeholder="neural networks, backprop, deep learning"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
            />
            <span style={{ fontSize:'0.75rem', color:'var(--text-tertiary)', marginTop:4 }}>
              Comma-separated
            </span>
          </div>

          <button
            type="submit"
            className={`btn btn-primary upload-submit ${!canSubmit ? '' : ''}`}
            disabled={!canSubmit}
          >
            {status === 'uploading' ? (
              <><div className="spinner" style={{ width:16,height:16,borderTopColor:'white' }} /> Processing…</>
            ) : (
              <><Upload size={16} /> Upload & Process</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
