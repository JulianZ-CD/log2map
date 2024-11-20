import type { Rectangle } from "@/types/map";
import type { LogEntry } from "@/types/location";
import { metersToCoordinates } from "./coordinates";

export function createPolygons(map: Element, entries: LogEntry[], coverageRange: number) {
  if (entries.length === 0) return;

  // 为每个点创建一个可配置大小的矩形区域
  const rectangles = entries.map(entry => {
    const offset = metersToCoordinates(entry.lat, entry.long, coverageRange);
    
    return {
      minLat: entry.lat - offset.lat,
      maxLat: entry.lat + offset.lat,
      minLng: entry.long - offset.lng,
      maxLng: entry.long + offset.lng,
    };
  });

  // 合并重叠的矩形
  const mergedAreas = mergeOverlappingRectangles(rectangles);

  // 为每个合并后的区域创建多边形
  mergedAreas.forEach(area => createSinglePolygon(map, area));
}

function createSinglePolygon(map: Element, area: Rectangle) {
  const polygon = document.createElement("gmp-polygon-3d");
  polygon.setAttribute("altitude-mode", "relative-to-ground");
  polygon.setAttribute("fill-color", "rgba(0, 255, 0, 0.5)");
  polygon.setAttribute("stroke-color", "#0000ff");
  polygon.setAttribute("stroke-width", "2");
  polygon.setAttribute("extruded", "");

  customElements.whenDefined(polygon.localName).then(() => {
    // @ts-ignore
    polygon.outerCoordinates = [
      { lat: area.minLat, lng: area.minLng, altitude: 10 },
      { lat: area.maxLat, lng: area.minLng, altitude: 10 },
      { lat: area.maxLat, lng: area.maxLng, altitude: 10 },
      { lat: area.minLat, lng: area.maxLng, altitude: 10 },
      { lat: area.minLat, lng: area.minLng, altitude: 10 },
    ];
  });

  map.append(polygon);
}

export function mergeOverlappingRectangles(rectangles: Rectangle[]): Rectangle[] {
  if (rectangles.length <= 1) return rectangles;

  const merged: Rectangle[] = [];
  let current = rectangles[0];

  for (let i = 1; i < rectangles.length; i++) {
    const next = rectangles[i];
    
    if (doRectanglesOverlap(current, next)) {
      current = {
        minLat: Math.min(current.minLat, next.minLat),
        maxLat: Math.max(current.maxLat, next.maxLat),
        minLng: Math.min(current.minLng, next.minLng),
        maxLng: Math.max(current.maxLng, next.maxLng),
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  
  merged.push(current);
  return merged;
}

function doRectanglesOverlap(r1: Rectangle, r2: Rectangle) {
  return !(
    r1.maxLat < r2.minLat ||
    r1.minLat > r2.maxLat ||
    r1.maxLng < r2.minLng ||
    r1.minLng > r2.maxLng
  );
} 