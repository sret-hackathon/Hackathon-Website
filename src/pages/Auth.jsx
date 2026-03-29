import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Mail, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';

const Auth = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name,
          email,
          role: 'student',
          points: 0,
          joined: new Date().toISOString()
        });
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('✅ Reset link sent! Check your inbox (and spam).');
      setTimeout(() => setShowForgot(false), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', animation: 'fadeIn 0.5s' }}>
      <div className="white-panel" style={{ width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '2.5rem', borderRadius: '16px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--primary-blue)', display: 'inline-flex', padding: '0.8rem', borderRadius: '12px', color: 'white', marginBottom: '1rem' }}>
            {showForgot ? <KeyRound size={28} /> : (isLogin ? <ShieldCheck size={28} /> : <UserIcon size={28} />)}
          </div>
          <h2 className="text-main" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {showForgot ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>
            {showForgot ? 'We will send a recovery link to your email.' : (isLogin ? 'Log in to access your hackathon dashboard.' : 'Join the elite SRET Hackathon Club today.')}
          </p>
        </div>

        {error && <div style={{ background: '#fef2f2', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #fee2e2' }}>⚠️ {error}</div>}
        {message && <div style={{ background: '#f0fdf4', color: 'var(--success)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #dcfce7' }}>{message}</div>}

        {!showForgot ? (
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {!isLogin && (
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><UserIcon size={18} /></span>
                <input type="text" placeholder="Full Name" className="form-control" style={{ paddingLeft: '3rem' }} value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} />
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Mail size={18} /></span>
              <input type="email" placeholder="Email Address" className="form-control" style={{ paddingLeft: '3rem' }} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><KeyRound size={18} /></span>
              <input type="password" placeholder="Password" className="form-control" style={{ paddingLeft: '3rem' }} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {isLogin && (
              <div style={{ textAlign: 'right' }}>
                <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>Forgot Password?</button>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', borderRadius: '10px', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              {isLogin ? 'Sign In' : 'Sign Up Free'} <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Mail size={18} /></span>
              <input type="email" placeholder="Enter your email" className="form-control" style={{ paddingLeft: '3rem' }} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', borderRadius: '10px', padding: '0.8rem' }}>Send Recovery Link</button>
            <button type="button" onClick={() => setShowForgot(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', width: '100%' }}>Back to Login</button>
          </form>
        )}

        {!showForgot && (
          <p className="text-muted text-center mt-6" style={{ fontSize: '0.9rem' }}>
            {isLogin ? "Don't have an account?" : "Already a member?"}
            <span style={{ color: 'var(--primary-blue)', cursor: 'pointer', fontWeight: 700, marginLeft: '0.5rem' }} onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Join Now" : "Sign In"}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
