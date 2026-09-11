import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ArrowRight, ArrowLeft, Shield } from 'lucide-react'

export default function AuthPage() {
  const { checkEmail, login, register, showToast } = useApp()

  // Steps: 1 = Enter Email, 2 = Enter Password (Existing User), 3 = Register (New User)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Student',
    institution: '',
    department: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Step 1: Verify Email First
  const handleEmailNext = async (e) => {
    e.preventDefault()
    if (!formData.email) return

    setLoading(true)
    try {
      const exists = await checkEmail(formData.email)
      if (exists) {
        setStep(2) // User exists -> Prompt for password
      } else {
        setStep(3) // User missing -> Direct to streamlined registration
        showToast('No account found. Create one below.', 'info')
      }
    } catch {
      showToast('Error checking email. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(formData.email, formData.password)
      showToast('Welcome back', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Incorrect password', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(formData)
      showToast('Account created', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        padding: '40px 32px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)',
        border: '1px solid rgba(230, 230, 230, 0.7)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Apple Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#000',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            ⌘
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', letterSpacing: '-0.02em', color: '#111', margin: 0 }}>
            {step === 1 && 'Sign in to StudyHive'}
            {step === 2 && 'Welcome Back'}
            {step === 3 && 'Create Account'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#86868b', marginTop: '6px' }}>
            {step === 1 && 'Enter your email to continue.'}
            {step === 2 && `Enter password for ${formData.email}`}
            {step === 3 && 'Set up your academic profile'}
          </p>
        </div>

        {/* STEP 1: Email Verification */}
        {step === 1 && (
          <form onSubmit={handleEmailNext} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              style={appleInputStyle}
            />
            <button type="submit" disabled={loading} style={appleButtonStyle}>
              {loading ? 'Checking...' : <>Continue <ArrowRight size={16} /></>}
            </button>
          </form>
        )}

        {/* STEP 2: Password Prompt for Existing User */}
        {step === 2 && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              autoFocus
              style={appleInputStyle}
            />
            <button type="submit" disabled={loading} style={appleButtonStyle}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={appleBackButtonStyle}
            >
              <ArrowLeft size={14} /> Use different email
            </button>
          </form>
        )}

        {/* STEP 3: Registration for New User */}
        {step === 3 && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              style={appleInputStyle}
            />
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={appleInputStyle}
            >
              <option value="Student">Student</option>
              <option value="Educator">Educator</option>
              <option value="Researcher">Researcher</option>
            </select>
            <input
              type="text"
              name="institution"
              placeholder="University / Institution"
              value={formData.institution}
              onChange={handleChange}
              required
              style={appleInputStyle}
            />
            <input
              type="password"
              name="password"
              placeholder="Create Password"
              value={formData.password}
              onChange={handleChange}
              required
              style={appleInputStyle}
            />
            <button type="submit" disabled={loading} style={{ ...appleButtonStyle, marginTop: '8px' }}>
              {loading ? 'Creating...' : 'Complete Setup'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={appleBackButtonStyle}
            >
              <ArrowLeft size={14} /> Back
            </button>
          </form>
        )}

        {/* Footer */}
        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.75rem', color: '#a1a1a6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Shield size={12} /> Privacy & Academic Data Protection
        </div>

      </div>
    </div>
  )
}

// Inline Apple Aesthetic Styles
const appleInputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid #d2d2d7',
  backgroundColor: '#f5f5f7',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'all 0.2s ease',
}

const appleButtonStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: '#0071e3', // Apple Accent Blue
  color: '#ffffff',
  fontSize: '0.95rem',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'background-color 0.2s ease',
}

const appleBackButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#86868b',
  fontSize: '0.85rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  marginTop: '4px',
}