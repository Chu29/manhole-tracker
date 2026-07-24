import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { GlassCard } from '../components/GlassCard';
import { RefreshCw, Search } from 'lucide-react';
import './Technicians.css';

interface Technician {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export function Technicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/technicians');
      setTechnicians(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await api.patch(`/admin/technicians/${id}`, { role: newRole });
      fetchTechnicians(); // refresh list to ensure sync
    } catch (error) {
      console.error('Role update failed', error);
      alert('Failed to update role');
    }
  };

  return (
    <div className="technicians-container">
      <header className="page-header">
        <div>
          <h1>Technicians</h1>
          <p>Manage system users and access roles.</p>
        </div>
        <button onClick={fetchTechnicians} className="btn-icon">
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </header>

      <GlassCard className="table-container">
        <div className="table-header-actions">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search technicians..." />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">Loading data...</td>
                </tr>
              ) : technicians.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.name}</td>
                  <td>{t.email}</td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>
                    <select 
                      className={`role-select ${t.role === 'admin' ? 'role-admin' : 'role-tech'}`}
                      value={t.role}
                      onChange={(e) => handleRoleChange(t.id, e.target.value)}
                    >
                      <option value="technician">Technician</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
              {!loading && technicians.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8">No technicians found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
