import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

/**
 * StatsCard Component
 * Reusable statistics card for dashboards
 * Used by both Admin and Vendor interfaces
 */
const StatsCard = ({ title, value, icon: Icon, iconColor, valueColor }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        {Icon && <Icon className={`h-4 w-4 ${iconColor || "text-blue-600"}`} />}
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${valueColor || "text-gray-900 dark:text-white"}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
