"use client";

import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { CalculatorResults } from "./calculator-results";

export default function DistanceCalculatorForm() {
  const [targetLat, setTargetLat] = useState("47.7412358");
  const [targetLong, setTargetLong] = useState("-122.2157236");
  const [results, setResults] = useState<any>(null);
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
      setResults(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
      setResults(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="target-latitude">Target Latitude</Label>
          <Input
            id="target-latitude"
            type="number"
            step="any"
            value={targetLat}
            onChange={(e) => setTargetLat(e.target.value)}
            placeholder="40.807313"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="target-longitude">Target Longitude</Label>
          <Input
            id="target-longitude"
            type="number"
            step="any"
            value={targetLong}
            onChange={(e) => setTargetLong(e.target.value)}
            placeholder="-73.946713"
            required
          />
        </div>

        <Button type="submit">Compare Locations</Button>
      </form>

      {error && (
        <div className="text-destructive border-l-2 border-destructive px-4 py-2">
          {error}
        </div>
      )}

      {results && <CalculatorResults results={results} />}
    </div>
  );
}
