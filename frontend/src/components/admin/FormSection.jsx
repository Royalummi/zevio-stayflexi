import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Collapsible Form Section Component
 * Used for organizing large forms into manageable, expandable sections
 */
const FormSection = ({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  required = false,
  badge = null,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="mb-6 bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
      {/* Section Header - Clickable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          <h3 className="text-lg font-semibold text-foreground">
            {title}
            {required && <span className="text-destructive ml-1">*</span>}
          </h3>
          {badge && (
            <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Section Content - Collapsible (kept mounted to preserve state) */}
      <div
        className={`px-6 py-5 ${isOpen ? "border-t border-border" : ""}`}
        style={{ display: isOpen ? "block" : "none" }}
      >
        {children}
      </div>
    </section>
  );
};

export default FormSection;
