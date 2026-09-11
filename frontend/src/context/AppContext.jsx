import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const AppContext = createContext(null)

// Fallback Mock Data
const MOCK_SUBJECTS = [
  { id: '1', name: 'Machine Learning', code: 'CS-401', icon: '🤖', color: '#6366f1', document_count: 3 },
  { id: '2', name: 'Data Structures', code: 'CS-201', icon: '🌳', color: '#10b981', document_count: 5 },
]

const MOCK_DOCUMENTS = [
  { id: '101', title: 'Neural Networks Overview.pdf', file_type: 'pdf', subject_id: '1', size: 1024500, uploaded_at: new Date().toISOString() },
]

export function AppProvider({ children }) {
  const [subjects, setSubjects] = useState([])
  const [documents, setDocuments] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [toast, setToast] = useState(null)
  
  // Auth State
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null)
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)

  // Toast Handler
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Auth Functions
const login = async (email, password) => {
    console.log(email);

    const { data } = await api.post('/users/login', {
        email,
        password
    });
    
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setToken(data.access_token);
    setUser(data.user);
}


  const register = async (userData) => {
    const { data } = await api.post('/users/register', userData)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    setToken(data.access_token)
    setUser(data.user)
  }
  const checkEmail = async (email) => {
  const { data } = await api.post('/checkEmail/check-email', { email })
  return data.exists // returns true or false
}

// Add checkEmail to your AppContext.Provider value object
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  // API Callbacks
  const fetchSubjects = useCallback(async () => {
    setLoadingSubjects(true)
    try {
      const { data } = await api.get('/subjects/')
      setSubjects(data.subjects || [])
    } catch {
      setSubjects(MOCK_SUBJECTS)
    } finally {
      setLoadingSubjects(false)
    }
  }, [])

  const fetchDocuments = useCallback(async (subjectId = null) => {
    setLoadingDocs(true)
    try {
      const params = subjectId ? { subject_id: subjectId } : {}
      const { data } = await api.get('/documents/', { params })
      setDocuments(data.documents || [])
    } catch {
      setDocuments(MOCK_DOCUMENTS)
    } finally {
      setLoadingDocs(false)
    }
  }, [])

  const deleteDocument = useCallback(async (docId) => {
    try {
      await api.delete(`/documents/${docId}`)
      setDocuments(prev => prev.filter(d => d.id !== docId))
      showToast('Document deleted', 'success')
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to delete document', 'error')
    }
  }, [showToast])

  const addSubject = useCallback(async (payload) => {
    try {
      const { data } = await api.post('/subjects/', payload)
      setSubjects(prev => [...prev, data])
      showToast(`"${data.name}" created`, 'success')
      return data
    } catch {
      const mock = { ...payload, id: Date.now().toString(), document_count: 0 }
      setSubjects(prev => [...prev, mock])
      showToast(`"${mock.name}" created`, 'success')
      return mock
    }
  }, [showToast])

  // Removed deleteSubject API call to comply with rules (Subjects are not deletable)
  const deleteSubject = useCallback(() => {
    showToast('Subjects cannot be deleted', 'error')
  }, [showToast])

  useEffect(() => {
    if (token) {
      fetchSubjects()
      fetchDocuments()
    }
  }, [token, fetchSubjects, fetchDocuments])

  return (
    <AppContext.Provider value={{
      user,
      token,
      login,
      register,
      checkEmail,
      logout,
      subjects, 
      documents,
      loadingSubjects, 
      loadingDocs,
      fetchSubjects, 
      fetchDocuments,
      deleteDocument, 
      addSubject, 
      deleteSubject,
      showToast, 
      toast,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)