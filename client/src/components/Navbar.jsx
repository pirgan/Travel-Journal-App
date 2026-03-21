import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-sand px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="font-display text-2xl font-bold text-terracotta">
        Wanderlog
      </Link>

      <Link to="/search">
        <input
          readOnly
          placeholder="Search places, memories..."
          className="hidden md:block w-72 px-4 py-2 rounded-full bg-sand text-sm text-gray-500 cursor-pointer focus:outline-none"
        />
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link
              to="/entry/new"
              className="bg-terracotta text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition"
            >
              + New Entry
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-terracotta transition"
            >
              Logout
            </button>
            <Link to="/profile" className="w-9 h-9 rounded-full bg-forest text-white flex items-center justify-center text-sm font-semibold">
              {user.name?.[0]?.toUpperCase()}
            </Link>
          </>
        ) : (
          <Link to="/login" className="text-sm text-terracotta font-medium">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
