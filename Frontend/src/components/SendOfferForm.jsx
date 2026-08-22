import React, { useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './SendOfferForm.css';

const SendOfferForm = ({ requestId, budgetPrice, onOfferSent }) => {
  const [offerPrice, setOfferPrice]         = useState('');
  const [petTicketPrice, setPetTicketPrice] = useState('');
  const [loading, setLoading]               = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/requests/${requestId}/offers`, {
        offerPrice: parseFloat(offerPrice),
        petTicketPrice: parseFloat(petTicketPrice),
      });
      toast.success('Offer sent successfully!');
      setOfferPrice('');
      setPetTicketPrice('');
      if (onOfferSent) onOfferSent();
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.message
        || 'Failed to send offer. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="offer-form-panel">
      <div className="offer-form-budget">
        <span className="offer-form-price">€{budgetPrice}</span>
        <span className="offer-form-price-label">Offered to traveler</span>
      </div>

      <form onSubmit={handleSubmit} className="offer-form">
        <h3 className="offer-form-title">Send an offer</h3>

        <div className="offer-form-field">
          <label>Your chaperoning fee</label>
          <div className="offer-form-input-wrapper">
            <span className="offer-form-currency">€</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              required
            />
          </div>
          <p className="offer-form-hint">This amount goes directly to you.</p>
        </div>

        <div className="offer-form-field">
          <label>Pet flight ticket cost</label>
          <div className="offer-form-input-wrapper">
            <span className="offer-form-currency">€</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={petTicketPrice}
              onChange={(e) => setPetTicketPrice(e.target.value)}
              required
            />
          </div>
          <p className="offer-form-hint">The cost of the pet's flight ticket paid separately by the owner.</p>
        </div>

        <button type="submit" className="offer-form-btn-primary" disabled={loading}>
          {loading ? 'Sending...' : 'Send offer'}
        </button>
      </form>
    </div>
  );
};

export default SendOfferForm;
