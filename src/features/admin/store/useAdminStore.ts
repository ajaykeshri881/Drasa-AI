import { create } from "zustand";

export interface AdminAlert {
  _id: string;
  id?: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isActive: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
}

interface AdminState {
  activeAlerts: AdminAlert[];
  setActiveAlerts: (alerts: AdminAlert[]) => void;
  dismissAlert: (alertId: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  activeAlerts: [],
  setActiveAlerts: (activeAlerts) => set({ activeAlerts }),
  dismissAlert: (alertId) =>
    set((state) => ({
      activeAlerts: state.activeAlerts.filter((a) => a._id !== alertId && a.id !== alertId),
    })),
}));
