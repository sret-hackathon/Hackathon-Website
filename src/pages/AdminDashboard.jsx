import { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment, addDoc, serverTimestamp, deleteDoc, orderBy } from 'firebase/firestore';
import { Database, Users, CheckCircle, XCircle, Image as ImageIcon, Send, FileText, PlusCircle, Trash2, Shield, Settings } from 'lucide-react';

const TABS = [
  { id: 'publish', label: '📋 Publish Hackathon', icon: Send },
  { id: 'manage', label: '⚙️ Manage Hacks', icon: Settings },
  { id: 'students', label: '🎓 All Students', icon: Shield },
  { id: 'roster', label: '👥 Reg Roster', icon: Users },
  { id: 'submissions', label: '📂 Submissions', icon: FileText },
  { id: 'proofs', label: '🖼️ Proof Queue', icon: Database },
  { id: 'gallery', label: '🏆 Gallery', icon: ImageIcon },
];

const emptyRound = () => ({ name: '', startDate: '', endDate: '', description: '' });
const emptyPrize = () => ({ label: '', amount: '', description: '' });

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('publish');

  // ─── Data States ───
  const [verifications, setVerifications] = useState([]);
  const [nativeRegs, setNativeRegs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allHackathons, setAllHackathons] = useState([]);
  
  // ─── UI States ───
  const [viewProof, setViewProof] = useState(null);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryBase64, setGalleryBase64] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  // ─── Publisher Form ───
  const [hackForm, setHackForm] = useState({
    title: '', organizer: '', tagline: '', type: 'mock', externalUrl: '',
    teamMin: 1, teamMax: 4, prizeTotal: '', eligibility: '',
    registrationDeadline: '', rounds: [emptyRound()], prizes: [emptyPrize()],
  });
  const [publishing, setPublishing] = useState(false);

  const fetchVerifications = async () => {
    try {
      const q = query(collection(db, 'verifications'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      setVerifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  const fetchNativeRegistrations = async () => {
    try {
      const snap = await getDocs(collection(db, 'registrations'));
      setNativeRegs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  const fetchSubmissions = async () => {
    try {
      const snap = await getDocs(collection(db, 'submissions'));
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  const fetchAllStudents = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setAllStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  const fetchAllHackathons = async () => {
    try {
      const q = query(collection(db, 'hackathons'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setAllHackathons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  const refreshAllData = useCallback(async () => {
    setLoadingData(true);
    await Promise.all([
      fetchVerifications(),
      fetchNativeRegistrations(),
      fetchSubmissions(),
      fetchAllStudents(),
      fetchAllHackathons()
    ]);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // ─── Verification Logic ───
  const handleVerify = async (verificationId, studentId, points) => {
    if (!window.confirm('Approve proof and award points?')) return;
    try {
      await updateDoc(doc(db, 'users', studentId), { points: increment(points) });
      await updateDoc(doc(db, 'verifications', verificationId), { status: 'approved' });
      window.toast(`✅ Approved! +${points} XP awarded.`);
      fetchVerifications();
    } catch (err) { window.toast(err.message); }
  };

  const handleReject = async (verificationId) => {
    if (!window.confirm('Reject this proof?')) return;
    try {
      await updateDoc(doc(db, 'verifications', verificationId), { status: 'rejected' });
      fetchVerifications();
      window.toast('❌ Proof rejected.');
    } catch (err) { window.toast(err.message); }
  };

  // ─── Hackathon Management ───
  const handleDeleteHackathon = async (id) => {
    if (!window.confirm('⚠️ Are you sure? This will remove the hackathon from the live page.')) return;
    try {
      await deleteDoc(doc(db, 'hackathons', id));
      window.toast('🗑️ Hackathon deleted.');
      fetchAllHackathons();
    } catch (err) { window.toast(err.message); }
  };

  const handleToggleHackStatus = async (id, currentStatus) => {
    const next = currentStatus === 'Open' ? 'Closed' : 'Open';
    try {
      await updateDoc(doc(db, 'hackathons', id), { status: next });
      window.toast(`Hackathon status set to: ${next}`);
      fetchAllHackathons();
    } catch (err) { window.toast(err.message); }
  };

  // ─── Publisher Logic ───
  const updateRound = (i, field, value) => {
    const rounds = [...hackForm.rounds];
    rounds[i][field] = value;
    setHackForm({ ...hackForm, rounds });
  };
  const addRound = () => setHackForm({ ...hackForm, rounds: [...hackForm.rounds, emptyRound()] });
  const removeRound = (i) => setHackForm({ ...hackForm, rounds: hackForm.rounds.filter((_, idx) => idx !== i) });

  const updatePrize = (i, field, value) => {
    const prizes = [...hackForm.prizes];
    prizes[i][field] = value;
    setHackForm({ ...hackForm, prizes });
  };
  const addPrize = () => setHackForm({ ...hackForm, prizes: [...hackForm.prizes, emptyPrize()] });
  const removePrize = (i) => setHackForm({ ...hackForm, prizes: hackForm.prizes.filter((_, idx) => idx !== i) });

  const handlePublishHackathon = async (e) => {
    e.preventDefault();
    if (!hackForm.title) return window.toast('Title is required.');
    setPublishing(true);
    try {
      await addDoc(collection(db, 'hackathons'), {
        ...hackForm,
        status: 'Open',
        teamSize: `${hackForm.teamMin} - ${hackForm.teamMax} Members`,
        createdBy: user?.uid || 'admin',
        createdAt: serverTimestamp(),
      });
      window.toast('🚀 Hackathon published!');
      setActiveTab('manage');
      fetchAllHackathons();
      setHackForm({ title: '', organizer: '', tagline: '', type: 'mock', externalUrl: '', teamMin: 1, teamMax: 4, prizeTotal: '', eligibility: '', registrationDeadline: '', rounds: [emptyRound()], prizes: [emptyPrize()] });
    } catch (err) { window.toast(err.message); }
    finally { setPublishing(false); }
  };

  // ─── Gallery Logic ───
  const submitGallery = async () => {
    if (!galleryBase64) return window.toast('Select an image!');
    try {
      await addDoc(collection(db, 'gallery'), { title: galleryTitle, imageBase64: galleryBase64, createdAt: serverTimestamp() });
      window.toast('Added to Gallery!');
      setGalleryTitle(''); setGalleryBase64(null);
    } catch (err) { window.toast(err.message); }
  };

  const TAB_BTN = (t) => ({
    padding: '0.8rem 1rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
    background: 'none', border: 'none', borderBottom: activeTab === t.id ? '2px solid var(--primary-blue)' : '2px solid transparent',
    color: activeTab === t.id ? 'var(--primary-blue)' : 'var(--text-muted)', fontSize: '0.85rem'
  });

  return (
    <div style={{ animation: 'fadeIn 0.5s', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-4xl text-main mb-1">Admin Dashboard</h1>
          <p className="text-muted">Control center for SRET Hackathon Club.</p>
        </div>
        <button onClick={refreshAllData} className="btn-outline" style={{ borderRadius: '25px', padding: '0.5rem 1.2rem' }}>
          {loadingData ? '⏳ Syncing...' : '↻ Sync Data'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-light)', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '2px' }}>
        {TABS.map(t => (
          <button key={t.id} style={TAB_BTN(t)} onClick={() => setActiveTab(t.id)}>
            <t.icon size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: PUBLISH ─── */}
      {activeTab === 'publish' && (
        <form onSubmit={handlePublishHackathon} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
          <Card style={{ borderLeft: '4px solid var(--primary-blue)' }}>
            <h2 className="text-main text-xl mb-4 font-bold">Hackathon Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="form-control" placeholder="Title*" value={hackForm.title} onChange={e => setHackForm({ ...hackForm, title: e.target.value })} required />
              <input className="form-control" placeholder="Organizer (e.g. Varroc)" value={hackForm.organizer} onChange={e => setHackForm({ ...hackForm, organizer: e.target.value })} />
              <input className="form-control" placeholder="Banner Tagline" value={hackForm.tagline} onChange={e => setHackForm({ ...hackForm, tagline: e.target.value })} />
              <select className="form-control" value={hackForm.type} onChange={e => setHackForm({ ...hackForm, type: e.target.value })}>
                <option value="mock">🏫 SRET Mock Hackathon</option>
                <option value="external">🌐 External Hackathon Link</option>
              </select>
              {hackForm.type === 'external' && <input className="form-control" placeholder="External URL" value={hackForm.externalUrl} onChange={e => setHackForm({ ...hackForm, externalUrl: e.target.value })} />}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" className="form-control" placeholder="Min Members" value={hackForm.teamMin} onChange={e => setHackForm({ ...hackForm, teamMin: Number(e.target.value) })} />
                <input type="number" className="form-control" placeholder="Max Members" value={hackForm.teamMax} onChange={e => setHackForm({ ...hackForm, teamMax: Number(e.target.value) })} />
              </div>
              <input className="form-control" placeholder="Prize Pool (e.g. ₹ 40,000)" value={hackForm.prizeTotal} onChange={e => setHackForm({ ...hackForm, prizeTotal: e.target.value })} />
              <textarea className="form-control" placeholder="Eligibility Criteria" value={hackForm.eligibility} onChange={e => setHackForm({ ...hackForm, eligibility: e.target.value })} />
              <label className="text-muted" style={{ fontSize: '0.85rem' }}>Registration Deadline</label>
              <input type="datetime-local" className="form-control" value={hackForm.registrationDeadline} onChange={e => setHackForm({ ...hackForm, registrationDeadline: e.target.value })} />
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <Card style={{ borderLeft: '4px solid #8b5cf6' }}>
              <h2 className="text-main text-xl mb-4 font-bold flex justify-between">
                <span>Timeline</span>
                <button type="button" onClick={addRound} className="btn-outline" style={{ fontSize: '0.75rem' }}>+ Add Round</button>
              </h2>
              <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {hackForm.rounds.map((r, i) => (
                  <div key={i} style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', position: 'relative' }}>
                    <button type="button" onClick={() => removeRound(i)} style={{ position: 'absolute', top: '5px', right: '5px', color: 'red', border: 'none', background: 'none' }}><Trash2 size={14} /></button>
                    <input className="form-control mb-2" placeholder={`Round ${i+1} Name`} value={r.name} onChange={e => updateRound(i, 'name', e.target.value)} />
                    <textarea className="form-control mb-2" placeholder="Description" rows={1} value={r.description} onChange={e => updateRound(i, 'description', e.target.value)} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="datetime-local" className="form-control" value={r.startDate} onChange={e => updateRound(i, 'startDate', e.target.value)} />
                      <input type="datetime-local" className="form-control" value={r.endDate} onChange={e => updateRound(i, 'endDate', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ borderLeft: '4px solid #f59e0b' }}>
              <h2 className="text-main text-xl mb-4 font-bold flex justify-between">
                <span>Prize Tiers</span>
                <button type="button" onClick={addPrize} className="btn-outline" style={{ fontSize: '0.75rem' }}>+ Add Prize</button>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {hackForm.prizes.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input className="form-control" placeholder="Winner" value={p.label} onChange={e => updatePrize(i, 'label', e.target.value)} />
                        <input className="form-control" placeholder="Amount" value={p.amount} onChange={e => updatePrize(i, 'amount', e.target.value)} />
                      </div>
                      <input className="form-control" placeholder="Description (e.g. Cash + PPO)" value={p.description} onChange={e => updatePrize(i, 'description', e.target.value)} />
                    </div>
                    <button type="button" onClick={() => removePrize(i)} style={{ color: 'red', border: 'none', background: 'none', marginTop: '10px' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </Card>

            <button type="submit" disabled={publishing} className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
              {publishing ? 'Publishing...' : '🚀 Put Hackathon Live'}
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB: MANAGE HACKS ─── */}
      {activeTab === 'manage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="text-main text-2xl font-bold">Manage Active Hackathons</h2>
          {allHackathons.map(h => (
            <Card key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="text-main font-bold">{h.title}</h3>
                <p className="text-muted">{h.organizer} · {h.type === 'mock' ? '🏫 SRET' : '🌐 External'}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleToggleHackStatus(h.id, h.status)} className="btn-outline" style={{ borderColor: h.status === 'Open' ? 'green' : 'orange' }}>
                  {h.status === 'Open' ? '🟢 Open' : '🔴 Closed'}
                </button>
                <button onClick={() => handleDeleteHackathon(h.id)} className="btn-outline" style={{ color: 'red', borderColor: 'red' }}><Trash2 size={18} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── TAB: ALL STUDENTS ─── */}
      {activeTab === 'students' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Student Name</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Email / UID</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Academic</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>XP Points</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {allStudents.map(s => (
                <tr key={s.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{s.firstName} {s.lastName}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{s.email}</td>
                  <td style={{ padding: '1rem' }}>{s.department || '—'} · {s.yearOfStudy || '—'}</td>
                  <td style={{ padding: '1rem' }}><span style={{ color: 'var(--primary-blue)', fontWeight: 800 }}>⭐ {s.points || 0}</span></td>
                  <td style={{ padding: '1rem' }}><span className="unstop-badge" style={{ background: s.role === 'admin' ? '#fee2e2' : '#f0fdf4' }}>{s.role || 'student'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB: ROSTER (REGS) ─── */}
      {activeTab === 'roster' && (
        <div style={{ overflowX: 'auto' }}>
          <h2 className="text-main text-2xl mb-4">Registration Roster ({nativeRegs.length})</h2>
          <table style={{ width: '100%', background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <thead style={{ background: '#eee' }}>
              <tr><th style={{ padding: '1rem' }}>Hackathon</th><th style={{ padding: '1rem' }}>Team</th><th style={{ padding: '1rem' }}>Leader</th><th style={{ padding: '1rem' }}>Size</th></tr>
            </thead>
            <tbody>
              {nativeRegs.map(reg => (
                <tr key={reg.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}><span className="unstop-badge">{reg.hackathonId}</span></td>
                  <td style={{ padding: '1rem', fontWeight: 700 }}>{reg.teamName || 'Solo'}</td>
                  <td style={{ padding: '1rem' }}>{reg.studentEmail}</td>
                  <td style={{ padding: '1rem' }}>{reg.teamMembers?.length + 1 || 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB: SUBMISSIONS ─── */}
      {activeTab === 'submissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="text-main text-2xl mb-2 font-bold">Project Submissions ({submissions.length})</h2>
          {submissions.map(sub => (
            <Card key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="unstop-badge" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>{sub.hackathonId}</span>
                <h3 className="text-main font-bold">{sub.title}</h3>
                <p className="text-muted">{sub.studentEmail}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={sub.driveLink} target="_blank" rel="noreferrer" className="btn-outline">📂 Link</a>
                <button onClick={async () => {
                  if (sub.status === 'shortlisted') return;
                  await updateDoc(doc(db, 'submissions', sub.id), { status: 'shortlisted' });
                  window.toast('Shortlisted!'); fetchSubmissions();
                }} className="btn-primary" style={{ background: sub.status === 'shortlisted' ? '#999' : '#16a34a', borderRadius: '4px' }}>
                  {sub.status === 'shortlisted' ? '✅ Shortlisted' : 'Shortlist'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── TAB: PROOFS ─── */}
      {activeTab === 'proofs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="text-main text-2xl mb-2">Pending Proofs ({verifications.length})</h2>
          {verifications.map(v => (
            <Card key={v.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3 className="text-main font-bold">{v.studentEmail}</h3>
                <p className="text-muted">+{v.claimedPoints} Points</p>
                <button onClick={() => setViewProof(v.proofBase64)} className="text-main underline" style={{ fontSize: '0.8rem', cursor: 'pointer', background: 'none', border: 'none' }}>View Screenshot</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleVerify(v.id, v.studentId, v.claimedPoints)} className="btn-primary" style={{ background: 'green' }}>Confirm</button>
                <button onClick={() => handleReject(v.id)} className="btn-outline" style={{ color: 'red' }}>Reject</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── TAB: GALLERY ─── */}
      {activeTab === 'gallery' && (
        <Card style={{ maxWidth: '400px' }}>
          <h2 className="text-main text-xl mb-4 font-bold">Add to Hall of Fame</h2>
          <input className="form-control mb-2" placeholder="Caption" value={galleryTitle} onChange={e => setGalleryTitle(e.target.value)} />
          <input type="file" onChange={(e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setGalleryBase64(reader.result);
            reader.readAsDataURL(file);
          }} className="mb-4" />
          <button onClick={submitGallery} className="btn-primary" style={{ width: '100%' }}>Upload Photo</button>
        </Card>
      )}

      {viewProof && <div onClick={() => setViewProof(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><img src={viewProof} style={{ maxWidth: '90%', maxHeight: '90%' }} /></div>}
    </div>
  );
};

export default AdminDashboard;
