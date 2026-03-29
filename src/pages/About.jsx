import Card from '../components/Card';
import { Link } from 'react-router-dom';
import { Zap, Trophy, Users, Code2, Target, BookOpen, ArrowRight } from 'lucide-react';

const STATS = [
  { label: 'Active Members', value: '120+', icon: '👨‍💻' },
  { label: 'Hackathons Won', value: '18', icon: '🏆' },
  { label: 'Events Conducted', value: '34', icon: '📅' },
  { label: 'Total Participants', value: '400+', icon: '🎓' },
];

const ACTIVITIES = [
  { title: 'Weekly Coding Challenges', desc: 'Sharpen your DSA skills with weekly competitive programming rounds on platforms like LeetCode and CodeChef.', icon: <Code2 size={28} color="#0a66c2"/> },
  { title: 'Hackathon Prep Workshops', desc: 'Get hands-on guidance on ideation, prototyping, pitching, and building a strong hackathon project.', icon: <Target size={28} color="#10b981"/> },
  { title: 'Quiz and Game Nights', desc: 'Fun quiz sessions covering tech trivia, coding puzzles, and industry knowledge — prizes for winners!', icon: <Zap size={28} color="#f59e0b"/> },
  { title: 'Guest Talks & Mentorship', desc: 'Industry professionals and alumni share real-world experiences to fast-track your growth.', icon: <BookOpen size={28} color="#8b5cf6"/> },
];

const TEAM = [
  { name: 'Faculty Coordinator', role: 'Faculty In-Charge', dept: 'Department of CSE', avatar: '👩‍🏫' },
  { name: 'Club President', role: 'Student Lead', dept: 'B.Tech CSE 4th Year', avatar: '👨‍💻' },
  { name: 'Technical Lead', role: 'Technical Coordinator', dept: 'B.Tech CSE 3rd Year', avatar: '👨‍💻' },
  { name: 'Events Lead', role: 'Events Coordinator', dept: 'B.Tech IT 3rd Year', avatar: '👩‍💻' },
];

const About = () => {
  return (
    <div style={{ animation: 'fadeIn 0.5s', paddingBottom: '4rem' }}>
      
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0a66c2 0%, #004182 50%, #002050 100%)',
        borderRadius: '16px',
        padding: '4rem 2rem',
        textAlign: 'center',
        color: 'white',
        marginBottom: '3rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-80px', left: '-30px', width: '250px', height: '250px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}></div>
        
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.2 }}>
          SRET Coding & Hackathon Club
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.85, maxWidth: '600px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
          Where future innovators are built. We are a student-led club at Sri Ramachandra Engineering & Technology, dedicated to fostering a culture of problem-solving, innovation, and hackathon excellence.
        </p>
        <Link to="/register" className="btn-primary" style={{ background: 'white', color: '#0a66c2', borderRadius: '25px', padding: '0.8rem 2rem', fontWeight: 700, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          Join Club Now <ArrowRight size={18} />
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {STATS.map((s, i) => (
          <Card key={i} style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-blue)' }}>{s.value}</div>
            <div className="text-muted" style={{ fontWeight: 600, marginTop: '0.3rem' }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Mission */}
      <Card style={{ marginBottom: '3rem', padding: '2.5rem', borderLeft: '4px solid var(--primary-blue)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
          <Trophy size={40} color="var(--primary-blue)" style={{ flexShrink: 0, marginTop: '0.3rem' }} />
          <div>
            <h2 className="text-main text-2xl mb-2">Our Mission</h2>
            <p className="text-muted" style={{ lineHeight: 1.8, fontSize: '1.05rem' }}>
              We believe every SRET student has the potential to build the next big thing. Our mission is to bridge the gap between classroom learning and real innovation — providing students access to the best hackathons, technical workshops, and a community of like-minded builders who push each other to excel.
            </p>
          </div>
        </div>
      </Card>

      {/* Activities */}
      <div className="mb-4">
        <h2 className="text-main text-2xl mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap color="var(--warning)" /> What We Do
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {ACTIVITIES.map((a, i) => (
            <Card key={i} className="card-hover" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>{a.icon}</div>
              <h3 className="text-main font-bold" style={{ marginBottom: '0.5rem' }}>{a.title}</h3>
              <p className="text-muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>{a.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="mt-4" style={{ marginTop: '3rem' }}>
        <h2 className="text-main text-2xl mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users color="var(--primary-blue)" /> Meet the Team
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {TEAM.map((t, i) => (
            <Card key={i} style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', background: '#eff6ff', borderRadius: '50%', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>{t.avatar}</div>
              <h3 className="text-main font-bold" style={{ marginBottom: '0.25rem' }}>{t.name}</h3>
              <span className="unstop-badge" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{t.role}</span>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{t.dept}</p>
            </Card>
          ))}
        </div>
        <p className="text-muted text-center" style={{ fontSize: '0.9rem', marginTop: '1.5rem' }}>
          *Team details are updated each semester. Contact the club email to connect with current coordinators.
        </p>
      </div>

      {/* CTA */}
      <Card style={{ marginTop: '3rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #86efac', textAlign: 'center', padding: '3rem' }}>
        <h2 className="text-main text-2xl mb-2">Ready to Build Something Amazing?</h2>
        <p className="text-muted mb-4" style={{ fontSize: '1rem', lineHeight: 1.7 }}>
          Join hundreds of SRET students who are already participating in hackathons, winning prizes, and building their careers through hands-on innovation.
        </p>
        <Link to="/hackathons" className="btn-primary" style={{ borderRadius: '25px', padding: '0.8rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          Explore Hackathons <ArrowRight size={18} />
        </Link>
      </Card>
    </div>
  );
};

export default About;
