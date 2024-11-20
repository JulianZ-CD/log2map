import { Analytics } from "@/utils/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface AnalyticsDisplayProps {
  analytics: Analytics | null;
}

export function AnalyticsDisplay({ analytics }: AnalyticsDisplayProps) {
  if (!analytics) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Location Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Accuracy Analysis</h4>
            <ul className="space-y-1 text-sm">
              <li>67th percentile: {analytics.accuracy.percentile67.toFixed(2)}m</li>
              <li>90th percentile: {analytics.accuracy.percentile90.toFixed(2)}m</li>
              <li>Maximum: {analytics.accuracy.max.toFixed(2)}m</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Distance Error Statistics</h4>
            <ul className="space-y-1 text-sm">
              <li>Mean: {analytics.distance_error.mean.toFixed(2)}m</li>
              <li>Maximum: {analytics.distance_error.max.toFixed(2)}m</li>
              <li>Minimum: {analytics.distance_error.min.toFixed(2)}m</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Coverage Analysis</h4>
            <ul className="space-y-1 text-sm">
              <li>Total points: {analytics.coverage.totalPoints}</li>
              <li>Poor coverage points: {analytics.coverage.poorCoveragePoints}</li>
              <li>Poor coverage: {analytics.coverage.poorCoveragePercentage.toFixed(2)}%</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Time Analysis</h4>
            <ul className="space-y-1 text-sm">
              <li>Duration: {analytics.time.duration.toFixed(2)}s</li>
              <li>Start: {analytics.time.startTime}</li>
              <li>End: {analytics.time.endTime}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 