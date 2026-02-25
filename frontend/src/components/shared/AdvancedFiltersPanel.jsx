import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";

/**
 * AdvancedFiltersPanel Component
 * Advanced filtering options for property lists
 * Supports City, Vendor (Admin only), Bedrooms, and Price Range filters
 */
const AdvancedFiltersPanel = ({
  cities = [],
  vendors = [],
  cityFilter,
  onCityFilterChange,
  vendorFilter,
  onVendorFilterChange,
  bedroomsFilter,
  onBedroomsFilterChange,
  priceRange,
  onPriceRangeChange,
  showVendorFilter = true, // Admin shows vendor filter, Vendor doesn't
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
      {/* City Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          City
        </label>
        <Select value={cityFilter} onValueChange={onCityFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vendor Filter (Admin only) */}
      {showVendorFilter && vendors.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Vendor
          </label>
          <Select value={vendorFilter} onValueChange={onVendorFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Bedrooms Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Bedrooms
        </label>
        <Select value={bedroomsFilter} onValueChange={onBedroomsFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="1">1 Bedroom</SelectItem>
            <SelectItem value="2">2 Bedrooms</SelectItem>
            <SelectItem value="3">3 Bedrooms</SelectItem>
            <SelectItem value="4">4 Bedrooms</SelectItem>
            <SelectItem value="5">5+ Bedrooms</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Max Price/Night
        </label>
        <Input
          type="number"
          placeholder="Max price"
          value={priceRange}
          onChange={(e) => onPriceRangeChange(e.target.value)}
          min="0"
          step="1000"
        />
      </div>
    </div>
  );
};

export default AdvancedFiltersPanel;
