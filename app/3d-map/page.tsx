import Google3DWrapper from "@/components/map/google-3d-wrapper";

export default function ThreeDMapPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="w-full min-w-[800px] max-w-4xl mt-8">
        <div className="w-full h-[800px]">
          <Google3DWrapper />
        </div>
      </div>
    </main>
  );
} 