import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { createReview, getReviewStatus, getTravelerReviews } from '../api/reviews';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import './ReviewPage.css';

const QUICK_TAGS = [
  'Communicative',
  'On time',
  'Caring with pet',
  'Sent updates',
  'Professional',
  'Would book again',
];

const REVIEW_MAX_LENGTH = 2000;
const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

function getName(user, fallback = 'Traveler') {
  if (!user) return fallback;
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || fallback;
}

function isAlreadyReviewedError(error) {
  return /review already exists/i.test(error?.message || '');
}

export default function ReviewPage() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [reviewStatus, setReviewStatus] = useState(null);
  const [travelerStats, setTravelerStats] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadReviewPage() {
      setLoading(true);
      setError('');

      try {
        const { data: offerData } = await api.get(`/offers/${offerId}`);
        const travelerId = offerData.travelerId?._id || offerData.travelerId;
        const [statusData, statsData] = await Promise.all([
          getReviewStatus(offerId),
          travelerId ? getTravelerReviews(travelerId) : Promise.resolve(null),
        ]);

        if (isMounted) {
          setOffer(offerData);
          setReviewStatus(statusData);
          setTravelerStats(statsData);

          if (statusData?.hasReview && statusData.review) {
            setRating(statusData.review.rating || 0);
            setSelectedTags(statusData.review.quickTags || []);
            setReviewText(statusData.review.reviewText || '');
          }
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || 'Could not load review details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReviewPage();

    return () => {
      isMounted = false;
    };
  }, [offerId]);

  const request = offer?.requestId || {};
  const pet = request.pet || {};
  const traveler = offer?.travelerId || {};
  const travelerId = traveler?._id || traveler;
  const travelerName = getName(traveler);
  const canReview = offer?.offerStatus === 'completed' && offer?.tripStatus === 'Delivered';
  const isReviewTooLong = reviewText.length > REVIEW_MAX_LENGTH;

  const tripLabel = useMemo(() => {
    const from = request.from || 'Origin';
    const to = request.to || 'Destination';
    return `${from} to ${to}`;
  }, [request.from, request.to]);

  const toggleTag = (tag) => {
    setSelectedTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!rating || isReviewTooLong || reviewStatus?.hasReview || !canReview) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const review = await createReview(offerId, {
        rating,
        reviewText,
        quickTags: selectedTags,
      });
      const savedReview = review.alreadyExists ? review.review : review;

      if (!savedReview) {
        throw new Error('Backend says a review exists, but it did not return the saved review.');
      }

      setReviewStatus({ hasReview: true, review: savedReview });

      const travelerId = traveler._id || traveler;
      if (travelerId) {
        const stats = await getTravelerReviews(travelerId);
        setTravelerStats(stats);
      }
    } catch (requestError) {
      if (isAlreadyReviewedError(requestError)) {
        const statusData = await getReviewStatus(offerId).catch(() => null);
        if (!statusData?.review) {
          setError('Backend says a review exists, but it could not load that review.');
          return;
        }

        setReviewStatus({
          hasReview: true,
          review: statusData.review,
        });

        const travelerId = traveler._id || traveler;
        if (travelerId) {
          const stats = await getTravelerReviews(travelerId).catch(() => null);
          if (stats) setTravelerStats(stats);
        }
        setError('');
      } else {
        setError(requestError.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error && !offer) {
    return (
      <main className="review-page">
        <div className="review-state review-state-error">
          <strong>Could not load review details.</strong>
          <span>{error}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="review-page">
      <div className="review-header">
        <button className="review-back" onClick={() => navigate(`/tracker/${offerId}`)} type="button">
          Back to tracker
        </button>
        <h1>Review your trip</h1>
        <p>Share how the pet transport went so other owners can book with confidence.</p>
      </div>

      <section className="review-layout">
        <aside className="review-summary-card">
          <div className="review-avatar">{travelerName.slice(0, 1).toUpperCase()}</div>
          <h2>{travelerName}</h2>
          <p>{pet.name || 'Pet'} - {tripLabel}</p>
          <div className="review-stat-row">
            <span>Current rating</span>
            <strong>
              {travelerStats ? travelerStats.averageRating.toFixed(1) : Number(traveler.avgRating || 0).toFixed(1)}
            </strong>
          </div>
          <div className="review-stat-row">
            <span>Reviews</span>
            <strong>{travelerStats?.reviewCount || 0}</strong>
          </div>
          {travelerId && (
            <button
              className="review-profile-link"
              onClick={() => navigate(`/profile/${travelerId}`)}
              type="button"
            >
              View traveler profile
            </button>
          )}
        </aside>

        <form className="review-card" onSubmit={handleSubmit}>
          {reviewStatus?.hasReview && (
            <div className="review-state review-state-success">
              <strong>Review already submitted.</strong>
              {reviewStatus.review?.rating ? (
                <span>You rated this traveler {reviewStatus.review.rating} out of 5.</span>
              ) : (
                <span>This completed offer already has a review.</span>
              )}
            </div>
          )}

          {!canReview && (
            <div className="review-state">
              Reviews can only be created after delivery is confirmed.
            </div>
          )}

          {error && (
            <div className="review-state review-state-error">
              <span>{error}</span>
            </div>
          )}

          <div className="review-section">
            <h3>Rate your experience</h3>
            <div className="review-star-row" aria-label="Choose rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  aria-label={`${star} out of 5`}
                  className={star <= (hoveredRating || rating) ? 'active' : ''}
                  disabled={reviewStatus?.hasReview || !canReview}
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  type="button"
                >
                  &#9733;
                </button>
              ))}
            </div>
            {rating > 0 && <p>{RATING_LABELS[rating - 1]}</p>}
          </div>

          <div className="review-section">
            <h3>Quick tags</h3>
            <p>Select all that apply.</p>
            <div className="review-tags">
              {QUICK_TAGS.map((tag) => (
                <button
                  className={selectedTags.includes(tag) ? 'selected' : ''}
                  disabled={reviewStatus?.hasReview || !canReview}
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="review-section">
            <h3>Tell us more</h3>
            <p>This will be visible on the traveler profile.</p>
            <textarea
              disabled={reviewStatus?.hasReview || !canReview}
              maxLength={REVIEW_MAX_LENGTH + 1}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="How was communication, timing, and pet care?"
              rows={6}
              value={reviewText}
            />
            <div className={`review-meta ${isReviewTooLong ? 'error' : ''}`}>
              <span>{isReviewTooLong ? 'Review is too long' : 'Maximum 2000 characters'}</span>
              <span>{reviewText.length}/{REVIEW_MAX_LENGTH}</span>
            </div>
          </div>

          <div className="review-actions">
            <button
              disabled={submitting || rating === 0 || isReviewTooLong || reviewStatus?.hasReview || !canReview}
              type="submit"
            >
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
