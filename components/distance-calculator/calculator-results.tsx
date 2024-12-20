export function CalculatorResults({ results }: { results: any }) {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium mb-2">Calculated Distances:</h3>
      <pre className="bg-muted rounded-md p-4 overflow-auto">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  )
} 