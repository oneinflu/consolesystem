'use client';
import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={["h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
});
Input.displayName = "Input";
