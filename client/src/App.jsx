import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider }  from './context/AuthContext';
import ProtectedRoute    from './components/ProtectedRoute';
import Navbar            from './components/Navbar';

import Login         from './pages/Login';
import Register      from './pages/Register';
import Home          from './pages/Home';
import EntryDetail   from './pages/EntryDetail';
import CreateEntry   from './pages/CreateEntry';
import TripNarrative from './pages/TripNarrative';
import SearchResults from './pages/SearchResults';
import Profile       from './pages/Profile';

const NO_NAV = ['/login', '/register', '/entry/new'];

function ConditionalNavbar() {
  const { pathname } = useLocation();
  if (NO_NAV.includes(pathname)) return null;
  return <Navbar />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ConditionalNavbar />
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/"          element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/entry/new" element={<ProtectedRoute><CreateEntry /></ProtectedRoute>} />
          <Route path="/entry/:id" element={<ProtectedRoute><EntryDetail /></ProtectedRoute>} />
          <Route path="/narrative" element={<ProtectedRoute><TripNarrative /></ProtectedRoute>} />
          <Route path="/search"    element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
        <ToastContainer position="bottom-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}
