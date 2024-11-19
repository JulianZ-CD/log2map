"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import type { LogEntry } from "@/types/location";
import { formatTimestamp, parseCoordinates } from "@/utils/location";

// 跟踪脚本是否已加载
let isScriptLoaded = false;

// 在文件顶部添加这些类型声明
declare global {
  interface Window {
    google: {
      maps: {
        importLibrary: (libraryName: string) => Promise<any>;
      };
    };
  }
}

export default function Google3DMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [targetLat, setTargetLat] = useState("47.7412358");
  const [targetLong, setTargetLong] = useState("-122.2157236");
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // 在组件加载时获取 API key
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

  // 修改地图初始化逻辑
  useEffect(() => {
    // 只在 apiKey 存在时初始化地图
    if (!apiKey) return;

    const initMap = async () => {
      if (typeof window !== "undefined" && mapRef.current) {
        if (!isScriptLoaded) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=alpha&libraries=maps3d,marker`;
          script.async = true;
          script.defer = true; // 添加 defer
          script.onload = () => {
            isScriptLoaded = true;
            const map = document.createElement("gmp-map-3d");
            map.setAttribute("center", `43.6425, -79.3871`);
            map.setAttribute("tilt", "60");
            map.setAttribute("range", "2000");
            map.style.height = "100%";
            mapRef.current?.appendChild(map);
          };
          document.head.appendChild(script);
          scriptRef.current = script;
        }
      }
    };

    initMap();
  }, [apiKey]); // 依赖于 apiKey

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
        lat: parseFloat(targetLat),
        long: parseFloat(targetLong),
      });

      if (error) throw error;
      setLogEntries(data);
      setError(null);

      if (mapRef.current) {
        while (mapRef.current.firstChild) {
          mapRef.current.removeChild(mapRef.current.firstChild);
        }

        const map = document.createElement("gmp-map-3d");
        map.setAttribute("center", `${targetLat}, ${targetLong}`);
        map.setAttribute("tilt", "60");
        map.setAttribute("range", "1000");
        map.style.height = "100%";
        mapRef.current.appendChild(map);

        if (!isScriptLoaded) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=alpha&libraries=maps3d,marker`;
          script.async = true;
          script.defer = true;
          script.onload = async () => {
            isScriptLoaded = true;
            await createMarkers(map, data);
          };
          document.head.appendChild(script);
          scriptRef.current = script;
        } else {
          await createMarkers(map, data);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    }
  };

  // 将标记创建逻辑抽取为单独的函数
  const createMarkers = async (map: Element, entries: LogEntry[]) => {
    const { Marker3DElement } =
      await window.google.maps.importLibrary("maps3d");

    entries.forEach((entry) => {
      const marker = new Marker3DElement({
        position: { lat: entry.lat, lng: entry.long },
      });

      marker.addEventListener("click", () => {
        const content = `
          <div style="padding: 10px">
            <p><strong>Time:</strong> ${formatTimestamp(entry.timestamp_ms)}</p>
            <p><strong>Accuracy:</strong> ${entry.accuracy.toFixed(2)}m</p>
            <p><strong>Distance:</strong> ${entry.dist_meters.toFixed(2)}m</p>
          </div>
        `;
        console.log(content);
      });

      map.append(marker);
    });
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="map-latitude">Target Latitude</Label>
            <Input
              id="map-latitude"
              type="number"
              step="any"
              value={targetLat}
              onChange={(e) => setTargetLat(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="map-longitude">Target Longitude</Label>
            <Input
              id="map-longitude"
              type="number"
              step="any"
              value={targetLong}
              onChange={(e) => setTargetLong(e.target.value)}
              required
            />
          </div>
        </div>
        <Button type="submit">Update Location</Button>
      </form>

      {error && (
        <div className="text-destructive border-l-2 border-destructive px-4 py-2">
          {error}
        </div>
      )}

      <div ref={mapRef} className="h-[calc(100vh-200px)] w-full" />

      <div className="p-4 overflow-auto bg-white">
        <h3 className="text-lg font-bold mb-2 text-black">
          Debug Information:
        </h3>
        <div className="space-y-2 text-black">
          <p>Total locations: {logEntries.length}</p>
          <details>
            <summary className="cursor-pointer hover:text-blue-600">
              Raw Data (Click to expand)
            </summary>
            <pre className="mt-2 text-sm overflow-auto bg-gray-50 p-2 rounded">
              {JSON.stringify(logEntries, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
