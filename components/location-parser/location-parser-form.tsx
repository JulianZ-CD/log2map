"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import type { ParsedLocation } from "@/types/location";
import { generateLocationSamples } from "@/utils/sample-generator";

export default function LocationParserForm() {
  const [logText, setLogText] = useState("");
  const [parsedLocations, setParsedLocations] = useState<ParsedLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCustomRegex, setShowCustomRegex] = useState(false);
  const [customRegex, setCustomRegex] = useState("");
  const [address, setAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [addresses, setAddresses] = useState("");
  const [geocodingProgress, setGeocodingProgress] = useState({
    current: 0,
    total: 0,
  });
  const [sampleCount, setSampleCount] = useState(20);
  const [includeAltitude, setIncludeAltitude] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  // 默认正则表达式
  const defaultPattern =
    /(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}).*?\((\d+\.\d+),\s*(-?\d+\.\d+)\).*?timestamp\s+(\d+)(?:,\s*altitude\s+(\d+\.?\d*))?(?:,\s*accuracy\s+(\d+\.?\d*))/;

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
        accuracy: loc.accuracy || 0, // 确保不为null
        altitude: loc.altitude || 0, // 确保不为null
        raw_message: loc.raw_message || "", // 确保不为null
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

  const handleGeocode = async (e: React.FormEvent) => {
    e.preventDefault();
    // 过滤掉空白行和只包含空格的行
    const addressList = addresses
      .split("\n")
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    if (addressList.length === 0) {
      setError("Please enter at least one address");
      return;
    }

    if (!apiKey) {
      setError("API key not loaded");
      return;
    }

    setIsGeocoding(true);
    setError(null);
    setGeocodingProgress({ current: 0, total: addressList.length });

    const results: string[] = [];
    const errors: string[] = [];

    // 为了避免超过 API 限制，添加延迟
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    try {
      for (let i = 0; i < addressList.length; i++) {
        const address = addressList[i].trim();
        if (!address) continue;

        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              address
            )}&key=${apiKey}`
          );

          const data = await response.json();

          if (data.status === "OK" && data.results?.[0]) {
            const location = data.results[0].geometry.location;
            const formattedLocation = `${location.lat},${location.lng}`;
            results.push(formattedLocation);
          } else {
            errors.push(`Failed to geocode "${address}": ${data.status}`);
          }
        } catch (err) {
          errors.push(
            `Error processing "${address}": ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }

        setGeocodingProgress({ current: i + 1, total: addressList.length });

        // 添加延迟以避免超过 API 限制
        if (i < addressList.length - 1) {
          await delay(200); // 200ms 延迟
        }
      }

      // 将结果添加到日志文本框
      if (results.length > 0) {
        setLogText((prevText) => {
          const newText = results.join("\n");
          return prevText ? `${prevText}\n${newText}` : newText;
        });
      }

      // 显示错误信息（如果有）
      if (errors.length > 0) {
        setError(
          `Completed with ${errors.length} errors:\n${errors.join("\n")}`
        );
      } else {
        setError(null);
      }

      // 清空地址输入
      setAddresses("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Geocoding failed");
    } finally {
      setIsGeocoding(false);
      setGeocodingProgress({ current: 0, total: 0 });
    }
  };

  const generateSampleData = () => {
    const samples = generateLocationSamples({
      count: sampleCount,
      includeAltitude,
    });
    
    setLogText((prev) => {
      const newText = samples.join('\n');
      return prev ? `${prev}\n${newText}` : newText;
    });
  };

  const handleClearDatabase = async () => {
    // 添加确认对话框
    if (!confirm('Are you sure you want to clear all location data from the database? This action cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('parsed_logs')
        .delete()
        .neq('id', 0); // 删除所有记录

      if (error) throw error;
      alert('Database cleared successfully!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear database');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="flex gap-4 items-end">
        <div className="grid gap-2">
          <Label htmlFor="sample-count">Generate Sample Data</Label>
          <input
            type="number"
            id="sample-count"
            value={sampleCount}
            onChange={(e) => setSampleCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="flex h-9 w-[100px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            min="1"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="include-altitude"
            checked={includeAltitude}
            onChange={(e) => setIncludeAltitude(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="include-altitude">Include Altitude</Label>
        </div>
        <Button type="button" onClick={generateSampleData}>
          Generate Sample Data
        </Button>
      </div>

      <form onSubmit={handleGeocode} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="addresses">Addresses to Geocode (one per line)</Label>
          <Textarea
            id="addresses"
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            placeholder="Enter addresses here, one per line..."
            className="min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={isGeocoding} className="flex-1">
              {isGeocoding
                ? `Converting (${geocodingProgress.current}/${geocodingProgress.total})...`
                : "Convert to Coordinates"}
            </Button>
          </div>
          {isGeocoding && (
            <div className="w-full bg-secondary rounded-full h-2.5 dark:bg-secondary">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%`,
                }}
              ></div>
            </div>
          )}
        </div>
      </form>

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
          <Label htmlFor="show-custom-regex">
            Use Custom Regular Expression
          </Label>
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
              Make sure your pattern includes capture groups for: timestamp,
              latitude, longitude, altitude (optional), and accuracy.
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleClearDatabase}
            disabled={isClearing}
          >
            {isClearing ? "Clearing..." : "Clear Database"}
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
                  <tr
                    key={index}
                    className="border-t border-muted-foreground/20"
                  >
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
