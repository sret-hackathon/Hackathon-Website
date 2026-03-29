import { Link } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';

const Navbar = ({ user }) => {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (d) => {
        if (d.exists()) setPoints(d.data().points || 0);
      });
      return () => unsub();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="primary-nav">
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
        <img src="/sret-logo.png" alt="SRET Logo" style={{ height: '40px', objectFit: 'contain' }} />
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/hackathons" className="nav-link">Hackathons</Link>
        <Link to="/projects" className="nav-link">Student Hub</Link>
        <Link to="/leaderboard" className="nav-link">Rankings</Link>
        <Link to="/about" className="nav-link">About Club</Link>
        
        {user ? (
          <>
            <div style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)', whiteSpace: 'nowrap'}}>
              🌟 {points} XP
            </div>
            <Link to="/profile" className="nav-link">Profile</Link>
            <Link to={`/dashboard/${['admin','super_admin','faculty_admin','dean'].includes(user?.role) ? 'admin' : 'student'}`} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            {user?.role === 'super_admin' && (
              <Link to="/admin-setup" className="nav-link" style={{ color: '#f59e0b', fontWeight: 700 }}>⚙️ Manage Admins</Link>
            )}
            <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </>
        ) : (
          <div style={{display: 'flex', gap: '1rem'}}>
            <Link to="/login" className="btn-outline" style={{borderRadius: '4px'}}>Sign In</Link>
            <Link to="/register" className="btn-primary" style={{borderRadius: '4px'}}>Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
