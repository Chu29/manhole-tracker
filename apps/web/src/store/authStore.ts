import { create } from 'zustand';

interface Technician {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  technician: Technician | null;
  isHydrated: boolean;
  setAuth: (token: string, technician: Technician) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  technician: null,
  isHydrated: false,

  setAuth: (token, technician) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_technician', JSON.stringify(technician));
    set({ token, technician });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_technician');
    set({ token: null, technician: null });
  },

  hydrate: () => {
    const token = localStorage.getItem('auth_token');
    const technicianStr = localStorage.getItem('auth_technician');
    
    let technician = null;
    if (technicianStr) {
      try {
        technician = JSON.parse(technicianStr);
      } catch (e) {
        console.error('Failed to parse technician from local storage', e);
      }
    }

    set({ token, technician, isHydrated: true });
  }
}));
