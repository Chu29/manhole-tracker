import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, LogOut, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './Sidebar.css';

export function Sidebar() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-glow">MT</div>
        <h2>Admin</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MapIcon size={20} />
          <span>Map View</span>
        </NavLink>
        <NavLink to="/technicians" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Technicians</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={logout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
