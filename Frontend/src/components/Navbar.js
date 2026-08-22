import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConversations } from '../api/messages';
import './Navbar.css';

const NAV_ITEMS = [
  { path: '/browse', label: 'Browse', icon: 'search' },
  { path: '/my-requests', label: 'My Requests', icon: 'schedule' },
  { path: '/my-offers', label: 'My Offers', icon: 'description' },
  { path: '/messages', label: 'Messages', icon: 'chat', protected: true, showUnread: true },
  { path: '/regulation', label: 'Regulation', icon: 'gavel' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  // fetch unread messages count every 30 seconds 
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const fetchUnread = async () => {
      try {
        const conversations = await getConversations();
        const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadCount(total);
      } catch {
        
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">✈</span>
        <span className="brand-text">PetFly</span>
      </Link>

      <div className="navbar-links">
        {NAV_ITEMS.map(({ path, label, icon, protected: requiresAuth, showUnread }) => (
          <Link
            key={path}
            to={requiresAuth && !user ? '/auth' : path}
            className={`nav-link${pathname === path ? ' active' : ''}`}
          >
            <span className="nav-icon-wrap">
              <span className="material-symbols-outlined nav-icon">{icon}</span>
              {showUnread && unreadCount > 0 && (
                <span className="nav-msg-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            {label}
          </Link>
        ))}
      </div>

      <div className="navbar-right">
        <div className="avatar-wrapper" ref={menuRef}>
          <button
            className="icon-btn avatar-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {user ? (
              <span className="avatar-initial">
                {user.firstName?.charAt(0).toUpperCase()}
              </span>
            ) : (
              <span className="material-symbols-outlined">person</span>
            )}
          </button>

          {menuOpen && (
            <div className="user-dropdown">
              {user ? (
                <>
                  <div className="dropdown-user-info">
                    <span className="dropdown-name">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <span className="material-symbols-outlined dropdown-icon">person</span>
                    My Profile
                  </button>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <span className="material-symbols-outlined dropdown-icon">logout</span>
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="dropdown-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="material-symbols-outlined dropdown-icon">login</span>
                    Sign in & up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
