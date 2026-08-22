import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL?.replace(/\/api$/, '') || 'http://localhost:5001';

const COUNTRIES = [
  { value: 'china', label: 'China', flag: '🇨🇳' },
  { value: 'germany', label: 'Germany', flag: '🇩🇪' },
  { value: 'turkey', label: 'Turkey', flag: '🇹🇷' },
];

const EXAMPLE_QUESTIONS = [
  'How long is the quarantine period?',
  'Can I bring my pet in the cabin with Lufthansa?',
  'What vaccinations does my pet need?',
  'How far in advance should I start the process?',
];

export default function RegulationPage() {
  const { user } = useAuth();
  const [country, setCountry] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!country) return;
    setChecklist([]);
    setMessages([]);
    setChecklistLoading(true);
    axios
      .get(`${API_URL}/api/regulations/checklist?country=${country}`)
      .then((res) => setChecklist(res.data.items || []))
      .catch(() => setChecklist([]))
      .finally(() => setChecklistLoading(false));
  }, [country]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (overrideText) => {
    const question = (overrideText ?? input).trim();
    if (!question || loading) return;

    const userMsg = { role: 'user', content: question };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/regulations/ask', {
        country,
        question,
        history: messages,
      });
      setMessages([...updatedMessages, { role: 'assistant', content: res.data.answer }]);
    } catch {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="regulation-page">
        <div className="regulation-header">
          <h1>Travel Requirements & Regulations</h1>
          <p className="regulation-subtitle">
            Essential documentation and health requirements for international pet travel
          </p>
        </div>

        <div className="notice-banner">
          <span className="material-symbols-outlined notice-icon">error</span>
          <div>
            <p className="notice-title">Important Notice</p>
            <p className="notice-body">
              Requirements vary by destination and change frequently. Always verify with the
              destination country's official agency and your airline before finalizing travel
              plans. PetFly provides this as guidance only.
            </p>
          </div>
        </div>

        <div className="destination-card">
          <p className="destination-title">
            <span className="material-symbols-outlined">language</span>
            Select Destination
          </p>
          <div className="select-wrapper">
            <select
              className="destination-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="" disabled>Select a country...</option>
              {COUNTRIES.map(({ value, label, flag }) => (
                <option key={value} value={value}>{flag}  {label}</option>
              ))}
            </select>
            <span className="material-symbols-outlined select-arrow">expand_more</span>
          </div>
        </div>

        {country && (
          <div className="regulation-content">
            <div className="checklist-panel">
              <h2 className="panel-title">
                <span className="material-symbols-outlined">checklist</span>
                Entry Requirements
              </h2>
              {checklistLoading ? (
                <p className="panel-loading">Loading...</p>
              ) : checklist.length === 0 ? (
                <p className="panel-empty">No checklist available.</p>
              ) : (
                <ul className="checklist">
                  {checklist.map((item) => (
                    <li key={item.id} className="checklist-item">
                      <span className="material-symbols-outlined check-icon">check_circle</span>
                      <span>
                        {item.label}
                        {item.warning && <span className="checklist-warning">{item.warning}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="chat-panel">
              <h2 className="panel-title">
                <span className="material-symbols-outlined">smart_toy</span>
                Ask the Regulation AI
              </h2>

              {!user ? (
                <div className="chat-login-required">
                  <span className="material-symbols-outlined">lock</span>
                  <p>Log in to ask the Regulation AI specific questions.</p>
                  <Link to="/auth" className="chat-login-link">Log in</Link>
                </div>
              ) : (
                <>
                  <div className="chat-messages">
                    {messages.length === 0 && (
                      <div className="chat-empty">
                        <p>
                          Ask about pet import rules for {COUNTRIES.find((c) => c.value === country)?.label}. For example:
                        </p>
                        <div className="chat-suggestions">
                          {EXAMPLE_QUESTIONS.map((q) => (
                            <button
                              key={q}
                              className="chat-suggestion-chip"
                              onClick={() => sendMessage(q)}
                              disabled={loading}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <div key={i} className={`chat-bubble ${msg.role}`}>
                        {msg.content}
                      </div>
                    ))}
                    {loading && (
                      <div className="chat-bubble assistant loading">
                        <span className="dot" /><span className="dot" /><span className="dot" />
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  <div className="chat-input-row">
                    <textarea
                      className="chat-input"
                      rows={1}
                      placeholder="e.g. How long is the quarantine period?"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button
                      className="send-btn"
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || loading}
                    >
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                  <p className="chat-disclaimer">AI can make mistakes. Always verify with official sources.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles = `
.regulation-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 32px 64px;
}

.regulation-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
}

.regulation-subtitle {
  margin: 8px 0 0;
  font-size: 15px;
  color: #64748b;
}

.notice-banner {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-top: 28px;
  padding: 18px 20px;
  background: #fff4f3;
  border: 1px solid #fdd5d2;
  border-radius: 14px;
}

.notice-icon {
  font-size: 22px;
  color: #f97066;
  flex-shrink: 0;
  margin-top: 1px;
}

.notice-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.notice-body {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}

.destination-card {
  margin-top: 20px;
  padding: 24px 28px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.destination-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.destination-title .material-symbols-outlined {
  font-size: 20px;
  color: #60a5fa;
}

.select-wrapper {
  position: relative;
}

.destination-select {
  width: 100%;
  padding: 14px 44px 14px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  color: #334155;
  background: #fff;
  cursor: pointer;
  outline: none;
  appearance: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.destination-select:hover {
  border-color: #94a3b8;
}

.destination-select:focus {
  border-color: #f97066;
  box-shadow: 0 0 0 3px rgba(249, 112, 102, 0.12);
}

.select-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: #94a3b8;
  pointer-events: none;
}

.regulation-content {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 24px;
  margin-top: 28px;
  align-items: start;
}

@media (max-width: 768px) {
  .regulation-content {
    grid-template-columns: 1fr;
  }
}

.checklist-panel,
.chat-panel {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  padding: 24px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.panel-title .material-symbols-outlined {
  font-size: 20px;
  color: #f97066;
}

.panel-loading,
.panel-empty {
  font-size: 14px;
  color: #94a3b8;
}

.checklist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: #334155;
  line-height: 1.5;
}

.check-icon {
  font-size: 18px;
  color: #22c55e;
  flex-shrink: 0;
  margin-top: 1px;
}

.checklist-warning {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  color: #f97066;
}

.chat-messages {
  min-height: 280px;
  max-height: 420px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding-right: 4px;
}

.chat-empty {
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
  margin: auto;
  padding: 32px 0;
}

.chat-empty p {
  margin: 0 0 14px;
}

.chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.chat-suggestion-chip {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.chat-suggestion-chip:hover {
  border-color: #f97066;
  color: #f97066;
  background: #fff0ef;
}

.chat-suggestion-chip:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.chat-bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.chat-bubble.user {
  align-self: flex-end;
  background: #f97066;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chat-bubble.assistant {
  align-self: flex-start;
  background: #f8fafc;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 4px;
}

.chat-bubble.loading {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 12px 16px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
  animation: bounce 1.2s infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

.chat-input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  color: #334155;
  resize: none;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}

.chat-input:focus {
  border-color: #f97066;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 12px;
  background: #f97066;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}

.send-btn:hover {
  background: #f75f52;
}

.send-btn:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
}

.send-btn .material-symbols-outlined {
  font-size: 20px;
}

.chat-disclaimer {
  margin: 8px 0 0;
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
}

.chat-login-required {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 16px;
  text-align: center;
}

.chat-login-required .material-symbols-outlined {
  font-size: 28px;
  color: #94a3b8;
}

.chat-login-required p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.chat-login-link {
  margin-top: 4px;
  padding: 8px 20px;
  border-radius: 10px;
  background: #f97066;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}

.chat-login-link:hover {
  background: #f75f52;
}
`;
