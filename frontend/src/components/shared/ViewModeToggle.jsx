import { List, Grid3x3 } from "lucide-react";
import { Button } from "../ui/button";

/**
 * ViewModeToggle Component
 * Toggle between List and Grid view modes
 * Used by both Admin and Vendor property management
 */
const ViewModeToggle = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={viewMode === "list" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("list")}
        className="w-full md:w-auto"
      >
        <List className="h-4 w-4 mr-2" />
        List
      </Button>
      <Button
        variant={viewMode === "grid" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("grid")}
        className="w-full md:w-auto"
      >
        <Grid3x3 className="h-4 w-4 mr-2" />
        Grid
      </Button>
    </div>
  );
};

export default ViewModeToggle;
