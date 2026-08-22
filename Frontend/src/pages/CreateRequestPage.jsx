import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPet, createRequest } from '../api/requests';
import ListingPaymentStep from '../components/ListingPaymentStep';

const STEPS = ['Pet info', 'Trip details', 'Price', 'Review', 'Payment'];
const SERVICE_FEE_RATE = 0.15;
const MAX_PHOTOS = 4;
const TODAY = new Date().toISOString().split('T')[0];

const AIRPORTS = [
  {
    group: 'Germany', options: [
      'Frankfurt (FRA)', 'Munich (MUC)', 'Berlin (BER)',
      'Düsseldorf (DUS)', 'Hamburg (HAM)', 'Stuttgart (STR)', 'Cologne/Bonn (CGN)',
    ]
  },
  {
    group: 'China', options: [
      'Beijing Capital (PEK)', 'Beijing Daxing (PKX)',
      'Shanghai Pudong (PVG)', 'Shanghai Hongqiao (SHA)',
      'Guangzhou (CAN)', 'Shenzhen (SZX)', 'Chengdu Tianfu (TFU)',
      'Chongqing (CKG)', 'Hangzhou (HGH)', "Xi'an (XIY)",
    ]
  },
  {
    group: 'Turkey', options: [
      'Istanbul (IST)', 'Istanbul Sabiha Gökçen (SAW)',
      'Ankara Esenboğa (ESB)', 'Antalya (AYT)', 'Izmir (ADB)',
    ]
  },
];

const AIRLINES = [
  'Lufthansa', 'Turkish Airlines', 'Air China', 'China Southern Airlines',
  'China Eastern Airlines', 'Pegasus Airlines', 'SunExpress', 'Condor',
  'Eurowings', 'Emirates', 'Qatar Airways', 'British Airways',
  'KLM', 'Air France', 'Singapore Airlines', 'Cathay Pacific',
  'Hainan Airlines', 'Xiamen Airlines', 'Spring Airlines',
];

function isValidPositiveNumber(val) {
  if (val === '') return false;
  const n = Number(val);
  return !isNaN(n) && n > 0;
}

function validateWeight(val) {
  if (val === '') return 'Weight is required';
  const n = Number(val);
  if (isNaN(n) || n <= 0) return 'Please enter a positive number';
  if (n > 50) return 'Maximum weight is 50 kg';
  return '';
}

function validateAge(val) {
  if (val === '') return 'Age is required';
  const n = Number(val);
  if (isNaN(n) || n <= 0) return 'Please enter a positive number';
  if (n > 100) return 'Maximum age is 100 years';
  return '';
}

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const airlineRef = useRef(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdRequestId, setCreatedRequestId] = useState(null);

  const [pet, setPet] = useState({
    name: '', type: 'Dog', customType: '', breed: '', weight: '', age: '', notes: '',
  });
  const [weightTouched, setWeightTouched] = useState(false);
  const [ageTouched, setAgeTouched] = useState(false);

  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [trip, setTrip] = useState({
    from: '', to: '', customFrom: '', customTo: '', flexibleDates: false,
    departureDate: '', departureDateEnd: '', preferredAirline: '',
  });
  const [airlineQuery, setAirlineQuery] = useState('');
  const [showAirlines, setShowAirlines] = useState(false);

  const [price, setPrice] = useState('');

  useEffect(() => {
    const handler = (e) => {
      if (airlineRef.current && !airlineRef.current.contains(e.target)) setShowAirlines(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredAirlines = airlineQuery.length >= 1
    ? AIRLINES.filter((a) => a.toLowerCase().includes(airlineQuery.toLowerCase()))
    : [];

  const weightError = weightTouched ? validateWeight(pet.weight) : '';
  const ageError = ageTouched ? validateAge(pet.age) : '';

  const departureDateError = trip.departureDate && trip.departureDate < TODAY
    ? 'Departure date must be today or later' : '';
  const departureDateEndError = trip.departureDateEnd && trip.departureDateEnd < trip.departureDate
    ? 'Latest date must be after earliest date'
    : (trip.departureDateEnd && trip.departureDateEnd < TODAY ? 'Date must be today or later' : '');
  const resolvedFrom = trip.from === '__other__' ? trip.customFrom.trim() : trip.from;
  const resolvedTo = trip.to === '__other__' ? trip.customTo.trim() : trip.to;
  const sameAirportError = resolvedFrom && resolvedTo && resolvedFrom === resolvedTo
    ? 'Departure and destination cannot be the same' : '';

  const addPhotos = (files) => {
    const incoming = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    if (incoming.length === 0) return;
    setPhotos((prev) => [...prev, ...incoming]);
    setPreviews((prev) => [...prev, ...incoming.map((f) => URL.createObjectURL(f))]);
  };
  const removePhoto = (index) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const serviceFee = price ? Math.max(6, Math.round(Number(price) * SERVICE_FEE_RATE * 100) / 100) : 0;
  const total = price ? Number(price) + serviceFee : 0;

  const canAdvance = () => {
    if (step === 0) {
      if (!pet.name || !pet.type || !pet.breed) return false;
      if (pet.type === 'Other' && !pet.customType.trim()) return false;
      if (validateWeight(pet.weight)) return false;
      if (validateAge(pet.age)) return false;
      return true;
    }
    if (step === 1) {
      if (!trip.from || !trip.to || !trip.departureDate) return false;
      if (trip.from === '__other__' && !trip.customFrom.trim()) return false;
      if (trip.to === '__other__' && !trip.customTo.trim()) return false;
      const resolvedFrom = trip.from === '__other__' ? trip.customFrom.trim() : trip.from;
      const resolvedTo = trip.to === '__other__' ? trip.customTo.trim() : trip.to;
      if (resolvedFrom === resolvedTo) return false;
      if (trip.departureDate < TODAY) return false;
      if (trip.flexibleDates) {
        if (!trip.departureDateEnd) return false;
        if (trip.departureDateEnd < trip.departureDate) return false;
      }
      return true;
    }
    if (step === 2) return price && Number(price) > 0;
    return true;
  };

  const handleNext = () => { if (step < STEPS.length - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleSubmit = () => {
    setStep(4);
  };

  const formatDateRange = () => {
    if (!trip.departureDate) return '';
    const dep = new Date(trip.departureDate + 'T00:00:00');
    const pad = (n) => String(n).padStart(2, '0');
    const fmtDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    if (trip.flexibleDates && trip.departureDateEnd) {
      const end = new Date(trip.departureDateEnd + 'T00:00:00');
      return `${fmtDate(dep)} – ${fmtDate(end)}`;
    }
    return fmtDate(dep);
  };

  const inputClass =
    'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white';
  const inputErrorClass =
    'w-full px-4 py-3 border border-red-300 rounded-xl text-sm text-slate-700 bg-red-50 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-100';
  const labelClass = 'text-sm font-semibold text-slate-800 mb-1.5';

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      {/* Back */}
      {step > 0 && (
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 mb-6 bg-transparent border-none cursor-pointer p-0"
        >
          ‹ Back
        </button>
      )}

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${i <= step ? 'bg-blue-300 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${i <= step ? 'text-slate-800' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-14 h-0.5 mx-2 ${i < step ? 'bg-blue-300' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ───── Step 1: Pet info ───── */}
      {step === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-7">Tell us about your pet</h2>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label className={labelClass}>Pet's name</label>
              <input className={inputClass} value={pet.name}
                onChange={(e) => setPet({ ...pet, name: e.target.value })} placeholder="e.g. Luna" />
            </div>
            <div className="flex flex-col">
              <label className={labelClass}>Species</label>
              <select className={inputClass} value={pet.type}
                onChange={(e) => setPet({ ...pet, type: e.target.value, customType: '' })}>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Other">Other</option>
              </select>
              {pet.type === 'Other' && (
                <input className={inputClass} style={{ marginTop: '0.5rem' }} value={pet.customType}
                  onChange={(e) => setPet({ ...pet, customType: e.target.value })}
                  placeholder="e.g. Rabbit, Hamster, Bird..." />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 mt-5">
            <div className="flex flex-col">
              <label className={labelClass}>Breed</label>
              <input className={inputClass} value={pet.breed}
                onChange={(e) => setPet({ ...pet, breed: e.target.value })} placeholder="e.g. Golden Retriever" />
            </div>
            <div className="flex flex-col">
              <label className={labelClass}>Weight · kg</label>
              <input
                className={weightError ? inputErrorClass : inputClass}
                value={pet.weight}
                onChange={(e) => setPet({ ...pet, weight: e.target.value })}
                onBlur={() => setWeightTouched(true)}
                placeholder="e.g. 25"
              />
              {weightError && <span className="text-xs text-red-500 mt-1">{weightError}</span>}
            </div>
          </div>

          <div className="flex flex-col mt-5 max-w-[48%]">
            <label className={labelClass}>Age · years</label>
            <input
              className={ageError ? inputErrorClass : inputClass}
              value={pet.age}
              onChange={(e) => setPet({ ...pet, age: e.target.value })}
              onBlur={() => setAgeTouched(true)}
              placeholder="e.g. 3"
            />
            {ageError && <span className="text-xs text-red-500 mt-1">{ageError}</span>}
          </div>

          <div className="flex flex-col mt-5">
            <label className={labelClass}>Special notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              className={`${inputClass} resize-y min-h-[100px]`}
              value={pet.notes}
              onChange={(e) => setPet({ ...pet, notes: e.target.value })}
              placeholder="Any special needs, temperament, or important information for travelers..."
            />
          </div>

          {/* Photo upload */}
          <div className="flex flex-col mt-7">
            <label className={labelClass}>Upload photos of your pet <span className="font-normal text-slate-400">(optional)</span></label>
            <p className="text-xs text-slate-400 mb-3">
              Help travelers recognize your pet. Multiple photos show different angles.
            </p>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />

            <div
              className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors"
              onClick={() => photos.length < MAX_PHOTOS && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files); }}
            >
              <span className="text-2xl text-slate-300">⬆</span>
              <span className="text-sm text-slate-600">Drag and drop photos here</span>
              <span className="text-xs text-slate-400">or click to browse</span>
              <button type="button"
                className="mt-2 px-5 py-2 rounded-lg bg-red-400 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                disabled={photos.length >= MAX_PHOTOS}>
                Choose files
              </button>
            </div>

            {previews.length > 0 && (
              <div className="flex gap-3 mt-4">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={src} alt={`Pet photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-2xl text-slate-300 hover:border-slate-300 hover:text-slate-400 transition-colors cursor-pointer bg-transparent">
                    +
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-slate-200">
            <button
              className="px-8 py-3 rounded-xl bg-red-400 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
              disabled={!canAdvance()} onClick={handleNext}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ───── Step 2: Trip details ───── */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-7">Trip details</h2>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label className={labelClass}>Departure airport</label>
              <select className={sameAirportError ? inputErrorClass : inputClass} value={trip.from}
                onChange={(e) => setTrip({ ...trip, from: e.target.value, customFrom: '' })}>
                <option value="">Select airport</option>
                {AIRPORTS.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map((a) => <option key={a} value={a}>{a}</option>)}
                  </optgroup>
                ))}
                <option value="__other__">Other airport</option>
              </select>
              {trip.from === '__other__' && (
                <input className={inputClass} style={{ marginTop: '0.5rem' }} value={trip.customFrom}
                  onChange={(e) => setTrip({ ...trip, customFrom: e.target.value })}
                  placeholder="Enter airport name, e.g. Tokyo Narita (NRT)" />
              )}
            </div>
            <div className="flex flex-col">
              <label className={labelClass}>Destination airport</label>
              <select className={sameAirportError ? inputErrorClass : inputClass} value={trip.to}
                onChange={(e) => setTrip({ ...trip, to: e.target.value, customTo: '' })}>
                <option value="">Select airport</option>
                {AIRPORTS.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map((a) => <option key={a} value={a}>{a}</option>)}
                  </optgroup>
                ))}
                <option value="__other__">Other airport</option>
              </select>
              {trip.to === '__other__' && (
                <input className={inputClass} style={{ marginTop: '0.5rem' }} value={trip.customTo}
                  onChange={(e) => setTrip({ ...trip, customTo: e.target.value })}
                  placeholder="Enter airport name, e.g. Tokyo Narita (NRT)" />
              )}
              {sameAirportError && <span className="text-xs text-red-500 mt-1">{sameAirportError}</span>}
            </div>
          </div>

          <div className="flex flex-col mt-5">
            <label className={labelClass}>Date flexibility</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${!trip.flexibleDates ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="dateFlex" className="accent-blue-500"
                  checked={!trip.flexibleDates}
                  onChange={() => setTrip({ ...trip, flexibleDates: false, departureDateEnd: '' })} />
                <div>
                  <strong className="block text-sm text-slate-800">Fixed date</strong>
                  <span className="text-xs text-slate-500">Must be on this exact date</span>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${trip.flexibleDates ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="dateFlex" className="accent-blue-500"
                  checked={trip.flexibleDates}
                  onChange={() => setTrip({ ...trip, flexibleDates: true })} />
                <div>
                  <strong className="block text-sm text-slate-800">Flexible dates</strong>
                  <span className="text-xs text-slate-500">Select a date range</span>
                </div>
              </label>
            </div>
          </div>

          {trip.flexibleDates ? (
            <div className="grid grid-cols-2 gap-5 mt-5">
              <div className="flex flex-col">
                <label className={labelClass}>Earliest departure</label>
                <input type="date" className={departureDateError ? inputErrorClass : inputClass} min={TODAY}
                  value={trip.departureDate}
                  onChange={(e) => setTrip({ ...trip, departureDate: e.target.value })} />
                {departureDateError && <span className="text-xs text-red-500 mt-1">{departureDateError}</span>}
              </div>
              <div className="flex flex-col">
                <label className={labelClass}>Latest departure</label>
                <input type="date" className={departureDateEndError ? inputErrorClass : inputClass}
                  min={trip.departureDate || TODAY}
                  value={trip.departureDateEnd}
                  onChange={(e) => setTrip({ ...trip, departureDateEnd: e.target.value })} />
                {departureDateEndError && <span className="text-xs text-red-500 mt-1">{departureDateEndError}</span>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col mt-5 max-w-[48%]">
              <label className={labelClass}>Departure date</label>
              <input type="date" className={departureDateError ? inputErrorClass : inputClass} min={TODAY}
                value={trip.departureDate}
                onChange={(e) => setTrip({ ...trip, departureDate: e.target.value })} />
              {departureDateError && <span className="text-xs text-red-500 mt-1">{departureDateError}</span>}
            </div>
          )}

          {/* Airline autocomplete */}
          <div className="flex flex-col mt-5 relative" ref={airlineRef}>
            <label className={labelClass}>
              Preferred airline <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              className={inputClass}
              value={airlineQuery || trip.preferredAirline}
              onChange={(e) => {
                setAirlineQuery(e.target.value);
                setTrip({ ...trip, preferredAirline: e.target.value });
                setShowAirlines(true);
              }}
              onFocus={() => { if (airlineQuery.length >= 1) setShowAirlines(true); }}
              placeholder="Start typing, e.g. Luft..."
            />
            {showAirlines && filteredAirlines.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                {filteredAirlines.map((a) => (
                  <button key={a} type="button"
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-none bg-transparent"
                    onClick={() => {
                      setTrip({ ...trip, preferredAirline: a });
                      setAirlineQuery(a);
                      setShowAirlines(false);
                    }}>
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mt-5">
            <Link to="/regulation" target="_blank" className="text-red-400 hover:underline text-sm font-medium no-underline">
              View travel requirements & regulations →
            </Link>
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-slate-200">
            <button
              className="px-8 py-3 rounded-xl bg-red-400 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
              disabled={!canAdvance()} onClick={handleNext}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ───── Step 3: Price ───── */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-800">Set your budget</h2>
          <p className="text-sm text-slate-500 mt-1 mb-7">
            This is what you'll pay the traveler for chaperoning your pet.
          </p>

          <div className="flex flex-col">
            <label className={labelClass}>Your budget</label>
            <div className="flex items-center gap-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 transition-all focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white">
              <span className="text-sm text-slate-400">€</span>
              <input type="number" min="1"
                className="flex-1 border-none outline-none bg-transparent text-sm text-slate-700 p-0"
                value={price} onChange={(e) => setPrice(e.target.value)} placeholder="150" />
            </div>
          </div>

          {price && Number(price) > 0 && (
            <div className="bg-slate-50 rounded-xl p-5 mt-4">
              <div className="flex justify-between py-2 text-sm text-slate-600">
                <span>Traveler receives</span><span>€{Number(price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-slate-600">
                <span>PetFly service fee</span><span>€{serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold text-slate-800 border-t border-slate-200 mt-2 pt-3">
                <span>Total you pay</span><span>€{total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-8 pt-6 border-t border-slate-200">
            <button
              className="px-8 py-3 rounded-xl bg-red-400 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
              disabled={!canAdvance()} onClick={handleNext}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ───── Step 4: Review ───── */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-800">Review your request</h2>
          <p className="text-sm text-slate-500 mt-1 mb-7">
            This is how your listing will appear to travelers.
          </p>

          <div className="flex gap-5 bg-slate-50 rounded-2xl p-6">
            <div className="w-24 h-24 rounded-xl bg-slate-200 flex items-center justify-center text-5xl shrink-0 overflow-hidden">
              {previews.length > 0 ? (
                <img src={previews[0]} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                pet.type === 'Dog' ? '🐕' : pet.type === 'Cat' ? '🐈' : '🐾'
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">{pet.name}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {pet.breed}
                {pet.age ? ` · ${pet.age} years` : ''}
                {pet.weight ? ` · ${pet.weight} kg` : ''}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                {resolvedFrom} → {resolvedTo} &nbsp;·&nbsp; {formatDateRange()}
              </p>
              <div className="flex gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-500">
                  €{Number(price).toFixed(0)}
                </span>
                {trip.flexibleDates && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-600">
                    Flexible dates
                  </span>
                )}
                {trip.preferredAirline && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {trip.preferredAirline}
                  </span>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end mt-8 pt-6 border-t border-slate-200">
            <button
              className="px-8 py-3 rounded-xl bg-red-400 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
              disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Processing...' : 'Continue to payment'}
            </button>
          </div>
        </div>
      )}

      {/* ───── Step 5: Payment ───── */}
      {step === 4 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-800">Pay service fee</h2>
          <p className="text-sm text-slate-500 mt-1 mb-7">
            A small fee is required to publish your request to travelers.
          </p>
          <ListingPaymentStep
            budgetPrice={Number(price)}
            petData={{ name: pet.name, type: pet.type === 'Other' ? pet.customType.trim() : pet.type, breed: pet.breed, weight: pet.weight ? Number(pet.weight) : undefined, age: pet.age ? Number(pet.age) : undefined, notes: pet.notes || undefined }}
            photos={photos}
            tripData={{ from: resolvedFrom, to: resolvedTo, departureDate: trip.departureDate, returnDate: trip.flexibleDates ? trip.departureDateEnd : undefined, flexibleDates: trip.flexibleDates, preferredAirline: trip.preferredAirline || undefined, price: Number(price) }}
            onPaymentSuccess={() => navigate('/my-requests')}
          />
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-700">
              <strong>Return policy:</strong> If you don't receive any offers before your departure date, your service fee will be fully refunded.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
