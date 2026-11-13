import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./button";

type IconButtonProps = Omit<ButtonProps, "size" | "children" | "aria-label"> & {
  /** Accessible name. Required because the button has no visible text (CLAUDE.md §14). */
  label: string;
  icon: ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizes = { sm: "icon-sm", md: "icon", lg: "icon-lg" } as const;

/** Round icon-only button (D-031, D-032). Touch size is at least 36px, 44px by default. */
function IconButton({ label, icon, size = "md", variant = "ghost", ...props }: IconButtonProps) {
  return (
    <Button aria-label={label} title={label} size={sizes[size]} variant={variant} {...props}>
      {icon}
    </Button>
  );
}

export { IconButton };
export type { IconButtonProps };
