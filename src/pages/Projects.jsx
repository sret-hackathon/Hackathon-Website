import { useState, useEffect } from 'react';
import Card from '../components/Card';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, orderBy } from 'firebase/firestore';
import { ThumbsUp, MessageSquare, Share2, Search, Star } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [newPostText, setNewPostText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Comment Engine State
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentInput, setCommentInput] = useState('');

  useEffect(() => {
    const qGallery = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsubGallery = onSnapshot(qGallery, (snap) => setGallery(snap.docs.map(d=>({id:d.id, ...d.data()}))));

    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
      setLoading(false);
    });
    return () => { unsubscribe(); unsubGallery(); };
  }, []);

  const handlePost = async (e) => {
    if (e.key === 'Enter' && newPostText.trim()) {
      if (!auth.currentUser) return window.toast('Please sign in to post!');
      try {
        await addDoc(collection(db, 'projects'), {
          studentId: auth.currentUser.uid,
          studentName: auth.currentUser.email.split('@')[0], 
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser.uid}`,
          headline: 'SRET Hacker',
          title: 'Latest Update',
          description: newPostText,
          hackathon: 'General',
          techStack: 'N/A',
          upvotes: [],
          comments: [],
          createdAt: serverTimestamp()
        });
        setNewPostText('');
        window.toast('Project pushed to live feed!');
      } catch (err) {
        window.toast('Error posting: ' + err.message);
      }
    }
  };

  const handleLike = async (postId, currentUpvotes) => {
    if (!auth.currentUser) return window.toast('Please sign in to like!');
    const uid = auth.currentUser.uid;
    const projectRef = doc(db, 'projects', postId);
    if (currentUpvotes && currentUpvotes.includes(uid)) {
      await updateDoc(projectRef, { upvotes: arrayRemove(uid) });
    } else {
      await updateDoc(projectRef, { upvotes: arrayUnion(uid) });
    }
  };

  const handleAddComment = async (e, postId) => {
    if (e.key === 'Enter' && commentInput.trim()) {
      if (!auth.currentUser) return window.toast('Please sign in to comment!');
      try {
        const projectRef = doc(db, 'projects', postId);
        await updateDoc(projectRef, { 
          comments: arrayUnion({
            uid: auth.currentUser.uid,
            name: auth.currentUser.email.split('@')[0], 
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser.uid}`,
            text: commentInput,
            timestamp: new Date().toISOString()
          })
        });
        setCommentInput(''); // Reset box
      } catch (err) {
        window.toast("Error commenting: " + err.message);
      }
    }
  };

  const filteredProjects = projects.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.techStack?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-main">Loading live feed...</div>;

  return (
    <div style={{animation: 'fadeIn 0.5s'}}>
      <div className="text-center mb-4">
        <h1 className="text-4xl text-main mb-2">Student Showcase</h1>
        <p className="text-muted" style={{maxWidth: '600px', margin: '0 auto'}}>Explore the latest project builds and connect with talented developers.</p>
      </div>

      <div style={{maxWidth: '800px', margin: '0 auto 2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '2rem'}}>
        <h2 className="text-main text-xl mb-4" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Star color="#f59e0b"/> Live Wall of Fame</h2>
        <div style={{display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem'}}>
          {gallery.length === 0 ? (
             <p className="text-muted text-center w-100">Admins haven't uploaded to the Wall of Fame yet!</p>
          ) : (
            gallery.map(img => (
              <div key={img.id} style={{minWidth: '250px', height: '150px', background: '#000', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden'}}>
                <img src={img.imageBase64} alt={img.title} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7}} />
                <span style={{zIndex: 1, color: 'white', padding: '0.5rem', fontWeight: 'bold', textShadow: '0px 2px 4px rgba(0,0,0,0.8)'}}>{img.title}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="unstop-tabs" style={{maxWidth: '600px', margin: '0 auto 1.5rem', justifyContent: 'center'}}>
        <div className={`unstop-tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')} style={{padding: '0.5rem 1rem'}}>Showcase Feed</div>
        <div className={`unstop-tab ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')} style={{padding: '0.5rem 1rem'}}>Team Matchmaking</div>
      </div>

      {activeTab === 'feed' ? (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px', margin: '0 auto'}}>
          
          <div style={{position: 'relative'}}>
            <Search size={18} style={{position: 'absolute', left: '15px', top: '15px', color: 'var(--text-muted)'}}/>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by student, tech stack, or hackathon..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{paddingLeft: '45px', borderRadius: '25px', background: '#fff', border: '1px solid var(--border-light)'}} 
            />
          </div>

          <Card style={{padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem'}}>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid || 'guest'}`} alt="You" style={{width: '48px', height: '48px', borderRadius: '50%', background: '#f3f4f6'}} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Start a post about your latest hackathon project... (Press Enter)" 
              style={{borderRadius: '25px', border: 'none', background: '#f3f4f6'}} 
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              onKeyDown={handlePost}
            />
          </Card>

          {filteredProjects.length === 0 && <p className="text-center text-muted">No posts found matching that search.</p>}

          {filteredProjects.map((proj) => {
            const upvoteCount = proj.upvotes ? proj.upvotes.length : 0;
            const userLiked = auth.currentUser && proj.upvotes && proj.upvotes.includes(auth.currentUser.uid);

            return (
              <Card key={proj.id} style={{padding: '0', overflow: 'hidden'}}>
                <div style={{padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <img src={proj.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${proj.studentId}`} alt={proj.studentName} style={{width: '48px', height: '48px', borderRadius: '50%', background: '#f3f4f6', objectFit: 'cover'}} />
                  <div style={{flex: 1}}>
                    <h3 className="text-main" style={{fontSize: '1rem', fontWeight: 600}}>{proj.studentName}</h3>
                    <p className="text-muted" style={{fontSize: '0.85rem'}}>{proj.headline}</p>
                  </div>
                </div>

                <div style={{padding: '0 1.5rem 1rem 1.5rem'}}>
                  <p className="text-main" style={{fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem'}}>{proj.description}</p>
                  
                  {proj.title !== 'Latest Update' && (
                    <div style={{backgroundColor: '#f3f9ff', border: '1px solid #0a66c2', color: '#0a66c2', padding: '0.8rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <span style={{fontWeight: 'bold', fontSize: '0.9rem'}}>Project: {proj.title}</span>
                      <span style={{fontSize: '0.85rem'}}>Built for: {proj.hackathon}</span>
                      <span style={{fontSize: '0.8rem', fontWeight: 600}}>Tech Stack: {proj.techStack}</span>
                    </div>
                  )}
                </div>

                <div style={{padding: '0.5rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between'}}>
                  <span className="text-muted" style={{fontSize: '0.85rem'}}>👍 ❤️ {upvoteCount}</span>
                </div>

                <div style={{padding: '0.5rem 1.5rem', display: 'flex', justifyContent: 'space-between'}}>
                  <button onClick={() => handleLike(proj.id, proj.upvotes)} style={{background: 'none', border: 'none', color: userLiked ? 'var(--primary-blue)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', cursor: 'pointer', fontWeight: 600}}>
                    <ThumbsUp size={18}/> {userLiked ? 'Liked' : 'Like'}
                  </button>
                  <button onClick={() => { setActiveCommentId(activeCommentId === proj.id ? null : proj.id); setCommentInput(''); }} style={{background: 'none', border: 'none', color: activeCommentId === proj.id ? 'var(--primary-blue)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', cursor: 'pointer', fontWeight: 600}}>
                    <MessageSquare size={18}/> Comment {proj.comments?.length > 0 && `(${proj.comments.length})`}
                  </button>
                  <button style={{background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', cursor: 'pointer', fontWeight: 600}}>
                    <Share2 size={18}/> Repost
                  </button>
                </div>

                {/* --- SMART COMMENT SECTION --- */}
                {activeCommentId === proj.id && (
                  <div style={{background: '#f9fafb', padding: '1.5rem', borderTop: '1px solid var(--border-light)', animation: 'fadeIn 0.2s'}}>
                    
                    {proj.comments && proj.comments.length > 0 ? (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem'}}>
                        {proj.comments.map((c, i) => (
                          <div key={i} style={{display: 'flex', gap: '0.8rem'}}>
                            <img src={c.avatar} alt="avatar" style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover'}} />
                            <div style={{background: '#fff', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-light)', flex: 1}}>
                              <span style={{fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem'}}>{c.name}</span>
                              <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>{c.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted mb-4" style={{fontSize: '0.9rem'}}>No comments yet. Be the first to start the discussion!</div>
                    )}

                    <div style={{display: 'flex', gap: '0.8rem', alignItems: 'center'}}>
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid || 'guest'}`} alt="You" style={{width: '32px', height: '32px', borderRadius: '50%', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}} />
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Write a comment... (Press Enter)" 
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => handleAddComment(e, proj.id)}
                        style={{borderRadius: '25px', padding: '0.6rem 1.2rem', flex: 1, border: '1px solid var(--primary-blue)', boxShadow: '0 0 0 2px rgba(10, 102, 194, 0.1)'}}
                      />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center text-muted p-8">Team Matchmaking live data sync coming in next patch...</div>
      )}
    </div>
  );
};
export default Projects;
