"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import StoreShell from "@/components/layout/StoreShell";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/useAuth";

// "link" works with Supabase's default email template (no custom SMTP needed).
// "code" needs custom SMTP and {{ .Token }} in the Magic Link template.
const LOGIN_MODE = process.env.NEXT_PUBLIC_LOGIN_MODE === "code" ? "code" : "link";
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "true";

// Only allow in-site redirects after login.
function safeNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/cart";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email"); // "email" | "code" | "sent"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) router.replace(next);
  }, [authLoading, user, next, router]);

  async function sendCode(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (err) return setError(err.message);
    setStep(LOGIN_MODE === "code" ? "code" : "sent");
  }

  async function verifyCode(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (err) return setError("That code didn't work. Check it and try again.");
    router.replace(next);
  }

  async function google() {
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${next}` },
    });
    if (err) setError(err.message);
  }

  const input =
    "w-full rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-5 h-12 text-[15px] outline-none focus:border-[var(--color-gold)]";

  return (
    <div className="mx-auto w-full max-w-sm py-10">
      <h1 className="font-[var(--font-display)] text-3xl mb-2">Sign in</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        {step === "email"
          ? LOGIN_MODE === "code"
            ? "We'll email you a 6-digit code. No password needed."
            : "We'll email you a sign-in link. No password needed."
          : step === "sent"
            ? `We sent a sign-in link to ${email}. Open it on this device to continue.`
            : `Enter the code we sent to ${email}.`}
      </p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
          <Button type="submit" fullWidth loading={busy}>
            {LOGIN_MODE === "code" ? "Email me a code" : "Email me a link"}
          </Button>
        </form>
      ) : step === "sent" ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Can't find it? Check spam, or wait a minute before requesting another.
          </p>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError("");
            }}
            className="text-left text-xs text-[var(--color-text-muted)] hover:text-[var(--color-gold-bright)]"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-3">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            autoFocus
            maxLength={8}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${input} tracking-[0.4em] text-center`}
          />
          <Button type="submit" fullWidth loading={busy}>
            Verify and continue
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError("");
            }}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-gold-bright)]"
          >
            Use a different email
          </button>
        </form>
      )}

      {GOOGLE_ENABLED && step === "email" ? (
        <div className="mt-4">
          <Button variant="secondary" fullWidth onClick={google}>
            Continue with Google
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>
      ) : null}
    </div>
  );
}

export default function LoginPage() {
  return (
    <StoreShell hideBottomNav>
      <main className="flex-1 min-w-0 px-4">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
    </StoreShell>
  );
}
