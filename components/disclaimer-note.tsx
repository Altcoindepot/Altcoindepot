import type { ReactNode } from "react";
import { ds } from "@/lib/ui-classes";

/** Quiet, shared “not financial advice” note. */
export function DisclaimerNote({
  children = "Informational only · not financial advice",
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <p className={`${ds.disclaimer} ${className}`.trim()}>{children}</p>;
}
