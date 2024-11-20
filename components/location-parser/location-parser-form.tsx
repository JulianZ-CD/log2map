"use client";

import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import type { ParsedLocation } from "@/types/location";

export default function LocationParserForm() {
  const [logText, setLogText] = useState("");
  const [parsedLocations, setParsedLocations] = useState<ParsedLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCustomRegex, setShowCustomRegex] = useState(false);
  const [customRegex, setCustomRegex] = useState("");

  // 默认正则表达式
  const defaultPattern = /(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}).*?\((\d+\.\d+),\s*(-?\d+\.\d+)\).*?timestamp\s+(\d+)(?:,\s*altitude\s+(\d+\.?\d*))?(?:,\s*accuracy\s+(\d+\.?\d*))/;
  
  // 简单坐标格式的正则表达式
  const simpleCoordinatePattern = /^(\d+\.\d+),\s*(-?\d+\.\d+)$/;

  const handleLogParse = (e: React.FormEvent) => {
    e.preventDefault();

    const lines = logText.split("\n");
    const parsed: ParsedLocation[] = [];

    // 使用自定义正则表达式或默认正则表达式
    let pattern;
    try {
      pattern = customRegex ? new RegExp(customRegex) : defaultPattern;
    } catch (e) {
      setError("Invalid regular expression");
      return;
    }

    lines.forEach((line) => {
      if (!line.trim()) return;

      // 首先尝试完整日志格式
      const match = line.match(pattern);
      if (match) {
        const [_, logTime, lat, long, timestamp, altitude, accuracy] = match;
        parsed.push({
          timestamp_ms: parseInt(timestamp),
          lat: parseFloat(lat),
          long: parseFloat(long),
          altitude: altitude ? parseFloat(altitude) : 0,
          accuracy: accuracy ? parseFloat(accuracy) : 0,
          raw_message: line.trim(),
        });
        return;
      }

      // 如果不匹配完整格式，尝试简单坐标格式
      const simpleMatch = line.match(simpleCoordinatePattern);
      if (simpleMatch) {
        const [_, lat, long] = simpleMatch;
        parsed.push({
          timestamp_ms: 0, // 使用当前时间戳
          lat: parseFloat(lat),
          long: parseFloat(long),
          altitude: 0,
          accuracy: 0,
          raw_message: line.trim(),
        });
      }
    });

    setParsedLocations(parsed);
    setError(parsed.length === 0 ? "No valid locations found" : null);
  };

  const handleUpload = async () => {
    if (parsedLocations.length === 0) {
      setError("No locations to upload");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();

    try {
      // 准备插入数据，所有可选字段都需要判断
      const insertData = parsedLocations.map((loc) => ({
        timestamp_ms: loc.timestamp_ms,
        location: `POINT(${loc.long} ${loc.lat})`, // PostGIS格式
        accuracy: loc.accuracy || 0,  // 确保不为null
        altitude: loc.altitude || 0,  // 确保不为null
        raw_message: loc.raw_message || "",  // 确保不为null
      }));

      const { data, error } = await supabase
        .from("parsed_logs")
        .insert(insertData);

      if (error) throw error;

      setLogText("");
      setParsedLocations([]);
      setError(null);
      alert("Successfully uploaded locations!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <form onSubmit={handleLogParse} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="log-text">Location Log Text</Label>
          <Textarea
            id="log-text"
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            placeholder="Paste your location log here..."
            className="min-h-[200px] font-mono text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-custom-regex"
            checked={showCustomRegex}
            onChange={(e) => setShowCustomRegex(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="show-custom-regex">Use Custom Regular Expression</Label>
        </div>

        {showCustomRegex && (
          <div className="grid gap-2">
            <Label htmlFor="custom-regex">Regular Expression Pattern</Label>
            <Textarea
              id="custom-regex"
              value={customRegex}
              onChange={(e) => setCustomRegex(e.target.value)}
              placeholder="Enter custom regex pattern..."
              className="font-mono text-sm w-full"
            />
            <p className="text-sm text-muted-foreground">
              Make sure your pattern includes capture groups for: timestamp, latitude, longitude, altitude (optional), and accuracy.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit">Parse Log</Button>
          <Button
            type="button"
            onClick={() => {
              setLogText("");
              setParsedLocations([]);
              setError(null);
            }}
          >
            Clear
          </Button>
          {parsedLocations.length > 0 && (
            <Button type="button" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload to Database"}
            </Button>
          )}
        </div>
      </form>

      {error && (
        <div className="text-destructive border-l-2 border-destructive px-4 py-2">
          {error}
        </div>
      )}

      {/* 显示解析结果 */}
      {parsedLocations.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">
            Parsed Locations: {parsedLocations.length} entries
          </h3>
          <div className="bg-muted rounded-md p-4 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Timestamp</th>
                  <th className="text-left p-2">Latitude</th>
                  <th className="text-left p-2">Longitude</th>
                  <th className="text-left p-2">Altitude</th>
                  <th className="text-left p-2">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {parsedLocations.map((loc, index) => (
                  <tr key={index} className="border-t border-muted-foreground/20">
                    <td className="p-2">
                      {new Date(loc.timestamp_ms).toLocaleString()}
                    </td>
                    <td className="p-2">{loc.lat}</td>
                    <td className="p-2">{loc.long}</td>
                    <td className="p-2">{loc.altitude.toFixed(2)}m</td>
                    <td className="p-2">{loc.accuracy.toFixed(2)}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <details className="mt-4">
              <summary className="cursor-pointer hover:text-blue-600">
                Show Raw JSON
              </summary>
              <pre className="mt-2 text-xs">
                {JSON.stringify(parsedLocations, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
