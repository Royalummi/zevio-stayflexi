import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, MapPin, Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import api from "../../lib/api";
import { toast } from "sonner";
import AddCityDialog from "./AddCityDialog";

const CityCombobox = ({ value, onChange, error, required = false }) => {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [suggestedCity, setSuggestedCity] = useState("");
  const [suggestedState, setSuggestedState] = useState("");
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [showLocationSuggestion, setShowLocationSuggestion] = useState(false);

  useEffect(() => {
    fetchCities();
    detectLocation();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await api.get("/admin/cities");
      setCities(response.data.data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to load cities");
    } finally {
      setLoading(false);
    }
  };

  // Detect user's location from IP with fallback services
  const detectLocation = async () => {
    // Try multiple geolocation services with fallbacks
    const services = [
      () => fetch("https://ipapi.co/json/", { timeout: 3000 }),
      () => fetch("https://ipwho.is/", { timeout: 3000 }),
      () => fetch("https://api.country.is/", { timeout: 3000 }),
    ];

    for (const service of services) {
      try {
        const response = await service();
        if (!response.ok) continue;

        const data = await response.json();

        // Different APIs have different field names
        const city = data.city || data.city_name || null;
        const state = data.region || data.region_code || data.state || null;
        const country =
          data.country_name || data.country || data.country_code || null;

        if (city && state) {
          console.log("[CityCombobox] Location detected:", {
            city,
            state,
            country,
          });
          setDetectedLocation({ city, state, country });
          return;
        }
      } catch (error) {
        console.log(
          "[CityCombobox] Location service failed, trying next...",
          error.message,
        );
        continue;
      }
    }

    console.log(
      "[CityCombobox] All location services failed - skipping auto-detection",
    );
  };

  // Check if detected location exists in cities and auto-select or show suggestion
  useEffect(() => {
    if (detectedLocation && cities.length > 0 && !value) {
      // Find matching city in database (case-insensitive)
      const matchingCity = cities.find(
        (city) =>
          city.name.toLowerCase() === detectedLocation.city.toLowerCase() &&
          city.state.toLowerCase() === detectedLocation.state.toLowerCase(),
      );

      if (matchingCity) {
        // Auto-select the matching city
        console.log(
          "[CityCombobox] Auto-selecting detected location:",
          matchingCity,
        );
        onChange(matchingCity.id, matchingCity);
        toast.success(
          `Location detected: ${matchingCity.name}, ${matchingCity.state}`,
        );
      } else if (
        detectedLocation.country === "India" ||
        detectedLocation.country === "IN"
      ) {
        // Show suggestion to add city if it doesn't exist (India only)
        console.log(
          "[CityCombobox] City not found in database, showing add suggestion",
        );
        setShowLocationSuggestion(true);
      }
    }
  }, [detectedLocation, cities, value, onChange]);

  const selectedCity = cities.find((city) => city.id === value);

  const handleAddCity = async (cityName, stateName) => {
    console.log("[CityCombobox] handleAddCity called:", {
      cityName,
      stateName,
    });
    try {
      console.log("[CityCombobox] Sending API request to /admin/cities");
      const response = await api.post("/admin/cities", {
        name: cityName,
        state: stateName,
      });

      console.log("[CityCombobox] API Response:", response.data);
      const newCity = response.data.data;

      // Add to cities list
      setCities((prev) => {
        const updated = [...prev, newCity];
        console.log("[CityCombobox] Updated cities list:", updated);
        return updated;
      });

      // Select the new city and pass the full city data
      console.log("[CityCombobox] Calling onChange with:", newCity);
      onChange(newCity.id, newCity);

      toast.success(`${newCity.name}, ${newCity.state} added successfully!`);
      setOpen(false);
      setSearchValue("");
      setShowLocationSuggestion(false);
      console.log("[CityCombobox] City added successfully!");
    } catch (error) {
      console.error("[CityCombobox] Error creating city:", error);
      console.error("[CityCombobox] Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to create city");
      throw error;
    }
  };

  const handleOpenAddDialog = (city = "", state = "") => {
    console.log("[CityCombobox] Opening add dialog with:", { city, state });
    setSuggestedCity(city);
    setSuggestedState(state);
    setShowAddDialog(true);
    setOpen(false);
  };

  const filteredCities = searchValue
    ? cities.filter((city) =>
        `${city.name} ${city.state}`
          .toLowerCase()
          .includes(searchValue.toLowerCase()),
      )
    : cities;

  const showAddOption = searchValue && filteredCities.length === 0;

  return (
    <div className="flex flex-col">
      {/* Location suggestion banner */}
      {showLocationSuggestion && detectedLocation && (
        <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              We detected you're in{" "}
              <strong>
                {detectedLocation.city}, {detectedLocation.state}
              </strong>
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              This city is not in our list yet.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("[CityCombobox] Add it button clicked");
              handleOpenAddDialog(
                detectedLocation.city,
                detectedLocation.state,
              );
              setShowLocationSuggestion(false);
            }}
            className="shrink-0"
          >
            Add it
          </Button>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between px-4 py-3 h-auto text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500",
            )}
          >
            {selectedCity
              ? `${selectedCity.name}, ${selectedCity.state}`
              : "Select city..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput
              placeholder="Search city..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading cities...
                </div>
              ) : (
                <>
                  {filteredCities.length > 0 ? (
                    <CommandGroup heading="Cities">
                      {filteredCities.map((city) => (
                        <CommandItem
                          key={city.id}
                          value={`${city.name} ${city.state}`}
                          onSelect={() => {
                            onChange(city.id, city);
                            setOpen(false);
                            setSearchValue("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === city.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {city.name}, {city.state}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    <CommandEmpty>
                      {showAddOption ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-3">
                            City not found
                          </p>
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenAddDialog(searchValue, "");
                            }}
                            size="sm"
                            variant="default"
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add "{searchValue}"
                          </Button>
                        </div>
                      ) : (
                        <p className="text-center py-6">No cities found</p>
                      )}
                    </CommandEmpty>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <span className="text-sm text-red-500 mt-1">{error}</span>}

      {/* Add City Dialog */}
      <AddCityDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddCity}
        suggestedCity={suggestedCity}
        suggestedState={suggestedState}
      />
    </div>
  );
};

export default CityCombobox;
