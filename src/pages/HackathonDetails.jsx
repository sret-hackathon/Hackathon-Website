import { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Users, Award, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { auth, db } from '../firebase';
import {
  doc, updateDoc, increment, collection, addDoc, serverTimestamp,
  setDoc, getDoc, query, where, getDocs
} from 'firebase/firestore';
import { useParams, Link } from 'react-router-dom';

const DEPARTMENTS = ['AIML', 'AIDA', 'Medical Engineering', 'ECE', 'Cyber Security'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const EMAIL_API = import.meta.env.VITE_EMAIL_API || 'http://localhost:5000';

// Seeded Eureka data (fallback when Firestore doc is missing)
const EUREKA_SEED = {
  id: 'eureka-3',
  title: 'Eureka Challenge 3.0',
  organizer: 'Varroc',
  tagline: 'IGNITE INNOVATION',
  type: 'mock',
  status: 'Open',
  prizeTotal: '₹ 40,000',
  teamMin: 1,
  teamMax: 4,
  teamSize: '1 - 4 Members',
  registrationDeadline: '2026-04-12T23:59',
  eligibility: 'Pre-final year students (2027 graduates) from AIML, AIDA, Medical Engineering, ECE, Cyber Security departments.',
  rounds: [
    { name: 'Executive Submission Round', startDate: '2026-03-23T12:00', endDate: '2026-04-12T23:59', description: 'Upload 7-slide PPT explaining your solution + optional simulation video (max 20MB via Google Drive link).' },
    { name: 'Detailed Submission Round', startDate: '', endDate: '', description: '8-10 slide PPT + optional simulation video (max 15MB). For shortlisted teams only.' },
    { name: 'Grand Finale', startDate: '', endDate: '', description: 'Present in front of Varroc leadership team in Pune.' }
  ],
  prizes: [
    { label: 'Winner', amount: '₹25,000', description: 'Cash + Pre-Placement Offer (PPO) worth 12.5 LPA CTC' },
    { label: 'Runners-Up', amount: '₹15,000', description: 'Cash + Pre-Placement Offer (PPO) worth 12.5 LPA CTC' },
    { label: 'Top Performers', amount: 'Goodies', description: 'Goodies + Pre-Placement Offer' },
  ],
};

const HackathonDetails = () => {
  const { id } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [loadingHack, setLoadingHack] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  // Registration wizard
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', mobile: '', gender: 'Male',
    age: '', yearOfStudy: '1st Year', department: 'AIML',
    gradYear: '2027', teamName: '', teamMembers: []
  });

  // Load hackathon from Firestore (or use seed)
  useEffect(() => {
    const fetch = async () => {
      try {
        if (id === 'eureka-3') {
          setHackathon(EUREKA_SEED);
        } else {
          const snap = await getDoc(doc(db, 'hackathons', id));
          if (snap.exists()) {
            setHackathon({ id: snap.id, ...snap.data() });
          } else {
            setHackathon(null);
          }
        }
      } catch (err) {
        console.error(err);
        setHackathon(null);
      } finally {
        setLoadingHack(false);
      }
    };
    fetch();
  }, [id]);

  // Open registration modal — auto-fill profile + check duplicate
  const handleOpenModal = async () => {
    if (!auth.currentUser) return window.toast('Please log in to register!');
    setProfileLoading(true);
    setShowModal(true);
    try {
      // Check duplicate
      const dupQ = query(
        collection(db, 'registrations'),
        where('hackathonId', '==', hackathon.id),
        where('studentId', '==', auth.currentUser.uid)
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) { setAlreadyRegistered(true); setProfileLoading(false); return; }

      // Auto-fill stored profile
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const p = userDoc.data();
        setFormData(prev => ({
          ...prev,
          firstName: p.firstName || auth.currentUser.email.split('@')[0],
          lastName: p.lastName || '',
          mobile: p.mobile || '',
          gender: p.gender || 'Male',
          age: p.age || '',
          yearOfStudy: p.yearOfStudy || '1st Year',
          department: p.department || 'AIML',
          gradYear: p.gradYear || '2027',
        }));
      }
    } catch (err) { console.error(err); }
    finally { setProfileLoading(false); }
  };

  // Send OTP via Flask backend + save profile for future auto-fill
  const handleNextStep1 = async () => {
    if (!auth.currentUser) return window.toast('Please log in first!');
    if (!formData.firstName) return window.toast('Please enter your first name.');
    if (!formData.mobile || formData.mobile.length < 10) return window.toast('Please enter a valid 10-digit mobile number.');

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpSending(true);
    try {
      await setDoc(doc(db, 'otpVerifications', auth.currentUser.uid), {
        otp: newOtp, mobile: formData.mobile,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });
      // Save profile details for future auto-fill
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        firstName: formData.firstName, lastName: formData.lastName,
        mobile: formData.mobile, gender: formData.gender,
        age: formData.age, yearOfStudy: formData.yearOfStudy,
        department: formData.department, gradYear: formData.gradYear,
      });
      // Email OTP via Flask
      await fetch(`${EMAIL_API}/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_email: auth.currentUser.email, to_name: formData.firstName, otp: newOtp })
      });
      window.toast(`📧 OTP sent to ${auth.currentUser.email}!`);
      setStep(2);
    } catch (err) { window.toast('Error: ' + err.message); }
    finally { setOtpSending(false); }
  };

  const handleVerifyOTP = () => {
    if (!otp) return window.toast('Please enter the OTP.');
    if (otp !== generatedOtp) return window.toast('❌ Invalid OTP. Check your email or resend.');
    setStep(3);
    window.toast('✅ Email verified!');
  };

  const handleAddMember = () => {
    if (formData.teamMembers.length >= (hackathon.teamMax - 1 || 3)) return window.toast(`Max ${hackathon.teamMax || 4} members allowed.`);
    setFormData({ ...formData, teamMembers: [...formData.teamMembers, { uniqueId: '', name: '' }] });
  };

  const updateMember = (index, field, value) => {
    const newMembers = [...formData.teamMembers];
    newMembers[index][field] = value;
    setFormData({ ...formData, teamMembers: newMembers });
  };

  const handleNativeRegister = async () => {
    if (!auth.currentUser) return window.toast('Please log in to register!');
    try {
      const regRef = await addDoc(collection(db, 'registrations'), {
        hackathonId: hackathon.id,
        hackathonTitle: hackathon.title,
        studentId: auth.currentUser.uid,
        studentEmail: auth.currentUser.email,
        uniqueId: auth.currentUser.email.split('@')[0],
        teamName: formData.teamName || 'Solo',
        teamMembers: formData.teamMembers,
        personalInfo: {
          firstName: formData.firstName, lastName: formData.lastName,
          mobile: formData.mobile, gender: formData.gender,
          age: formData.age, yearOfStudy: formData.yearOfStudy,
          department: formData.department, gradYear: formData.gradYear
        },
        status: 'Registered',
        createdAt: serverTimestamp()
      });

      // Send team invites
      const leaderUniqueId = auth.currentUser.email.split('@')[0];
      for (const member of formData.teamMembers) {
        if (member.uniqueId && member.uniqueId !== leaderUniqueId) {
          await addDoc(collection(db, 'teamInvites'), {
            registrationId: regRef.id,
            hackathonId: hackathon.id,
            teamName: formData.teamName || 'Solo',
            leaderEmail: auth.currentUser.email,
            inviteeId: member.uniqueId,
            inviteeName: member.name,
            status: 'pending',
            createdAt: serverTimestamp()
          });
          fetch(`${EMAIL_API}/send-team-invite`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to_email: `${member.uniqueId}@sriher.edu.in`,
              to_name: member.name || member.uniqueId,
              leader_name: formData.firstName,
              team_name: formData.teamName || 'Solo',
              hackathon_name: hackathon.title
            })
          });
        }
      }

      await updateDoc(doc(db, 'users', auth.currentUser.uid), { points: increment(25) });

      // Send confirmation email
      fetch(`${EMAIL_API}/send-registration-confirm`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: auth.currentUser.email, to_name: formData.firstName,
          hackathon_name: hackathon.title, team_name: formData.teamName || 'Solo', xp_awarded: 25
        })
      });

      window.toast('🎉 Registered! +25 SRET Points. Confirmation sent to your email!');
      setShowModal(false); setStep(1); setOtp('');
    } catch (err) { window.toast('Error: ' + err.message); }
  };

  const closeModal = () => { setShowModal(false); setStep(1); setOtp(''); setAlreadyRegistered(false); };

  // Format date helper
  const fmtDate = (str) => {
    if (!str) return '';
    try { return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return str; }
  };

  // ─── Loading ───
  if (loadingHack) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', border: '4px solid #e5e7eb', borderTop: '4px solid var(--primary-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        <p className="text-muted" style={{ marginTop: '1rem' }}>Loading hackathon...</p>
      </div>
    );
  }

  // ─── Not Found ───
  if (!hackathon) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 className="text-main text-2xl mb-2">Hackathon Not Found</h2>
        <p className="text-muted mb-4">This hackathon may have been removed or the link is incorrect.</p>
        <Link to="/hackathons" className="btn-primary" style={{ borderRadius: '25px' }}>← Back to Hackathons</Link>
      </div>
    );
  }

  // ─── External hackathon — simple redirect page ───
  if (hackathon.type === 'external') {
    return (
      <div style={{ animation: 'fadeIn 0.5s', maxWidth: '700px', margin: '3rem auto' }}>
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌐</div>
          <span className="unstop-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>External Hackathon</span>
          <h1 className="text-main text-4xl mb-2">{hackathon.title}</h1>
          {hackathon.organizer && <p className="text-muted mb-2" style={{ fontSize: '1.1rem' }}>by {hackathon.organizer}</p>}
          {hackathon.eligibility && <p className="text-main mb-4" style={{ lineHeight: 1.6 }}>{hackathon.eligibility}</p>}
          {hackathon.prizeTotal && <p className="font-bold text-main mb-4">💰 Prize Pool: {hackathon.prizeTotal}</p>}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            {hackathon.externalUrl && (
              <a href={hackathon.externalUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ borderRadius: '25px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Register on Platform <ExternalLink size={16} />
              </a>
            )}
            <Link to="/hackathons" className="btn-outline" style={{ borderRadius: '25px' }}>← Back</Link>
          </div>
          <p className="text-muted" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
            After registering, log your participation in your <Link to="/dashboard/student" style={{ color: 'var(--primary-blue)' }}>Student Dashboard</Link> for SRET XP points and Dean tracking.
          </p>
        </Card>
      </div>
    );
  }

  // ─── Mock hackathon — full detail page ───
  return (
    <div style={{ animation: 'fadeIn 0.5s', paddingBottom: '4rem' }}>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #022a18 0%, #001a0e 100%)', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '0.4rem' }}>{hackathon.tagline || hackathon.title}</h1>
        {hackathon.tagline && <h2 style={{ fontSize: '1.2rem', fontWeight: 400, color: '#4ade80' }}>{hackathon.title}</h2>}
        {hackathon.organizer && <p style={{ color: '#aaa', marginTop: '0.5rem' }}>by {hackathon.organizer}</p>}
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Main Content */}
        <div style={{ flex: '1 1 60%', minWidth: '300px' }}>
          <Card className="mb-4">
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {hackathon.teamSize && <span className="unstop-badge"><Users size={14} /> {hackathon.teamSize}</span>}
              {hackathon.prizeTotal && <span className="unstop-badge" style={{ background: '#eff6ff', color: '#1e3a8a' }}><Award size={14} /> {hackathon.prizeTotal}</span>}
              {hackathon.registrationDeadline && (
                <span className="unstop-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                  📅 Reg. closes: {fmtDate(hackathon.registrationDeadline)}
                </span>
              )}
            </div>
            {hackathon.eligibility && (
              <p className="text-main" style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>{hackathon.eligibility}</p>
            )}
          </Card>

          <Card>
            <div className="unstop-tabs">
              <div className={`unstop-tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Stages & Timeline</div>
              <div className={`unstop-tab ${activeTab === 'prizes' ? 'active' : ''}`} onClick={() => setActiveTab('prizes')}>Prizes</div>
            </div>

            {/* Rounds Timeline */}
            {activeTab === 'details' && (
              <div>
                <h3 className="text-2xl text-main mb-4">Stages and Timelines</h3>
                {(hackathon.rounds || []).map((round, i) => (
                  <div key={i} style={{ borderLeft: `2px solid ${i === 0 ? 'var(--primary-blue)' : 'var(--border-light)'}`, paddingLeft: '2rem', margin: '1.5rem 0', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-11px', top: '0', background: i === 0 ? 'var(--primary-blue)' : 'var(--border-light)', width: '20px', height: '20px', borderRadius: '50%', border: '4px solid #fff' }}></div>
                    <h4 className="font-bold text-main" style={{ fontSize: '1.05rem' }}>{round.name}</h4>
                    {(round.startDate || round.endDate) && (
                      <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                        {round.startDate ? fmtDate(round.startDate) : ''}
                        {round.startDate && round.endDate ? ' – ' : ''}
                        {round.endDate ? fmtDate(round.endDate) : ''}
                      </p>
                    )}
                    {round.description && <p className="text-main" style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>{round.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Prizes */}
            {activeTab === 'prizes' && (
              <div>
                <h3 className="text-2xl text-main mb-4">Rewards & Prizes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {(hackathon.prizes || []).map((prize, i) => (
                    <div key={i} style={{ padding: '1.25rem', border: '1px solid #10b981', borderRadius: '8px', background: '#f0fdf4' }}>
                      <span className="unstop-badge" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>{prize.label}</span>
                      <h4 className="text-main font-bold" style={{ fontSize: '1.5rem', color: '#047857' }}>{prize.amount}</h4>
                      {prize.description && (
                        <p className="text-main" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <CheckCircle size={16} color="#047857" /> {prize.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sticky Sidebar */}
        <div style={{ flex: '1 1 28%', minWidth: '280px' }}>
          <Card style={{ position: 'sticky', top: '100px', padding: '2rem' }}>
            {hackathon.registrationDeadline && (
              <div style={{ background: '#000', color: 'white', padding: '0.4rem 0.9rem', borderRadius: '20px', display: 'inline-block', fontSize: '0.82rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                Closes: {fmtDate(hackathon.registrationDeadline)}
              </div>
            )}
            <h3 className="text-xl font-bold text-main mb-1">Register Now</h3>
            <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
              {hackathon.status === 'Open' ? 'Registrations are currently open!' : `Status: ${hackathon.status}`}
            </p>

            {showModal ? (
              <div style={{ background: '#fff', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', animation: 'fadeIn 0.3s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <h4 className="font-bold text-main">{alreadyRegistered ? '✅ Already Registered' : `Step ${step}/3`}</h4>
                  <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>✕</button>
                </div>

                {alreadyRegistered && (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                    <p className="text-main font-bold">You're already registered!</p>
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Go to your student dashboard to submit your PPT.</p>
                    <Link to="/dashboard/student" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem', borderRadius: '4px' }}>Open Dashboard</Link>
                  </div>
                )}

                {profileLoading && !alreadyRegistered && (
                  <div style={{ textAlign: 'center', padding: '1rem' }}><p className="text-muted">Loading your profile...</p></div>
                )}

                {!profileLoading && !alreadyRegistered && step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p className="text-muted" style={{ fontSize: '0.82rem' }}>✨ Auto-filled from your profile — review and confirm.</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label className="text-main" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>First Name *</label>
                        <input className="form-control" placeholder="Ravi" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} style={{ fontSize: '0.9rem' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="text-main" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Last Name</label>
                        <input className="form-control" placeholder="(optional)" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} style={{ fontSize: '0.9rem' }} />
                      </div>
                    </div>
                    <label className="text-main" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Mobile Number *</label>
                    <input type="tel" className="form-control" placeholder="10-digit number" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} maxLength={10} style={{ fontSize: '0.9rem' }} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label className="text-main" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Gender</label>
                        <select className="form-control" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} style={{ fontSize: '0.9rem' }}>
                          <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="text-main" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Age</label>
                        <input type="number" className="form-control" placeholder="20" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} style={{ fontSize: '0.9rem' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label className="text-main" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Year</label>
                        <select className="form-control" value={formData.yearOfStudy} onChange={e => setFormData({ ...formData, yearOfStudy: e.target.value })} style={{ fontSize: '0.9rem' }}>
                          {YEARS.map(y => <option key={y}>{y}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="text-main" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Grad Year</label>
                        <select className="form-control" value={formData.gradYear} onChange={e => setFormData({ ...formData, gradYear: e.target.value })} style={{ fontSize: '0.9rem' }}>
                          <option>2027</option><option>2026</option><option>2028</option><option>2029</option>
                        </select>
                      </div>
                    </div>
                    <label className="text-main" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Department *</label>
                    <select className="form-control" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} style={{ fontSize: '0.9rem' }}>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <button onClick={handleNextStep1} className="btn-primary" disabled={otpSending} style={{ width: '100%', marginTop: '0.25rem' }}>
                      {otpSending ? 'Sending OTP...' : 'Send OTP to Email →'}
                    </button>
                  </div>
                )}

                {!profileLoading && !alreadyRegistered && step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
                    <div style={{ background: '#dcfce7', color: '#166534', padding: '0.8rem', borderRadius: '8px', border: '1px solid #86efac' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>✉️ Check your SRET email</p>
                      <p style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '0.2rem' }}>{auth.currentUser?.email}</p>
                    </div>
                    <input type="text" className="form-control" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} style={{ fontSize: '1.4rem', textAlign: 'center', letterSpacing: '0.5rem', fontWeight: 'bold' }} maxLength={6} />
                    <button onClick={handleVerifyOTP} className="btn-primary" style={{ width: '100%' }}>Verify OTP</button>
                    <button onClick={handleNextStep1} disabled={otpSending} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}>
                      {otpSending ? 'Resending...' : "Didn't receive? Resend OTP"}
                    </button>
                  </div>
                )}

                {!profileLoading && !alreadyRegistered && step === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ background: '#eff6ff', padding: '0.7rem', borderRadius: '4px', borderLeft: '4px solid var(--primary-blue)' }}>
                      <p style={{ fontSize: '0.82rem', color: '#1e3a8a' }}><b>Note:</b> Teammates get an email + Dashboard notification to confirm joining.</p>
                    </div>
                    <label className="text-main" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Team Name (Solo if blank)</label>
                    <input className="form-control" placeholder="e.g. Innovators" value={formData.teamName} onChange={e => setFormData({ ...formData, teamName: e.target.value })} style={{ fontSize: '0.9rem' }} />
                    <div style={{ borderBottom: '1px solid var(--border-light)' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="text-main" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Teammates ({formData.teamMembers.length + 1}/{hackathon.teamMax || 4})</label>
                      <button onClick={handleAddMember} className="btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}>+ Add</button>
                    </div>
                    {/* Leader */}
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }}></span>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formData.firstName} {formData.lastName}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Team Leader</div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✅ You</span>
                    </div>
                    {formData.teamMembers.map((member, index) => (
                      <div key={index} style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>⚠️ Pending invite</span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <input className="form-control" placeholder="Unique ID (e.g. e0124011)" value={member.uniqueId} onChange={e => updateMember(index, 'uniqueId', e.target.value)} style={{ flex: 1, fontSize: '0.85rem' }} />
                          <input className="form-control" placeholder="Full Name" value={member.name} onChange={e => updateMember(index, 'name', e.target.value)} style={{ flex: 1, fontSize: '0.85rem' }} />
                        </div>
                      </div>
                    ))}
                    <button onClick={handleNativeRegister} className="btn-primary" style={{ width: '100%', background: '#16a34a', border: 'none', marginTop: '0.25rem' }}>
                      ✅ Complete Registration
                    </button>
                  </div>
                )}
              </div>
            ) : (
              hackathon.status === 'Open' ? (
                <button onClick={handleOpenModal} className="btn-primary" style={{ width: '100%', borderRadius: '25px', padding: '0.85rem', fontSize: '1.05rem', marginBottom: '1rem' }}>
                  Register Now
                </button>
              ) : (
                <div style={{ background: '#f3f4f6', borderRadius: '8px', padding: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
                  <p className="text-muted font-bold">Registrations {hackathon.status}</p>
                </div>
              )
            )}
            <p className="text-center text-muted" style={{ fontSize: '0.82rem' }}>+25 SRET XP on registration ⭐</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HackathonDetails;
