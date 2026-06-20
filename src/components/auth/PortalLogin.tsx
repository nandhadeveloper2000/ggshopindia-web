"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  pinLoginSchema,
  type LoginSchema,
} from "@/lib/validators";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { getRoleHome, UserRoleType } from "@/lib/roles";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface PortalLoginProps {
  portalTitle: string;
  portalSubtitle: string;
  badge: string;
  icon: ReactNode;
  allowedRoles: UserRoleType[];
  identifierLabel?: string;
  identifierPlaceholder?: string;
  fallbackRedirect: string;
}

type Mode = "password" | "otp" | "pin";

const MODE_LABEL: Record<Mode, string> = {
  password: "Password",
  otp: "OTP",
  pin: "PIN",
};

export function PortalLogin({
  portalTitle,
  portalSubtitle,
  badge,
  icon,
  allowedRoles,
  identifierLabel = "Email / Username / Mobile",
  identifierPlaceholder = "you@example.com",
  fallbackRedirect,
}: PortalLoginProps) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<Mode>("password");

  const handleAuthenticated = (user: { name: string; role: string }, accessToken: string, refreshToken?: string) => {
    if (!allowedRoles.includes(user.role as UserRoleType)) {
      toast.error(`This portal is for ${badge.toLowerCase()} only. Use the correct portal for your role.`);
      return false;
    }
    setSession(user as never, accessToken, refreshToken);
    toast.success(`Welcome, ${user.name}`);
    router.replace(getRoleHome(user.role) || fallbackRedirect);
    return true;
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/20">{icon}</div>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight">{APP_NAME}</span>
            <span className="text-xs text-primary-foreground/70">{badge}</span>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">{portalTitle}</h2>
          <p className="text-sm text-primary-foreground/80 max-w-md">{portalSubtitle}</p>
        </div>
        <p className="text-xs text-primary-foreground/70">© {new Date().getFullYear()} {APP_NAME}.</p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {badge}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in with {MODE_LABEL[mode]}</h1>
            <p className="text-sm text-muted-foreground">{portalSubtitle}</p>
          </div>

          <div className="inline-flex w-full rounded-md border bg-muted p-1">
            {(["password", "otp", "pin"] as Mode[]).map((m) => {
              const active = mode === m;
              const Icon = m === "password" ? Lock : m === "otp" ? ShieldCheck : KeyRound;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {MODE_LABEL[m]}
                </button>
              );
            })}
          </div>

          {mode === "password" && (
            <PasswordForm
              identifierLabel={identifierLabel}
              identifierPlaceholder={identifierPlaceholder}
              onAuthenticated={handleAuthenticated}
            />
          )}
          {mode === "otp" && (
            <OtpForm
              identifierLabel={identifierLabel}
              identifierPlaceholder={identifierPlaceholder}
              onAuthenticated={handleAuthenticated}
            />
          )}
          {mode === "pin" && (
            <PinForm
              identifierLabel={identifierLabel}
              identifierPlaceholder={identifierPlaceholder}
              onAuthenticated={handleAuthenticated}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface SubFormProps {
  identifierLabel: string;
  identifierPlaceholder: string;
  onAuthenticated: (user: { name: string; role: string }, accessToken: string, refreshToken?: string) => boolean;
}

function PasswordForm({ identifierLabel, identifierPlaceholder, onAuthenticated }: SubFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", remember: false },
  });

  const onSubmit = async (values: LoginSchema) => {
    try {
      const res = await authService.login(values);
      onAuthenticated(res.user, res.accessToken, res.refreshToken);
    } catch {
      toast.error("Invalid credentials");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1.5">
        <Label htmlFor="identifier">{identifierLabel}</Label>
        <Input id="identifier" autoComplete="username" placeholder={identifierPlaceholder} {...register("identifier")} />
        {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-2.5 text-muted-foreground"
            tabIndex={-1}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox id="remember" onCheckedChange={(v) => setValue("remember", Boolean(v))} />
          Remember me
        </label>
        <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign In
      </Button>
    </form>
  );
}

function OtpForm({ identifierLabel, identifierPlaceholder, onAuthenticated }: SubFormProps) {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [identifier, setIdentifier] = useState("");

  const reqForm = useForm({ resolver: zodResolver(otpRequestSchema), defaultValues: { identifier: "" } });
  const verifyForm = useForm({ resolver: zodResolver(otpVerifySchema), defaultValues: { identifier: "", otp: "" } });

  const requestOtp = async (values: { identifier: string }) => {
    try {
      await authService.requestOtp(values);
      setIdentifier(values.identifier);
      verifyForm.setValue("identifier", values.identifier);
      toast.success("OTP sent.");
      setStep("verify");
    } catch {
      toast.error("Failed to send OTP");
    }
  };

  const verifyOtp = async (values: { identifier: string; otp: string }) => {
    try {
      const res = await authService.verifyOtp(values);
      onAuthenticated(res.user, res.accessToken, res.refreshToken);
    } catch {
      toast.error("Invalid OTP");
    }
  };

  if (step === "request") {
    return (
      <form className="space-y-4" onSubmit={reqForm.handleSubmit(requestOtp)}>
        <div className="space-y-1.5">
          <Label htmlFor="otp-identifier">{identifierLabel}</Label>
          <Input id="otp-identifier" placeholder={identifierPlaceholder} {...reqForm.register("identifier")} />
          {reqForm.formState.errors.identifier && (
            <p className="text-xs text-destructive">{reqForm.formState.errors.identifier.message as string}</p>
          )}
        </div>
        <Button type="submit" disabled={reqForm.formState.isSubmitting} className="w-full">
          {reqForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send OTP
        </Button>
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={verifyForm.handleSubmit(verifyOtp)}>
      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        OTP sent to <span className="font-medium text-foreground">{identifier}</span>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="otp-code">Enter OTP</Label>
        <Input
          id="otp-code"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          autoFocus
          {...verifyForm.register("otp")}
        />
        {verifyForm.formState.errors.otp && (
          <p className="text-xs text-destructive">{verifyForm.formState.errors.otp.message as string}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setStep("request")} className="flex-1">
          Back
        </Button>
        <Button type="submit" disabled={verifyForm.formState.isSubmitting} className="flex-1">
          {verifyForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify
        </Button>
      </div>
    </form>
  );
}

function PinForm({ identifierLabel, identifierPlaceholder, onAuthenticated }: SubFormProps) {
  const form = useForm({ resolver: zodResolver(pinLoginSchema), defaultValues: { identifier: "", pin: "" } });

  const onSubmit = async (values: { identifier: string; pin: string }) => {
    try {
      const res = await authService.pinLogin(values);
      onAuthenticated(res.user, res.accessToken, res.refreshToken);
    } catch {
      toast.error("Invalid PIN");
    }
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-1.5">
        <Label htmlFor="pin-identifier">{identifierLabel}</Label>
        <Input id="pin-identifier" placeholder={identifierPlaceholder} {...form.register("identifier")} />
        {form.formState.errors.identifier && (
          <p className="text-xs text-destructive">{form.formState.errors.identifier.message as string}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pin-code">PIN</Label>
        <Input
          id="pin-code"
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="••••"
          {...form.register("pin")}
        />
        {form.formState.errors.pin && (
          <p className="text-xs text-destructive">{form.formState.errors.pin.message as string}</p>
        )}
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign In
      </Button>
    </form>
  );
}
