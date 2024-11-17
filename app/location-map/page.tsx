import MapWrapper from '@/components/map/map-wrapper'

export default function LocationMapPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="w-full min-w-[800px] max-w-4xl mt-8">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-4">
          <span className="h-[1px] bg-gray-300 flex-grow"></span>
          <span>Location Map</span>
          <span className="h-[1px] bg-gray-300 flex-grow"></span>
        </h2>
        <div className="w-full h-[600px]">
          <MapWrapper />
        </div>
      </div>
    </main>
  )
}