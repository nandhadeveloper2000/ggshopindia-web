"use client";
import { create } from "zustand";

type AuthModalMode = "login" | "signup";

interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
  /** Open the login/signup popup, optionally starting on the signup tab. */
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
}

/**
 * Controls the global Flipkart-style login popup ({@link AuthModal}). Any
 * component can call `openAuthModal()` to prompt sign-in without navigating away.
 */
export const useAuthModal = create<AuthModalState>((set) => ({
  open: false,
  mode: "login",
  openAuthModal: (mode = "login") => set({ open: true, mode }),
  closeAuthModal: () => set({ open: false }),
}));
