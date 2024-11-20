import type { Rectangle } from "@/types/map";
import type { LogEntry } from "@/types/location";
import { metersToCoordinates } from "./coordinates";

export function createPolygons(map: Element, entries: LogEntry[], coverageRange: number) {
  if (entries.length === 0) return;

  // 为每个点创建一个矩形区域并直接绘制
  entries.forEach(entry => {
    const offset = metersToCoordinates(entry.lat, entry.long, coverageRange);
    const area = {
      minLat: entry.lat - offset.lat,
      maxLat: entry.lat + offset.lat,
      minLng: entry.long - offset.lng,
      maxLng: entry.long + offset.lng,
    };
    
    createSinglePolygon(map, area, entry.altitude || 10); // 使用条目中的高度，如果没有则默认为10
  });
}

function createSinglePolygon(map: Element, area: Rectangle, altitude: number) {
  const polygon = document.createElement("gmp-polygon-3d");
  polygon.setAttribute("altitude-mode", "relative-to-ground");
  polygon.setAttribute("fill-color", "rgba(0, 255, 0, 0.5)");
  polygon.setAttribute("stroke-color", "#0000ff");
  polygon.setAttribute("stroke-width", "2");
  polygon.setAttribute("extruded", "");

  customElements.whenDefined(polygon.localName).then(() => {
    // @ts-ignore
    polygon.outerCoordinates = [
      { lat: area.minLat, lng: area.minLng, altitude: altitude ?? 10 },
      { lat: area.maxLat, lng: area.minLng, altitude: altitude ?? 10 },
      { lat: area.maxLat, lng: area.maxLng, altitude: altitude ?? 10 },
      { lat: area.minLat, lng: area.maxLng, altitude: altitude ?? 10 },
      { lat: area.minLat, lng: area.minLng, altitude: altitude ?? 10 },
    ];
  });

  map.append(polygon);
} 