import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Home, Sparkles } from "lucide-react";

/**
 * Property Type Selection Modal
 * Pre-selection modal shown before property creation
 * Forces user to choose property type upfront for better UX
 *
 * Session 51 - Property Creation Enhancement
 */
const PropertyTypeSelectionModal = ({ open, onClose }) => {
  const navigate = useNavigate();

  const propertyTypes = [
    {
      id: "pt-001",
      name: "Villa",
      slug: "villa",
      description:
        "Perfect for short-term stays, vacations, and weekend getaways",
      icon: Home,
      features: [
        "Minimum 1-7 night stays",
        "Private pools & gardens",
        "Event hosting options",
        "Pet-friendly available",
      ],
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
    },
    {
      id: "pt-002",
      name: "Service Apartment",
      slug: "service-apartment",
      description:
        "Ideal for long-term stays, remote work, and corporate housing",
      icon: Building2,
      features: [
        "Minimum 30+ day stays",
        "Fully furnished units",
        "High-speed WiFi",
        "Utilities often included",
      ],
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
    },
  ];

  const handleSelectType = (propertyType) => {
    // Navigate to add property form with pre-selected type
    navigate("/admin/properties/new", {
      state: {
        propertyTypeId: propertyType.id,
        propertyTypeName: propertyType.name,
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Choose Property Type
          </DialogTitle>
          <DialogDescription className="text-base">
            Select the type of property you want to add. This will customize the
            form to show only relevant fields.
            <span className="block mt-2 text-blue-600 dark:text-blue-400 font-medium">
              ℹ️ Property type can be changed later by admin from the edit form
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {propertyTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => handleSelectType(type)}
                className={`
                  ${type.bgColor} ${type.borderColor} ${type.hoverBg}
                  border-2 rounded-xl p-6 transition-all duration-200
                  hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
                  text-left focus:outline-none focus:ring-4 focus:ring-primary/20
                  group
                `}
              >
                {/* Icon & Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`bg-gradient-to-br ${type.color} p-4 rounded-xl text-white shadow-lg group-hover:shadow-xl transition-shadow`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {type.slug}
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                  {type.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {type.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2">
                  {type.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Select Button */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div
                    className={`bg-gradient-to-r ${type.color} text-white px-4 py-2 rounded-lg text-center font-semibold group-hover:shadow-lg transition-shadow`}
                  >
                    Select {type.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
            <span className="text-lg">💡</span>
            <span>
              <strong>Tip:</strong> Choose carefully! Each property type has
              specific fields tailored to its use case. Villa forms include pool
              and event options, while Service Apartment forms include
              housekeeping and utilities.
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyTypeSelectionModal;
