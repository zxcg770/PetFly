import { Link } from 'react-router-dom';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

function formatDateRange(departure, returnDate) {
  const dep = new Date(departure);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const depStr = `${months[dep.getMonth()]} ${dep.getDate()}`;
  if (!returnDate) return depStr;
  const ret = new Date(returnDate);
  if (dep.getMonth() === ret.getMonth()) return `${depStr}-${ret.getDate()}`;
  return `${depStr} - ${months[ret.getMonth()]} ${ret.getDate()}`;
}

export default function RequestCard({ request }) {
  const { pet, from, to, departureDate, returnDate, price, _id } = request;
  const detailPath = `/request/${_id}`;

  return (
    <Link to={detailPath} className="no-underline">
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
        <div className="w-full aspect-[4/3] overflow-hidden bg-slate-100 flex items-center justify-center">
          {imageUrl(pet.image) ? (
            <img src={imageUrl(pet.image)} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">{pet.type === 'Dog' ? '🐕' : pet.type === 'Cat' ? '🐈' : '🐾'}</span>
          )}
        </div>
        <div className="px-5 pt-4 pb-5">
          <h3 className="text-lg font-bold text-slate-800 m-0">{pet.name}</h3>
          <p className="text-sm text-slate-400 mt-1">{pet.breed} &middot; {pet.type}</p>
          <p className="text-sm text-slate-600 font-medium mt-3">{from} &rarr; {to}</p>
          <p className="text-xs text-slate-400 mt-1">{formatDateRange(departureDate, returnDate)}</p>
          <div className="h-px bg-slate-100 my-3.5" />
          <p className="text-lg font-bold text-red-400 m-0">&euro;{price}</p>
        </div>
      </div>
    </Link>
  );
}
