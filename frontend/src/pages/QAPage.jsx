import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Sparkles, BookOpen, ChevronDown, X, ExternalLink, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import api from '../utils/api'
import { useApp } from '../context/AppContext'
import './QAPage.css'

const MOCK_ANSWERS = [
  // { q: /neural|network|layer/i, a: `## Neural Networks\n\nA neural network is a computational model inspired by the human brain. It consists of:\n\n- **Input layer** — receives raw data\n- **Hidden layers** — learn intermediate representations\n- **Output layer** — produces predictions\n\nEach connection has a **weight** that adjusts during training via backpropagation.\n\n> Based on *Introduction to Neural Networks*, Page 3` },
  // { q: /gradient|descent|optim/i, a: `## Gradient Descent\n\nGradient descent minimizes a loss function by iteratively updating parameters in the direction of the negative gradient:\n\n$$w = w - \\alpha \\cdot \\nabla L(w)$$\n\nWhere **α** is the learning rate. Variants include:\n- **SGD** — uses one sample per step\n- **Mini-batch** — uses small batches\n- **Adam** — adaptive learning rates\n\n> Based on *Gradient Descent Explained*, Page 7` },
  // { q: /tree|binary|bst/i, a: `## Binary Search Trees\n\nA BST is a binary tree where every node's left subtree contains values **less than** the node, and the right subtree contains values **greater than** the node.\n\n**Time Complexities:**\n| Operation | Average | Worst |\n|-----------|---------|-------|\n| Search | O(log n) | O(n) |\n| Insert | O(log n) | O(n) |\n| Delete | O(log n) | O(n) |\n\n> Based on *Binary Trees & BSTs*, Page 2` },
  // // { q: /.*/i, a: `## Answer from Study Materials\n\nBased on the documents in your library, here's what I found relevant to your question:\n\nThis topic is covered across several of your uploaded materials. The key concepts involve understanding the fundamental principles and how they apply in practical scenarios.\n\nTo get more precise answers, consider:\n1. Selecting a specific **subject** to narrow the search\n2. Uploading more focused study materials\n3. Rephrasing your question with specific terminology\n\n> Searched across all uploaded documents` },
]

// function getMockAnswer(q) {
//   const match = MOCK_ANSWERS.find(m => m.q.test(q))
//   return match ? match.a : MOCK_ANSWERS[MOCK_ANSWERS.length - 1].a
// }

export default function QAPage() {
  const [searchParams] = useSearchParams()
  const { subjects, documents } = useApp()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'all')
  const [expandedSources, setExpandedSources] = useState(null)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const subjectDocs = selectedSubject === 'all'
    ? documents
    : documents.filter(d => d.subject_id === selectedSubject)

  const sendMessage = useCallback(async (e) => {
    e?.preventDefault()
    const q = input.trim()
    if (!q || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q, id: Date.now() }])
    setLoading(true)

    try {
      const payload = {
        question: q,
        user_id: 'alex',
        session_id: sessionId,
        ...(selectedSubject !== 'all' ? { subject_id: selectedSubject } : {}),
      }
      const { data } = await api.post('/qa/ask', payload)
      setSessionId(data.session_id)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        id: Date.now() + 1,
      }])
    } catch {
      // Demo mode
      
    } finally {
      setLoading(false)
    }
  }, [input, loading, sessionId, selectedSubject, subjectDocs])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const clearChat = () => { setMessages([]); setSessionId(null) }

  const subject = subjects.find(s => s.id === selectedSubject)

  const SUGGESTED = [
    'Explain the main concepts in this subject',
    'What are the key algorithms covered?',
    'Give me a summary of the uploaded notes',
    'What are the most important formulas?',
  ]

  return (
    <div className="qa-page">
      {/* Sidebar-like header */}
      <div className="qa-header">
        <div className="qa-header-left">
          <div className="qa-title-row">
            <Sparkles size={18} style={{ color: 'var(--accent)' }} />
            <h1>Ask AI</h1>
          </div>
          <p className="qa-subtitle">
            Ask anything about your study materials. Powered by RAG.
          </p>
        </div>

        <div className="qa-controls">
          {/* Subject selector */}
          <div className="qa-subject-select-wrap">
            <BookOpen size={14} style={{ color:'var(--text-tertiary)' }} />
            <select
              className="qa-subject-select"
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
            >
              <option value="all">All Subjects ({documents.length} docs)</option>
              {subjects.map(s => {
                const count = documents.filter(d => d.subject_id === s.id).length
                return <option key={s.id} value={s.id}>{s.icon} {s.name} ({count})</option>
              })}
            </select>
            <ChevronDown size={13} style={{ color:'var(--text-tertiary)', marginLeft:-4 }} />
          </div>

          {messages.length > 0 && (
            <button className="btn btn-ghost clear-btn" onClick={clearChat}>
              <RefreshCw size={14} /> New chat
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="qa-chat-area">
        {messages.length === 0 ? (
          <div className="qa-empty">
            <div className="qa-empty-icon">✨</div>
            <h2>What would you like to know?</h2>
            <p>
              {subjectDocs.length > 0
                ? `Searching across ${subjectDocs.length} document${subjectDocs.length !== 1 ? 's' : ''}${subject ? ` in ${subject.name}` : ''}.`
                : 'Upload study materials first, then ask questions about them.'}
            </p>
            <div className="suggested-questions">
              {SUGGESTED.map(q => (
                <button
                  key={q}
                  className="suggested-q"
                  onClick={() => { setInput(q); inputRef.current?.focus() }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="qa-messages">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`qa-message ${msg.role}`}
                style={{ animationDelay: `${(i % 3) * 0.05}s` }}
              >
                {msg.role === 'assistant' && (
                  <div className="msg-avatar ai">
                    <Sparkles size={13} />
                  </div>
                )}

                <div className="msg-bubble">
                  {msg.role === 'assistant' ? (
                    <>
                      <div className="msg-content markdown-body">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {msg.sources?.length > 0 && (
                        <div className="msg-sources">
                          <button
                            className="sources-toggle"
                            onClick={() => setExpandedSources(expandedSources === msg.id ? null : msg.id)}
                          >
                            <BookOpen size={12} />
                            {msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''}
                            {msg.confidence > 0 && (
                              <span className="confidence-pill">
                                {Math.round(msg.confidence * 100)}% match
                              </span>
                            )}
                            <ChevronDown
                              size={12}
                              style={{ transition: 'transform 0.2s', transform: expandedSources === msg.id ? 'rotate(180deg)' : 'none' }}
                            />
                          </button>

                          {expandedSources === msg.id && (
                            <div className="sources-list">
                              {msg.sources.map((src, si) => (
                                <div key={si} className="source-item">
                                  <div className="source-header">
                                    <span className="source-title">{src.document_title}</span>
                                    {src.page_number && (
                                      <span className="source-page">p. {src.page_number}</span>
                                    )}
                                    {src.similarity_score > 0 && (
                                      <span className="source-score">
                                        {Math.round(src.similarity_score * 100)}%
                                      </span>
                                    )}
                                  </div>
                                  {src.excerpt && (
                                    <p className="source-excerpt">{src.excerpt}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="msg-content">{msg.content}</div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="msg-avatar user">A</div>
                )}
              </div>
            ))}

            {loading && (
              <div className="qa-message assistant">
                <div className="msg-avatar ai"><Sparkles size={13} /></div>
                <div className="msg-bubble">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="qa-input-area">
        <form className="qa-input-form" onSubmit={sendMessage}>
          <textarea
            ref={inputRef}
            className="qa-input"
            placeholder="Ask a question about your study materials…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            type="submit"
            className={`qa-send-btn ${input.trim() && !loading ? 'active' : ''}`}
            disabled={!input.trim() || loading}
          >
            <Send size={16} />
          </button>
        </form>
        <p className="qa-disclaimer">
          Answers are based on your uploaded documents. Always verify with source materials.
        </p>
      </div>
    </div>
  )
}
