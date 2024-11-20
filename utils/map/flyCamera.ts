interface Location {
  lat: number;
  lng: number;
}

// 计算点相对于中心点的角度
const calculateAngle = (point: Location, center: Location): number => {
  const deltaX = point.lng - center.lng;
  const deltaY = point.lat - center.lat;
  return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
};

// 按照圆形路径排序点
const sortLocationsByCircularPath = (
  locations: Location[], 
  targetLat: string, 
  targetLong: string
): Location[] => {
  const center = {
    lat: parseFloat(targetLat),
    lng: parseFloat(targetLong)
  };

  return [...locations].sort((a, b) => {
    const angleA = calculateAngle(a, center);
    const angleB = calculateAngle(b, center);
    return angleA - angleB;
  });
};

export const flyThroughLocations = async (
  map: Element,
  locations: Location[],
  index: number,
  targetLat: string,
  targetLong: string
) => {
  // 对位置进行圆形排序
  const sortedLocations = sortLocationsByCircularPath(locations, targetLat, targetLong);
  
  if (index >= sortedLocations.length) {
    // 所有位置都访问完后，飞到目标位置并环绕
    await (map as any).flyCameraTo({
      endCamera: {
        center: {
          lat: parseFloat(targetLat),
          lng: parseFloat(targetLong),
          altitude: 0,
        },
        tilt: 60,
        range: 1000,
      },
      durationMillis: 2000,
    });

    // 等待飞行结束后开始环绕
    (map as any).addEventListener(
      "gmp-animationend",
      () => {
        (map as any).flyCameraAround({
          camera: {
            center: {
              lat: parseFloat(targetLat),
              lng: parseFloat(targetLong),
              altitude: 0,
            },
            tilt: 60,
            range: 1000,
          },
          durationMillis: 5000,
          rounds: 1,
        });
      },
      { once: true }
    );

    return;
  }

  // 飞到当前位置
  await (map as any).flyCameraTo({
    endCamera: {
      center: {
        lat: sortedLocations[index].lat,
        lng: sortedLocations[index].lng,
        altitude: 0,
      },
      tilt: 30,
      range: 1000,
    },
    durationMillis: 1500,
  });

  // 等待当前动画结束后继续下一个位置
  (map as any).addEventListener(
    "gmp-animationend",
    () => {
      flyThroughLocations(map, sortedLocations, index + 1, targetLat, targetLong);
    },
    { once: true }
  );
}; 