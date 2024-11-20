import type { LogEntry } from "@/types/location";
import type { MarkerOptions } from "@/types/map";

export async function createMarkers(
  map: Element,
  entries: LogEntry[],
  options: MarkerOptions,
  onMarkerClick: (entry: LogEntry) => void,
  isClickedLocation: boolean = false
) {
  const { Marker3DInteractiveElement } =
    await window.google.maps.importLibrary("maps3d");
  const { PinElement } = await window.google.maps.importLibrary("marker");

  entries.forEach((entry) => {
    const pinColor = getPinColor(entry, options);
    const pinBackground = new PinElement({
      background: pinColor,
      glyphColor: "#FFFFFF",
    });

    const interactiveMarker = new Marker3DInteractiveElement({
      position: {
        lat: entry.lat,
        lng: entry.long,
        altitude: entry.altitude || 0,
      },
      altitudeMode: "RELATIVE_TO_GROUND",
      extruded: true,
      collisionBehavior: "REQUIRED",
    });

    interactiveMarker.append(pinBackground);
    interactiveMarker.addEventListener("gmp-click", () => onMarkerClick(entry));

    map.append(interactiveMarker);

    if (isClickedLocation) {
      const clickedMarker = new Marker3DInteractiveElement({
        position: {
          lat: entry.lat,
          lng: entry.long,
          altitude: entry.altitude || 0,
        },
        altitudeMode: "RELATIVE_TO_GROUND",
        extruded: true,
        collisionBehavior: "REQUIRED",
      });

      const pinBackground = new PinElement({
        background: "#1E40AF", // 深蓝色
        glyphColor: "#FFFFFF",
        scale: 1.2, // 稍微放大一点以区分
      });

      clickedMarker.append(pinBackground);
      map.append(clickedMarker);
    }
  });
}

function getPinColor(entry: LogEntry, options: MarkerOptions): string {
  if (!options.useColorCoding) return "#EF4444";

  if (entry.dist_meters <= options.distanceRanges.excellent) {
    return "#34D399"; // 绿色
  } else if (entry.dist_meters <= options.distanceRanges.good) {
    return "#FBBC04"; // 黄色
  }
  return "#EF4444"; // 红色
}
