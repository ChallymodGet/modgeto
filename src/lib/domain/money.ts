/**
 * Money in integer minor units (docs/03 §23, D-012, D-023).
 * Never use floating point for prices: amounts are bigint, percentages are basis points.
 */

/** V1 Service currencies (D-013). Subscription billing uses NGN and USD only (D-001). */
export const CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** All V1 currencies use 2 minor digits (kobo, cents, pence, cents). */
export const MINOR_DIGITS: Record<Currency, number> = { NGN: 2, USD: 2, GBP: 2, EUR: 2 };

const LOCALE: Record<Currency, string> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "en-IE",
};

export type Money = { readonly amountMinor: bigint; readonly currency: Currency };

/**
 * A percentage in basis points: 100% = 10_000, 50% = 5_000, 12.5% = 1_250.
 * Keeps percentage arithmetic in integers.
 */
export type BasisPoints = number;
export const PERCENT_100: BasisPoints = 10_000;

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function money(amountMinor: bigint | number, currency: Currency): Money {
  if (typeof amountMinor === "number" && !Number.isSafeInteger(amountMinor)) {
    throw new RangeError(`Money amount must be a safe integer of minor units, got ${amountMinor}`);
  }
  return { amountMinor: BigInt(amountMinor), currency };
}

export function zero(currency: Currency): Money {
  return { amountMinor: 0n, currency };
}

/** Builds Money from whole major units, for readable tests and config: major(150_000, "NGN") = ₦150,000. */
export function major(amountMajor: number, currency: Currency): Money {
  if (!Number.isSafeInteger(amountMajor)) {
    throw new RangeError(`major() takes whole units only, got ${amountMajor}`);
  }
  return money(BigInt(amountMajor) * 10n ** BigInt(MINOR_DIGITS[currency]), currency);
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} and ${b.currency}. No FX conversion in V1.`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: a.amountMinor - b.amountMinor, currency: a.currency };
}

export function sum(items: readonly Money[], currency: Currency): Money {
  return items.reduce((total, item) => add(total, item), zero(currency));
}

export function multiply(a: Money, factor: number | bigint): Money {
  if (typeof factor === "number" && !Number.isSafeInteger(factor)) {
    throw new RangeError(`Money can only be multiplied by an integer, got ${factor}`);
  }
  return { amountMinor: a.amountMinor * BigInt(factor), currency: a.currency };
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  return a.amountMinor < b.amountMinor ? -1 : a.amountMinor > b.amountMinor ? 1 : 0;
}

export function isNegative(a: Money): boolean {
  return a.amountMinor < 0n;
}

export function isZero(a: Money): boolean {
  return a.amountMinor === 0n;
}

export function max(a: Money, b: Money): Money {
  return compare(a, b) >= 0 ? a : b;
}

export function equals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amountMinor === b.amountMinor;
}

/**
 * Percentage of an amount, rounded half-up to the nearest minor unit (D-012).
 * Applies to non-negative amounts, which is every percentage line in V1.
 */
export function percentOf(a: Money, bps: BasisPoints): Money {
  if (!Number.isInteger(bps) || bps < 0) {
    throw new RangeError(`Basis points must be a non-negative integer, got ${bps}`);
  }
  if (a.amountMinor < 0n) {
    throw new RangeError("percentOf() expects a non-negative amount");
  }
  const scaled = a.amountMinor * BigInt(bps);
  const result = (scaled + BigInt(PERCENT_100 / 2)) / BigInt(PERCENT_100);
  return { amountMinor: result, currency: a.currency };
}

/** "150000.5" style decimal string, exact. */
export function toDecimalString(a: Money): string {
  const digits = MINOR_DIGITS[a.currency];
  const negative = a.amountMinor < 0n;
  const abs = negative ? -a.amountMinor : a.amountMinor;
  const base = 10n ** BigInt(digits);
  const whole = abs / base;
  const fraction = (abs % base).toString().padStart(digits, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

type FormatOptions = {
  /** Show "+₦80,000" for positive modifiers (docs/08 §10). */
  signed?: boolean;
};

/**
 * Display format: ₦150,000 when whole, ₦150,000.50 when not.
 * Uses Intl with an exact decimal string, so no float conversion happens.
 */
export function formatMoney(a: Money, options: FormatOptions = {}): string {
  const whole = a.amountMinor % 10n ** BigInt(MINOR_DIGITS[a.currency]) === 0n;
  const formatter = new Intl.NumberFormat(LOCALE[a.currency], {
    style: "currency",
    currency: a.currency,
    minimumFractionDigits: whole ? 0 : MINOR_DIGITS[a.currency],
    maximumFractionDigits: MINOR_DIGITS[a.currency],
    signDisplay: options.signed ? "exceptZero" : "auto",
  });
  // Intl.NumberFormat accepts exact decimal strings (ES2023); the cast is for older lib typings.
  return formatter.format(toDecimalString(a) as unknown as number);
}

/**
 * Parses user input such as "150000", "150,000.50" or "₦150,000" into Money.
 * Returns null for anything ambiguous: negatives, more than 2 decimals, letters, empty input.
 */
export function parseMoney(input: string, currency: Currency): Money | null {
  const cleaned = input.replace(/[\s,₦$£€]/g, "");
  const digits = MINOR_DIGITS[currency];
  const match = new RegExp(`^(\\d+)(?:\\.(\\d{1,${digits}}))?$`).exec(cleaned);
  if (!match) return null;
  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? "").padEnd(digits, "0") || "0");
  return money(whole * 10n ** BigInt(digits) + fraction, currency);
}

/** Converts a human percentage like 12.5 to basis points (1250). Rejects more than 2 decimals. */
export function percentToBps(percent: number | string): BasisPoints | null {
  const text = String(percent).trim();
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return null;
  const bps = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0") || "0");
  return bps <= PERCENT_100 ? bps : null;
}

/** JSON-safe form for Server Action payloads and JSONB snapshots (bigint does not survive JSON). */
export type MoneyJSON = { amountMinor: string; currency: Currency };

export function toJSON(a: Money): MoneyJSON {
  return { amountMinor: a.amountMinor.toString(), currency: a.currency };
}

export function fromJSON(json: MoneyJSON): Money {
  if (!/^-?\d+$/.test(json.amountMinor)) {
    throw new RangeError(`Invalid minor-unit string: ${json.amountMinor}`);
  }
  return money(BigInt(json.amountMinor), json.currency);
}
