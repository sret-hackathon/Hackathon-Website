import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { Trophy, Users, Code, ArrowRight } from 'lucide-react';

const Home = () => {
  return (
    <div style={{animation: 'fadeIn 0.5s'}}>
      <section className="p-8 text-center mt-4 mb-4" style={{background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)', borderRadius: '12px', border: '1px solid var(--border-light)'}}>
        <h1 className="text-main" style={{fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', color: '#0a66c2'}}>Innovate. Build. Win.</h1>
        <p className="text-muted" style={{fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem'}}>
          The ultimate platform for SRET students to showcase projects, join hackathons, and build world-class portfolios.
        </p>
        <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap'}}>
          <Link to="/hackathons" className="btn-primary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            Explore Hackathons <ArrowRight size={18} />
          </Link>
          <Link to="/projects" className="btn-outline">View Student Hub</Link>
        </div>
      </section>

      <section className="p-4 mt-4" style={{display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center'}}>
        <Card hover className="text-center" style={{flex: '1', minWidth: '250px'}}>
          <Trophy size={40} style={{color: '#f59e0b', margin: '0 auto 1rem'}} />
          <h3 className="text-main text-4xl mb-2">12+</h3>
          <p className="text-muted font-bold">Hackathons Hosted</p>
        </Card>
        <Card hover className="text-center" style={{flex: '1', minWidth: '250px'}}>
          <Code size={40} style={{color: '#0a66c2', margin: '0 auto 1rem'}} />
          <h3 className="text-main text-4xl mb-2">350+</h3>
          <p className="text-muted font-bold">Projects Submitted</p>
        </Card>
        <Card hover className="text-center" style={{flex: '1', minWidth: '250px'}}>
          <Users size={40} style={{color: '#10b981', margin: '0 auto 1rem'}} />
          <h3 className="text-main text-4xl mb-2">1200+</h3>
          <p className="text-muted font-bold">Active Students</p>
        </Card>
      </section>
    </div>
  );
};
export default Home;
