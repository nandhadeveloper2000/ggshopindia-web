"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Pencil,
  Phone,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/auth/OtpInput";
import {
  customerMobileSchema,
  customerSignupSchema,
  loginSchema,
  type CustomerMobileSchema,
  type CustomerSignupSchema,
  type LoginSchema,
} from "@/lib/validators";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/lib/roles";
import { APP_NAME, DEMO_OTP } from "@/lib/constants";
import { routes } from "@/lib/routes";
import {
  buildDemoCustomerSession,
  isDemoOtp,
  markDemoSession,
  rememberCustomer,
} from "@/lib/customerDemoAuth";

export type CustomerAuthMode = "login" | "signup" | "password";
type Step = "identify" | "otp";

const RESEND_SECONDS = 30;

interface CustomerAuthFormProps {
  initialMode?: CustomerAuthMode;
  /**
   * Called after a successful sign-in instead of the default redirect to the
   * customer home. The modal uses this to close itself before navigating.
   */
  onSuccess?: () => void;
}

/**
 * The Flipkart-style customer auth flow (mobile → OTP → home, plus signup and a
 * secondary password path). Rendered both as the full `/login` page (inside
 * {@link CustomerAuthPanel}) and inside the global {@link AuthModal} popup.
 */
export function CustomerAuthForm({ initialMode = "login", onSuccess }: CustomerAuthFormProps) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [mode, setMode] = useState<CustomerAuthMode>(initialMode);
  const [step, setStep] = useState<Step>("identify");
  const [mobile, setMobile] = useState("");
  const [pending, setPending] = useState<{ name?: string; email?: string }>({});
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  // The last code auto-verified, so re-completing the same (wrong) code doesn't
  // re-toast. The explicit "Verify" button is unaffected.
  const lastAutoCode = useRef("");

  const mobileForm = useForm<CustomerMobileSchema>({
    resolver: zodResolver(customerMobileSchema),
    defaultValues: { mobile: "" },
  });
  const signupForm = useForm<CustomerSignupSchema>({
    resolver: zodResolver(customerSignupSchema),
    defaultValues: { name: "", mobile: "", email: "" },
  });
  const passwordForm = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", remember: false },
  });

  // Resend countdown while on the OTP step.
  useEffect(() => {
    if (step !== "otp") return;
    const timer = setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const finish = (name: string) => {
    toast.success(`Welcome, ${name}!`);
    if (onSuccess) onSuccess();
    else router.replace(routes.customer.home);
  };

  const goToOtp = (nextMobile: string, profile: { name?: string; email?: string }) => {
    setMobile(nextMobile);
    setPending(profile);
    setOtp("");
    setOtpError(false);
    lastAutoCode.current = "";
    setStep("otp");
    setResendIn(RESEND_SECONDS);
    toast.success(`OTP sent to +91 ${nextMobile}`);
  };

  const onRequestLogin = mobileForm.handleSubmit(({ mobile: m }) => goToOtp(m, {}));

  const onRequestSignup = signupForm.handleSubmit(({ name, mobile: m, email }) => {
    rememberCustomer(m, name, email || undefined);
    goToOtp(m, { name, email: email || undefined });
  });

  const verify = (code: string = otp) => {
    if (verifying) return;
    if (code.length < 6) {
      setOtpError(true);
      toast.error("Enter the 6-digit OTP");
      return;
    }
    if (!isDemoOtp(code)) {
      setOtpError(true);
      toast.error("Incorrect OTP. Please try again.");
      return;
    }
    setVerifying(true);
    const session = buildDemoCustomerSession({ mobile, name: pending.name, email: pending.email });
    setSession(session.user, session.accessToken, session.refreshToken);
    markDemoSession();
    rememberCustomer(mobile, pending.name, pending.email);
    finish(session.user.name);
  };

  const resendOtp = () => {
    if (resendIn > 0) return;
    setResendIn(RESEND_SECONDS);
    setOtp("");
    setOtpError(false);
    lastAutoCode.current = "";
    toast.success(`OTP re-sent to +91 ${mobile}`);
  };

  const changeNumber = () => {
    setStep("identify");
    setOtp("");
    setOtpError(false);
    lastAutoCode.current = "";
  };

  const onPasswordSubmit = passwordForm.handleSubmit(async ({ identifier, password }) => {
    try {
      const res = await authService.login({ identifier, password });
      if (res.user.role !== UserRole.CUSTOMER) {
        toast.error("This portal is for customers only.");
        return;
      }
      setSession(res.user as never, res.accessToken, res.refreshToken);
      finish(res.user.name);
    } catch {
      toast.error("Invalid credentials");
    }
  });

  const switchMode = (next: CustomerAuthMode) => {
    setMode(next);
    setStep("identify");
    setOtp("");
    setOtpError(false);
    lastAutoCode.current = "";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <ShoppingBag className="h-3.5 w-3.5" />
          Customer
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === "otp"
            ? "Verify your number"
            : mode === "signup"
              ? "Create your account"
              : mode === "password"
                ? "Sign in with password"
                : "Login or Sign up"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === "otp" ? (
            <>
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-foreground">+91 {mobile}</span>
            </>
          ) : mode === "signup" ? (
            "Get access to your orders, wishlist, and recommendations."
          ) : mode === "password" ? (
            "Use your registered email or mobile and password."
          ) : (
            "Enter your mobile number to continue with a one-time password."
          )}
        </p>
      </div>

      {/* OTP STEP */}
      {step === "otp" ? (
        <div className="space-y-5">
          <button
            type="button"
            onClick={changeNumber}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            Change number
          </button>

          <div className="space-y-2">
            <Label>Enter OTP</Label>
            <OtpInput
              value={otp}
              onChange={(v) => {
                setOtp(v);
                if (otpError) setOtpError(false);
              }}
              onComplete={(v) => {
                if (v === lastAutoCode.current) return;
                lastAutoCode.current = v;
                verify(v);
              }}
              autoFocus
              disabled={verifying}
              hasError={otpError}
            />
            {otpError && <p className="text-xs text-destructive">Incorrect OTP. Please try again.</p>}
          </div>

          <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Demo mode — enter <span className="font-semibold text-foreground">{DEMO_OTP}</span> to sign in.
            </span>
          </div>

          <Button type="button" className="w-full" size="lg" disabled={verifying} onClick={() => verify()}>
            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify &amp; Continue
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {resendIn > 0 ? (
              <>
                Not received your code?{" "}
                <span className="font-medium text-foreground">0:{resendIn.toString().padStart(2, "0")}</span>
              </>
            ) : (
              <button type="button" onClick={resendOtp} className="font-medium text-primary hover:underline">
                Resend OTP
              </button>
            )}
          </p>
        </div>
      ) : mode === "login" ? (
        /* LOGIN — mobile entry */
        <form className="space-y-4" onSubmit={onRequestLogin}>
          <div className="space-y-1.5">
            <Label htmlFor="login-mobile">Mobile number</Label>
            <div className="flex">
              <span className="inline-flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                +91
              </span>
              <Input
                id="login-mobile"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
                placeholder="10-digit mobile number"
                className="rounded-l-none"
                {...mobileForm.register("mobile")}
              />
            </div>
            {mobileForm.formState.errors.mobile && (
              <p className="text-xs text-destructive">{mobileForm.formState.errors.mobile.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg">
            Request OTP
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>

          <div className="relative py-1 text-center">
            <span className="relative z-10 bg-background px-3 text-xs text-muted-foreground">or</span>
            <span className="absolute inset-x-0 top-1/2 z-0 h-px bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={() => switchMode("password")}>
            <Lock className="mr-1.5 h-4 w-4" />
            Sign in with password
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            New to {APP_NAME}?{" "}
            <button type="button" onClick={() => switchMode("signup")} className="font-medium text-primary hover:underline">
              Create an account
            </button>
          </p>
        </form>
      ) : mode === "signup" ? (
        /* SIGNUP */
        <form className="space-y-4" onSubmit={onRequestSignup}>
          <div className="space-y-1.5">
            <Label htmlFor="signup-name">Full name</Label>
            <Input id="signup-name" autoComplete="name" placeholder="Your name" {...signupForm.register("name")} />
            {signupForm.formState.errors.name && (
              <p className="text-xs text-destructive">{signupForm.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-mobile">Mobile number</Label>
            <div className="flex">
              <span className="inline-flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                +91
              </span>
              <Input
                id="signup-mobile"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
                placeholder="10-digit mobile number"
                className="rounded-l-none"
                {...signupForm.register("mobile")}
              />
            </div>
            {signupForm.formState.errors.mobile && (
              <p className="text-xs text-destructive">{signupForm.formState.errors.mobile.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-email">
              Email <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...signupForm.register("email")}
            />
            {signupForm.formState.errors.email && (
              <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg">
            Create account
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button type="button" onClick={() => switchMode("login")} className="font-medium text-primary hover:underline">
              Sign in
            </button>
          </p>
        </form>
      ) : (
        /* PASSWORD (secondary, real backend) */
        <form className="space-y-4" onSubmit={onPasswordSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="pw-identifier">Email or mobile</Label>
            <Input
              id="pw-identifier"
              autoComplete="username"
              placeholder="you@example.com"
              {...passwordForm.register("identifier")}
            />
            {passwordForm.formState.errors.identifier && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.identifier.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pw-password">Password</Label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="pw-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...passwordForm.register("password")}
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
            {passwordForm.formState.errors.password && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={passwordForm.formState.isSubmitting}>
            {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <button type="button" onClick={() => switchMode("login")} className="font-medium text-primary hover:underline">
              Sign in with OTP instead
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
