import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import LoadingSpinner from './shared/LoadingSpinner';
import './TrackingPage.css';

const STEPS = ['BookingConfirmed', 'Pickup', 'InFlight', 'Landed', 'Delivered'];

const STEP_LABELS = {
  BookingConfirmed: 'Booking Confirmed',
  Pickup:           'Pickup',
  InFlight:         'In Flight',
  Landed:           'Landed',
  Delivered:        'Delivered',
};

const STEP_DESCRIPTIONS = {
  BookingConfirmed: 'The booking has been confirmed.',
  Pickup:           'Pet has been picked up from the owner.',
  InFlight:         'Pet is currently in flight.',
  Landed:           'Flight has landed at the destination.',
  Delivered:        'Pet has been delivered safely.',
};

const NEXT_STEP = {
  BookingConfirmed: 'Pickup',
  Pickup:           'InFlight',
  InFlight:         'Landed',
  Landed:           'Delivered',
};

const TrackingPage = ({ offerId, currentUserId }) => {
  const navigate = useNavigate();
  const [offer,    setOffer]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOffer = async () => {
    try {
      const { data } = await api.get(`/offers/${offerId}`);
      setOffer(data);
    } catch {
      toast.error('Could not load tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOffer(); }, [offerId]);

  const handleStepClick = async (step, index) => {
    if (userRole !== 'traveler') return;
    const currentIndex = STEPS.indexOf(offer.tripStatus);
    if (index !== currentIndex + 1) return;
    if (step === 'Delivered') return;

    setUpdating(true);
    try {
      await api.put(`/offers/${offerId}/trip-status`, { tripStatus: step });
      toast.success(`Marked as ${STEP_LABELS[step]}`);
      fetchOffer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setUpdating(true);
    try {
      await api.put(`/offers/${offerId}/confirm-delivery`);
      toast.success('Delivery confirmed! Payment released to traveler.');
      fetchOffer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm delivery.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!offer)  return <div className="tracking-error">Offer not found.</div>;

  const req      = offer.requestId || {};
  const traveler = offer.travelerId || {};
  const pet      = req.pet || {};

  const currentStepIndex = STEPS.indexOf(offer.tripStatus);
  const isCompleted      = offer.tripStatus === 'Delivered';

  const userRole = currentUserId === offer.travelerId?._id?.toString()
    ? 'traveler'
    : currentUserId === offer.requestId?.owner?._id?.toString()
    ? 'petOwner'
    : null;

  const owner = req.owner || {};

  const contact = userRole === 'petOwner' ? traveler : owner;
  const contactName = contact.firstName
    ? `${contact.firstName} ${contact.lastName ? contact.lastName[0] + '.' : ''}`
    : userRole === 'petOwner' ? 'Traveler' : 'Owner';
  const contactLabel = userRole === 'petOwner' ? 'Traveler Contact' : 'Owner Contact';

  const requestId = typeof req._id === 'object' ? req._id : req._id;

  const travelDate = req.departureDate
    ? new Date(req.departureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className="tracking-page">
      <div className="tracking-header">
        <h1 className="tracking-title">{pet.name ? `${pet.name}'s Journey` : 'Journey Tracker'}</h1>
        <p className="tracking-subtitle">{req.from || '—'} → {req.to || '—'} · {travelDate}</p>
      </div>

      <div className="tracking-body">

        {/* Left — Timeline */}
        <div className="tracking-timeline-card">
          <h2 className="tracking-section-title">Trip Status</h2>

          <div className="tracking-timeline">
            {STEPS.map((step, index) => {
              const isDone      = index < currentStepIndex ||
                (userRole === 'petOwner' && offer.tripStatus === 'Landed' && step === 'Landed');
              const isCurrent   = index === currentStepIndex &&
                !(userRole === 'petOwner' && offer.tripStatus === 'Landed' && step === 'Landed');
              const isPending   = index > currentStepIndex;
              const isNextStep  = userRole === 'traveler' && index === currentStepIndex + 1 && step !== 'Delivered';
              const isClickable = isNextStep && !updating;

              return (
                <div
                  key={step}
                  className={`tracking-step ${isClickable ? 'clickable' : ''}`}
                  onClick={() => isClickable && handleStepClick(step, index)}
                >
                  <div className="tracking-step-left">
                    {userRole === 'traveler' ? (
                      <div className={`tracking-checkbox ${isDone ? 'checked' : isCurrent ? 'active' : isNextStep ? 'next' : 'empty'}`}>
                        {(isDone || isCurrent) && <span>✓</span>}
                      </div>
                    ) : (
                      <div className={`tracking-dot ${isDone ? 'done' : isCurrent ? 'current' : 'pending'}`}>
                        {isDone ? '✓' : ''}
                      </div>
                    )}
                    {index < STEPS.length - 1 && (
                      <div className={`tracking-line ${isDone ? 'done' : isCurrent ? 'current-line' : ''}`} />
                    )}
                  </div>

                  <div className="tracking-step-content">
                    <div>
                      <span className={`tracking-step-label ${isCurrent ? 'current' : isPending ? 'pending' : ''}`}>
                        {STEP_LABELS[step]}
                      </span>
                      <p className="tracking-step-desc">{STEP_DESCRIPTIONS[step]}</p>
                    </div>
                    <div className="tracking-step-right">
                      {isCurrent && !isCompleted && userRole !== 'petOwner' && <span className="tracking-step-badge">In progress</span>}
                      {userRole === 'petOwner' && step === 'Delivered' && offer.tripStatus === 'Landed' && <span className="tracking-step-badge">In progress</span>}
                      {isPending && !isNextStep && !(userRole === 'petOwner' && step === 'Delivered' && offer.tripStatus === 'Landed') && <span className="tracking-step-pending">Pending</span>}
                      {isNextStep && <span className="tracking-step-next">Tap to mark ✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pet owner: confirm delivery */}
          {userRole === 'petOwner' && offer.tripStatus === 'Landed' && (
            <div className="tracking-confirm-section">
              <button className="tracking-btn-primary" onClick={handleConfirmDelivery} disabled={updating}>
                {updating ? 'Confirming...' : 'Confirm pet has arrived safely'}
              </button>
              <p className="tracking-confirm-hint">This will release payment to the traveler.</p>
            </div>
          )}

          {isCompleted && (
            <div className="tracking-completed">
              <span>✓ Journey completed successfully!</span>
              {userRole === 'petOwner' && (
                <button
                  className="tracking-review-btn"
                  onClick={() => navigate(`/reviews/offers/${offerId}`)}
                  type="button"
                >
                  Review traveler
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right — Traveler & Flight Details */}
        <div className="tracking-right">
          <div className="tracking-info-card">
            <h2 className="tracking-section-title">{contactLabel}</h2>
            <div className="tracking-traveler-row">
              <div className="tracking-avatar">{contact.firstName?.[0] || '?'}</div>
              <div>
                <div
                  className="tracking-traveler-name"
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate(`/profile/${contact._id}`)}
                >
                  {contactName}
                </div>
                {contact.isVerified && (
                  <div className="tracking-verified">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="#22c55e" opacity="0.15" stroke="#22c55e" strokeWidth="1.5"/>
                      <path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Verified ID
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="tracking-info-card">
            <h2 className="tracking-section-title">Flight Details</h2>
            <div className="tracking-detail-row">
              <span>Travel date</span>
              <span>{travelDate}</span>
            </div>
            <div className="tracking-detail-row">
              <span>Route</span>
              <span>{req.from || '—'} → {req.to || '—'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrackingPage;
