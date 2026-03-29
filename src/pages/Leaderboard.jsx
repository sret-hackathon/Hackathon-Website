import { useState, useEffect } from 'react';
import Card from '../components/Card';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { Trophy, Medal, Star } from 'lucide-react';

const Leaderboard = () => {
  const [topHackers, setTopHackers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc, index) => ({
           rank: index + 1,
           name: doc.data().name || doc.data().email.split('@')[0],
           points: doc.data().points || 0,
           avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.id}`
        }));
        setTopHackers(data);
      } catch (err) {
        console.error("Error fetching leaderboard: ", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div style={{animation: 'fadeIn 0.5s', maxWidth: '800px', margin: '0 auto'}}>
      <div className="text-center mb-8">
        <h1 className="text-4xl text-main mb-2">Global Leaderboard</h1>
        <p className="text-muted">Rankings are based on live SRET Points earned from verified hackathons.</p>
      </div>

      <Card style={{padding: '0', overflow: 'hidden'}}>
        <div style={{background: 'linear-gradient(135deg, #0a66c2 0%, #004182 100%)', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <h2 className="text-2xl font-bold" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Trophy /> Top Innovators</h2>
           <span style={{background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold'}}>Live Database</span>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-main">Syncing Global Ranks...</div>
        ) : topHackers.length === 0 ? (
          <div className="p-8 text-center text-muted">No students have earned points yet!</div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column'}}>
            {topHackers.map((hacker, index) => (
              <div key={hacker.rank} style={{display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: index === topHackers.length - 1 ? 'none' : '1px solid var(--border-light)', background: hacker.rank === 1 ? '#fffbeb' : hacker.rank === 2 ? '#f3f4f6' : hacker.rank === 3 ? '#fff7ed' : '#fff'}}>
                
                <div style={{width: '40px', fontWeight: 'bold', fontSize: '1.2rem', color: hacker.rank <= 3 ? '#000' : 'var(--text-muted)'}}>
                  #{hacker.rank}
                </div>
                
                <img src={hacker.avatar} alt={hacker.name} style={{width: '50px', height: '50px', borderRadius: '50%', background: '#f3f4f6', marginRight: '1rem'}} />
                
                <div style={{flex: 1}}>
                  <h3 className="text-main" style={{fontSize: '1.1rem', fontWeight: 600}}>{hacker.name}</h3>
                </div>

                <div style={{textAlign: 'right'}}>
                  <div className="text-primary-blue font-bold" style={{fontSize: '1.4rem'}}>{hacker.points}</div>
                  <div className="text-muted" style={{fontSize: '0.8rem'}}>XP</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
export default Leaderboard;
