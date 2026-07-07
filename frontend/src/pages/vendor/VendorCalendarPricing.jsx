import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import api from "../../lib/api";
import PropertyCalendarPricing from "../../components/shared/PropertyCalendarPricing";
import {
  CalendarDays,
  Search,
  Building2,
  MapPin,
  ChevronLeft,
  Filter,
  X,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

export default function VendorCalendarPricing() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [cityFilter, setCityFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");

  // Reset area when city changes
  useEffect(() => {
    setAreaFilter("all");
  }, [cityFilter]);

  const cities = useMemo(() => {
    const set = new Set();
    properties.forEach((p) => {
      const c = p.city || p.city_name;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [properties]);

  const areas = useMemo(() => {
    const set = new Set();
    properties.forEach((p) => {
      const c = p.city || p.city_name;
      if (p.area && (cityFilter === "all" || c === cityFilter)) set.add(p.area);
    });
    return Array.from(set).sort();
  }, [properties, cityFilter]);

  const activeFilterCount = [
    cityFilter !== "all",
    areaFilter !== "all",
    search.trim() !== "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setCityFilter("all");
    setAreaFilter("all");
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get("/vendor/properties?limit=1000");
      const d = response.data;
      const list =
        d?.data?.properties ||
        d?.properties ||
        (Array.isArray(d?.data) ? d.data : null) ||
        (Array.isArray(d) ? d : []);
      setProperties(list);
    } catch {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const filtered = properties.filter((p) => {
    const city = p.city || p.city_name;
    if (cityFilter !== "all" && city !== cityFilter) return false;
    if (areaFilter !== "all" && p.area !== areaFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !p.title?.toLowerCase().includes(q) &&
        !city?.toLowerCase().includes(q) &&
        !p.area?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  if (selectedProperty) {
    return (
      <div className="mx-auto">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSelectedProperty(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            All Properties
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground truncate max-w-xs">
            {selectedProperty.title}
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Calendar Pricing
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {selectedProperty.title} &mdash; {selectedProperty.city}
          </p>
        </div>

        <PropertyCalendarPricing
          propertyId={selectedProperty.id}
          basePrice={Number(selectedProperty.price_per_night) || 0}
          canEdit={!Boolean(selectedProperty.is_stayflexi_active)}
          role="vendor"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Calendar Pricing
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select a property to manage its day-wise pricing overrides.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 mb-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city or area…"
            className="pl-9"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />

          {/* City filter */}
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="h-8 text-xs w-36">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Area filter */}
          <Select
            value={areaFilter}
            onValueChange={setAreaFilter}
            disabled={areas.length === 0}
          >
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md border border-border hover:bg-accent transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted-foreground mb-3">
          {filtered.length} propert{filtered.length === 1 ? "y" : "ies"} found
        </p>
      )}

      {/* Property list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No properties found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProperty(p)}
              className="w-full text-left rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors p-4 flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {p.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {[p.area, p.city].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {p.status && (
                  <Badge
                    variant={p.status === "active" ? "default" : "secondary"}
                    className="capitalize text-xs"
                  >
                    {p.status}
                  </Badge>
                )}
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  ₹{(Number(p.price_per_night) || 0).toLocaleString("en-IN")}
                  <span className="text-xs text-muted-foreground font-normal">
                    /night
                  </span>
                </span>
                <CalendarDays className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
