"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import type { LogEntry } from "@/types/location";
import type { MapControls } from "@/types/map";
import { formatTimestamp } from "@/utils/location";
import { createMarkers } from "@/utils/map/markers";
import { createPolygons } from "@/utils/map/polygons";
import { flyThroughLocations } from "@/utils/map/flyCamera";
import { Analytics, analyzeLocationData } from "@/utils/analytics";
import { AnalyticsDisplay } from "./analytics-display";
import { ClickRecordsModal } from "@/utils/map/click-records-modal";

// 跟踪脚本是否已加载
let isScriptLoaded = false;

declare global {
  interface Window {
    google: {
      maps: {
        importLibrary: (libraryName: string) => Promise<any>;
      };
    };
  }
}

interface ClickRecord {
  lat: number;
  lng: number;
  timestamp: number;
}

export default function Google3DMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [showRangeSettings, setShowRangeSettings] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [clickedLocations, setClickedLocations] = useState<
    Array<{ lat: number; lng: number }>
  >([]);

  // 将所有地图控制状态合并到一个对象中
  const [mapControls, setMapControls] = useState<MapControls>({
    useTargetLocation: true,
    targetLat: "33.008770",
    targetLong: "-96.668880",
    useColorCoding: true,
    showPolygon: true,
    distanceRanges: {
      excellent: 50,
      good: 200,
    },
    coverageRange: 20,
  });

  // 在组件顶部添加一个 ref 来存储当前的中心点
  const centerPointRef = useRef<{ lat: string; long: string } | null>(null);

  // API key 获取逻辑保持不变
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch("/api/map");
        const { key } = await response.json();
        setApiKey(key);
      } catch (error) {
        console.error("Failed to fetch API key:", error);
        setError("Failed to load map API");
      }
    };

    fetchApiKey();
  }, []);

  // 添加一个加载脚本的通用函数
  const loadGoogleMapsScript = async (apiKey: string): Promise<void> => {
    if (isScriptLoaded) return;

    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=alpha&libraries=maps3d,marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        isScriptLoaded = true;
        resolve();
      };
      document.head.appendChild(script);
      scriptRef.current = script;
    });
  };

  // 添加新的状态控制是否启点击
  const [enableClick, setEnableClick] = useState(false);

  // 在组件顶部添加新的状态
  const [clickRecords, setClickRecords] = useState<ClickRecord[]>([]);
  const [showClickModal, setShowClickModal] = useState(false);

  // 修改点击监听器函数
  const addClickListener = async (map: Element) => {
    if (!enableClick) return;

    map.addEventListener("gmp-click", async (event: any) => {
      const position = event.position;
      if (position) {
        // 记录新的点击
        const newRecord = {
          lat: position.lat,
          lng: position.lng,
          timestamp: Date.now(),
        };
        setClickRecords((prev) => [...prev, newRecord]);

        // 更新显示状态
        setClickedLocations((prev) => [
          ...prev,
          {
            lat: position.lat,
            lng: position.lng,
          },
        ]);
        setClickedLocation({ lat: position.lat, lng: position.lng });
      }
    });
  };

  // 修改初始化地图的 useEffect
  useEffect(() => {
    if (!apiKey) return;

    const initMap = async () => {
      if (typeof window !== "undefined" && mapRef.current) {
        await loadGoogleMapsScript(apiKey);

        const map = document.createElement("gmp-map-3d");
        map.setAttribute(
          "center",
          `${mapControls.targetLat}, ${mapControls.targetLong}`
        );
        map.setAttribute("tilt", "60");
        map.setAttribute("range", "2000");
        map.style.height = "100%";

        // 使用相同的函数添加点击监听器
        addClickListener(map);

        mapRef.current?.appendChild(map);
      }
    };

    initMap();
  }, [apiKey, mapControls.targetLat, mapControls.targetLong]);

  // 添加计算中心点的函数
  const calculateCenterPoint = (entries: LogEntry[]) => {
    if (entries.length === 0) return null;

    const sumLat = entries.reduce((sum, entry) => sum + entry.lat, 0);
    const sumLong = entries.reduce((sum, entry) => sum + entry.long, 0);

    return {
      lat: (sumLat / entries.length).toFixed(6),
      long: (sumLong / entries.length).toFixed(6),
    };
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError("Map API key not loaded");
      return;
    }

    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc("nearby_logs", {
        lat: mapControls.useTargetLocation
          ? parseFloat(mapControls.targetLat)
          : 0,
        long: mapControls.useTargetLocation
          ? parseFloat(mapControls.targetLong)
          : 0,
      });

      if (error) throw error;
      setLogEntries(data);
      setAnalytics(analyzeLocationData(data, mapControls.distanceRanges.good));
      setError(null);

      // 计算中心点
      const center = mapControls.useTargetLocation
        ? { lat: mapControls.targetLat, long: mapControls.targetLong }
        : calculateCenterPoint(data);

      if (!center) {
        setError("No data available to calculate center point");
        return;
      }

      // 保存中心点到 ref
      centerPointRef.current = center;

      // 更新地图控制状态
      if (!mapControls.useTargetLocation) {
        setMapControls((prev) => ({
          ...prev,
          targetLat: center.lat,
          targetLong: center.long,
          useColorCoding: false,
          showPolygon: false,
        }));
      }

      if (mapRef.current) {
        // 清除现有地图
        while (mapRef.current.firstChild) {
          mapRef.current.removeChild(mapRef.current.firstChild);
        }

        // 创建新地图
        const map = document.createElement("gmp-map-3d");
        map.setAttribute(
          "center",
          `${mapControls.targetLat}, ${mapControls.targetLong}`
        );
        map.setAttribute("tilt", "60");
        map.setAttribute("range", "1000");
        map.style.height = "100%";

        // 添加点击事件监听器
        addClickListener(map);

        mapRef.current.appendChild(map);

        // 确保脚本已加载
        if (!isScriptLoaded) {
          await loadGoogleMapsScript(apiKey);
        }

        await updateMapElements(map, data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    }
  };

  // 更新地图元素的辅助函数
  const updateMapElements = async (map: Element, entries: LogEntry[]) => {
    const poorLocations = entries
      .filter((entry) => entry.dist_meters > mapControls.distanceRanges.good)
      .map((entry) => ({
        lat: entry.lat,
        lng: entry.long,
      }));

    if (poorLocations.length > 0) {
      // 使用保存的中心点
      const currentCenter = centerPointRef.current;
      if (!currentCenter) {
        console.error("No center point available");
        return;
      }

      await flyThroughLocations(
        map,
        poorLocations,
        0,
        currentCenter.lat,
        currentCenter.long,
        mapControls.useTargetLocation
      );
    }

    // 添加标记和多边形
    if (mapControls.showPolygon) {
      createPolygons(map, entries, mapControls.coverageRange);

      if (clickedLocations.length > 0) {
        const clickedEntries = clickedLocations.map((pos) => ({
          lat: pos.lat,
          long: pos.lng,
          dist_meters: 0,
          accuracy: 0,
          timestamp_ms: Date.now(),
        }));

        createPolygons(
          map,
          clickedEntries as LogEntry[],
          mapControls.coverageRange
        );
      }
    }

    await createMarkers(
      map,
      entries,
      {
        useColorCoding: mapControls.useColorCoding,
        distanceRanges: mapControls.distanceRanges,
      },
      setSelectedEntry
    );

    // Add markers for clicked locations
    if (clickedLocations.length > 0) {
      const clickedMarkers = clickedLocations.map((pos) => ({
        lat: pos.lat,
        long: pos.lng,
        dist_meters: 0,
        accuracy: 0,
        timestamp_ms: Date.now(),
      }));

      await createMarkers(
        map,
        clickedMarkers as LogEntry[],
        { useColorCoding: false, distanceRanges: mapControls.distanceRanges },
        setSelectedEntry,
        true // Add an optional parameter to createMarkers to style clicked locations differently
      );
    }
  };

  // 更新控制状态的辅助函数
  const updateMapControl = (key: keyof MapControls, value: any) => {
    setMapControls((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveAllRecords = async () => {
    try {
      const supabase = createClient();

      const insertData = clickRecords.map((record) => ({
        timestamp_ms: record.timestamp,
        location: `POINT(${record.lng} ${record.lat})`,
        accuracy: 0,
        altitude: 0,
        raw_message: `Batch clicked location: ${record.lat}, ${record.lng}`,
      }));

      const { data, error } = await supabase
        .from("parsed_logs")
        .insert(insertData)
        .select();

      if (error) throw error;

      console.log("Successfully inserted locations:", data);

      // 清除记录
      setClickRecords([]);
      setClickedLocations([]);
      setShowClickModal(false);

      // 重新获取数据
      await handleSubmit(new Event("submit") as any);
    } catch (error: any) {
      console.error("Error saving locations:", error);
      setError(error.message || "Failed to save locations");
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 py-2">
        <div className="flex items-center gap-4 mb-4">
          <Label htmlFor="use-target" className="flex items-center gap-2">
            <Input
              id="use-target"
              type="checkbox"
              className="w-4 h-4"
              checked={mapControls.useTargetLocation}
              onChange={(e) => {
                const useTarget = e.target.checked;
                setMapControls((prev) => ({
                  ...prev,
                  useTargetLocation: useTarget,
                  useColorCoding: useTarget,
                  showPolygon: useTarget,
                }));
              }}
            />
            Use Target Location
          </Label>
        </div>

        {mapControls.useTargetLocation && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="map-latitude">Target Latitude</Label>
                <Input
                  id="map-latitude"
                  type="number"
                  step="any"
                  value={mapControls.targetLat}
                  onChange={(e) =>
                    updateMapControl("targetLat", e.target.value)
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="map-longitude">Target Longitude</Label>
                <Input
                  id="map-longitude"
                  type="number"
                  step="any"
                  value={mapControls.targetLong}
                  onChange={(e) =>
                    updateMapControl("targetLong", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Label
                    htmlFor="color-coding"
                    className="flex items-center gap-2"
                  >
                    <Input
                      id="color-coding"
                      type="checkbox"
                      className="w-4 h-4"
                      checked={mapControls.useColorCoding}
                      onChange={(e) =>
                        updateMapControl("useColorCoding", e.target.checked)
                      }
                    />
                    Enable color coding for markers
                  </Label>

                  <Label
                    htmlFor="show-polygon"
                    className="flex items-center gap-2"
                  >
                    <Input
                      id="show-polygon"
                      type="checkbox"
                      className="w-4 h-4"
                      checked={mapControls.showPolygon}
                      onChange={(e) =>
                        updateMapControl("showPolygon", e.target.checked)
                      }
                    />
                    Show Area Polygon
                  </Label>

                  {mapControls.showPolygon && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="coverage-range">Coverage (m):</Label>
                      <Input
                        id="coverage-range"
                        type="number"
                        className="w-20"
                        value={mapControls.coverageRange}
                        onChange={(e) =>
                          updateMapControl(
                            "coverageRange",
                            Number(e.target.value)
                          )
                        }
                        min="1"
                        max="100"
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRangeSettings(!showRangeSettings)}
                >
                  {showRangeSettings ? "Hide" : "Show"} Range Settings
                </Button>
              </div>

              {showRangeSettings && mapControls.useColorCoding && (
                <div className="grid gap-4 p-4 border rounded-lg">
                  <div className="grid gap-2">
                    <Label htmlFor="excellent-range">
                      Excellent Range (Green) - Up to (meters):
                    </Label>
                    <Input
                      id="excellent-range"
                      type="number"
                      value={mapControls.distanceRanges.excellent}
                      onChange={(e) =>
                        updateMapControl("distanceRanges", {
                          ...mapControls.distanceRanges,
                          excellent: Number(e.target.value),
                        })
                      }
                      min="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="good-range">
                      Good Range (Yellow) - Up to (meters):
                    </Label>
                    <Input
                      id="good-range"
                      type="number"
                      value={mapControls.distanceRanges.good}
                      onChange={(e) =>
                        updateMapControl("distanceRanges", {
                          ...mapControls.distanceRanges,
                          good: Number(e.target.value),
                        })
                      }
                      min={mapControls.distanceRanges.excellent}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="enable-click" className="flex items-center gap-2">
              <Input
                id="enable-click"
                type="checkbox"
                className="w-4 h-4"
                checked={enableClick}
                onChange={(e) => setEnableClick(e.target.checked)}
              />
              Enable Click to Add Locations
            </Label>
          </div>
        </div>

        <Button type="submit">Update Map</Button>
      </form>

      {error && (
        <div className="text-destructive border-l-2 border-destructive px-4 py-2">
          {error}
        </div>
      )}

      <div className="relative flex-1">
        <div className="absolute bottom-8 left-4 z-10 flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const map = mapRef.current?.firstChild as any;
                if (map) {
                  map.stopCameraAnimation();
                }
              }}
            >
              Stop Animation
            </Button>

            {clickedLocations.length > 0 && (
              <>
                <div className="bg-blue-500 text-white rounded-lg px-3 py-1.5 flex items-center">
                  Clicked: {clickedLocations.length}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setClickedLocations([])}
                >
                  Clear Clicked
                </Button>
              </>
            )}

            {clickRecords.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowClickModal(true)}
              >
                View Clicks ({clickRecords.length})
              </Button>
            )}
          </div>
        </div>

        {enableClick && (
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-lg z-10">
            Click Mode: Active
          </div>
        )}

        <div ref={mapRef} className="h-[calc(100vh-200px)] w-full" />

        {selectedEntry && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-black">Location Details</h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-black">
              <p>
                <strong>Time:</strong>{" "}
                {formatTimestamp(selectedEntry.timestamp_ms)}
              </p>
              <p>
                <strong>Accuracy:</strong> {selectedEntry.accuracy.toFixed(2)}m
              </p>
              <p>
                <strong>Distance:</strong>{" "}
                <span
                  className={`inline-flex items-center ${
                    mapControls.useColorCoding
                      ? selectedEntry.dist_meters <=
                        mapControls.distanceRanges.excellent
                        ? "text-green-600"
                        : selectedEntry.dist_meters <=
                            mapControls.distanceRanges.good
                          ? "text-yellow-600"
                          : "text-red-600"
                      : ""
                  }`}
                >
                  {selectedEntry.dist_meters.toFixed(2)}m
                  {mapControls.useColorCoding &&
                    (selectedEntry.dist_meters <=
                    mapControls.distanceRanges.excellent
                      ? " (Excellent)"
                      : selectedEntry.dist_meters <=
                          mapControls.distanceRanges.good
                        ? " (Good)"
                        : " (Poor)")}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        {mapControls.useTargetLocation && (
          <>
            <div className="flex justify-end mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                {showAnalytics ? "Hide" : "Show"} Analytics
              </Button>
            </div>

            {showAnalytics && <AnalyticsDisplay analytics={analytics} />}
          </>
        )}
      </div>

      {showClickModal && (
        <ClickRecordsModal
          records={clickRecords}
          onClose={() => setShowClickModal(false)}
          onSave={saveAllRecords}
        />
      )}
    </div>
  );
}
