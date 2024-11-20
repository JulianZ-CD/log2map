export function metersToCoordinates(
  lat: number,
  long: number,
  distanceMeters: number
) {
  const metersToLat = 0.00001; // 约1.11米
  const metersToLng = 0.00001 / Math.cos(lat * Math.PI / 180);
  
  return {
    lat: metersToLat * distanceMeters,
    lng: metersToLng * distanceMeters
  };
}

export function calculateBounds(entries: { lat: number; long: number }[]) {
  if (entries.length === 0) return null;
  
  return entries.reduce(
    (acc, entry) => ({
      minLat: Math.min(acc.minLat, entry.lat),
      maxLat: Math.max(acc.maxLat, entry.lat),
      minLng: Math.min(acc.minLng, entry.long),
      maxLng: Math.max(acc.maxLng, entry.long),
    }),
    {
      minLat: entries[0].lat,
      maxLat: entries[0].lat,
      minLng: entries[0].long,
      maxLng: entries[0].long,
    }
  );
} 