import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const buttonVariants = {
  default: "bg-slate-900 text-white hover:bg-slate-800",
  destructive: "bg-red-500 text-white hover:bg-red-600",
  outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  ghost: "hover:bg-slate-100 hover:text-slate-900",
  link: "text-slate-900 underline-offset-4 hover:underline",
};

const buttonSizes = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8",
  icon: "h-9 w-9",
};

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
