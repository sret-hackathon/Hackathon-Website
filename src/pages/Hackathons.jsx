import { useState, useEffect } from 'react';
import Card from '../components/Card';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Users, ExternalLink } from 'lucide-react';

// Seeded Eureka entry so the page is never empty until admin posts
const SEED_HACKATHON = {
  id: 'eureka-3',
  title: 'Varroc Eureka Challenge 3.0',
  organizer: 'Varroc',
  tagline: 'Ignite Innovation',
  type: 'mock',
  status: 'Open',
  prizeTotal: '₹ 40,000',
  teamSize: '1 - 4 Members',
  registrationDeadline: '2026-04-12T23:59',
  rounds: [{ name: 'Executive Submission', startDate: '2026-03-23', endDate: '2026-04-12' }],
};

const STATUS_COLOR = {
  Open: { bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e' },
  Closed: { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
  'Coming Soon': { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' },
};

const HackathonCard = ({ hack }) => {
  const colors = STATUS_COLOR[hack.status] || STATUS_COLOR['Coming Soon'];
  const isExternal = hack.type === 'external';

  // Compute deadline label
  let deadlineLabel = 'TBA';
  if (hack.registrationDeadline) {
    const d = new Date(hack.registrationDeadline);
    deadlineLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <Card className="card-hover" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1.5rem', flexWrap: 'wrap' }}>
      {/* Icon */}
      <div style={{ width: '90px', height: '90px', background: isExternal ? '#eff6ff' : 'linear-gradient(135deg, #0a66c2, #004182)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '2.2rem' }}>{isExternal ? '🌐' : '⚡'}</span>
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: '220px' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <span className="unstop-badge" style={{ background: isExternal ? '#eff6ff' : '#f0fdf4', color: isExternal ? '#1e3a8a' : '#16a34a' }}>
            {isExternal ? '🌐 External' : '🏫 SRET Mock'}
          </span>
          {hack.organizer && <span className="text-muted" style={{ fontSize: '0.85rem' }}>by {hack.organizer}</span>}
        </div>
        <h3 className="text-main font-bold" style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>{hack.title}</h3>
        {hack.tagline && <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{hack.tagline}</p>}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {hack.teamSize && <span><Users size={13} style={{ marginRight: '3px' }} />{hack.teamSize}</span>}
          {hack.prizeTotal && <span>💰 {hack.prizeTotal}</span>}
          <span>📅 Deadline: {deadlineLabel}</span>
        </div>
      </div>

      {/* Status + CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '140px', alignItems: 'flex-end' }}>
        <span style={{ background: colors.bg, color: colors.text, padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: colors.dot, display: 'inline-block' }}></span>
          {hack.status}
        </span>

        {isExternal && hack.externalUrl ? (
          <a href={hack.externalUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ borderRadius: '4px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            Register <ExternalLink size={14} />
          </a>
        ) : (
          <Link to={`/hackathons/${hack.id}`} className="btn-primary" style={{ borderRadius: '4px', textAlign: 'center', textDecoration: 'none', fontSize: '0.9rem' }}>
            View Details
          </Link>
        )}
      </div>
    </Card>
  );
};

const Hackathons = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchHacks = async () => {
      try {
        const q = query(collection(db, 'hackathons'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Always show seeded Eureka entry if not already in DB
        const hasEureka = data.some(h => h.id === 'eureka-3');
        setHackathons(hasEureka ? data : [SEED_HACKATHON, ...data]);
      } catch (err) {
        console.error(err);
        setHackathons([SEED_HACKATHON]);
      } finally {
        setLoading(false);
      }
    };
    fetchHacks();
  }, []);

  const FILTERS = ['All', 'Open', 'mock', 'external'];
  const displayed = hackathons.filter(h => {
    if (filter === 'All') return true;
    if (filter === 'Open') return h.status === 'Open';
    return h.type === filter;
  });

  return (
    <div style={{ animation: 'fadeIn 0.5s', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a66c2 0%, #004182 100%)', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', color: 'white', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Competitions & Hackathons</h1>
        <p style={{ opacity: 0.85, fontSize: '1.1rem' }}>SRET internal challenges + top external hackathons to participate in</p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Filter + Count bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 className="text-main text-xl font-bold">{displayed.length} Opportunit{displayed.length === 1 ? 'y' : 'ies'}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? 'var(--primary-blue)' : '#f3f4f6',
                color: filter === f ? 'white' : '#4b5563',
                border: 'none', borderRadius: '20px', padding: '0.3rem 0.9rem',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
              }}>
                {f === 'mock' ? '🏫 SRET Only' : f === 'external' ? '🌐 External' : f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '120px', background: '#f3f4f6', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</p>
            <p className="text-muted">No hackathons found for this filter.</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {displayed.map(hack => <HackathonCard key={hack.id} hack={hack} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hackathons;
