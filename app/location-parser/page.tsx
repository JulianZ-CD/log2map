import LocationParserForm from "@/components/location-parser/location-parser-form";

export default function LocationParserPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-6 px-4">
      <h2 className="font-medium text-xl mb-4">Location Parser</h2>
      <LocationParserForm />
    </div>
  );
} 