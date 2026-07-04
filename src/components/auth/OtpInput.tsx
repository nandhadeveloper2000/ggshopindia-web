"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired when the last digit is filled (e.g. to auto-submit). */
  onComplete?: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  hasError?: boolean;
}

/**
 * Segmented numeric OTP entry — one box per digit, with auto-advance,
 * backspace-to-previous, arrow navigation, and full-code paste support.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus,
  disabled,
  hasError,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const commit = (next: string[]) => {
    const joined = next.join("").slice(0, length);
    // Fire onComplete only on the transition INTO a full code, not on every
    // edit that leaves an already-full field full (which would re-trigger
    // auto-verify and spam errors). `value` is the pre-change value here.
    const wasFull = value.length >= length;
    onChange(joined);
    if (joined.length === length && !wasFull) onComplete?.(joined);
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      const next = digits.slice();
      next[index] = "";
      commit(next);
      return;
    }
    const chars = cleaned.split("");
    const next = digits.slice();
    let cursor = index;
    for (const ch of chars) {
      if (cursor >= length) break;
      next[cursor] = ch;
      cursor += 1;
    }
    commit(next);
    refs.current[Math.min(cursor, length - 1)]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = digits.slice();
      if (next[index]) {
        next[index] = "";
        commit(next);
      } else if (index > 0) {
        next[index - 1] = "";
        commit(next);
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleChange(index, e.clipboardData.getData("text"));
  };

  return (
    <div className="flex gap-2 sm:gap-2.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.target.select()}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={index === 0 ? length : 1}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          aria-label={`OTP digit ${index + 1}`}
          className={cn(
            "h-12 w-11 rounded-md border bg-background text-center text-lg font-semibold text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-12",
            hasError ? "border-destructive focus:border-destructive focus:ring-destructive/30" : "border-input"
          )}
        />
      ))}
    </div>
  );
}
