import { useState, useRef } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const formatPropertyLabel = (property) => {
  if (!property) return "";
  const location = property.city_name || property.area;
  return location ? `${property.title} (${location})` : property.title;
};

export default function PropertySearchCombobox({
  properties = [],
  value,
  onChange,
  placeholder = "Search and select property…",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef(null);

  const selectedProperty = properties.find(
    (property) => String(property.id) === String(value),
  );

  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredProperties = normalizedSearch
    ? properties.filter((property) => {
        const haystack = [
          property.title,
          property.city_name,
          property.area,
          property.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : properties;

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setSearchValue("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between px-3 py-2.5 h-auto text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate pr-2">
            {selectedProperty ? formatPropertyLabel(selectedProperty) : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0"
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          searchInputRef.current?.focus();
        }}
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name, city, or area…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto overflow-x-hidden p-1">
          {filteredProperties.length > 0 ? (
            filteredProperties.map((property) => (
              <div
                key={property.id}
                role="option"
                aria-selected={String(value) === String(property.id)}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange(property.id);
                  setOpen(false);
                  setSearchValue("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    String(value) === String(property.id)
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
                <span className="truncate">{formatPropertyLabel(property)}</span>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No properties found
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
