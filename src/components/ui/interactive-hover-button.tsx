import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Button", className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-md border bg-background px-3 py-1.5 text-center text-sm font-medium transition-all duration-200",
        className,
      )}
      {...props}
    >
      <span className="inline-block transition-all duration-200 group-hover:translate-x-2 group-hover:opacity-0">
        {text}
      </span>
      <div className="absolute top-0 z-10 flex h-full w-full translate-x-2 items-center justify-center gap-1 text-primary-foreground opacity-0 transition-all duration-200 group-hover:-translate-x-0 group-hover:opacity-100">
        <span className="text-xs">{text}</span>
        <ArrowRight className="h-3 w-3" />
      </div>
      <div className="absolute left-1 top-1 h-1 w-1 rounded-sm bg-primary transition-all duration-200 group-hover:left-0 group-hover:top-0 group-hover:h-full group-hover:w-full group-hover:rounded-md group-hover:bg-primary"></div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
