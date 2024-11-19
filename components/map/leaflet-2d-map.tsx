"use client";

import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "react-leaflet-markercluster/dist/styles.min.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { createClient } from "@/utils/supabase/client";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import type { LogEntry } from "@/types/location";
import { formatTimestamp, parseCoordinates } from "@/utils/location";

// 自定义标记图标
const customIcon = new L.Icon({
  iconUrl: "/images/placeholder.png",
  iconSize: [25, 25],
});

// 自定义聚类图标
const createClusterCustomIcon = function (cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  // 根据聚类数量选择不同的背景色
  const bgColor =
    count < 10 ? "bg-blue-500" : count < 100 ? "bg-orange-500" : "bg-red-500";

  return L.divIcon({
    html: `
      <div class="flex items-center justify-center rounded-full ${bgColor} text-white font-bold shadow-lg w-[40px] h-[40px] border-2 border-white">
        ${count}
      </div>
    `,
    className: "bg-transparent",
    iconSize: L.point(40, 40, true),
    iconAnchor: L.point(20, 20),
  });
};

export default function LocationMap() {
  const mapRef = useRef<L.Map | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [targetLat, setTargetLat] = useState("33.008770");
  const [targetLong, setTargetLong] = useState("-96.668880");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        mapRef.current.setView(
          [parseFloat(targetLat), parseFloat(targetLong)],
          mapRef.current.getZoom()
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    }
  };

  // 计算地图中心点
  const mapCenter = [parseFloat(targetLat), parseFloat(targetLong)];

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
              placeholder="47.7412358"
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
              placeholder="-122.2157236"
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

      <MapContainer
        ref={mapRef}
        center={mapCenter as L.LatLngExpression}
        zoom={14}
        className="h-[calc(200vh-400px)] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* <Marker position={mapCenter as L.LatLngExpression} icon={customIcon}>
          <Popup>Real Location</Popup>
        </Marker> */}
        {/* @ts-ignore */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={40}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={true}
          zoomToBoundsOnClick={true}
          disableClusteringAtZoom={15}
          singleMarkerMode={false}
          chunkProgress={(processed: number, total: number) => {
            console.log(`Loaded ${processed} of ${total} points`);
          }}
          minimumClusterSize={10}
        >
          {logEntries.map((entry) => (
            <Marker
              key={entry.id}
              position={[entry.lat, entry.long]}
              icon={customIcon}
            >
              <Popup className="w-64">
                <div className="space-y-2">
                  <p className="font-semibold">
                    Time: {formatTimestamp(entry.timestamp_ms)}
                  </p>
                  <p className="text-sm">
                    Accuracy: {entry.accuracy.toFixed(2)}m
                  </p>
                  <p className="text-sm">
                    Distance: {entry.dist_meters.toFixed(2)}m
                  </p>
                  <details className="text-xs">
                    <summary className="cursor-pointer hover:text-blue-600">
                      Raw Message
                    </summary>
                    <p className="mt-1 whitespace-pre-wrap">
                      {entry.raw_message}
                    </p>
                  </details>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

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
