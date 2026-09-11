import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Toast from './Toast'
import {
  LayoutDashboard, BookOpen, FileText,
  MessageSquare, Upload, Layers
} from 'lucide-react'
import './Layout.css'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subjects', icon: Layers, label: 'Subjects' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/ask', icon: MessageSquare, label: 'Ask AI' },
  { to: '/upload', icon: Upload, label: 'Upload' },
]

export default function Layout({ children }) {
  const { toast,user } = useApp()

  return (
    <div>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">
            <BookOpen size={18} strokeWidth={2.5} />
          </div>
          <span className="logo-text">StudyHive</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">Student</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      {toast && <Toast toast={toast} />}
    </div>
  )
}
