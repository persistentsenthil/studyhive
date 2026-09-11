export const formatBytes = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const fileTypeColor = (type) => {
  const map = { pdf: '#ff3b30', docx: '#0071e3', doc: '#0071e3', txt: '#34c759' }
  return map[type?.toLowerCase()] || '#6e6e73'
}

export const fileTypeIcon = (type) => {
  const map = { pdf: '📄', docx: '📝', doc: '📝', txt: '📃' }
  return map[type?.toLowerCase()] || '📎'
}

export const statusColor = (status) => {
  const map = { ready: 'green', processing: 'orange', error: 'red', uploading: 'blue' }
  return map[status] || 'gray'
}

export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

export const subjectColors = [
  '#0071e3','#34c759','#ff9f0a','#ff3b30',
  '#af52de','#32ade6','#ff6b35','#30b0c7',
]
