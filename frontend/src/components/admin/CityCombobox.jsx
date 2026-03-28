import { useState, useEffect, useRef } from "react";
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

  // Keep a stable ref to onChange so the location-detection effect doesn't
  // re-run every time the parent re-renders (inline arrow functions change each render)
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
      // Try admin endpoint first; fall back to public endpoint for non-admin users
      let response;
      try {
        response = await api.get("/admin/cities");
      } catch (adminErr) {
        if (
          adminErr.response?.status === 401 ||
          adminErr.response?.status === 403
        ) {
          response = await api.get("/public/cities");
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
        // Auto-select the matching city — defer to avoid "setState during render" warning
        setTimeout(() => {
          onChangeRef.current(matchingCity.id, matchingCity);
          toast.success(
            `Location detected: ${matchingCity.name}, ${matchingCity.state}`,
          );
        }, 0);
      } else if (
        detectedLocation.country === "India" ||
        detectedLocation.country === "IN"
      ) {
        // Show suggestion to add city if it doesn't exist (India only)
        setShowLocationSuggestion(true);
      }
    }
  }, [detectedLocation, cities, value]); // onChange intentionally omitted — accessed via stable ref

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
