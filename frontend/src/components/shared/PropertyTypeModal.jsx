import { Building2, Home } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

/**
 * PropertyTypeModal Component
 * Modal for selecting property type before adding new property
 * Used by both Admin and Vendor interfaces
 */
const PropertyTypeModal = ({ open, onClose, onSelectType }) => {
  const handleSelectType = (type) => {
    onSelectType(type);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Property Type</DialogTitle>
          <DialogDescription>
            Choose the type of property you want to add
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Villa Option */}
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-blue-50 hover:border-blue-500 dark:hover:bg-blue-900/20 transition-all"
            onClick={() => handleSelectType("villa")}
          >
            <Building2 className="h-12 w-12 text-blue-600" />
            <div className="text-center">
              <div className="font-semibold text-lg">Villa</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Luxury villa properties
              </div>
            </div>
          </Button>

          {/* Service Apartment Option */}
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-indigo-50 hover:border-indigo-500 dark:hover:bg-indigo-900/20 transition-all"
            onClick={() => handleSelectType("service_apartment")}
          >
            <Home className="h-12 w-12 text-indigo-600" />
            <div className="text-center">
              <div className="font-semibold text-lg">Service Apartment</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Service apartment properties
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyTypeModal;
