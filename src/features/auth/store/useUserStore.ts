import { create } from "zustand";
import { BaseUser } from "@/types";

interface UserState {
  user: BaseUser | null;
  isLoading: boolean;
  setUser: (user: BaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  updatePreferences: (prefs: Partial<BaseUser["preferences"]>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  updatePreferences: (prefs) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            preferences: { ...state.user.preferences, ...prefs },
          }
        : null,
    })),
}));
