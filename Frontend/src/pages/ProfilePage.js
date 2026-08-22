import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyProfile, getPublicProfile, updateMyProfile, uploadMyProfilePhoto } from '../api/profile';
import { getTravelerReviews } from '../api/reviews';
import './ProfilePage.css';

function getFullName(profile) {
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
}

function getEntityId(entity) {
  return typeof entity === 'object' && entity !== null ? entity._id : entity;
}

function formatJoinDate(date) {
  if (!date) {
    return 'Not available';
  }

  return new Date(date).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isPublicProfile = Boolean(userId);
  const [profile, setProfile] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewsStatus, setReviewsStatus] = useState('idle');
  const [reviewsError, setReviewsError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    about: '',
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setStatus('loading');
    setError('');

    const profileRequest = isPublicProfile ? getPublicProfile(userId) : getMyProfile();

    profileRequest
      .then((data) => {
        setProfile(data);
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          location: data.location || '',
          about: data.about || '',
        });
        setStatus('success');

        if (data._id) {
          setReviewsStatus('loading');
          setReviewsError('');
          getTravelerReviews(data._id)
            .then((stats) => {
              setReviewStats(stats);
              setReviewsStatus('success');
            })
            .catch((requestError) => {
              setReviewsError(requestError.message);
              setReviewsStatus('error');
            });
        }
      })
      .catch((requestError) => {
        setError(requestError.message);
        setStatus('error');
      });
  }, [isPublicProfile, userId]);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedPhoto]);

  const initials = useMemo(() => {
    const name = getFullName(profile) || profile?.email || 'User';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [profile]);

  const displayedPhoto = photoPreview || profile?.profilePhoto;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    setSaveMessage('');
    setSaveError('');
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedPhoto(file || null);
    setSaveMessage('');
    setSaveError('');
  };

  const handleCancel = () => {
    setForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      location: profile.location || '',
      about: profile.about || '',
    });
    setSelectedPhoto(null);
    setIsEditing(false);
    setSaveError('');
    setSaveMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaveMessage('');

    try {
      let updatedProfile = await updateMyProfile({
        ...form,
        profileCompleted: Boolean(
          form.firstName.trim() &&
            form.lastName.trim() &&
            form.email.trim() &&
            form.location.trim() &&
            form.about.trim()
        ),
      });

      if (selectedPhoto) {
        updatedProfile = await uploadMyProfilePhoto(selectedPhoto);
      }

      setProfile(updatedProfile);
      setForm({
        firstName: updatedProfile.firstName || '',
        lastName: updatedProfile.lastName || '',
        email: updatedProfile.email || '',
        location: updatedProfile.location || '',
        about: updatedProfile.about || '',
      });
      setSelectedPhoto(null);
      setIsEditing(false);
      setSaveMessage('Profile updated.');
    } catch (requestError) {
      setSaveError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="profile-page">
      <div className="profile-header">
        <h1>{isPublicProfile ? 'Traveler Profile' : 'My Profile'}</h1>
        <p>
          {isPublicProfile
            ? 'View traveler details and reviews from pet owners.'
            : 'Manage the personal details other PetFly users see.'}
        </p>
      </div>

      {status === 'loading' && <div className="profile-state">Loading profile...</div>}

      {status === 'error' && (
        <div className="profile-state profile-state-error">
          <strong>Could not load profile.</strong>
          <span>{error}</span>
        </div>
      )}

      {status === 'success' && profile && (
        <section className="profile-layout">
          <aside className="profile-summary">
            <div className="profile-photo" aria-hidden="true">
              {displayedPhoto ? <img src={displayedPhoto} alt="" /> : <span>{initials}</span>}
            </div>
            <h2>{getFullName(profile) || 'Unnamed user'}</h2>
            {!isPublicProfile && <p>{profile.email || 'Not added'}</p>}
            <div className="profile-badges">
              <span>{profile.profileCompleted ? 'Profile complete' : 'Profile incomplete'}</span>
            </div>
          </aside>

          <section className="profile-details">
            <div className="profile-card">
              <div className="profile-card-header">
                <h3>Personal Details</h3>
                {!isPublicProfile && !isEditing && (
                  <button className="profile-edit-button" onClick={() => setIsEditing(true)} type="button">
                    Edit profile
                  </button>
                )}
              </div>

              {saveMessage && <p className="profile-save-message">{saveMessage}</p>}
              {saveError && <p className="profile-save-error">{saveError}</p>}

              {isEditing ? (
                <form className="profile-form" onSubmit={handleSubmit}>
                  <div className="profile-photo-upload">
                    <div className="profile-photo-upload-preview" aria-hidden="true">
                      {displayedPhoto ? <img src={displayedPhoto} alt="" /> : <span>{initials}</span>}
                    </div>
                    <label>
                      Profile photo
                      <input accept="image/*" onChange={handlePhotoChange} type="file" />
                      <span>{selectedPhoto ? selectedPhoto.name : 'Upload an image file.'}</span>
                    </label>
                  </div>

                  <div className="profile-form-grid">
                    <label>
                      First name
                      <input name="firstName" onChange={handleChange} required type="text" value={form.firstName} />
                    </label>
                    <label>
                      Last name
                      <input name="lastName" onChange={handleChange} required type="text" value={form.lastName} />
                    </label>
                    <label>
                      Email
                      <input name="email" onChange={handleChange} required type="email" value={form.email} />
                    </label>
                    <label>
                      Location
                      <input
                        name="location"
                        onChange={handleChange}
                        placeholder="Munich, Germany"
                        type="text"
                        value={form.location}
                      />
                    </label>
                    <label className="profile-form-wide">
                      About
                      <textarea
                        maxLength={1000}
                        name="about"
                        onChange={handleChange}
                        placeholder="Tell owners and travelers a little about yourself."
                        rows={5}
                        value={form.about}
                      />
                      <span>{form.about.length}/1000</span>
                    </label>
                  </div>
                  <div className="profile-form-actions">
                    <button className="profile-secondary-button" disabled={isSaving} onClick={handleCancel} type="button">
                      Cancel
                    </button>
                    <button className="profile-primary-button" disabled={isSaving} type="submit">
                      {isSaving ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <dl>
                  <div>
                    <dt>First name</dt>
                    <dd>{profile.firstName || 'Not added'}</dd>
                  </div>
                  <div>
                    <dt>Last name</dt>
                    <dd>{profile.lastName || 'Not added'}</dd>
                  </div>
                  {!isPublicProfile && (
                    <div>
                      <dt>Email</dt>
                      <dd>{profile.email || 'Not added'}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Location</dt>
                    <dd>{profile.location || 'Not added'}</dd>
                  </div>
                </dl>
              )}
            </div>

            {!isEditing && (
              <div className="profile-card">
                <h3>About</h3>
                <p className="profile-about">{profile.about || 'No profile description yet.'}</p>
              </div>
            )}

            <div className="profile-card profile-meta-card">
              <div>
                <span className="material-symbols-outlined">star</span>
                <strong>
                  {reviewStats
                    ? reviewStats.averageRating.toFixed(1)
                    : Number(profile.avgRating || 0).toFixed(1)}
                </strong>
                <small>Average rating</small>
              </div>
              <div>
                <span className="material-symbols-outlined">calendar_month</span>
                <strong>{formatJoinDate(profile.createdAt)}</strong>
                <small>Member since</small>
              </div>
            </div>

            <div className="profile-card profile-reviews-card">
              <div className="profile-card-header">
                <h3>Traveler Reviews</h3>
                {reviewStats && <span>{reviewStats.reviewCount} reviews</span>}
              </div>

              {reviewsStatus === 'loading' && (
                <p className="profile-reviews-state">Loading reviews...</p>
              )}

              {reviewsStatus === 'error' && (
                <p className="profile-reviews-state error">{reviewsError}</p>
              )}

              {reviewsStatus === 'success' && reviewStats?.reviews?.length === 0 && (
                <p className="profile-reviews-state">No traveler reviews yet.</p>
              )}

              {reviewsStatus === 'success' && reviewStats?.reviews?.length > 0 && (
                <div className="profile-review-list">
                  {reviewStats.reviews.map((review) => {
                    const reviewerName = getFullName(review.reviewerId) || 'Pet owner';
                    const reviewerId = getEntityId(review.reviewerId);
                    const pet = review.requestId?.pet;

                    return (
                      <article className="profile-review-item" key={review._id}>
                        <div className="profile-review-topline">
                          {reviewerId ? (
                            <button
                              className="profile-review-name-button"
                              onClick={() => navigate(`/profile/${reviewerId}`)}
                              type="button"
                            >
                              {reviewerName}
                            </button>
                          ) : (
                            <strong>{reviewerName}</strong>
                          )}
                          <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                        </div>
                        {pet && (
                          <p className="profile-review-trip">
                            {pet.name} - {[pet.breed, pet.type].filter(Boolean).join(' - ')}
                          </p>
                        )}
                        {review.reviewText && <p className="profile-review-text">{review.reviewText}</p>}
                        {review.quickTags?.length > 0 && (
                          <div className="profile-review-tags">
                            {review.quickTags.map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}
