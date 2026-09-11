import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SubjectsPage from './pages/SubjectsPage'
import SubjectDetail from './pages/SubjectDetail'
import DocumentsPage from './pages/DocumentsPage'
import QAPage from './pages/QAPage'
import UploadPage from './pages/UploadPage'
import AuthPage from './pages/AuthPage'

// 1. Content component that safely consumes useApp()
function AppContent() {
  const { user, token } = useApp()

  // Guard: Unauthenticated users see ONLY AuthPage
  if (!user || !token) {
    
    return (
      <div 
        className="app-layout-guest" 
        style={{ 
          minHeight: '100vh', 
          background: '#f8fafc', 
          display: 'flex', 
          alignItems: 'center', 
          justify: 'center' 
        }}
      >
        <AuthPage />
      </div>
    )
  }

  // Authenticated route views wrapped in main Layout
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/subjects/:subjectId" element={<SubjectDetail />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/ask" element={<QAPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

// 2. Root App component that provides AppProvider at the very top level
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}