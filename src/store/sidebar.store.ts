"use client";
import { create } from "zustand";

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
  setMobileOpen: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  collapsed: false,
  mobileOpen: false,
  toggle: () => set({ collapsed: !get().collapsed }),
  setCollapsed: (v) => set({ collapsed: v }),
  setMobileOpen: (v) => set({ mobileOpen: v }),
}));
