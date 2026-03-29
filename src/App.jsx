import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { auth, db } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Hackathons from './pages/Hackathons'
import HackathonDetails from './pages/HackathonDetails'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminSetup from './pages/AdminSetup'
import About from './pages/About'
import NotFound from './pages/NotFound'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [toast, setToast] = useState(null)

  useEffect(() => {
    window.toast = (msg) => window.dispatchEvent(new CustomEvent('showToast', { detail: msg }));
    
    const handleToast = (e) => {
      setToast(e.detail);
      setTimeout(() => setToast(null), 3500);
    };
    window.addEventListener('showToast', handleToast);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        const userData = userDoc.exists() ? userDoc.data() : { role: 'student' }
        setUser({ ...firebaseUser, ...userData })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => {
      unsubscribe();
      window.removeEventListener('showToast', handleToast);
    }
  }, [])

  return (
    <div className="app-container">
      {toast && (
        <div style={{position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '30px', fontWeight: 'bold', zIndex: 99999, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)', animation: 'fadeIn 0.3s ease-out'}}>
          ✨ {toast}
        </div>
      )}
      <Navbar user={user} />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/hackathons" element={<Hackathons />} />
          <Route path="/hackathons/:id" element={<HackathonDetails />} />
          
          <Route path="/about" element={<About />} />
          <Route path="/admin-setup" element={<AdminSetup />} />

          <Route path="/dashboard/student" element={
            <ProtectedRoute user={user} loading={loading} allowedRoles={['student']}>
              <StudentDashboard user={user} />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/admin" element={
            <ProtectedRoute user={user} loading={loading} allowedRoles={['admin', 'super_admin', 'faculty_admin']}>
              <AdminDashboard user={user} />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
