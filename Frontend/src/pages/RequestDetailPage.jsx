import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRequestById } from '../api/requests';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { createConversation, sendMessage } from '../api/messages';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

function formatDateRange(departure, returnDate) {
  const dep = new Date(departure);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const depStr = `${months[dep.getMonth()]} ${dep.getDate()}`;
  if (!returnDate) return `${depStr}, ${dep.getFullYear()}`;
  const ret = new Date(returnDate);
  return `${depStr}-${ret.getDate()}, ${ret.getFullYear()}`;
}

function formatMemberSince(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.getFullYear().toString();
}

function photoUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [offerPrice, setOfferPrice] = useState('');
  const [petTicketPrice, setPetTicketPrice] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSendOffer = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSending(true);
    try {
      const finalOfferPrice = offerPrice ? Number(offerPrice) : request.price;
      const finalTicketPrice = petTicketPrice ? Number(petTicketPrice) : 0;

      const offerRes = await api.post(`/requests/${id}/offers`, {
        offerPrice: finalOfferPrice,
        petTicketPrice: finalTicketPrice,
      });
      const createdOfferId = offerRes.data._id;

      const travelerName = user?.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : 'A traveler';

      const conversation = await createConversation(id);
      await sendMessage(conversation._id, {
        text: `${travelerName} sent an offer`,
        offerId: createdOfferId,
      });

      toast.success('Offer sent successfully!');
      navigate('/my-offers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    getRequestById(id)
      .then((data) => {
        setRequest(data);
        setPhotoIndex(0);
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-center text-slate-400 py-20">Loading...</p>;
  if (error) return <p className="text-center text-red-500 py-20">{error}</p>;
  if (!request) return null;

  const { pet, owner } = request;
  const allPhotos = pet?.photos?.length ? pet.photos : pet?.image ? [pet.image] : [];
  const currentPhoto = allPhotos[photoIndex] ? photoUrl(allPhotos[photoIndex]) : null;
  const hasMultiple = allPhotos.length > 1;

  const prevPhoto = () => setPhotoIndex((i) => (i - 1 + allPhotos.length) % allPhotos.length);
  const nextPhoto = () => setPhotoIndex((i) => (i + 1) % allPhotos.length);

  const ownerName = owner
    ? `${owner.firstName} ${owner.lastName?.charAt(0)}.`
    : 'Unknown';

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      {/* Back link */}
      <Link
        to="/browse"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 no-underline mb-6"
      >
        ‹ Back to browse
      </Link>

      <div className="flex gap-8 items-start">
        {/* Left column */}
        <div className="flex-1 min-w-0">
          {/* Photo carousel */}
          {currentPhoto ? (
            <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3]">
              <img
                src={currentPhoto}
                alt={pet?.name}
                className="w-full h-full object-cover"
              />
              {hasMultiple && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-600 text-lg shadow transition-colors cursor-pointer border-none"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-600 text-lg shadow transition-colors cursor-pointer border-none"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allPhotos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={`w-2 h-2 rounded-full border-none cursor-pointer transition-colors ${
                          i === photoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-100 aspect-[4/3] flex items-center justify-center text-7xl text-slate-300">
              {pet?.type === 'Dog' ? '🐕' : pet?.type === 'Cat' ? '🐈' : '🐾'}
            </div>
          )}

          {/* Pet info card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 mt-6">
            <h1 className="text-3xl font-bold text-slate-800">{pet?.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {pet?.breed}
              {pet?.age ? ` · ${pet.age} years` : ''}
              {pet?.weight ? ` · ${pet.weight} kg` : ''}
            </p>

            {/* Route & date */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
                <span className="text-blue-400 text-xl">📍</span>
                <div>
                  <p className="text-xs text-slate-400">Route</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {request.from} → {request.to}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
                <span className="text-blue-400 text-xl">📅</span>
                <div>
                  <p className="text-xs text-slate-400">Date range</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {formatDateRange(request.departureDate, request.returnDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Special requirements / notes */}
            {pet?.notes && (
              <>
                <div className="h-px bg-slate-100 my-6" />
                <h3 className="text-base font-bold text-slate-800">Special requirements</h3>
                <div className="mt-3 space-y-2">
                  {pet.notes.split('\n').filter(Boolean).map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <p className="text-sm text-slate-600">{line}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Extra info */}
            {(request.flexibleDates || request.preferredAirline) && (
              <>
                <div className="h-px bg-slate-100 my-6" />
                <div className="flex flex-wrap gap-2">
                  {request.flexibleDates && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-600">
                      Flexible dates
                    </span>
                  )}
                  {request.preferredAirline && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-500">
                      {request.preferredAirline}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Owner card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">About the owner</h3>
            <Link
              to={`/profile/${owner?._id}`}
              className="flex items-center gap-4 no-underline group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl shrink-0">
                👤
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800 group-hover:underline">
                    {ownerName}
                  </span>
                  {owner?.avgRating > 0 && (
                    <span className="text-xs text-slate-500">
                      ⭐ {owner.avgRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Member since {formatMemberSince(owner?.createdAt)}
                  {owner?.isVerified && (
                    <span className="ml-2 text-green-500">✓ Verified ID</span>
                  )}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right sidebar — offer panel */}
        <div className="w-80 shrink-0 sticky top-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="text-center pb-5 border-b border-slate-100">
              <p className="text-3xl font-bold text-red-400">€{request.price}</p>
              <p className="text-xs text-slate-400 mt-1">Offered to traveler</p>
            </div>

            <div className="mt-5">
              <h3 className="text-base font-bold text-slate-800">Send an offer</h3>
              <label className="flex items-center gap-1 text-sm text-slate-600 mt-3 mb-1.5">
                Your fee
                <span className="relative group cursor-default">
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-xs flex items-center justify-center font-bold">?</span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    This is the amount that will go directly to you for chaperoning the pet.
                  </span>
                </span>
              </label>
              <div className="flex items-center gap-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white transition-all">
                <span className="text-sm text-slate-400">€</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="flex-1 border-none outline-none bg-transparent text-sm text-slate-700 p-0"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Math.floor(Math.abs(Number(e.target.value))) || '')}
                  placeholder={String(request.price)}
                />
              </div>

              <label className="flex items-center gap-1 text-sm text-slate-600 mt-4 mb-1.5">
                Pet ticket price
                <span className="relative group cursor-default">
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-xs flex items-center justify-center font-bold">?</span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Check how much your airline charges for pet tickets and enter that price here.
                  </span>
                </span>
              </label>
              <div className="flex items-center gap-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white transition-all">
                <span className="text-sm text-slate-400">€</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="flex-1 border-none outline-none bg-transparent text-sm text-slate-700 p-0"
                  value={petTicketPrice}
                  onChange={(e) => setPetTicketPrice(Math.floor(Math.abs(Number(e.target.value))) || '')}
                  placeholder="0"
                />
              </div>

              <button
                className="w-full mt-4 py-3 rounded-xl bg-red-400 hover:bg-red-500 text-white font-semibold text-sm transition-colors cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSendOffer}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send offer'}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
