"use client";

import { useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { reverseOsm, searchOsm } from "@/lib/osm";
import { useLocationStore } from "@/store/location.store";
import { useAuthStore } from "@/store/auth.store";
import { useAuthModal } from "@/store/authModal.store";

/**
 * Reliance Digital-style "Choose your delivery location" popup: enter a pincode
 * (resolved to a place name via the India Post API) or use the browser's current
 * location (reverse-geocoded via OpenStreetMap). Signed-out shoppers get a Login
 * shortcut to their saved addresses.
 */
export function LocationModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const setLocation = useLocationStore((s) => s.setLocation);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthModal((s) => s.openAuthModal);
  const [pincode, setPincode] = useState("");
  const [busy, setBusy] = useState(false);

  const applyPincode = async () => {
    const pin = pincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    setBusy(true);
    try {
      // Resolve the pincode to a locality name (India Post; free, no key).
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = (await res.json()) as Array<{
        Status?: string;
        PostOffice?: Array<{ Name?: string; District?: string }> | null;
      }>;
      const po = data?.[0]?.Status === "Success" ? data[0].PostOffice?.[0] : undefined;
      // Best-effort geocode the pincode so shop distances can be shown.
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const fill = (await searchOsm(`${pin}, India`))[0]?.fill;
        if (fill?.latitude && fill?.longitude) {
          lat = Number(fill.latitude);
          lng = Number(fill.longitude);
        }
      } catch {
        /* geocoding is optional */
      }
      setLocation(pin, po?.Name ?? po?.District, lat, lng);
      toast.success("Delivery location updated");
      onOpenChange(false);
    } catch {
      // Network/API failure — still accept the raw pincode.
      setLocation(pin);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const fill = await reverseOsm(pos.coords.latitude, pos.coords.longitude);
          if (fill.pincode) {
            setLocation(fill.pincode, fill.area ?? fill.district, pos.coords.latitude, pos.coords.longitude);
            toast.success("Delivery location updated");
            onOpenChange(false);
          } else {
            toast.error("Couldn't determine your pincode from your location");
          }
        } catch {
          toast.error("Could not resolve your location");
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        toast.error("Location permission denied");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-6">
        <DialogTitle className="text-lg font-semibold">Choose your delivery location</DialogTitle>
        <DialogDescription className="sr-only">
          Enter your pincode or use your current location to set a delivery area.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="loc-pincode" className="text-xs text-muted-foreground">
              Enter Pincode
            </label>
            <div className="flex gap-2">
              <Input
                id="loc-pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="600042"
                onKeyDown={(e) => e.key === "Enter" && applyPincode()}
              />
              <Button onClick={applyPincode} disabled={busy || pincode.length < 6}>
                Apply
              </Button>
            </div>
          </div>

          <Button variant="outline" className="w-full gap-2" onClick={useCurrentLocation} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
            Use my current location
          </Button>

          <div className="relative py-1 text-center">
            <span className="relative z-10 bg-background px-3 text-xs text-muted-foreground">or</span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          </div>

          {user ? (
            <p className="text-center text-xs text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.name}</span>
            </p>
          ) : (
            <>
              <p className="text-center text-xs text-muted-foreground">
                To view your saved delivery addresses, sign in
              </p>
              <Button
                variant="outline"
                className="w-full font-semibold text-primary"
                onClick={() => {
                  onOpenChange(false);
                  openAuthModal("login");
                }}
              >
                LOGIN
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
