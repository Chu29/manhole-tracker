import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { GlassCard } from '../components/GlassCard';
import { RefreshCw, Search, CheckCircle } from 'lucide-react';
import './Dashboard.css';

interface Manhole {
  id: string;
  code: string;
  utility_type: string;
  status: string;
  depth_meters: number;
}

export function Dashboard() {
  const [manholes, setManholes] = useState<Manhole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('active');

  const fetchManholes = async () => {
    setLoading(true);
    try {
      // Assuming a generic GET /manholes endpoint for admins exists or reusing nearby
      const res = await api.get('/manholes/nearby?lat=0&lng=0&radius=999999999');
      setManholes(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManholes();
  }, []);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => 
          api.patch(`/manholes/${id}`, { status: bulkStatus })
        )
      );
      setSelectedIds(new Set());
      fetchManholes();
    } catch (e) {
      console.error('Bulk update failed', e);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Manage manhole assets globally.</p>
        </div>
        <button onClick={fetchManholes} className="btn-icon">
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </header>

      {selectedIds.size > 0 && (
        <GlassCard className="bulk-actions-panel slide-down">
          <div className="bulk-info">
            <CheckCircle className="text-accent" size={20} />
            <span>{selectedIds.size} items selected</span>
          </div>
          <div className="bulk-controls">
            <select 
              value={bulkStatus} 
              onChange={e => setBulkStatus(e.target.value)}
              className="glass-select"
            >
              <option value="active">Active</option>
              <option value="needs_inspection">Needs Inspection</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <button onClick={handleBulkUpdate} className="btn-primary small">
              Update Status
            </button>
          </div>
        </GlassCard>
      )}

      <GlassCard className="table-container">
        <div className="table-header-actions">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search manholes..." />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Code</th>
                <th>Utility Type</th>
                <th>Status</th>
                <th>Depth</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">Loading data...</td>
                </tr>
              ) : manholes.map((m) => (
                <tr key={m.id} className={selectedIds.has(m.id) ? 'selected' : ''}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                      className="custom-checkbox"
                    />
                  </td>
                  <td className="font-medium">{m.code}</td>
                  <td className="capitalize">{m.utility_type}</td>
                  <td>
                    <span className={`status-badge status-${m.status.replace('_', '-')}`}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{m.depth_meters ? `${m.depth_meters}m` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
