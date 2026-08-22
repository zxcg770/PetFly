import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyRequests } from '../api/requests';
import api from '../api/axios';

const PET_EMOJI = { Dog: '🐕', Cat: '🐈', Other: '🐾' };
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

function petImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

const STATUS_CONFIG = {
  open: { label: 'Open', classes: 'bg-blue-100 text-blue-600' },
  accepted: { label: 'Accepted', classes: 'bg-orange-100 text-orange-600' },
  completed: { label: 'Completed', classes: 'bg-green-100 text-green-600' },
};

function formatDateRange(departure, returnDate) {
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const dep = new Date(departure);
  if (!returnDate) return fmtDate(dep);
  const ret = new Date(returnDate);
  return `${fmtDate(dep)} – ${fmtDate(ret)}`;
}

export default function MyRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const createLink = user ? '/create-request' : '/auth';

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(true);
    getMyRequests()
      .then((data) => setRequests(data.filter((r) => r.status !== 'pending')))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/requests/${confirmDeleteId}`);
      setRequests((prev) => prev.filter((r) => r._id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete request.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">Delete this request?</h3>
            <p className="mt-3 text-sm text-slate-500">
              If you delete this post, you won't be able to get your listing fee back. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-400 hover:bg-red-500 text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Requests</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your pet transport requests</p>
        </div>
        <Link
          to={createLink}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-400 hover:bg-red-500 text-white font-semibold text-sm transition-colors no-underline"
        >
          <span>+</span> New request
        </Link>
      </div>

      {/* Filters */}
      {requests.length > 0 && (
        <div className="flex gap-2 mt-6 flex-wrap">
          {['all', 'open', 'accepted', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${activeFilter === f ? 'bg-red-400 text-white border-red-400' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <p className="text-center text-slate-400 py-16">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500 py-16">{error}</p>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl text-slate-300 mb-4">📋</div>
          <h2 className="text-xl font-semibold text-slate-600">You haven't posted requests yet</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            Create your first pet transport request to find a traveler for your pet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-8">
          {requests.filter(r => activeFilter === 'all' || r.status === activeFilter).map((req) => {
            const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.open;
            const isAccepted = req.status === 'accepted';
            return (
              <div
                key={req._id}
                onClick={() => {
                  if (req.status === 'completed') return;
                  if (isAccepted && req.acceptedOfferId) navigate(`/tracker/${req.acceptedOfferId}`);
                  else navigate(`/request/${req._id}`);
                }}
                className={`flex items-center gap-5 p-6 bg-white border border-slate-200 rounded-2xl transition-all no-underline ${req.status === 'completed' ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:border-slate-300'}`}
              >
                {/* Avatar */}
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                  {petImageUrl(req.pet?.image) ? (
                    <img
                      src={petImageUrl(req.pet.image)}
                      alt={req.pet.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    PET_EMOJI[req.pet?.type] || '🐾'
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-800">{req.pet?.name}</h3>
                  <p className="text-sm text-slate-500">{req.pet?.breed}</p>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {req.from} → {req.to} &nbsp;&nbsp; {formatDateRange(req.departureDate, req.returnDate)}
                  </p>
                  {req.status === 'open' && req.offerCount > 0 && (
                    <p className="mt-1 text-xs font-medium text-red-400">
                      {req.offerCount} offer{req.offerCount !== 1 ? 's' : ''} received
                    </p>
                  )}
                  {req.acceptedTraveler && (
                    <p className="mt-1 text-xs text-slate-600">
                      Traveling with {req.acceptedTraveler.firstName} {req.acceptedTraveler.lastName?.charAt(0)}.
                    </p>
                  )}
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${status.classes}`}>
                    {status.label}
                  </span>
                  {req.status === 'open' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(req._id); }}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                  {req.status !== 'completed' && <span className="text-slate-300 text-lg">→</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
