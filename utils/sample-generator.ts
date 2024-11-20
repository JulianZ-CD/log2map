interface GenerateSampleOptions {
  count: number;
  includeAltitude: boolean;
  baseLatitude?: number;
  baseLongitude?: number;
}

function generateRandomPoint(
  baseLatitude: number,
  baseLongitude: number
): {
  lat: number;
  long: number;
  distance: number;
} {
  const MAX_DISTANCE = 300;

  // 将距离范围分成5个圈（0-100m, 100-200m, 200-300m）
  const ringIndex = Math.floor(Math.random() * 3);
  const minDistance = ringIndex * 100;
  const maxDistance = (ringIndex + 1) * 100;

  // 在当前圈内生成随机距离
  const distance = minDistance + Math.random() * (maxDistance - minDistance);

  // 生成随机角度 (0-360度)
  const angle = Math.random() * 2 * Math.PI;

  // 计算纬度和经度的变化量
  // 纬度：1度约等于111公里
  // 经度：1度约等于95公里（在北纬33度左右）
  const latChange = (distance / 111000) * Math.cos(angle);
  const longChange = (distance / 95000) * Math.sin(angle);

  return {
    lat: baseLatitude + latChange,
    long: baseLongitude + longChange,
    distance: Math.round(distance), // 返回实际距离，用于调试
  };
}

export function generateLocationSamples({
  count,
  includeAltitude,
  baseLatitude = 33.00877,
  baseLongitude = -96.66888,
}: GenerateSampleOptions): string[] {
  const samples: string[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // 生成随机点位
    const { lat, long, distance } = generateRandomPoint(
      baseLatitude,
      baseLongitude
    );

    // 根据距离调整精度值（距离越远，精度值越大）
    const accuracy = (distance * 0.1 + Math.random() * 10).toFixed(6);

    const timestamp = now.getTime() - i * 1000;
    const altitude = Math.floor(Math.random() * 20) + 10;

    // Format date as MM-DD HH:mm:ss.SSS
    const dateStr = now
      .toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
      })
      .replace("/", "-");
    const timeStr = now.toTimeString().split(" ")[0];
    const msStr = now.getMilliseconds().toString().padStart(3, "0");

    const altitudeStr = includeAltitude ? `, altitude ${altitude}` : "";

    const sample = `${dateStr} ${timeStr}.${msStr}   492  1834 D LocSvc_ApiV02: Got Zpp fix location validity (lat:1, lon:1, timestamp:1 accuracy:1) (${lat.toFixed(6)}, ${long.toFixed(6)}), timestamp ${timestamp}${altitudeStr}, accuracy ${accuracy}`;

    samples.push(sample);
  }

  return samples;
}
