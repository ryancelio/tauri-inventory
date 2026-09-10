import { create } from "zustand";

interface ApiStatusState {
  isOnline: boolean;
  isChecking: boolean;

  setOnline: (value: boolean) => void;
  setChecking: (value: boolean) => void;
}

export const useApiStatusStore = create<ApiStatusState>((set) => ({
  isOnline: true,
  isChecking: false,

  setOnline: (value) => set({ isOnline: value }),
  setChecking: (value) => set({ isChecking: value }),
}));
