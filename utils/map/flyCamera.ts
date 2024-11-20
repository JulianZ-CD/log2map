interface Location {
  lat: number;
  lng: number;
}

export const flyThroughLocations = async (
  map: Element,
  locations: Location[],
  index: number,
  targetLat: string,
  targetLong: string
) => {
  if (index >= locations.length) {
    // 所有位置都访问完后，飞到目标位置并环绕
    await (map as any).flyCameraTo({
      endCamera: {
        center: {
          lat: parseFloat(targetLat),
          lng: parseFloat(targetLong),
          altitude: 0,
        },
        tilt: 60,
        range: 500,
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
            range: 500,
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
        lat: locations[index].lat,
        lng: locations[index].lng,
        altitude: 0,
      },
      tilt: 60,
      range: 800,
    },
    durationMillis: 2000,
  });

  // 等待当前动画结束后继续下一个位置
  (map as any).addEventListener(
    "gmp-animationend",
    () => {
      flyThroughLocations(map, locations, index + 1, targetLat, targetLong);
    },
    { once: true }
  );
}; 