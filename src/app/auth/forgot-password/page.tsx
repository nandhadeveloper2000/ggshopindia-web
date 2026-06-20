"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/validators";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const form = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { identifier: "" } });

  const onSubmit = async (values: { identifier: string }) => {
    try {
      await authService.forgotPassword(values.identifier);
      toast.success("Reset link sent. Please check your inbox.");
    } catch {
      toast.error("Failed to send reset link");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot password?</h1>
        <p className="text-sm text-muted-foreground">Enter your email or mobile and we&apos;ll send a reset link.</p>
      </div>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label htmlFor="identifier">Email or Mobile</Label>
          <Input id="identifier" placeholder="you@example.com" {...form.register("identifier")} />
          {form.formState.errors.identifier && (
            <p className="text-xs text-destructive">{form.formState.errors.identifier.message as string}</p>
          )}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send Reset Link
        </Button>
      </form>
      <div className="text-center text-sm">
        <Link href="/auth/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
