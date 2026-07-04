"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocationState {
  pincode?: string;
  place?: string;
  /** Coordinates (from geolocation or a geocoded pincode) — used for shop distance. */
  lat?: number;
  lng?: number;
  /** Set the delivery location (persisted to localStorage). */
  setLocation: (pincode: string, place?: string, lat?: number, lng?: number) => void;
  clear: () => void;
}

/**
 * The shopper's chosen delivery location (Reliance Digital-style pincode picker),
 * shown in the storefront header and persisted across reloads. Coordinates power
 * the "distance to shop" on product pages.
 */
export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      pincode: undefined,
      place: undefined,
      lat: undefined,
      lng: undefined,
      setLocation: (pincode, place, lat, lng) => set({ pincode, place, lat, lng }),
      clear: () => set({ pincode: undefined, place: undefined, lat: undefined, lng: undefined }),
    }),
    { name: "si_location" },
  ),
);
