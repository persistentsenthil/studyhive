import { CheckCircle, AlertCircle, Info } from 'lucide-react'
import './Toast.css'

const icons = {
  success: <CheckCircle size={16} />,
  error: <AlertCircle size={16} />,
  info: <Info size={16} />,
}

export default function Toast({ toast }) {
  return (
    <div className={`toast toast-${toast.type}`} key={toast.id}>
      <span className="toast-icon">{icons[toast.type] || icons.info}</span>
      <span className="toast-msg">{toast.message}</span>
    </div>
  )
}
