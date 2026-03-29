import { useState, useEffect } from 'react';
import Card from '../components/Card';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { UploadCloud, CheckCircle, Clock, Bell, Users, FileText, User, Save, Globe } from 'lucide-react';

const DEPARTMENTS = ['AIML', 'AIDA', 'Medical Engineering', 'ECE', 'Cyber Security'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('submit');
  const [loading, setLoading] = useState(true);

  // User Profile State
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    gender: 'Male',
    age: '',
    yearOfStudy: '1st Year',
    department: 'AIML',
    gradYear: '2027',
    bio: '',
    githubUrl: '',
    linkedinUrl: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Project Feed State
  const [title, setTitle] = useState('');
  const [hackathon, setHackathon] = useState('');
  const [techStack, setTechStack] = useState('');

  // PPT Submission State
  const [registrations, setRegistrations] = useState([]);
  const [pptTitle, setPptTitle] = useState('');
  const [pptDriveLink, setPptDriveLink] = useState('');
  const [pptHackId, setPptHackId] = useState('');
  const [deadlineStatus, setDeadlineStatus] = useState(null);

  // External & Proofs
  const [extHackName, setExtHackName] = useState('');
  const [extTeamName, setExtTeamName] = useState('');
  const [extMembers, setExtMembers] = useState([]);
  const [proofBase64, setProofBase64] = useState(null);

  // Invites
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      try {
        const uid = auth.currentUser.uid;
        const email = auth.currentUser.email;
        const uniqueId = email.split('@')[0];

        // 1. Fetch Profile
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          setProfile(prev => ({ ...prev, ...userDoc.data() }));
        }

        // 2. Fetch Invites
        const inviteQ = query(collection(db, 'teamInvites'), where('inviteeId', '==', uniqueId), where('status', '==', 'pending'));
        const inviteSnap = await getDocs(inviteQ);
        setInvites(inviteSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 3. Fetch Registrations (for submissions)
        const regQ = query(collection(db, 'registrations'), where('studentId', '==', uid));
        const regSnap = await getDocs(regQ);
        const regs = regSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRegistrations(regs);

        if (regs.length > 0) {
          setPptHackId(regs[0].hackathonId);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update deadline when hackathon selection changes
  useEffect(() => {
    if (!pptHackId) {
      setDeadlineStatus('not_registered');
      return;
    }
    const reg = registrations.find(r => r.hackathonId === pptHackId);
    if (reg) {
      const registeredAt = reg.createdAt?.toDate ? reg.createdAt.toDate() : new Date(reg.createdAt);
      const deadlineDate = new Date(registeredAt.getTime() + 5 * 24 * 60 * 60 * 1000);
      const now = new Date();
      setDeadlineStatus(now <= deadlineDate ? 'open' : 'closed');
    } else {
      setDeadlineStatus('not_registered');
    }
  }, [pptHackId, registrations]);

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ...profile,
        updatedAt: serverTimestamp()
      });
      window.toast('✅ Profile updated successfully!');
    } catch (err) {
      window.toast('Error saving profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return window.toast("Must be logged in!");
    try {
      await addDoc(collection(db, 'projects'), {
        studentId: auth.currentUser.uid,
        studentName: profile.firstName || auth.currentUser.email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser.uid}`,
        headline: profile.department ? `${profile.department} · ${profile.yearOfStudy}` : 'SRET Student',
        title,
        description: `Check out our new submission for the ${hackathon}!`,
        hackathon,
        techStack,
        upvotes: [],
        comments: [],
        createdAt: serverTimestamp()
      });
      window.toast('Project pushed to Student Hub feed!');
      setTitle(''); setHackathon(''); setTechStack('');
    } catch (err) { window.toast(err.message); }
  };

  const handleSubmitPPT = async () => {
    if (!auth.currentUser) return window.toast('Must be logged in!');
    if (deadlineStatus === 'not_registered') return window.toast('You must register for this hackathon first.');
    if (deadlineStatus === 'closed') return window.toast('⏰ Deadline passed (5 days after registration).');
    if (!pptTitle || !pptDriveLink) return window.toast('Please fill all fields.');
    if (!pptDriveLink.includes('drive.google.com')) return window.toast('Invalid Google Drive link.');
    try {
      await addDoc(collection(db, 'submissions'), {
        studentId: auth.currentUser.uid,
        studentEmail: auth.currentUser.email,
        hackathonId: pptHackId,
        title: pptTitle,
        driveLink: pptDriveLink,
        status: 'submitted',
        round: 'Round 1',
        createdAt: serverTimestamp()
      });
      window.toast('📊 PPT Submitted! Admin will review soon.');
      setPptTitle(''); setPptDriveLink('');
    } catch (err) { window.toast(err.message); }
  };

  const handleInviteResponse = async (inviteId, accept) => {
    try {
      await updateDoc(doc(db, 'teamInvites', inviteId), { status: accept ? 'accepted' : 'rejected' });
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
      window.toast(accept ? '✅ Team invite accepted!' : 'Invite declined.');
    } catch (err) { window.toast(err.message); }
  };

  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProofBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofBase64) return window.toast("Select an image first!");
    try {
      await addDoc(collection(db, 'verifications'), {
        studentId: auth.currentUser.uid,
        studentEmail: auth.currentUser.email,
        hackathonId: 'External Submission',
        proofBase64,
        status: 'pending',
        claimedPoints: 50,
        createdAt: serverTimestamp()
      });
      window.toast('Proof uploaded! +50 XP pending review.');
      setProofBase64(null);
    } catch (err) { window.toast(err.message); }
  };

  const handleSubmitExternal = async () => {
    if (!extHackName || !extTeamName) return window.toast("Fill required fields.");
    try {
      await addDoc(collection(db, 'externalParticipations'), {
        leaderId: auth.currentUser.uid,
        leaderEmail: auth.currentUser.email,
        hackathonName: extHackName,
        teamName: extTeamName,
        teamMembers: extMembers,
        createdAt: serverTimestamp()
      });
      window.toast('Participation recorded!');
      setExtHackName(''); setExtTeamName(''); setExtMembers([]);
    } catch (err) { window.toast(err.message); }
  };

  const TAB_STYLE = (t) => ({
    padding: '0.75rem 1.25rem', cursor: 'pointer', fontWeight: 600,
    color: activeTab === t ? 'var(--primary-blue)' : 'var(--text-muted)',
    whiteSpace: 'nowrap', background: 'none', border: 'none',
    borderBottom: activeTab === t ? '2px solid var(--primary-blue)' : '2px solid transparent'
  });

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}><Clock className="spin" /> Loading Dashboard...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.5s' }}>
      <div className="mb-4">
        <h1 className="text-4xl text-main mb-2">Student Dashboard</h1>
        <p className="text-muted">Welcome back, {profile.firstName || 'Student'}. Manage your hackathon journey here.</p>
        
        {invites.length > 0 && (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '0.8rem 1.2rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bell size={18} color="#d97706" />
            <span style={{ fontWeight: 600, color: '#92400e' }}>You have {invites.length} pending team invite{invites.length > 1 ? 's' : ''}!</span>
            <button onClick={() => setActiveTab('invites')} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>View Now</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-light)', marginBottom: '2rem', overflowX: 'auto' }}>
        <button style={TAB_STYLE('submit')} onClick={() => setActiveTab('submit')}>📤 Project Feed</button>
        <button style={TAB_STYLE('ppt')} onClick={() => setActiveTab('ppt')}>📊 Mock Submission</button>
        <button style={TAB_STYLE('profile')} onClick={() => setActiveTab('profile')}>👤 Profile Settings</button>
        <button style={TAB_STYLE('external')} onClick={() => setActiveTab('external')}>🌐 Track External</button>
        <button style={TAB_STYLE('proof')} onClick={() => setActiveTab('proof')}>🖼️ Upload Proof</button>
        <button style={{ ...TAB_STYLE('invites'), position: 'relative' }} onClick={() => setActiveTab('invites')}>
          👥 Invitites {invites.length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '0.1rem 0.4rem', fontSize: '0.7rem', marginLeft: '0.3rem' }}>{invites.length}</span>}
        </button>
      </div>

      {/* ─── TAB: PROJECT FEED ─── */}
      {activeTab === 'submit' && (
        <Card style={{ maxWidth: '600px' }}>
          <h2 className="text-main text-2xl mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UploadCloud color="var(--primary-blue)" /> Push to Feed</h2>
          <form onSubmit={handleSubmitProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" className="form-control" placeholder="Project Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <input type="text" className="form-control" placeholder="Hackathon Name" value={hackathon} onChange={e => setHackathon(e.target.value)} required />
            <input type="text" className="form-control" placeholder="Tech Stack" value={techStack} onChange={e => setTechStack(e.target.value)} required />
            <button type="submit" className="btn-primary mt-4">Post Project</button>
          </form>
        </Card>
      )}

      {/* ─── TAB: MOCK SUBMISSION (DYNAMIC) ─── */}
      {activeTab === 'ppt' && (
        <Card style={{ maxWidth: '600px' }}>
          <h2 className="text-main text-2xl mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText color="var(--primary-blue)" /> Mock Submission</h2>
          
          {registrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p className="text-muted mb-4">You haven't registered for any mock hackathons yet.</p>
              <Link to="/hackathons" className="btn-primary">Browse Hackathons</Link>
            </div>
          ) : (
            <>
              {deadlineStatus === 'closed' && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Clock size={16} color="#991b1b" />
                  <span style={{ color: '#991b1b', fontSize: '0.9rem', fontWeight: 600 }}>Submission window closed (5 days past registration).</span>
                </div>
              )}
              {deadlineStatus === 'open' && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <CheckCircle size={16} color="#166534" />
                  <span style={{ color: '#166534', fontSize: '0.9rem', fontWeight: 600 }}>Window Open! You have 5 days from registration to submit.</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label className="text-main" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Select Hackathon</label>
                  <select className="form-control" value={pptHackId} onChange={e => setPptHackId(e.target.value)}>
                    {registrations.map(r => (
                      <option key={r.id} value={r.hackathonId}>{r.hackathonTitle || r.hackathonId}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-main" style={{ fontWeight: 600, fontSize: '0.9rem' }}>PPT/Project Title</label>
                  <input className="form-control" placeholder="e.g. AI Med-System" value={pptTitle} onChange={e => setPptTitle(e.target.value)} />
                </div>
                <div>
                  <label className="text-main" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Google Drive Link</label>
                  <input className="form-control" placeholder="https://drive.google.com/..." value={pptDriveLink} onChange={e => setPptDriveLink(e.target.value)} />
                </div>
                <button onClick={handleSubmitPPT} disabled={deadlineStatus === 'closed'} className="btn-primary">Submit for Review</button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* ─── TAB: PROFILE SETTINGS ─── */}
      {activeTab === 'profile' && (
        <Card style={{ maxWidth: '800px' }}>
          <h2 className="text-main text-2xl mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User color="var(--primary-blue)" /> Profile Settings</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-main text-lg font-bold">Personal Data</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="form-control" placeholder="First Name" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
                <input className="form-control" placeholder="Last Name" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
              </div>
              <input className="form-control" placeholder="Mobile" value={profile.mobile} onChange={e => setProfile({ ...profile, mobile: e.target.value })} />
              <textarea className="form-control" placeholder="Short Bio" rows={3} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-main text-lg font-bold">Academic Data</h3>
              <select className="form-control" value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
              <select className="form-control" value={profile.yearOfStudy} onChange={e => setProfile({ ...profile, yearOfStudy: e.target.value })}>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
              <h3 className="text-main text-lg font-bold mt-2">Social Links</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={18} color="var(--text-muted)" />
                <input className="form-control" placeholder="GitHub URL" value={profile.github} onChange={e => setProfile({ ...profile, github: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={18} color="var(--text-muted)" />
                <input className="form-control" placeholder="LinkedIn URL" value={profile.linkedin} onChange={e => setProfile({ ...profile, linkedin: e.target.value })} />
              </div>
            </div>
          </div>
          <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary mt-6" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {savingProfile ? 'Saving...' : <><Save size={18} /> Save Profile Updates</>}
          </button>
        </Card>
      )}

      {/* ─── TAB: EXTERNAL ─── */}
      {activeTab === 'external' && (
        <Card style={{ maxWidth: '600px' }}>
          <h2 className="text-main text-2xl mb-4"><Users color="var(--primary-blue)" size={24} /> Track External</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input className="form-control" placeholder="Hackathon (e.g. SIH 2024)" value={extHackName} onChange={e => setExtHackName(e.target.value)} />
            <input className="form-control" placeholder="Team Name" value={extTeamName} onChange={e => setExtTeamName(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="text-main font-bold">Team Members</label>
              <button onClick={() => setExtMembers([...extMembers, ''])} className="btn-outline" style={{ padding: '0.2rem 0.5rem' }}>+ Add</button>
            </div>
            {extMembers.map((m, i) => (
              <input key={i} className="form-control" placeholder={`Member ${i+1}`} value={m} onChange={e => { const arr = [...extMembers]; arr[i] = e.target.value; setExtMembers(arr); }} />
            ))}
            <button onClick={handleSubmitExternal} className="btn-primary">Save External participation</button>
          </div>
        </Card>
      )}

      {/* ─── TAB: PROOF ─── */}
      {activeTab === 'proof' && (
        <Card style={{ maxWidth: '600px' }}>
          <h2 className="text-main text-2xl mb-4"><UploadCloud color="var(--primary-blue)" size={24} /> Upload Screenshot</h2>
          <div style={{ background: '#f9fafb', border: '1px dashed #ccc', padding: '2rem', textAlign: 'center', borderRadius: '8px' }}>
            <input type="file" onChange={handleProofChange} accept="image/*" style={{ marginBottom: '1rem' }} />
            <button onClick={handleSubmitProof} className="btn-primary" style={{ width: '100%' }}>Submit for +50 XP</button>
          </div>
        </Card>
      )}

      {/* ─── TAB: INVITES ─── */}
      {activeTab === 'invites' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="text-main text-2xl mb-4">Pending Invites</h2>
          {invites.length === 0 ? <p className="text-muted">No pending invites.</p> : invites.map(inv => (
            <Card key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="unstop-badge">{inv.hackathonId}</span>
                <h3 className="text-main font-bold">{inv.teamName}</h3>
                <p className="text-muted">Leader: {inv.leaderEmail}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleInviteResponse(inv.id, false)} className="btn-outline">Decline</button>
                <button onClick={() => handleInviteResponse(inv.id, true)} className="btn-primary">Accept</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
