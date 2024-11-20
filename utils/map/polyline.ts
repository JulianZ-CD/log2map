interface Location {
  lat: number;
  lng: number;
}

export const createPolyline = async (map: Element, locations: Location[]) => {
  // 创建 polyline 元素
  const polyline = document.createElement('gmp-polyline-3d');
  polyline.setAttribute('altitude-mode', 'relative-to-ground');
  polyline.setAttribute('stroke-color', 'rgba(139, 69, 19, 0.75)'); // 棕色
  polyline.setAttribute('stroke-width', '15');
  map.appendChild(polyline);

  // 等待 polyline 组件定义完成
  await customElements.whenDefined(polyline.localName);
  
  // 设置坐标点，首尾相连形成封闭的围栏
  (polyline as any).coordinates = [
    ...locations,
    locations[0] // 添加第一个点作为最后一个点，形成闭环
  ];
}; 