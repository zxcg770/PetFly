import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api/axios';
import { toast } from 'react-toastify';

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

function computeFee(budgetPrice) {
  const commission = budgetPrice * 0.15;
  return commission < 6 ? 5 : commission;
}

function CheckoutForm({ budgetPrice, petData, photos, tripData, onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const postFee = computeFee(budgetPrice);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { data } = await api.post('/payments/listing-intent', { budgetPrice });
      const { clientSecret, paymentIntentId } = data;

      const cardElement = elements.getElement(CardNumberElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        const formData = new FormData();
        for (const [key, value] of Object.entries(petData)) {
          if (value !== undefined) formData.append(key, value);
        }
        for (const file of (photos || [])) formData.append('photos', file);
        const petRes = await api.post('/pets', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

        const reqRes = await api.post('/requests', { ...tripData, pet: petRes.data._id, status: 'open' });

        await api.post(`/payments/listing/${reqRes.data._id}`, {
          budgetPrice,
          stripePaymentIntentId: paymentIntentId,
        });

        toast.success('Service fee paid! Your request is now live.');
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
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <p>Your budget: <strong>€{budgetPrice?.toFixed(2)}</strong></p>
        <p>Service fee: <strong>€{postFee.toFixed(2)}</strong></p>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>Card number</label>
        <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 14px', background: '#fff' }}>
          <CardNumberElement options={ELEMENT_OPTIONS} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>Expiry date</label>
          <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 14px', background: '#fff' }}>
            <CardExpiryElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>CVC</label>
          <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 14px', background: '#fff' }}>
            <CardCvcElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading || !stripe} style={{
        width: '100%',
        padding: '12px',
        background: '#6366f1',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}>
        {loading ? 'Processing...' : `🔒 Pay Service Fee €${postFee.toFixed(2)}`}
      </button>
      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
        This fee makes your request visible to travelers.
      </p>
    </form>
  );
}

const ListingPaymentStep = ({ budgetPrice, petData, photos, tripData, onPaymentSuccess }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        budgetPrice={budgetPrice}
        petData={petData}
        photos={photos}
        tripData={tripData}
        onPaymentSuccess={onPaymentSuccess}
      />
    </Elements>
  );
};

export default ListingPaymentStep;
