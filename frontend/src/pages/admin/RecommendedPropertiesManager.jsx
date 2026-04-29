import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import api from "../../lib/api";
import {
  Star,
  GripVertical,
  Edit,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Home,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

// Sortable Row Component
function SortablePropertyRow({
  property,
  onToggleRecommended,
  onEdit,
  onView,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Parse photos safely
  let thumbnail = null;
  try {
    const photos =
      typeof property.photos === "string"
        ? JSON.parse(property.photos)
        : property.photos;
    thumbnail = photos && photos.length > 0 ? photos[0] : null;
  } catch (e) {
    thumbnail = null;
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b hover:bg-muted/50 transition-colors ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      {/* Drag Handle */}
      <td className="p-4 w-10">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      </td>

      {/* Priority Number */}
      <td className="p-4 w-16 text-center">
        {property.is_recommended === 1 && property.recommended_priority > 0 ? (
          <Badge variant="outline" className="font-mono">
            #{property.recommended_priority}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </td>

      {/* Thumbnail + Title */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={property.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <Home className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h3 className="font-medium text-sm">
              {property.title || "Untitled Property"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {property.city_name || property.city || "Unknown"},{" "}
              {property.city_state || property.state || "-"}
            </p>
          </div>
        </div>
      </td>

      {/* Property Details */}
      <td className="p-4 text-sm text-muted-foreground">
        {property.bedrooms || 0}BR • {property.max_guests || 0} Guests
      </td>

      {/* Rating */}
      <td className="p-4 text-sm">
        {property.rating ? (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{Number(property.rating).toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({property.reviews_count || 0})
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">No ratings yet</span>
        )}
      </td>

      {/* Status */}
      <td className="p-4">
        <Badge
          variant={property.status === "approved" ? "default" : "secondary"}
        >
          {property.status}
        </Badge>
      </td>

      {/* Recommended Toggle */}
      <td className="p-4">
        <Switch
          type="button"
          checked={property.is_recommended === 1}
          onCheckedChange={(checked) =>
            onToggleRecommended(property.id, checked)
          }
        />
      </td>
    </tr>
  );
}

// Main Component
export default function RecommendedPropertiesManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [villaProperties, setVillaProperties] = useState([]);
  const [apartmentProperties, setApartmentProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("villa");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Fetch all properties
  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/properties");

      if (response.data.success) {
        const allPropsRaw =
          response.data.data.properties || response.data.data || [];
        const allProps = (Array.isArray(allPropsRaw) ? allPropsRaw : []).filter(
          (p) => p && p.status === "approved",
        );
        setProperties(Array.isArray(allProps) ? allProps : []);

        // Separate by property type
        const villas = allProps.filter(
          (p) => p && p.property_type_id === "pt-001",
        );
        const apartments = allProps.filter(
          (p) => p && p.property_type_id === "pt-002",
        );

        // Sort by recommended_priority (highest first)
        setVillaProperties(
          villas.sort(
            (a, b) =>
              (b.recommended_priority || 0) - (a.recommended_priority || 0),
          ),
        );
        setApartmentProperties(
          apartments.sort(
            (a, b) =>
              (b.recommended_priority || 0) - (a.recommended_priority || 0),
          ),
        );
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error(error.response?.data?.message || "Failed to load properties");
      // Set empty arrays on error to prevent undefined issues
      setProperties([]);
      setVillaProperties([]);
      setApartmentProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Toggle recommended status
  const handleToggleRecommended = async (propertyId, isRecommended) => {
    try {
      // Check 12-property limit before toggling ON
      if (isRecommended) {
        const currentProps =
          activeTab === "villa" ? villaProperties : apartmentProperties;
        const currentRecommendedCount = currentProps.filter(
          (p) => p.is_recommended === 1,
        ).length;

        if (currentRecommendedCount >= 12) {
          const propertyType =
            activeTab === "villa" ? "Villas" : "Service Apartments";
          toast.error(
            `Cannot recommend more than 12 ${propertyType}. Please unmark others first.`,
          );
          return;
        }
      }

      const response = await api.put(
        `/admin/properties/${propertyId}/recommended`,
        { is_recommended: Boolean(isRecommended) },
      );

      if (response.data.success) {
        toast.success(
          isRecommended
            ? "Property marked as recommended"
            : "Property removed from recommended",
        );
        fetchProperties(); // Refresh list
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to update property";
      toast.error(errorMsg);
      console.error("Error toggling recommended:", error);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const currentProps =
      activeTab === "villa" ? villaProperties : apartmentProperties;
    const recommendedProps = currentProps.filter((p) => p.is_recommended === 1);

    const oldIndex = recommendedProps.findIndex((p) => p.id === active.id);
    const newIndex = recommendedProps.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update UI
    const newOrder = arrayMove(recommendedProps, oldIndex, newIndex);

    if (activeTab === "villa") {
      const nonRecommended = villaProperties.filter(
        (p) => p.is_recommended !== 1,
      );
      setVillaProperties([...newOrder, ...nonRecommended]);
    } else {
      const nonRecommended = apartmentProperties.filter(
        (p) => p.is_recommended !== 1,
      );
      setApartmentProperties([...newOrder, ...nonRecommended]);
    }

    // Send new order to backend
    try {
      const orderedIds = newOrder.map((p) => p.id);
      const property_type_id = activeTab === "villa" ? "pt-001" : "pt-002";

      await api.put("/admin/recommended-properties/reorder", {
        property_type_id,
        ordered_property_ids: orderedIds,
      });

      toast.success("Priority order updated successfully");
      fetchProperties(); // Refresh to get updated priorities from server
    } catch (error) {
      console.error("Error reordering:", error);
      toast.error("Failed to update order");
      fetchProperties(); // Revert on error
    }
  };

  // Navigation handlers
  const handleEdit = (property) => {
    if (!property || !property.id) {
      console.error("Invalid property object", property);
      toast.error("Cannot edit: Invalid property data");
      return;
    }
    navigate(`/admin/properties/${property.id}/edit`);
  };

  const handleView = (property) => {
    if (!property || !property.id) {
      console.error("Invalid property object", property);
      toast.error("Cannot view: Invalid property data");
      return;
    }
    navigate(`/admin/properties`);
  };

  // Filter properties
  const getFilteredProperties = (props) => {
    if (!Array.isArray(props)) return [];

    let filtered = props;

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "recommended") {
        filtered = filtered.filter((p) => p && p.is_recommended === 1);
      } else {
        filtered = filtered.filter((p) => p && p.status === statusFilter);
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        if (!p) return false;
        const title = (p.title || "").toLowerCase();
        const cityName = (p.city_name || p.city || "").toLowerCase();
        return title.includes(query) || cityName.includes(query);
      });
    }

    return filtered;
  };

  const filteredVillas = getFilteredProperties(villaProperties);
  const filteredApartments = getFilteredProperties(apartmentProperties);

  const recommendedVillasCount = Array.isArray(villaProperties)
    ? villaProperties.filter((p) => p && p.is_recommended === 1).length
    : 0;
  const recommendedApartmentsCount = Array.isArray(apartmentProperties)
    ? apartmentProperties.filter((p) => p && p.is_recommended === 1).length
    : 0;

  // Get items for drag-drop (only recommended ones)
  const getRecommendedItems = (props) => {
    if (!Array.isArray(props)) return [];
    return props.filter((p) => p && p.is_recommended === 1).map((p) => p.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Recommended Properties Manager
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage which properties appear in the "Recommended" sections on your
          homepage
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by property name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="recommended">Recommended Only</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>

            <Button type="button" variant="outline" onClick={fetchProperties}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="villa">
            Villas ({recommendedVillasCount}/12)
          </TabsTrigger>
          <TabsTrigger value="apartment">
            Service Apartments ({recommendedApartmentsCount}/12)
          </TabsTrigger>
        </TabsList>

        {/* Villas Tab */}
        <TabsContent value="villa" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Villa Properties</CardTitle>
              <CardDescription>
                Manage recommended villas. Drag to reorder priority.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading properties...
                </div>
              ) : filteredVillas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No villa properties found
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="p-4 text-left w-10"></th>
                          <th className="p-4 text-left w-16">Priority</th>
                          <th className="p-4 text-left">Property</th>
                          <th className="p-4 text-left">Details</th>
                          <th className="p-4 text-left">Rating</th>
                          <th className="p-4 text-left">Status</th>
                          <th className="p-4 text-left">Recommended</th>
                        </tr>
                      </thead>
                      <tbody>
                        <SortableContext
                          items={getRecommendedItems(filteredVillas)}
                          strategy={verticalListSortingStrategy}
                        >
                          {filteredVillas.map((property) => (
                            <SortablePropertyRow
                              key={property.id}
                              property={property}
                              onToggleRecommended={handleToggleRecommended}
                              onEdit={handleEdit}
                              onView={handleView}
                            />
                          ))}
                        </SortableContext>
                      </tbody>
                    </table>
                  </div>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Apartments Tab */}
        <TabsContent value="apartment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Apartment Properties</CardTitle>
              <CardDescription>
                Manage recommended service apartments. Drag to reorder priority.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading properties...
                </div>
              ) : filteredApartments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No service apartment properties found
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="p-4 text-left w-10"></th>
                          <th className="p-4 text-left w-16">Priority</th>
                          <th className="p-4 text-left">Property</th>
                          <th className="p-4 text-left">Details</th>
                          <th className="p-4 text-left">Rating</th>
                          <th className="p-4 text-left">Status</th>
                          <th className="p-4 text-left">Recommended</th>
                          <th className="p-4 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <SortableContext
                          items={getRecommendedItems(filteredApartments)}
                          strategy={verticalListSortingStrategy}
                        >
                          {filteredApartments.map((property) => (
                            <SortablePropertyRow
                              key={property.id}
                              property={property}
                              onToggleRecommended={handleToggleRecommended}
                              onEdit={handleEdit}
                              onView={handleView}
                            />
                          ))}
                        </SortableContext>
                      </tbody>
                    </table>
                  </div>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
