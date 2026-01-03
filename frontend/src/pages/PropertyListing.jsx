import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, MapPin, IndianRupee, Star, Home, Filter } from "lucide-react";
import api from "../lib/api";
import { formatCurrency } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";

export default function PropertyListing() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: "",
    min_price: "",
    max_price: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 1,
  });

  useEffect(() => {
    fetchCities();
    fetchProperties();
  }, [pagination.page, filters]);

  const fetchCities = async () => {
    try {
      const response = await api.get("/public/cities");
      setCities(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch cities:", error);
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.city && { city: filters.city }),
        ...(filters.min_price && { min_price: filters.min_price }),
        ...(filters.max_price && { max_price: filters.max_price }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await api.get("/public/properties", { params });
      setProperties(response.data.data?.properties || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.data.data?.pagination?.totalPages || 1,
      }));
    } catch (error) {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProperties();
  };

  const handlePropertyClick = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Zevio Villas
              </h1>
            </div>
            <Button onClick={() => navigate("/dashboard")}>My Dashboard</Button>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                City
              </label>
              <Select
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.state}
                  </option>
                ))}
              </Select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <IndianRupee className="h-4 w-4 inline mr-1" />
                Min Price
              </label>
              <Input
                type="number"
                placeholder="Min price"
                value={filters.min_price}
                onChange={(e) =>
                  handleFilterChange("min_price", e.target.value)
                }
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <IndianRupee className="h-4 w-4 inline mr-1" />
                Max Price
              </label>
              <Input
                type="number"
                placeholder="Max price"
                value={filters.max_price}
                onChange={(e) =>
                  handleFilterChange("max_price", e.target.value)
                }
              />
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Property Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Available Properties
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({properties.length} properties found)
            </span>
          </h2>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <Home className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No properties found
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card
                  key={property.id}
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handlePropertyClick(property.id)}
                >
                  {/* Property Image */}
                  <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0].image_url}
                        alt={property.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Home className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-white text-gray-900">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {property.status === "approved" ? "Verified" : "New"}
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1 text-gray-900 dark:text-white">
                      {property.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{property.city_name}</span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {property.description}
                    </p>

                    {/* Price & CTA */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Per Night
                        </p>
                        <p className="text-xl font-bold text-primary dark:text-blue-400">
                          {formatCurrency(property.price_per_night)}
                        </p>
                      </div>
                      <Button size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
