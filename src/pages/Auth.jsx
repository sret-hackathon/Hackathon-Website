import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

const Auth = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="p-8" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh'}}>
      <div className="white-panel" style={{width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}>
        <h2 className="text-main mb-4 text-center" style={{fontSize: '2rem'}}>{isLogin ? 'Welcome Back' : 'Join HackClub'}</h2>
        {error && <div style={{background: '#fef2f2', color: 'var(--danger)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem'}}>{error}</div>}
        
        <form onSubmit={handleAuth} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Full Name" 
              className="form-control"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required={!isLogin}
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            className="form-control"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="form-control"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
          <button type="submit" className="btn-primary mt-4" style={{width: '100%', borderRadius: '4px'}}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-muted text-center mt-4" style={{cursor: 'pointer', fontWeight: 500}} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </p>
      </div>
    </div>
  );
};

export default Auth;
