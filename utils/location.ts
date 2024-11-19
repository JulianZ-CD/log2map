import type { Coordinates } from "@/types/location";

export const formatTimestamp = (timestamp_ms: number) => {
  const date = new Date(timestamp_ms);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

export const parseCoordinates = (lat: string, long: string): Coordinates => {
  return {
    lat: parseFloat(lat),
    long: parseFloat(long),
  };
};
