import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './PaymentPage.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#111827',
      fontFamily: 'inherit',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

function CheckoutForm({ offer, onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const req      = offer.requestId || {};
  const traveler = offer.travelerId || {};
  const pet      = req.pet || {};
  const total    = (offer.offerPrice || 0) + (offer.petTicketPrice || 0);

  const travelerName = traveler.firstName
    ? `${traveler.firstName} ${traveler.lastName ? traveler.lastName[0] + '.' : ''}`
    : 'Traveler';

  const travelDate = req.departureDate
    ? new Date(req.departureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/payments/intent/${offer._id}`);
      const { clientSecret, paymentIntentId } = data;

      const cardElement = elements.getElement(CardNumberElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (paymentIntent.status === 'requires_capture') {
        await api.post(`/payments/traveler/${offer._id}`, {
          stripePaymentIntentId: paymentIntentId,
        });
        toast.success('Payment successful! Funds held until delivery.');
        if (onPaymentSuccess) onPaymentSuccess();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <h1 className="payment-title">Confirm your booking with {travelerName}</h1>

      <div className="payment-body">

        {/* Left — Trip Summary */}
        <div className="payment-summary">
          <h2 className="payment-section-title">Trip Summary</h2>

          <div className="payment-traveler-card">
            <div className="payment-avatar">
              {traveler.firstName?.[0] || 'T'}
            </div>
            <div>
              <div className="payment-traveler-name">
                {travelerName}
                {traveler.avgRating && (
                  <span className="payment-rating"> ★ {traveler.avgRating}</span>
                )}
              </div>
              {traveler.isVerified && (
                <div className="payment-verified">✓ Verified ID</div>
              )}
            </div>
          </div>

          <div className="payment-pet-row">
            <span className="payment-pet-icon">🐾</span>
            <div>
              <div className="payment-pet-name">{pet.name || 'Pet'}</div>
              <div className="payment-pet-breed">{pet.breed || pet.type || '—'}</div>
            </div>
          </div>

          <div className="payment-details">
            <div className="payment-detail-row">
              <span>Route</span>
              <span>{req.from || '—'} → {req.to || '—'}</span>
            </div>
            <div className="payment-detail-row">
              <span>Travel date</span>
              <span>{travelDate}</span>
            </div>
            {offer.flightNumber && (
              <div className="payment-detail-row">
                <span>Flight</span>
                <span>{offer.flightNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right — Price & Payment */}
        <div className="payment-right">
          <div className="payment-breakdown">
            <h2 className="payment-section-title">Price Breakdown</h2>
            <div className="payment-breakdown-row">
              <span>Traveler payment</span>
              <span>€{offer.offerPrice?.toFixed(2)}</span>
            </div>
            <div className="payment-breakdown-row">
              <span>Pet Flight Ticket</span>
              <span>€{offer.petTicketPrice?.toFixed(2)}</span>
            </div>
            <div className="payment-breakdown-row total">
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <h2 className="payment-section-title">Payment Method</h2>

            <div className="payment-field">
              <label>Card number</label>
              <div className="stripe-card-element">
                <CardNumberElement options={ELEMENT_OPTIONS} />
              </div>
            </div>
            <div className="payment-field-row">
              <div className="payment-field">
                <label>Expiry date</label>
                <div className="stripe-card-element">
                  <CardExpiryElement options={ELEMENT_OPTIONS} />
                </div>
              </div>
              <div className="payment-field">
                <label>CVC</label>
                <div className="stripe-card-element">
                  <CardCvcElement options={ELEMENT_OPTIONS} />
                </div>
              </div>
            </div>

            <button type="submit" className="payment-btn" disabled={loading || !stripe}>
              {loading ? 'Processing...' : `🔒 Confirm & Pay €${total.toFixed(2)}`}
            </button>
            <p className="payment-terms">
              By confirming, you agree to PetFly's Terms of Service and Refund Policy.
              Payment is held securely until your pet is delivered.
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}

const PaymentPage = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    api.get(`/offers/${offerId}`)
      .then(res => {
        setOffer(res.data);
        if (res.data.acceptedAt) {
          const deadline = new Date(res.data.acceptedAt).getTime() + 10 * 60 * 1000;
          const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      })
      .catch(() => navigate('/my-requests'));
  }, [offerId, navigate]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      toast.error('Time expired. The offer has been cancelled.');
      const requestId = offer?.requestId?._id || offer?.requestId;
      navigate(requestId ? `/messages?transportRequestId=${requestId}` : '/my-requests');
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, navigate, offer]);

  if (!offer) return null;

  const mins = timeLeft !== null ? Math.floor(timeLeft / 60) : null;
  const secs = timeLeft !== null ? timeLeft % 60 : null;

  return (
    <Elements stripe={stripePromise}>
      {timeLeft !== null && (
        <div style={{ textAlign: 'center', padding: '12px', background: timeLeft < 60 ? '#fee2e2' : '#fef3c7', color: timeLeft < 60 ? '#dc2626' : '#92400e', fontWeight: 600, fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>
          ⏱ Complete payment within {mins}:{String(secs).padStart(2, '0')} or the offer will be cancelled
        </div>
      )}
      <CheckoutForm offer={offer} onPaymentSuccess={() => navigate(`/tracker/${offerId}`)} />
    </Elements>
  );
};

export default PaymentPage;
