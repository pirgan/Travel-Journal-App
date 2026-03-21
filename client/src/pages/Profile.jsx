import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-forest mb-8">Profile</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-sand p-6 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-forest text-white flex items-center justify-center text-3xl font-semibold">
          {user?.name?.[0]?.toUpperCase()}
        </div>

        <div className="text-center">
          <p className="text-xl font-semibold text-gray-800">{user?.name}</p>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="mt-8 w-full py-3 rounded-full border border-terracotta text-terracotta text-sm font-medium hover:bg-terracotta hover:text-white transition"
      >
        Sign out
      </button>
    </div>
  );
}
