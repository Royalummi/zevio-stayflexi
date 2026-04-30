import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

/**
 * Form Progress Indicator
 * Shows completion percentage and required fields status
 */
const FormProgressBar = ({ completionPercentage, sections }) => {
  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm mb-6">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Form Progress
            </span>
            <span className="text-lg font-bold text-primary">
              {completionPercentage}%
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {sections.filter((s) => s.complete).length} of {sections.length}{" "}
            sections complete
          </span>
        </div>

        {/* Progress Bar Visual */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Section Status Indicators */}
        <div className="flex items-center gap-4 mt-3 overflow-x-auto pb-2">
          {sections.map((section, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs whitespace-nowrap"
            >
              {section.complete ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span
                className={
                  section.complete ? "text-foreground" : "text-muted-foreground"
                }
              >
                {section.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormProgressBar;
