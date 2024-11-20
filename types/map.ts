export interface Rectangle {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }
  
  export interface MapControls {
    targetLat: string;
    targetLong: string;
    useColorCoding: boolean;
    showPolygon: boolean;
    distanceRanges: {
      excellent: number;
      good: number;
    };
    coverageRange: number;
  }
  
  export interface MarkerOptions {
    useColorCoding: boolean;
    distanceRanges: {
      excellent: number;
      good: number;
    };
  }