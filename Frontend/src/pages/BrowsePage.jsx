import { useState, useEffect } from 'react';
import axios from 'axios';
import RequestCard from '../components/RequestCard.jsx';

const API_URL = process.env.REACT_APP_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

const PET_TABS = [
  { label: 'All pets', value: '' },
  { label: 'Dogs only', value: 'Dog' },
  { label: 'Cats only', value: 'Cat' },
];

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Soonest departure', value: 'soonest' },
  { label: 'Highest pay', value: 'highest_pay' },
];

export default function BrowsePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [petType, setPetType] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const params = new URLSearchParams();
    if (petType) params.set('petType', petType);
    if (sort) params.set('sort', sort);

    if (search.trim()) {
      const parts = search.split(/\s+to\s+/i);
      if (parts[0]) params.set('from', parts[0].trim());
      if (parts[1]) params.set('to', parts[1].trim());
    }

    setLoading(true);
    axios
      .get(`${API_URL}/api/requests?${params}`)
      .then((res) => setRequests(res.data))
      .catch((err) => console.error('Failed to fetch requests:', err))
      .finally(() => setLoading(false));
  }, [petType, sort, search]);

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 m-0">Browse pet requests</h1>
        <p className="mt-2 text-sm text-slate-500">
          Find pets traveling on routes you're already taking.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          * Prices do not include pet tickets and commission fee.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mt-6">
        <div className="flex-1 flex items-center gap-2.5 px-4 h-12 border border-slate-200 rounded-xl bg-white transition-all focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
          <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
          <input
            type="text"
            className="flex-1 border-none outline-none text-sm text-slate-700 bg-transparent placeholder:text-slate-400"
            placeholder="Search by route (e.g., London to New York)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mt-5">
        <div className="flex gap-1">
          {PET_TABS.map(({ label, value }) => (
            <button
              key={value}
              className={`px-4 py-2 rounded-lg border-none text-sm font-medium cursor-pointer transition-all ${
                petType === value
                  ? 'bg-red-50 text-red-400'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              onClick={() => setPetType(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          className="px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white cursor-pointer outline-none focus:border-blue-300"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-center text-slate-400 py-16">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-center text-slate-400 py-16">No pet requests found.</p>
      ) : (
        <div className="grid grid-cols-3 gap-6 mt-6 max-[768px]:grid-cols-2 max-[580px]:grid-cols-1">
          {requests.map((req) => (
            <RequestCard key={req._id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}
