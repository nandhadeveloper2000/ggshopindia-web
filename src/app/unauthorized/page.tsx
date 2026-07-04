"use client";

import Link from "next/link";
import { ShieldAlert, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import { getRoleHome } from "@/lib/roles";
import { getLoginPortalFor } from "@/lib/portals";
import { APP_NAME } from "@/lib/constants";

/**
 * 403 Access Denied — shown when a signed-in user tries to open a route their
 * role is not allowed to access. Reachable from middleware redirects and as a
 * direct fallback. Offers a way back to where the user *is* allowed to go.
 */
export default function UnauthorizedPage() {
  const user = useAuthStore((s) => s.user);

  const primaryHref = user ? getRoleHome(user.role) : "/login";
  const primaryLabel = user ? "Go to my dashboard" : "Go to login";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/40 p-6">
      {/* Ambient brand glows */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

      <Card className="relative w-full max-w-md overflow-hidden border-border/60 shadow-xl">
        <CardContent className="flex flex-col items-center gap-6 px-6 py-10 text-center sm:px-10">
          <LockedOutArt />

          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-destructive">
            <ShieldAlert className="h-3.5 w-3.5" />
            403 · Access Denied
          </span>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              You don&apos;t have access to this page
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {user
                ? "Your account role isn't permitted to view this section. Head back to your dashboard to keep working."
                : "Please sign in with an account that has access to continue."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5 pt-1 sm:flex-row">
            <Button asChild size="lg" className="group sm:flex-1">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="sm:flex-1">
              <Link href="/">
                <Home className="mr-1.5 h-4 w-4" />
                Back to {APP_NAME}
              </Link>
            </Button>
          </div>

          {user && (
            <Link
              href={getLoginPortalFor(user.role)}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Sign in as a different user
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Friendly on-brand "locked out" illustration: a padlock character that has
 * shut itself, giving the 403 a human, approachable feel instead of a bare
 * error icon. Colors derive from the theme tokens so it adapts to dark mode.
 */
function LockedOutArt() {
  return (
    <svg
      viewBox="0 0 320 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="A locked padlock character denying access"
      className="animate-float-soft h-auto w-56 max-w-full sm:w-64"
    >
      <defs>
        <linearGradient id="ao-lock" x1="80" y1="116" x2="240" y2="212" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(240 100% 42%)" />
          <stop offset="1" stopColor="hsl(240 100% 27%)" />
        </linearGradient>
        <linearGradient id="ao-shackle" x1="120" y1="60" x2="200" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#cbd5e1" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <radialGradient id="ao-bg" cx="0.5" cy="0.42" r="0.62">
          <stop stopColor="hsl(240 100% 96%)" />
          <stop offset="1" stopColor="hsl(240 92% 90%)" />
        </radialGradient>
      </defs>

      {/* Soft backdrop */}
      <circle cx="160" cy="118" r="106" fill="url(#ao-bg)" />

      {/* Floating decor */}
      <circle cx="50" cy="72" r="7" fill="hsl(240 100% 27% / 0.14)" />
      <circle cx="282" cy="90" r="9" fill="hsl(38 92% 50% / 0.35)" />
      <circle cx="266" cy="188" r="6" fill="hsl(240 100% 27% / 0.14)" />
      <path d="M44 150 l6 6 M50 150 l-6 6" stroke="hsl(240 100% 27% / 0.3)" strokeWidth="3" strokeLinecap="round" />
      <path d="M272 48 l5 5 M277 48 l-5 5" stroke="hsl(38 92% 50% / 0.6)" strokeWidth="3" strokeLinecap="round" />

      {/* Ground shadow */}
      <ellipse cx="160" cy="230" rx="84" ry="12" fill="hsl(222 47% 11% / 0.07)" />

      {/* Legs + feet */}
      <rect x="138" y="196" width="12" height="26" rx="6" fill="hsl(240 100% 30%)" />
      <rect x="170" y="196" width="12" height="26" rx="6" fill="hsl(240 100% 30%)" />
      <ellipse cx="143" cy="224" rx="12" ry="6" fill="hsl(222 47% 14%)" />
      <ellipse cx="177" cy="224" rx="12" ry="6" fill="hsl(222 47% 14%)" />

      {/* Arms — left raised in a shrug, right resting down */}
      <path d="M112 152 q-24 -6 -28 -32" stroke="url(#ao-lock)" strokeWidth="13" fill="none" strokeLinecap="round" />
      <circle cx="84" cy="120" r="8" fill="hsl(240 100% 42%)" />
      <path d="M208 152 q24 8 26 30" stroke="url(#ao-lock)" strokeWidth="13" fill="none" strokeLinecap="round" />
      <circle cx="234" cy="182" r="8" fill="hsl(240 100% 42%)" />

      {/* Shackle */}
      <path d="M132 118 v-20 a28 28 0 0 1 56 0 v20" stroke="url(#ao-shackle)" strokeWidth="14" fill="none" strokeLinecap="round" />

      {/* Lock body */}
      <rect x="108" y="114" width="104" height="94" rx="26" fill="url(#ao-lock)" />
      <rect x="120" y="126" width="42" height="13" rx="6.5" fill="#ffffff" opacity="0.14" />

      {/* Worried eyebrows */}
      <path d="M134 141 l15 -4" stroke="hsl(222 47% 11%)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M171 137 l15 4" stroke="hsl(222 47% 11%)" strokeWidth="3.5" strokeLinecap="round" />

      {/* Eyes */}
      <circle cx="142" cy="152" r="9" fill="#ffffff" />
      <circle cx="178" cy="152" r="9" fill="#ffffff" />
      <circle cx="144" cy="154" r="4" fill="hsl(222 47% 11%)" />
      <circle cx="180" cy="154" r="4" fill="hsl(222 47% 11%)" />

      {/* Blush */}
      <circle cx="128" cy="168" r="5" fill="hsl(38 92% 50% / 0.5)" />
      <circle cx="192" cy="168" r="5" fill="hsl(38 92% 50% / 0.5)" />

      {/* Keyhole doubling as a small worried mouth */}
      <circle cx="160" cy="178" r="7" fill="hsl(222 47% 11% / 0.85)" />
      <path d="M160 182 l-5 13 h10 z" fill="hsl(222 47% 11% / 0.85)" />
    </svg>
  );
}
