import type { ReactNode } from "react";
import type { ActionState } from "@/shared/lib/action-state";

export function FormField({
  name,
  label,
  hint,
  state,
  children,
  wide = false,
}: {
  name: string;
  label: string;
  hint?: string;
  state: ActionState;
  children: ReactNode;
  wide?: boolean;
}) {
  const errors = state.fields?.[name];
  return (
    <div className={`field${wide ? " fieldWide" : ""}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && <small id={`${name}-hint`}>{hint}</small>}
      {errors && (
        <small className="fieldError" id={`${name}-error`}>
          {errors.join(" · ")}
        </small>
      )}
    </div>
  );
}

export function FormFeedback({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;
  return (
    <p
      className={
        state.status === "error" ? "feedback errorText" : "feedback successText"
      }
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}
