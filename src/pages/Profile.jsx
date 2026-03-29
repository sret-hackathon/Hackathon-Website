import { useState, useEffect } from 'react';
import Card from '../components/Card';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User, Image as ImageIcon, Briefcase, Link2, CheckCircle, Phone, GraduationCap, School } from 'lucide-react';

const DEPARTMENTS = ['AIML', 'AIDA', 'Medical Engineering', 'ECE', 'Cyber Security'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    gender: 'Male',
    age: '',
    yearOfStudy: '1st Year',
    department: 'AIML',
    gradYear: '2027',
    headline: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
    avatarBase64: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            mobile: data.mobile || '',
            gender: data.gender || 'Male',
            age: data.age || '',
            yearOfStudy: data.yearOfStudy || '1st Year',
            department: data.department || 'AIML',
            gradYear: data.gradYear || '2027',
            headline: data.headline || 'SRET Innovator',
            bio: data.bio || '',
            githubUrl: data.githubUrl || '',
            linkedinUrl: data.linkedinUrl || '',
            avatarBase64: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser.uid}`
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile({...profile, avatarBase64: reader.result});
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ...profile,
        avatar: profile.avatarBase64,
        updatedAt: serverTimestamp()
      });
      window.toast('✨ Master Profile Updated! All hackathon registrations will now use this data.');
    } catch (err) {
      window.toast("Error saving profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <div className="spin" style={{ width: '40px', height: '40px', border: '3px solid #ccc', borderTopColor: 'var(--primary-blue)', borderRadius: '50%', margin: '0 auto' }}></div>
      <p className="text-muted mt-2">Opening your locker...</p>
    </div>
  );

  return (
    <div style={{animation: 'fadeIn 0.5s', maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem'}}>
      <div className="text-center mb-8">
        <h1 className="text-4xl text-main mb-2">Master Profile</h1>
        <p className="text-muted">Keep your academic and personal details updated for easy hackathon registrations.</p>
      </div>

      <form onSubmit={handleSave}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem'}}>
          
          {/* Section 1: Identity */}
          <Card>
            <h2 className="text-xl font-bold text-main mb-6 flex items-center gap-2"><User size={20} color="var(--primary-blue)"/> Personal Identity</h2>
            
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
              <img src={profile.avatarBase64} alt="Avatar" style={{width: '120px', height: '120px', borderRadius: '50%', background: '#fff', objectFit: 'cover', border: '4px solid var(--primary-blue)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}} />
              <label style={{cursor: 'pointer', color: 'var(--primary-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem'}}>
                <ImageIcon size={16}/> Change Profile Photo
                <input type="file" accept="image/*" onChange={handleImageChange} style={{display: 'none'}} />
              </label>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
              <div style={{display: 'flex', gap: '0.75rem'}}>
                <div style={{flex: 1}}>
                  <label className="text-main font-bold" style={{fontSize: '0.85rem'}}>First Name</label>
                  <input type="text" className="form-control mt-1" value={profile.firstName} onChange={e=>setProfile({...profile, firstName: e.target.value})} required />
                </div>
                <div style={{flex: 1}}>
                  <label className="text-main font-bold" style={{fontSize: '0.85rem'}}>Last Name</label>
                  <input type="text" className="form-control mt-1" value={profile.lastName} onChange={e=>setProfile({...profile, lastName: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-main font-bold" style={{fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Phone size={14}/> Mobile Number</label>
                <input type="tel" className="form-control mt-1" placeholder="10-digit number" value={profile.mobile} onChange={e=>setProfile({...profile, mobile: e.target.value})} />
              </div>

              <div style={{display: 'flex', gap: '0.75rem'}}>
                <div style={{flex: 1}}>
                  <label className="text-main font-bold" style={{fontSize: '0.85rem'}}>Gender</label>
                  <select className="form-control mt-1" value={profile.gender} onChange={e=>setProfile({...profile, gender: e.target.value})}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div style={{flex: 1}}>
                  <label className="text-main font-bold" style={{fontSize: '0.85rem'}}>Age</label>
                  <input type="number" className="form-control mt-1" value={profile.age} onChange={e=>setProfile({...profile, age: e.target.value})} />
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Academic & Social */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
            <Card>
              <h2 className="text-xl font-bold text-main mb-6 flex items-center gap-2"><GraduationCap size={20} color="var(--primary-blue)"/> Academic Records</h2>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                <div>
                  <label className="text-main font-bold" style={{fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><School size={14}/> Department</label>
                  <select className="form-control mt-1" value={profile.department} onChange={e=>setProfile({...profile, department: e.target.value})}>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{display: 'flex', gap: '0.75rem'}}>
                  <div style={{flex: 1}}>
                    <label className="text-main font-bold" style={{fontSize: '0.85rem'}}>Current Year</label>
                    <select className="form-control mt-1" value={profile.yearOfStudy} onChange={e=>setProfile({...profile, yearOfStudy: e.target.value})}>
                      {YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <div style={{flex: 1}}>
                    <label className="text-main font-bold" style={{fontSize: '0.85rem'}}>Grad Year</label>
                    <select className="form-control mt-1" value={profile.gradYear} onChange={e=>setProfile({...profile, gradYear: e.target.value})}>
                      <option>2027</option><option>2026</option><option>2028</option><option>2029</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-bold text-main mb-6 flex items-center gap-2"><Briefcase size={20} color="var(--primary-blue)"/> Online Presence</h2>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                <div>
                  <label className="text-main font-bold" style={{fontSize: '0.85rem'}}>Headline / Bio</label>
                  <input type="text" className="form-control mt-1" placeholder="E.g. Fullstack React Developer" value={profile.headline} onChange={e=>setProfile({...profile, headline: e.target.value})} />
                </div>
                <div>
                  <label className="text-main font-bold" style={{fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Link2 size={14}/> GitHub Profile</label>
                  <input type="url" className="form-control mt-1" placeholder="https://github.com/..." value={profile.githubUrl} onChange={e=>setProfile({...profile, githubUrl: e.target.value})} />
                </div>
                <div>
                  <label className="text-main font-bold" style={{fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Link2 size={14}/> LinkedIn Profile</label>
                  <input type="url" className="form-control mt-1" placeholder="https://linkedin.com/in/..." value={profile.linkedinUrl} onChange={e=>setProfile({...profile, linkedinUrl: e.target.value})} />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <button type="submit" className="btn-primary mt-8" disabled={saving} style={{width: '100%', borderRadius: '30px', padding: '1rem', fontSize: '1.1rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'}}>
           {saving ? '⏳ Saving Updates...' : <><CheckCircle size={22}/> Save Master Profile</>}
        </button>
      </form>
    </div>
  );
};
export default Profile;
