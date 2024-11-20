import type { LogEntry } from "@/types/location";
import { formatTimestamp } from "./location";

export interface Analytics {
  accuracy: {
    percentile67: number;
    percentile90: number;
    max: number;
  };
  distance_error: {
    mean: number;
    max: number;
    min: number;
  };
  coverage: {
    totalPoints: number;
    poorCoveragePoints: number;
    poorCoveragePercentage: number;
  };
  time: {
    duration: number;
    startTime: string;
    endTime: string;
  };
}

export function analyzeLocationData(entries: LogEntry[], goodRangeThreshold: number): Analytics | null {
  if (entries.length === 0) return null;

  // 排序精度值用于百分位数计算
  const sortedAccuracies = [...entries].sort((a, b) => a.accuracy - b.accuracy);
  const idx67 = Math.floor(entries.length * 0.67);
  const idx90 = Math.floor(entries.length * 0.90);

  // 排序时间戳
  const sortedByTime = [...entries].sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  return {
    accuracy: {
      percentile67: sortedAccuracies[idx67]?.accuracy || 0,
      percentile90: sortedAccuracies[idx90]?.accuracy || 0,
      max: Math.max(...entries.map(e => e.accuracy)),
    },
    distance_error: {
      mean: entries.reduce((sum, e) => sum + e.dist_meters, 0) / entries.length,
      max: Math.max(...entries.map(e => e.dist_meters)),
      min: Math.min(...entries.map(e => e.dist_meters)),
    },
    coverage: {
      totalPoints: entries.length,
      poorCoveragePoints: entries.filter(e => e.dist_meters > goodRangeThreshold).length,
      poorCoveragePercentage: (entries.filter(e => e.dist_meters > goodRangeThreshold).length / entries.length) * 100,
    },
    time: {
      duration: (sortedByTime[sortedByTime.length - 1].timestamp_ms - sortedByTime[0].timestamp_ms) / 1000, // 秒
      startTime: formatTimestamp(sortedByTime[0].timestamp_ms),
      endTime: formatTimestamp(sortedByTime[sortedByTime.length - 1].timestamp_ms),
    }
  };
} 