import { create } from "zustand";
import { type SupportedLocale, DEFAULT_LOCALE } from "@sgc/i18n";

interface AppState {
  activeCondominiumId: string | null;
  locale: SupportedLocale;
  setActiveCondominiumId: (id: string | null) => void;
  setLocale: (locale: SupportedLocale) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeCondominiumId: null,
  locale: DEFAULT_LOCALE,
  setActiveCondominiumId: (id) => set({ activeCondominiumId: id }),
  setLocale: (locale) => set({ locale }),
}));
