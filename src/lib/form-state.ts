/** What a form's server action sends back to the browser. */
export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors: Record<string, string> };

export const IDLE: FormState = { status: "idle" };

/** A service's answer: a value, or a message (and field messages) to show the person. */
export type ServiceResult<T = void> =
  { ok: true; value: T } | { ok: false; message: string; fieldErrors?: Record<string, string> };

export const ok = <T>(value: T): ServiceResult<T> => ({ ok: true, value });
export const fail = (
  message: string,
  fieldErrors?: Record<string, string>,
): { ok: false; message: string; fieldErrors?: Record<string, string> } => ({
  ok: false,
  message,
  fieldErrors,
});

export function toFormState(result: ServiceResult<unknown>, success: string): FormState {
  return result.ok
    ? { status: "success", message: success }
    : { status: "error", message: result.message, fieldErrors: result.fieldErrors ?? {} };
}
