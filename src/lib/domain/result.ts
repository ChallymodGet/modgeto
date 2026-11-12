/** A rule violation the caller can show or log. `code` is stable; `message` is for developers. */
export type DomainError = {
  code: string;
  message: string;
  /** Optional pointer to the thing that failed (an add-on id, a Builder section, a field). */
  target?: string;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: DomainError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T = never>(code: string, message: string, target?: string): Result<T> {
  return { ok: false, error: { code, message, ...(target ? { target } : {}) } };
}

/** Unwraps a Result or throws. For tests and code paths where failure is a programming error. */
export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
}
