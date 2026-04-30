import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const AddCityDialog = ({
  open,
  onOpenChange,
  onAdd,
  suggestedCity = "",
  suggestedState = "",
}) => {
  const [cityName, setCityName] = useState("");
  const [stateName, setStateName] = useState("");
  const [loading, setLoading] = useState(false);

  // Update fields when suggestions change or dialog opens
  useEffect(() => {
    if (open) {
      setCityName(suggestedCity);
      setStateName(suggestedState);
    }
  }, [open, suggestedCity, suggestedState]);

  const handleAddClick = async () => {
    if (!cityName.trim() || !stateName.trim()) {
      console.log("[AddCityDialog] Validation failed - empty fields");
      return;
    }

    setLoading(true);
    try {
      console.log("[AddCityDialog] Calling onAdd...");
      await onAdd(cityName.trim(), stateName.trim());
      // Reset form
      setCityName("");
      setStateName("");
      onOpenChange(false);
      console.log("[AddCityDialog] Dialog closed successfully");
    } catch (error) {
      console.error("[AddCityDialog] Error adding city:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddClick();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New City</DialogTitle>
          <DialogDescription>
            Add a new city to the system. This city will be available for all
            properties.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="city">City Name *</Label>
            <Input
              id="city"
              placeholder="e.g., Bangalore"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              placeholder="e.g., Karnataka"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAddClick}
            disabled={loading || !cityName.trim() || !stateName.trim()}
          >
            {loading ? (
              <>Adding...</>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add City
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCityDialog;
