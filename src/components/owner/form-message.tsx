import type { FormState } from "@/lib/form-state";
import { Alert } from "@/components/ui/alert";

/** The success or error message a form action sent back. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle") return null;
  return (
    <div tabIndex={-1} data-form-message className="outline-none">
      <Alert tone={state.status === "error" ? "error" : "success"}>{state.message}</Alert>
    </div>
  );
}
