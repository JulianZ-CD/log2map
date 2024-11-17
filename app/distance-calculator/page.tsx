import DistanceCalculatorForm from "@/components/distance-calculator/distance-calculator-form";

export default function DistanceCalculatorPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-6 px-4">
      <h2 className="font-medium text-xl mb-4">Distance Calculator</h2>
      <DistanceCalculatorForm />
    </div>
  );
} 