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

  const handleLogParse = (e: React.FormEvent) => {
    e.preventDefault();

    // 分割多行文本
    const lines = logText.split("\n");
    const parsed: ParsedLocation[] = [];

    // 更新正则表达式以匹配完整格式
    const pattern =
      /(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}).*?\((\d+\.\d+),\s*(-?\d+\.\d+)\).*?timestamp\s+(\d+),\s*accuracy\s+(\d+\.?\d*)/;

    lines.forEach((line) => {
      if (!line.trim()) return;

      const match = line.match(pattern);
      if (match) {
        const [_, logTime, lat, long, timestamp, accuracy] = match;
        parsed.push({
          timestamp_ms: parseInt(timestamp),
          lat: parseFloat(lat),
          long: parseFloat(long),
          accuracy: parseFloat(accuracy),
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
      // 准备插入数据
      const insertData = parsedLocations.map((loc) => ({
        timestamp_ms: loc.timestamp_ms,
        location: `POINT(${loc.long} ${loc.lat})`, // PostGIS格式
        accuracy: loc.accuracy,
        raw_message: loc.raw_message,
      }));

      const { data, error } = await supabase
        .from("parsed_logs")
        .insert(insertData);

      if (error) throw error;

      // 上传成功后清空表单
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
    <div className="flex flex-col gap-6">
      <form onSubmit={handleLogParse} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="log-text">Location Log Text</Label>
          <Textarea
            id="log-text"
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            placeholder="Paste your location log here..."
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit">Parse Log</Button>
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
                  <th className="text-left p-2">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {parsedLocations.map((loc, index) => (
                  <tr
                    key={index}
                    className="border-t border-muted-foreground/20"
                  >
                    <td className="p-2">
                      {new Date(loc.timestamp_ms).toLocaleString()}
                    </td>
                    <td className="p-2">{loc.lat}</td>
                    <td className="p-2">{loc.long}</td>
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
