"use client";

/**
 * Authentication and verification screens (docs/06 §4, docs/05 §32–36,
 * AUTH-001–007). Email and password only; both email and phone are verified.
 * People return to what they were doing via `next` (docs/05 §36).
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, FileCheck2, Mail, MessageSquareText } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { PasswordInput } from "@/components/ui/password-input";
import { TextLink } from "@/components/ui/text-link";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/schemas";
import {
  EMAIL_LINK_EXPIRY_HOURS,
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  OTP_RESEND_COOLDOWN_SECONDS,
  authContext,
  safeNext,
  withNext,
} from "./policy";
import * as auth from "./simulated-auth";

// ------------------------------------------------------------------ shared

function useNext() {
  const params = useSearchParams();
  return params.get("next");
}

function Header({
  title,
  description,
  icon,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {icon && (
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-primary-subtle text-primary-text [&_svg]:size-6"
        >
          {icon}
        </span>
      )}
      <h1 className="text-h2 text-foreground">{title}</h1>
      {description && <p className="text-body text-foreground-secondary">{description}</p>}
    </div>
  );
}

/** Explains why we're asking, when the person is mid-Request (AUTH-006). */
function ContextNote({ next }: { next: string | null }) {
  if (authContext(next) !== "SUBMIT_REQUEST") return null;
  return (
    <p className="flex items-start gap-2 rounded-md bg-primary-subtle px-4 py-3 text-body-sm text-foreground">
      <FileCheck2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary-text" />
      Your choices and Brief are saved. Verify your account to submit your Project Request.
    </p>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-danger-border bg-danger-subtle px-4 py-3 text-body-sm text-foreground"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
      {message}
    </p>
  );
}

/** Counts down a resend cooldown; returns seconds left and a restart function. */
function useCooldown(seconds: number) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endsAt === null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  const left = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000));
  return { left, start: () => (setEndsAt(Date.now() + seconds * 1000), setNow(Date.now())) };
}

/**
 * Stands in for the email link and SMS until Phase 9. Safe to render: /auth is
 * only reachable where preview routes are enabled (D-040), and Phase 9 removes it.
 */
function DevNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-border-strong px-4 py-3 text-caption text-foreground-secondary">
      <p className="font-semibold tracking-wide uppercase">Simulated until Phase 9</p>
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ Sign up

export function SignUpScreen() {
  const router = useRouter();
  const next = useNext();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "" },
  });

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Create your account"
        description="One account works for hiring Creatives and, later, for offering your own Services."
      />
      <ContextNote next={next} />
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          const result = await auth.signUp(values);
          if (!result.ok) return setError(result.message);
          router.push(withNext("/auth/verify-email", next));
        })}
      >
        <Controller
          control={form.control}
          name="fullName"
          render={({ field, fieldState }) => (
            <FormField label="Full name" error={fieldState.error?.message} required>
              <Input {...field} autoComplete="name" />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField
              label="Email address"
              description="We'll send a link to verify it."
              error={fieldState.error?.message}
              required
            >
              <Input {...field} type="email" autoComplete="email" inputMode="email" />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <FormField
              label="Phone number"
              description="Include your country code, for example +234 803 123 4567. We'll text you a code. We don't use it for marketing."
              error={fieldState.error?.message}
              required
            >
              <Input {...field} type="tel" autoComplete="tel" inputMode="tel" placeholder="+234" />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormField
              label="Password"
              description="At least 8 characters."
              error={fieldState.error?.message}
              required
            >
              <PasswordInput {...field} autoComplete="new-password" />
            </FormField>
          )}
        />
        <FormError message={error} />
        <Button type="submit" size="lg" fullWidth loading={form.formState.isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="text-center text-body-sm text-foreground-secondary">
        Already have an account? <TextLink href={withNext("/auth/sign-in", next)}>Sign in</TextLink>
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ Sign in

export function SignInScreen() {
  const router = useRouter();
  const next = useNext();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="flex flex-col gap-6">
      <Header title="Sign in" description="Welcome back." />
      {params.get("reset") === "done" && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-md border border-success-border bg-success-subtle px-4 py-3 text-body-sm text-foreground"
        >
          <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-text" />
          Your password has been changed. Sign in with your new password.
        </p>
      )}
      <ContextNote next={next} />
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          const result = await auth.signIn(values);
          if (!result.ok) {
            setError(result.message);
            form.setFocus("password");
            return;
          }
          router.push(safeNext(next));
        })}
      >
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField label="Email address" error={fieldState.error?.message} required>
              <Input {...field} type="email" autoComplete="email" inputMode="email" />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormField label="Password" error={fieldState.error?.message} required>
              <PasswordInput {...field} autoComplete="current-password" />
            </FormField>
          )}
        />
        <TextLink
          href={withNext("/auth/forgot-password", next)}
          tone="muted"
          className="-mt-2 self-start text-body-sm"
        >
          Forgot your password?
        </TextLink>
        <FormError message={error} />
        <Button type="submit" size="lg" fullWidth loading={form.formState.isSubmitting}>
          Sign in
        </Button>
      </form>
      <p className="text-center text-body-sm text-foreground-secondary">
        New to Modgeto?{" "}
        <TextLink href={withNext("/auth/sign-up", next)}>Create an account</TextLink>
      </p>
      <DevNote>
        <p>
          Any email and password sign in. Use the password &quot;wrong-password&quot; to see the
          error.
        </p>
      </DevNote>
    </div>
  );
}

// ------------------------------------------------------------------ Verify email

const subscribeNoop = () => () => {};

export function VerifyEmailScreen() {
  const router = useRouter();
  const next = useNext();
  const params = useSearchParams();
  const expired = params.get("status") === "expired";
  const email = useSyncExternalStore(
    subscribeNoop,
    () => auth.pendingAccount()?.email ?? null,
    () => null,
  );
  const cooldown = useCooldown(OTP_RESEND_COOLDOWN_SECONDS);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const resend = async () => {
    setSending(true);
    await auth.resendVerificationEmail();
    setSending(false);
    cooldown.start();
    setNotice("We've sent a new link. Check your inbox and spam folder.");
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        icon={<Mail />}
        title={expired ? "That link has expired" : "Check your email"}
        description={
          expired ? (
            "Verification links work once and expire after " +
            EMAIL_LINK_EXPIRY_HOURS +
            " hours. Send yourself a new one."
          ) : (
            <>
              We sent a verification link to{" "}
              {email ? (
                <span className="font-semibold text-foreground">{email}</span>
              ) : (
                "your email address"
              )}
              . Open it on any device to continue. It expires in {EMAIL_LINK_EXPIRY_HOURS} hours.
            </>
          )
        }
      />
      <ContextNote next={next} />
      {notice && (
        <p role="status" className="text-body-sm text-success-text">
          {notice}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <Button
          variant={expired ? "primary" : "secondary"}
          onClick={resend}
          loading={sending}
          disabled={cooldown.left > 0}
        >
          {cooldown.left > 0 ? `Send again in ${cooldown.left}s` : "Send a new link"}
        </Button>
        <p className="text-center text-body-sm text-foreground-secondary">
          Wrong email? <TextLink href={withNext("/auth/sign-up", next)}>Change it</TextLink>
        </p>
      </div>
      <DevNote>
        <p>No email is sent yet. Use this to act as if you opened the link.</p>
        <Button
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={async () => {
            await auth.simulateEmailLinkOpened();
            router.push(withNext("/auth/verify-phone", next));
          }}
        >
          Open the verification link
        </Button>
      </DevNote>
    </div>
  );
}

// ------------------------------------------------------------------ Verify phone

export function VerifyPhoneScreen() {
  const router = useRouter();
  const next = useNext();
  const fieldId = useId();
  const phone = useSyncExternalStore(
    subscribeNoop,
    () => auth.pendingAccount()?.phone ?? null,
    () => null,
  );
  const cooldown = useCooldown(OTP_RESEND_COOLDOWN_SECONDS);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    await auth.sendPhoneCode();
    setSent(true);
    setBlocked(false);
    setError(null);
    setCode("");
    cooldown.start();
  };
  // Send the first code when the screen opens (docs/05 §34).
  useEffect(() => {
    let active = true;
    auth.sendPhoneCode().then(() => {
      if (!active) return;
      setSent(true);
      cooldown.start();
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount
  }, []);

  const verify = async (value: string) => {
    if (value.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    setBusy(true);
    const result = await auth.verifyPhoneCode(value);
    setBusy(false);
    if (result.ok) {
      router.push(safeNext(next));
      return;
    }
    setCode("");
    if (result.reason === "WRONG_CODE") {
      setError(
        `That code isn't right. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? "try" : "tries"} left.`,
      );
    } else if (result.reason === "EXPIRED") {
      setError("That code has expired. Send a new one.");
      setBlocked(true);
    } else if (result.reason === "TOO_MANY_ATTEMPTS") {
      setError("Too many wrong codes. Send a new one to try again.");
      setBlocked(true);
    } else {
      setError("Send a code first.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        icon={<MessageSquareText />}
        title="Verify your phone"
        description={
          <>
            {sent ? "We texted a code to " : "Sending a code to "}
            {phone ? (
              <span className="font-semibold text-foreground tabular-nums">{phone}</span>
            ) : (
              "your phone"
            )}
            . It expires in {OTP_EXPIRY_MINUTES} minutes.
          </>
        }
      />
      <ContextNote next={next} />
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          verify(code);
        }}
      >
        <FormField
          label="Verification code"
          description={`Enter the ${OTP_LENGTH}-digit code.`}
          error={error}
          required
        >
          <OtpInput
            id={fieldId}
            length={OTP_LENGTH}
            value={code}
            onValueChange={(v) => {
              setCode(v);
              if (error && !blocked) setError(null);
            }}
            onValueComplete={(v) => !blocked && verify(v)}
            disabled={blocked || busy}
          />
        </FormField>
        <Button type="submit" size="lg" fullWidth loading={busy} disabled={blocked}>
          Verify phone
        </Button>
      </form>
      <div className="flex flex-col items-center gap-2 text-body-sm text-foreground-secondary">
        <Button variant={blocked ? "primary" : "ghost"} onClick={send} disabled={cooldown.left > 0}>
          {cooldown.left > 0 ? `Send a new code in ${cooldown.left}s` : "Send a new code"}
        </Button>
        <p>
          Wrong number? <TextLink href={withNext("/auth/sign-up", next)}>Change it</TextLink>
        </p>
      </div>
      <DevNote>
        <p>No SMS is sent yet. The code is 123456; any other code uses up a try.</p>
      </DevNote>
    </div>
  );
}

// ------------------------------------------------------------------ Forgot password

export function ForgotPasswordScreen() {
  const next = useNext();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6">
        <Header
          icon={<Mail />}
          title="Check your email"
          description={
            <>
              If <span className="font-semibold text-foreground">{sentTo}</span> has a Modgeto
              account, we&apos;ve sent a link to reset the password. It works once and expires in{" "}
              {EMAIL_LINK_EXPIRY_HOURS} hours.
            </>
          }
        />
        <ButtonLink href={withNext("/auth/sign-in", next)} variant="secondary" fullWidth>
          Back to sign in
        </ButtonLink>
        <DevNote>
          <ButtonLink
            href={withNext("/auth/reset-password", next)}
            size="sm"
            variant="secondary"
            className="self-start"
          >
            Open the reset link
          </ButtonLink>
        </DevNote>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Reset your password"
        description="Enter the email you signed up with. We'll send you a link to choose a new password."
      />
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(async ({ email }) => {
          await auth.requestPasswordReset();
          setSentTo(email);
        })}
      >
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField label="Email address" error={fieldState.error?.message} required>
              <Input {...field} type="email" autoComplete="email" inputMode="email" />
            </FormField>
          )}
        />
        <Button type="submit" size="lg" fullWidth loading={form.formState.isSubmitting}>
          Send reset link
        </Button>
      </form>
      <p className="text-center text-body-sm text-foreground-secondary">
        Remembered it? <TextLink href={withNext("/auth/sign-in", next)}>Sign in</TextLink>
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ Reset password

export function ResetPasswordScreen() {
  const router = useRouter();
  const next = useNext();
  const params = useSearchParams();
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  if (params.get("status") === "expired") {
    return (
      <div className="flex flex-col gap-6">
        <Header
          icon={<CircleAlert />}
          title="That link has expired"
          description={`Reset links work once and expire after ${EMAIL_LINK_EXPIRY_HOURS} hours. Ask for a new one.`}
        />
        <ButtonLink href={withNext("/auth/forgot-password", next)} fullWidth>
          Send a new link
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Choose a new password"
        description="Use at least 8 characters. You'll be signed out on other devices."
      />
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(async () => {
          await auth.resetPassword();
          router.push(`${withNext("/auth/sign-in", next)}${next ? "&" : "?"}reset=done`);
        })}
      >
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormField label="New password" error={fieldState.error?.message} required>
              <PasswordInput {...field} autoComplete="new-password" />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="confirm"
          render={({ field, fieldState }) => (
            <FormField label="Confirm new password" error={fieldState.error?.message} required>
              <PasswordInput {...field} autoComplete="new-password" />
            </FormField>
          )}
        />
        <Button type="submit" size="lg" fullWidth loading={form.formState.isSubmitting}>
          Save new password
        </Button>
      </form>
    </div>
  );
}
