import { create } from 'zustand';
import type { Appointment, VisitRecord, BlacklistItem } from '@shared/types';
import { appointmentApi, recordApi, blacklistApi } from '../services/api.js';

type Role = 'employee' | 'visitor' | 'guard' | null;

interface AppState {
  role: Role;
  currentEmployee: { name: string; phone: string } | null;

  appointments: Appointment[];
  loading: boolean;
  error: string | null;

  todayRecords: VisitRecord[];
  todayStats: { total: number; entered: number; exited: number; inPark: number };

  blacklist: BlacklistItem[];

  setRole: (role: Role) => void;
  setCurrentEmployee: (emp: { name: string; phone: string } | null) => void;

  fetchAppointments: (params?: { status?: string; employeePhone?: string }) => Promise<void>;
  fetchTodayRecords: () => Promise<void>;
  fetchTodayStats: () => Promise<void>;
  fetchBlacklist: () => Promise<void>;

  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  role: null,
  currentEmployee: null,

  appointments: [],
  loading: false,
  error: null,

  todayRecords: [],
  todayStats: { total: 0, entered: 0, exited: 0, inPark: 0 },

  blacklist: [],

  setRole: (role) => set({ role }),
  setCurrentEmployee: (emp) => set({ currentEmployee: emp }),

  fetchAppointments: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await appointmentApi.list(params);
      set({ appointments: data });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTodayRecords: async () => {
    set({ loading: true, error: null });
    try {
      const data = await recordApi.listToday();
      set({ todayRecords: data });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTodayStats: async () => {
    try {
      const data = await recordApi.getTodayStats();
      set({ todayStats: data });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  },

  fetchBlacklist: async () => {
    set({ loading: true, error: null });
    try {
      const data = await blacklistApi.list();
      set({ blacklist: data });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
