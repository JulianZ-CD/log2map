import type { LogEntry } from "@/types/location";
import { metersToCoordinates } from "./coordinates";

export async function createCubicModels(
  map: Element,
  entries: LogEntry[],
  coverageRange: number,
  targetLat: string,
  targetLong: string
) {
  console.log('Starting createCubicModels...', { targetLat, targetLong });

  try {
    const { Model3DElement } = await window.google.maps.importLibrary("maps3d");
    console.log('Maps3d library loaded');

    await customElements.whenDefined('gmp-model-3d');
    console.log('gmp-model-3d defined');

    const model = new Model3DElement({
      src: "/models/xxx.glb",
      position: {
        lat: parseFloat(targetLat),
        lng: parseFloat(targetLong),
        scale: 0.1,
        altitude: 10
      },
      orientation: { tilt: 90 },
      altitudeMode: "RELATIVE_TO_GROUND"
    });
    console.log('Model created');

    model.addEventListener('load', () => {
      console.log('Model loaded successfully at target position');
    });

    model.addEventListener('error', (error: any) => {
      console.error('Error loading model:', error);
    });

    map.append(model);
    console.log('Model appended to map');

  } catch (error) {
    console.error('Error in createCubicModels:', error);
  }
}
