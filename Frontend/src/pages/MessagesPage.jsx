import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createConversation,
  deleteConversation,
  getConversations,
  getMessages,
  markConversationRead,
  sendMessage,
} from '../api/messages';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
const DEFAULT_CONTEXT = {
  petName: 'Unknown pet',
  petType: 'Pet',
  route: 'Route unavailable',
  date: 'Date unavailable',
  status: 'Open',
  budget: '—',
};
const MESSAGE_MAX_LENGTH = 2000;

function getRequestedTransportRequestId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('transportRequestId');
}

function getEntityId(entity) {
  return typeof entity === 'object' && entity !== null ? entity._id : entity;
}

function getDisplayName(entity, fallback = 'Unknown user') {
  if (!entity || typeof entity !== 'object') {
    return entity || fallback;
  }

  const fullName = [entity.firstName, entity.lastName].filter(Boolean).join(' ').trim();
  return fullName || entity.email || fallback;
}

function getOtherPerson(conversation, currentUserId) {
  return getEntityId(conversation.ownerId) === currentUserId
    ? conversation.travelerId
    : conversation.ownerId;
}

function getRequestDetails(conversation, fallbackContext) {
  const request = conversation?.transportRequestId;
  const pet = request?.pet;

  return {
    petName: pet?.name || fallbackContext.petName,
    petType: [pet?.breed, pet?.type].filter(Boolean).join(' - ') || fallbackContext.petType,
    petPhoto: pet?.photos?.[0] || pet?.image || null,
    route: request?.from && request?.to ? `${request.from} to ${request.to}` : fallbackContext.route,
    // show date range for flexible dates, single date otherwise
    date: (() => {
      if (!request?.departureDate) return fallbackContext.date;
      const fmt = (d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      if (request.flexibleDates && request.returnDate) {
        return `${fmt(request.departureDate)} – ${fmt(request.returnDate)}`;
      }
      return fmt(request.departureDate);
    })(),
    status: request?.status || fallbackContext.status,
    budget: request?.price ? `EUR ${request.price}` : fallbackContext.budget,
  };
}

function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getConversationPreview(conversation, currentUserId) {
  if (!conversation.lastMessage) {
    return 'No messages yet';
  }

  const senderLabel = getEntityId(conversation.lastMessage.senderId) === currentUserId
    ? 'You'
    : getDisplayName(conversation.lastMessage.senderId);

  return `${senderLabel}: ${conversation.lastMessage.text}`;
}

function MessagingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startupTransportRequestId] = useState(getRequestedTransportRequestId);
  const currentUserId = user?._id || '';
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageStatus, setMessageStatus] = useState('idle');
  const [messageError, setMessageError] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [conversationPendingDelete, setConversationPendingDelete] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const autoStartAttemptedRef = useRef(false);
  const [showNewOfferForm, setShowNewOfferForm] = useState(false);
  const [newOfferPrice, setNewOfferPrice] = useState('');
  const [newTicketPrice, setNewTicketPrice] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  const selectedConversation = conversations.find(
    (conversation) => conversation._id === selectedConversationId
  );
  const isMessageTooLong = messageText.length > MESSAGE_MAX_LENGTH;

  const loadConversations = useCallback((options = {}) => {
    if (!options.silent) {
      setStatus('loading');
      setError('');
    }

    return getConversations()
      .then((data) => {
        setConversations(data);
        setSelectedConversationId((currentId) =>
          data.some((conversation) => conversation._id === currentId) ? currentId : ''
        );
        setStatus('success');
      })
      .catch((requestError) => {
        if (!options.silent) {
          setError(requestError.message);
          setStatus('error');
        }
      });
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!startupTransportRequestId || autoStartAttemptedRef.current) {
      return;
    }

    autoStartAttemptedRef.current = true;
    setError('');

    createConversation(startupTransportRequestId)
      .then((conversation) => {
        return loadConversations().then(() => {
          setSelectedConversationId(conversation._id);
        });
      })
      .catch((requestError) => {
        setError(requestError.message);
        setStatus('error');
      });
  }, [loadConversations, startupTransportRequestId]);

  const loadMessages = useCallback((conversationId, options = {}) => {
    if (!conversationId) {
      setMessages([]);
      setMessageStatus('idle');
      return Promise.resolve();
    }

    if (!options.silent) {
      setMessageStatus('loading');
      setMessageError('');
    }

    return getMessages(conversationId)
      .then((data) => {
        setMessages(data);
        setMessageStatus('success');
      })
      .catch((requestError) => {
        if (!options.silent) {
          setMessageError(requestError.message);
          setMessageStatus('error');
        }
      });
  }, []);

  useEffect(() => {
    loadMessages(selectedConversationId);
  }, [loadMessages, selectedConversationId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadConversations({ silent: true });

      if (selectedConversationId) {
        loadMessages(selectedConversationId, { silent: true });
      }
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadConversations, loadMessages, selectedConversationId]);

  useEffect(() => {
    if (messageStatus === 'success') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messageStatus]);

  useEffect(() => {
    if (!selectedConversation || selectedConversation.unreadCount <= 0) {
      return;
    }

    markConversationRead(selectedConversation._id)
      .then(() => loadConversations())
      .catch(() => { });
  }, [currentUserId, loadConversations, selectedConversation]);

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const trimmedMessage = messageText.trim();
    if (!selectedConversationId || !trimmedMessage || isMessageTooLong) {
      return;
    }

    setIsSending(true);
    setMessageError('');

    try {
      await sendMessage(selectedConversationId, {
        text: trimmedMessage,
      });
      setMessageText('');
      await Promise.all([loadMessages(selectedConversationId), loadConversations()]);
    } catch (requestError) {
      setMessageError(requestError.message);
      setMessageStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestDeleteConversation = (event, conversationId) => {
    event.stopPropagation();

    const conversation = conversations.find((item) => item._id === conversationId);
    if (!conversation) {
      return;
    }

    setConversationPendingDelete(conversation);
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!conversationId) {
      return;
    }

    setIsDeletingConversation(true);
    setMessageError('');

    try {
      await deleteConversation(conversationId);
      if (selectedConversationId === conversationId) {
        setSelectedConversationId('');
        setMessages([]);
        setMessageStatus('idle');
      }

      await loadConversations();
    } catch (requestError) {
      setMessageError(requestError.message);
    } finally {
      setIsDeletingConversation(false);
      setConversationPendingDelete(null);
    }
  };

  const handleOpenProfile = (event, person) => {
    event?.stopPropagation();

    const userId = getEntityId(person);
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  const selectedRequestDetails = getRequestDetails(selectedConversation, DEFAULT_CONTEXT);

  const isTravelerInConversation = selectedConversation &&
    getEntityId(selectedConversation.travelerId) === currentUserId;
  const hasDeclinedOffer = isTravelerInConversation &&
    messages.some(m => m.offerId && (m.offerId.offerStatus === 'cancelled' || m.offerId.offerStatus === 'declined'));

  const handleSendNewOffer = async () => {
    if (!newOfferPrice) return;
    setSendingOffer(true);
    try {
      const requestId = selectedConversation?.transportRequestId?._id
        || selectedConversation?.transportRequestId;
      const offerRes = await api.post(`/requests/${requestId}/offers`, {
        offerPrice: Number(newOfferPrice),
        petTicketPrice: Number(newTicketPrice) || 0,
      });
      await sendMessage(selectedConversationId, {
        text: `${user?.firstName || 'Traveler'} sent a new offer`,
        offerId: offerRes.data._id,
      });
      setNewOfferPrice('');
      setNewTicketPrice('');
      setShowNewOfferForm(false);
      await loadMessages(selectedConversationId);
    } catch {
      setMessageError('Could not send offer');
    } finally {
      setSendingOffer(false);
    }
  };

  return (
    <main className="messaging-shell">
      <div className="messaging-page-header">
        <h1>Messages</h1>
        <p>Coordinate pet transport details with owners and travelers.</p>
      </div>

      <section className="messaging-layout">
        <aside className="conversation-sidebar">
          <div className="sidebar-header">
            <div>
              <h2>Conversations</h2>
              <p>Signed in as {getDisplayName(user)}</p>
            </div>
          </div>

          {status === 'loading' && <p className="sidebar-status">Loading conversations...</p>}

          {status === 'error' && (
            <div className="sidebar-status error">
              <strong>Could not connect.</strong>
              <span>{error}</span>
            </div>
          )}

          {status === 'success' && conversations.length === 0 && (
            <div className="empty-list">
              <strong>No conversations yet.</strong>
              <span>Open messages from a transport request to start a conversation.</span>
            </div>
          )}

          {status === 'success' && conversations.length > 0 && (
            <div className="conversation-list">
              {conversations.map((conversation) => {
                const otherPerson = getOtherPerson(conversation, currentUserId);
                const otherPersonName = getDisplayName(otherPerson);
                const requestDetails = getRequestDetails(conversation, DEFAULT_CONTEXT);

                return (
                  <div
                    className={`conversation-item ${selectedConversationId === conversation._id ? 'selected' : ''
                      }`}
                    key={conversation._id}
                    onClick={() => setSelectedConversationId(conversation._id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedConversationId(conversation._id);
                      }
                    }}
                  >
                    <div className="avatar" aria-hidden="true">
                      {otherPersonName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="conversation-copy">
                      <div className="conversation-title-row">
                        <button
                          className="conversation-profile-link"
                          onClick={(event) => handleOpenProfile(event, otherPerson)}
                          type="button"
                        >
                          {otherPersonName}
                        </button>
                        {conversation.unreadCount > 0 && (
                          <span className="unread-badge">{conversation.unreadCount}</span>
                        )}
                      </div>
                      <span>
                        {requestDetails.petName} - {requestDetails.petType}
                      </span>
                      <small>{getConversationPreview(conversation, currentUserId)}</small>
                    </div>
                    <button
                      aria-label="Delete conversation"
                      className="conversation-delete-button"
                      disabled={isDeletingConversation}
                      onClick={(event) => handleRequestDeleteConversation(event, conversation._id)}
                      title="Delete conversation"
                      type="button"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        <section className="chat-panel">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-title">
                  <div className="avatar large" aria-hidden="true">
                    {getDisplayName(getOtherPerson(selectedConversation, currentUserId)).slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2>
                      <button
                        className="chat-profile-link"
                        onClick={(event) => handleOpenProfile(event, getOtherPerson(selectedConversation, currentUserId))}
                        type="button"
                      >
                        {getDisplayName(getOtherPerson(selectedConversation, currentUserId))}
                      </button>
                    </h2>
                    <p>{selectedRequestDetails.petName} - {selectedRequestDetails.route}</p>
                  </div>
                </div>
              </div>

              <div className="request-summary">
                {/* show pet photo if available, otherwise fall back to initial */}
                {selectedRequestDetails.petPhoto ? (
                  <img
                    src={selectedRequestDetails.petPhoto}
                    alt={selectedRequestDetails.petName}
                    className="summary-icon"
                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                  />
                ) : (
                  <span className="summary-icon" aria-hidden="true">
                    {selectedRequestDetails.petName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="summary-content">
                  <div className="summary-title-row">
                    <div>
                      <strong>{selectedRequestDetails.petName}</strong>
                      <p>{selectedRequestDetails.petType}</p>
                    </div>
                    <span className="status-pill">{selectedRequestDetails.status}</span>
                  </div>
                  <div className="summary-details">
                    <span>{selectedRequestDetails.route}</span>
                    <span>{selectedRequestDetails.date}</span>
                    <span>{selectedRequestDetails.budget}</span>
                  </div>
                  <p className="summary-meta">
                    Owner:{' '}
                    <button
                      className="summary-profile-link"
                      onClick={(event) => handleOpenProfile(event, selectedConversation.ownerId)}
                      type="button"
                    >
                      {getDisplayName(selectedConversation.ownerId)}
                    </button>{' '}
                    | Traveler:{' '}
                    <button
                      className="summary-profile-link"
                      onClick={(event) => handleOpenProfile(event, selectedConversation.travelerId)}
                      type="button"
                    >
                      {getDisplayName(selectedConversation.travelerId)}
                    </button>
                  </p>
                  {/* traveler link to tracker once offer is accepted */}
                  {isTravelerInConversation &&
                    (selectedRequestDetails.status === 'accepted' || selectedRequestDetails.status === 'completed') && (() => {
                      const acceptedOffer = messages.find(m => m.offerId && m.offerId.offerStatus === 'accepted');
                      return acceptedOffer ? (
                        <button
                          className="small-action"
                          onClick={() => navigate(`/tracker/${acceptedOffer.offerId._id}`)}
                          style={{ marginTop: '10px', width: '100%' }}
                        >
                          Update travel status →
                        </button>
                      ) : null;
                    })()}
                </div>
              </div>

              <div className="message-thread">
                {messageStatus === 'loading' && (
                  <div className="message-placeholder centered">
                    <h3>Loading messages...</h3>
                  </div>
                )}

                {messageStatus === 'error' && (
                  <div className="message-placeholder centered error-text">
                    <h3>Could not load messages.</h3>
                    <p>{messageError}</p>
                  </div>
                )}

                {messageStatus === 'success' && messages.length === 0 && (
                  <div className="message-placeholder centered">
                    <h3>No messages yet.</h3>
                    <p>Send a message to start the conversation.</p>
                  </div>
                )}

                {messageStatus === 'success' && messages.length > 0 && (
                  <div className="message-list">
                    {messageError && (
                      <p className="message-inline-error">{messageError}</p>
                    )}
                    {messages.map((message) => {
                      if (message.offerId) {
                        const offer = message.offerId;
                        const isOwner = selectedConversation &&
                          getEntityId(selectedConversation.ownerId) === currentUserId;
                        const canAct = isOwner &&
                          (offer.offerStatus === 'pending' || offer.offerStatus === 'open');
                        const isDeclined = offer.offerStatus === 'cancelled' || offer.offerStatus === 'declined';

                        const handleAccept = async () => {
                          try {
                            await api.put(`/offers/${offer._id}/accept`);
                            navigate(`/payment/${offer._id}`);
                          } catch {
                            setMessageError('Could not accept offer');
                          }
                        };
                        const handleDecline = async () => {
                          try {
                            await api.put(`/offers/${offer._id}/reject`);
                            await loadMessages(selectedConversationId);
                          } catch {
                            setMessageError('Could not decline offer');
                          }
                        };

                        return (
                          <div className="message-row system" key={message._id}>
                            <div className="message-offer-card">
                              <p className="offer-card-title">{message.text}</p>
                              <div className="offer-card-fees">
                                <div className="offer-card-fee-row">
                                  <span>Travel fee</span>
                                  <span>€{offer.offerPrice}</span>
                                </div>
                                <div className="offer-card-fee-row">
                                  <span>Pet ticket fee</span>
                                  <span>€{offer.petTicketPrice}</span>
                                </div>
                              </div>
                              {offer.offerStatus === 'accepted' && (
                                <div className="offer-card-status accepted">✓ Accepted</div>
                              )}
                              {isDeclined && (
                                <div className="offer-card-status declined">✗ Declined</div>
                              )}
                              {canAct && (
                                <div className="offer-card-actions">
                                  <div className="offer-card-buttons">
                                    <button className="offer-card-btn accept" onClick={handleAccept}>Accept</button>
                                    <button className="offer-card-btn decline" onClick={handleDecline}>Decline</button>
                                  </div>
                                  <p className="offer-card-hint">By declining the offer, the traveler can offer a new price.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      const isOwnMessage = getEntityId(message.senderId) === currentUserId;

                      return (
                        <div
                          className={`message-row ${isOwnMessage ? 'own' : 'other'}`}
                          key={message._id}
                        >
                          <div className="message-bubble">
                            <p>{message.text}</p>
                            <span>
                              {isOwnMessage
                                ? `${message.readAt ? 'Read' : 'Sent'} - ${formatMessageTime(message.createdAt)}`
                                : `${getDisplayName(message.senderId)} - ${formatMessageTime(message.createdAt)}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {hasDeclinedOffer && (
                <div className="new-offer-bar">
                  {!showNewOfferForm ? (
                    <button className="new-offer-trigger" onClick={() => setShowNewOfferForm(true)}>
                      + Give a new offer
                    </button>
                  ) : (
                    <div className="new-offer-form">
                      <div className="new-offer-inputs">
                        <div className="new-offer-field">
                          <label>Travel fee (€)</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="0"
                            value={newOfferPrice}
                            onChange={e => setNewOfferPrice(e.target.value)}
                          />
                        </div>
                        <div className="new-offer-field">
                          <label>Pet ticket fee (€)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={newTicketPrice}
                            onChange={e => setNewTicketPrice(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="new-offer-actions">
                        <button className="new-offer-cancel" onClick={() => setShowNewOfferForm(false)}>Cancel</button>
                        <button className="new-offer-submit" onClick={handleSendNewOffer} disabled={sendingOffer || !newOfferPrice}>
                          {sendingOffer ? 'Sending...' : 'Send offer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form className="message-composer" onSubmit={handleSendMessage}>
                <div className="composer-input-group">
                  <textarea
                    disabled={isSending || messageStatus === 'loading'}
                    onChange={(event) => setMessageText(event.target.value)}
                    //send by pressing enter on keyboard
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        if (messageText.trim() && !isMessageTooLong) {
                          handleSendMessage(event);
                        }
                      }
                    }}
                    placeholder="Type your message..."
                    rows={1}
                    value={messageText}
                  />
                  <div className={`composer-meta ${isMessageTooLong ? 'error' : ''}`}>
                    <span>
                      {isMessageTooLong ? 'Message is too long' : 'Maximum 2000 characters'}
                    </span>
                    <span>{messageText.length}/{MESSAGE_MAX_LENGTH}</span>
                  </div>
                </div>
                <button
                  disabled={
                    isSending ||
                    !messageText.trim() ||
                    isMessageTooLong ||
                    messageStatus === 'loading'
                  }
                  type="submit"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="message-placeholder centered">
              <h3>Select a conversation</h3>
              <p>Create or choose a conversation to see its transport request details.</p>
            </div>
          )}
        </section>
      </section>

      {conversationPendingDelete && (
        <div className="delete-modal-backdrop" role="presentation">
          <div className="delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <div className="delete-modal-icon" aria-hidden="true">
              <span className="material-symbols-outlined">delete</span>
            </div>
            <div className="delete-modal-copy">
              <h2 id="delete-modal-title">Delete conversation?</h2>
              <p>
                This removes the conversation from your inbox only. The other person can still see it.
              </p>
            </div>
            <div className="delete-modal-actions">
              <button
                className="delete-modal-cancel"
                disabled={isDeletingConversation}
                onClick={() => setConversationPendingDelete(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="delete-modal-confirm"
                disabled={isDeletingConversation}
                onClick={() => handleDeleteConversation(conversationPendingDelete._id)}
                type="button"
              >
                {isDeletingConversation ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default MessagingPage;

