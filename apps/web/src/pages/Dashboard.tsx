import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { GlassCard } from '../components/GlassCard';
import { RefreshCw, Search, CheckCircle, Plus, Edit2, Trash2, X } from 'lucide-react';
import './Dashboard.css';

interface Manhole {
  id: string;
  code: string;
  utility_type: string;
  status: string;
  depth_meters: number;
  lat?: number;
  lng?: number;
  install_date?: string;
}

export function Dashboard() {
  const [manholes, setManholes] = useState<Manhole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManhole, setEditingManhole] = useState<Manhole | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    utilityType: 'sewer',
    status: 'active',
    lat: '',
    lng: '',
    depthMeters: ''
  });

  const fetchManholes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/manholes');
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
          api.patch(`/admin/manholes/${id}`, { status: bulkStatus })
        )
      );
      setSelectedIds(new Set());
      fetchManholes();
    } catch (e) {
      console.error('Bulk update failed', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this manhole?')) return;
    try {
      await api.delete(`/admin/manholes/${id}`);
      fetchManholes();
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const openCreateModal = () => {
    setEditingManhole(null);
    setFormData({ code: '', utilityType: 'sewer', status: 'active', lat: '', lng: '', depthMeters: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (m: Manhole) => {
    setEditingManhole(m);
    setFormData({
      code: m.code || '',
      utilityType: m.utility_type || 'sewer',
      status: m.status || 'active',
      lat: m.lat ? m.lat.toString() : '',
      lng: m.lng ? m.lng.toString() : '',
      depthMeters: m.depth_meters ? m.depth_meters.toString() : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: formData.code,
        utilityType: formData.utilityType,
        status: formData.status,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        depthMeters: formData.depthMeters ? parseFloat(formData.depthMeters) : null
      };

      if (editingManhole) {
        await api.patch(`/admin/manholes/${editingManhole.id}`, payload);
      } else {
        await api.post('/admin/manholes', payload);
      }
      setIsModalOpen(false);
      fetchManholes();
    } catch (error) {
      console.error('Save failed', error);
      alert('Failed to save manhole details.');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <div>
          <h1>Manholes</h1>
          <p>Manage all manhole assets system-wide.</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchManholes} className="btn-icon">
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
          <button onClick={openCreateModal} className="btn-primary">
            <Plus size={18} />
            Add Manhole
          </button>
        </div>
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
              <option value="inactive">Inactive</option>
              <option value="buried">Buried</option>
              <option value="damaged">Damaged</option>
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
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">Loading data...</td>
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
                  <td>
                    <div className="row-actions">
                      <button onClick={() => openEditModal(m)} className="action-btn edit" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="action-btn delete" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && manholes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8">No manholes found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {isModalOpen && (
        <div className="modal-overlay">
          <GlassCard className="modal-content">
            <div className="modal-header">
              <h2>{editingManhole ? 'Edit Manhole' : 'Create Manhole'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="close-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Code</label>
                <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="glass-input" />
              </div>
              <div className="form-group-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input required type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} className="glass-input" />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input required type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} className="glass-input" />
                </div>
              </div>
              <div className="form-group-row">
                <div className="form-group">
                  <label>Utility Type</label>
                  <select value={formData.utilityType} onChange={e => setFormData({...formData, utilityType: e.target.value})} className="glass-select full-width">
                    <option value="sewer">Sewer</option>
                    <option value="electrical">Electrical</option>
                    <option value="telecom">Telecom</option>
                    <option value="water">Water</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="glass-select full-width">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="buried">Buried</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Depth (meters)</label>
                <input type="number" step="any" value={formData.depthMeters} onChange={e => setFormData({...formData, depthMeters: e.target.value})} className="glass-input" />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Manhole</button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
