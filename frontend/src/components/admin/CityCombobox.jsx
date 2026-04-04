import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, MapPin, Plus, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import api from "../../lib/api";
import { toast } from "sonner";
import AddCityDialog from "./AddCityDialog";

const CityCombobox = ({
  value,
  onChange,
  error,
  required = false,
  externalCities = null,
}) => {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState(externalCities || []);
  const [loading, setLoading] = useState(!externalCities);
  const [searchValue, setSearchValue] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [suggestedCity, setSuggestedCity] = useState("");
  const [suggestedState, setSuggestedState] = useState("");
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [showLocationSuggestion, setShowLocationSuggestion] = useState(false);

  useEffect(() => {
    if (!externalCities) {
      fetchCities();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect location only once, only when no city is pre-selected,
  // and with a proper AbortController so strict-mode cleanup cancels the first run.
  useEffect(() => {
    if (value) return; // Already has a city selected — skip detection

    const controller = new AbortController();
    detectLocation(controller.signal);

    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync if externalCities prop updates
  useEffect(() => {
    if (externalCities) {
      setCities(externalCities);
      setLoading(false);
    }
  }, [externalCities]);

  const fetchCities = async () => {
    try {
      // Try admin → vendor → public endpoint based on user role
      let response;
      try {
        response = await api.get("/admin/cities");
      } catch (adminErr) {
        if (
          adminErr.response?.status === 401 ||
          adminErr.response?.status === 403
        ) {
          try {
            response = await api.get("/vendor/cities");
          } catch (vendorErr) {
            if (
              vendorErr.response?.status === 401 ||
              vendorErr.response?.status === 403
            ) {
              response = await api.get("/public/cities");
            } else {
              throw vendorErr;
            }
          }
        } else {
          throw adminErr;
        }
      }
      const data = response.data.data;
      setCities(Array.isArray(data) ? data : data?.cities || data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to load cities");
    } finally {
      setLoading(false);
    }
  };

  // Detect user's location from IP with fallback services.
  // Accepts an AbortSignal so React strict-mode cleanup can cancel in-flight requests.
  const detectLocation = async (signal) => {
    const services = [
      {
        url: "https://ipapi.co/json/",
        parse: (d) => ({
          city: d.city,
          state: d.region,
          country: d.country_name,
        }),
      },
      {
        url: "https://ipwho.is/",
        parse: (d) => ({ city: d.city, state: d.region, country: d.country }),
      },
    ];

    for (const { url, parse } of services) {
      if (signal?.aborted) return;
      try {
        const response = await fetch(url, {
          signal,
          // Enforce a per-request timeout via AbortSignal.timeout where supported
          ...(typeof AbortSignal.timeout === "function"
            ? { signal: AbortSignal.any([signal, AbortSignal.timeout(4000)]) }
            : {}),
        });
        if (!response.ok) continue;

        const data = await response.json();
        const loc = parse(data);

        if (loc.city && loc.state) {
          setDetectedLocation(loc);
          return;
        }
      } catch {
        // Silently try the next service (or give up)
        continue;
      }
    }
    // All services failed — nothing to do, the component works fine without it
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
        // Show suggestion banner — let user decide to select it
        setShowLocationSuggestion(true);
      } else if (
        detectedLocation.country === "India" ||
        detectedLocation.country === "IN"
      ) {
        // Show suggestion to add city if it doesn't exist (India only)
        setShowLocationSuggestion(true);
      }
    }
  }, [detectedLocation, cities, value]);

  const selectedCity = cities.find((city) => city.id === value);

  const handleAddCity = async (cityName, stateName) => {
    console.log("[CityCombobox] handleAddCity called:", {
      cityName,
      stateName,
    });
    try {
      // Try admin → vendor endpoint based on user role
      let response;
      try {
        response = await api.post("/admin/cities", {
          name: cityName,
          state: stateName,
        });
      } catch (adminErr) {
        if (
          adminErr.response?.status === 401 ||
          adminErr.response?.status === 403
        ) {
          response = await api.post("/vendor/cities", {
            name: cityName,
            state: stateName,
          });
        } else {
          throw adminErr;
        }
      }

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
  const searchInputRef = useRef(null);

  return (
    <div className="flex flex-col">
      {/* Location suggestion banner */}
      {showLocationSuggestion &&
        detectedLocation &&
        (() => {
          const matchingCity = cities.find(
            (city) =>
              city.name.toLowerCase() === detectedLocation.city.toLowerCase() &&
              city.state.toLowerCase() === detectedLocation.state.toLowerCase(),
          );
          return (
            <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  We detected you're in{" "}
                  <strong>
                    {detectedLocation.city}, {detectedLocation.state}
                  </strong>
                </p>
                {!matchingCity && (
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    This city is not in our list yet.
                  </p>
                )}
              </div>
              {matchingCity ? (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(matchingCity.id, matchingCity);
                    setShowLocationSuggestion(false);
                  }}
                  className="shrink-0"
                >
                  Select it
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
              )}
            </div>
          );
        })()}

      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setSearchValue("");
        }}
      >
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
        <PopoverContent
          className="w-[400px] p-0"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            searchInputRef.current?.focus();
          }}
        >
          {/* Search input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search city..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* City list */}
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading cities...
              </div>
            ) : filteredCities.length > 0 ? (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Cities
                </div>
                {filteredCities.map((city) => (
                  <div
                    key={city.id}
                    role="option"
                    aria-selected={value === city.id}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
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
                  </div>
                ))}
              </>
            ) : showAddOption ? (
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
              <p className="text-center py-6 text-sm text-muted-foreground">
                No cities found
              </p>
            )}
          </div>
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
