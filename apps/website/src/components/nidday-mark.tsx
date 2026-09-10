import { cn } from "@midday/ui/cn";

export function NiddayMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("text-foreground", className)}
      fill="none"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 25V7l18 18V7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.5"
      />
      <path d="M7 20.5 25 11.5" stroke="#D5A323" strokeWidth="2" />
    </svg>
  );
}
