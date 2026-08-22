import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from './shared/LoadingSpinner';
import './MyOffersPage.css';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (weeks >= 1)  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days  >= 1)  return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours >= 1)  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${mins} min ago`;
};

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

function petImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

const PetIcon = ({ pet }) => {
  const img = petImageUrl(pet?.image);
  if (img) return (
    <div className="offer-pet-icon" style={{ overflow: 'hidden', borderRadius: '12px' }}>
      <img src={img} alt={pet?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
  return (
    <div className="offer-pet-icon">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text y="36" fontSize="32" textAnchor="middle" x="24">{pet?.type === 'Cat' ? '🐈' : '🐕'}</text>
      </svg>
    </div>
  );
};

const ArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

const StarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#93c5fd" stroke="none">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
);

const OfferCard = ({ offer, onCardClick }) => {
  const req      = offer.requestId || {};
  const pet      = req.pet || {};
  const owner    = req.owner || {};
  const status   = offer.offerStatus;    // pending | open | accepted | cancelled

  const isPending   = status === 'pending' || status === 'open';
  const isAccepted  = status === 'accepted';
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';
  const isDeclined  = status === 'declined';

  const ownerName = owner.firstName
    ? `${owner.firstName} ${owner.lastName ? owner.lastName[0] + '.' : ''}`
    : 'Owner';

  const flightDate = req.departureDate
    ? new Date(req.departureDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    : '';

  const sentAgo = timeAgo(offer.createdAt);

  return (
    <div
      className={`offer-card ${isCancelled || isDeclined ? 'cancelled' : 'clickable'}`}
      onClick={() => !isCancelled && !isDeclined && onCardClick(offer)}
    >
      <PetIcon pet={pet} />

      <div className="offer-info">
        <div className="offer-name">{pet.name || 'Pet'}</div>
        <div className="offer-breed">{pet.type || pet.breed || 'Unknown'}</div>
        <div className="offer-route-row">
          <span>{req.from || '—'}</span>
          <span className="offer-arrow-text"> → </span>
          <span>{req.to || '—'}</span>
          {flightDate && <span className="offer-date">&nbsp; {flightDate}</span>}
        </div>
        <div className="offer-owner-row">
          <UserIcon />
          <span className="offer-owner-name">{ownerName}</span>
          <StarIcon />
          <span className="offer-rating">{owner.avgRating ?? '—'}</span>
        </div>
        <div className={`offer-price-row ${isCancelled ? 'price-muted' : ''}`}>
          {isAccepted
            ? <span className="offer-price-label orange">Earning: <strong>€{offer.offerPrice}</strong></span>
            : <span className={`offer-price-label ${isCancelled ? '' : 'orange'}`}>
                Offered: <strong>€{offer.offerPrice}</strong>
              </span>
          }
          <span className="offer-sent-ago">
            &nbsp; · &nbsp;
            {isAccepted ? `Accepted ${sentAgo}` : isCancelled ? sentAgo : `Sent ${sentAgo}`}
          </span>
        </div>
      </div>

      <div className="offer-right">
        {isPending   && <span className="badge badge-pending">Pending</span>}
        {isAccepted  && <span className="badge badge-accepted">Accepted</span>}
        {isCompleted && <span className="badge badge-accepted">Completed</span>}
        {isCancelled && <span className="badge badge-cancelled">Canceled</span>}
        {isDeclined  && <span className="badge badge-cancelled">Declined</span>}
        {!isCompleted && !isCancelled && !isDeclined && <ArrowIcon />}
      </div>
    </div>
  );
};

const MyOffersPage = () => {
  const navigate  = useNavigate();
  const [offers,  setOffers]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data } = await api.get('/offers/my');
        setOffers(data);
      } catch (err) {
        setError('Could not load your offers. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleCardClick = (offer) => {
    const status = offer.offerStatus;
    if (status === 'pending' || status === 'open') {
      navigate(`/messages?transportRequestId=${offer.requestId?._id}`);
    } else if (status === 'accepted') {
      navigate(`/tracker/${offer._id}`);
    }
    // cancelled → nothing
  };

  if (loading) return <LoadingSpinner />;

  const filtered  = activeFilter === 'all' ? offers : offers.filter(o => o.offerStatus === activeFilter);
  const pending   = filtered.filter(o => o.offerStatus === 'pending' || o.offerStatus === 'open');
  const accepted  = filtered.filter(o => o.offerStatus === 'accepted');
  const completed = filtered.filter(o => o.offerStatus === 'completed');
  const past      = filtered.filter(o => o.offerStatus === 'cancelled' || o.offerStatus === 'declined');

  return (
    <div className="offers-page">
      <div className="offers-header">
        <h1 className="offers-title">My Offers</h1>
        <p className="offers-subtitle">Track offers you've sent to pet owners</p>
      </div>

      {error && <div className="offers-error">{error}</div>}

      {offers.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {['all', 'pending', 'accepted', 'completed', 'declined', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                border: activeFilter === f ? 'none' : '1px solid #e2e8f0',
                background: activeFilter === f ? '#f87171' : '#fff',
                color: activeFilter === f ? '#fff' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Pending */}
      {(pending.length > 0 || (!error && offers.length === 0)) && (
        <section className="offers-section">
          <h2 className="section-heading">Pending Offers</h2>
          {pending.length === 0 && <p className="section-empty">No pending offers.</p>}
          {pending.map(offer => (
            <OfferCard key={offer._id} offer={offer} onCardClick={handleCardClick} />
          ))}
        </section>
      )}

      {/* Accepted */}
      {accepted.length > 0 && (
        <section className="offers-section">
          <h2 className="section-heading">Accepted Offers</h2>
          {accepted.map(offer => (
            <OfferCard key={offer._id} offer={offer} onCardClick={handleCardClick} />
          ))}
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section className="offers-section">
          <h2 className="section-heading">Completed Offers</h2>
          {completed.map(offer => (
            <OfferCard key={offer._id} offer={offer} onCardClick={handleCardClick} />
          ))}
        </section>
      )}

      {/* Past / Cancelled */}
      {past.length > 0 && (
        <section className="offers-section">
          <h2 className="section-heading">Past Offers</h2>
          {past.map(offer => (
            <OfferCard key={offer._id} offer={offer} onCardClick={handleCardClick} />
          ))}
        </section>
      )}

      {/* Fully empty */}
      {!error && offers.length === 0 && (
        <div className="offers-empty">
          <span style={{ fontSize: 48 }}>📋</span>
          <p>You haven't made any offers yet.</p>
          <button onClick={() => navigate('/browse')}>Browse Requests</button>
        </div>
      )}
    </div>
  );
};

export default MyOffersPage;
