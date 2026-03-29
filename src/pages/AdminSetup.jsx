import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import Card from '../components/Card';
import { ShieldCheck, UserCheck, UserX } from 'lucide-react';

// This page is only accessible if the user is already a super_admin.
const AdminSetup = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!auth.currentUser) return;
      try {
        const myDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)));
        if (!myDoc.empty) setCurrentUserRole(myDoc.docs[0].data().role);

        const snap = await getDocs(collection(db, 'users'));
        setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      window.toast(`✅ Role updated to "${newRole}" successfully.`);
    } catch (err) {
      window.toast('Error: ' + err.message);
    }
  };

  if (!auth.currentUser) {
    return (
      <Card style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px', margin: '4rem auto' }}>
        <p className="text-muted">Please sign in to access the Admin Management Panel.</p>
      </Card>
    );
  }

  if (currentUserRole !== 'super_admin' && currentUserRole !== 'admin') {
    return (
      <Card style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px', margin: '4rem auto' }}>
        <ShieldCheck size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 className="text-main text-2xl mb-2">Access Restricted</h2>
        <p className="text-muted">Only the Super Admin can manage user roles. Contact the club lead for access.</p>
      </Card>
    );
  }

  const ROLE_OPTIONS = ['student', 'admin', 'super_admin', 'dean'];

  return (
    <div style={{ animation: 'fadeIn 0.5s' }}>
      <div className="mb-4">
        <h1 className="text-4xl text-main mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck color="var(--primary-blue)" /> Admin Management Panel
        </h1>
        <p className="text-muted">Grant or revoke admin access for faculty, coordinators, and Dean accounts.</p>
      </div>

      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
        <div>
          <b style={{ color: '#92400e' }}>Important:</b>
          <span style={{ color: '#92400e', fontSize: '0.9rem' }}> Only promote trusted faculty and coordinators to admin. <b>super_admin</b> has full access including role management.</span>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Loading users...</p>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem' }}>Email / Unique ID</th>
                  <th style={{ padding: '1rem' }}>Name</th>
                  <th style={{ padding: '1rem' }}>Current Role</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '1rem', color: 'var(--primary-blue)', fontWeight: 600 }}>{user.email || user.id}</td>
                    <td style={{ padding: '1rem' }}>{user.name || '—'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: user.role === 'super_admin' ? '#fef3c7' : user.role === 'admin' || user.role === 'faculty_admin' ? '#eff6ff' : user.role === 'dean' ? '#f0fdf4' : '#f3f4f6',
                        color: user.role === 'super_admin' ? '#92400e' : user.role === 'admin' || user.role === 'faculty_admin' ? '#1e3a8a' : user.role === 'dean' ? '#166534' : 'var(--text-muted)',
                        padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold'
                      }}>
                        {user.role || 'student'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {user.id !== auth.currentUser?.uid ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {ROLE_OPTIONS.filter(r => r !== (user.role || 'student')).map(role => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(user.id, role)}
                              style={{
                                background: role === 'student' ? '#fee2e2' : role === 'super_admin' ? '#fef3c7' : '#eff6ff',
                                color: role === 'student' ? '#dc2626' : role === 'super_admin' ? '#92400e' : '#1e3a8a',
                                border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                              }}
                            >
                              {role === 'student' ? <><UserX size={12} style={{ marginRight: '4px' }} />Revoke</> : <><UserCheck size={12} style={{ marginRight: '4px' }} />→ {role}</>}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>You (current user)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminSetup;
