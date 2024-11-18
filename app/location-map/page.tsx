import MapWrapper from "@/components/map/map-wrapper";

export default function LocationMapPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="w-full min-w-[800px] max-w-4xl mt-8">
        <div className="w-full h-[800px]">
          <MapWrapper />
        </div>
      </div>
    </main>
  );
}
