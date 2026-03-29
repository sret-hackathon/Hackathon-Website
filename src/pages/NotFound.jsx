import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      animation: 'fadeIn 0.5s',
      padding: '2rem'
    }}>
      <div style={{ fontSize: '6rem', marginBottom: '1rem', lineHeight: 1 }}>⚡</div>
      <h1 style={{
        fontSize: '6rem',
        fontWeight: 900,
        color: 'var(--primary-blue)',
        lineHeight: 1,
        marginBottom: '0.5rem'
      }}>404</h1>
      <h2 className="text-main text-2xl mb-2">Page Not Found</h2>
      <p className="text-muted mb-4" style={{ maxWidth: '400px', lineHeight: 1.7 }}>
        Looks like this page doesn't exist or was moved. Head back to the platform and keep building!
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn-primary" style={{ borderRadius: '25px', padding: '0.75rem 1.5rem' }}>
          🏠 Back to Home
        </Link>
        <Link to="/hackathons" className="btn-outline" style={{ borderRadius: '25px', padding: '0.75rem 1.5rem' }}>
          🏆 View Hackathons
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
