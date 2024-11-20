export default async function Index() {
  return (
    <div className="flex-1 flex flex-col gap-8 px-4 py-8 max-w-4xl mx-auto">
      {/* Hero Section - 添加渐入和上浮动画 */}
      <section className="text-center space-y-4 animate-fade-up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
          Log2Map: Visualize Location Data in 3D
        </h1>
        <p className="text-xl text-muted-foreground">
          Transform location logs into interactive 3D visualizations using Google Maps Platform
        </p>
      </section>

      {/* Key Features - 添加hover效果和交错动画 */}
      <section className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="space-y-3 p-6 border rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-up">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">📊</span>
            Log Analysis
          </h3>
          <p className="text-muted-foreground">
            Parse and analyze thousands of location logs. Visualize accuracy metrics and coverage analysis in immersive 3D.
          </p>
        </div>

        <div className="space-y-3 p-6 border rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-up [animation-delay:200ms]">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">🗺️</span>
            Deployment Plan
          </h3>
          <p className="text-muted-foreground">
            Plan infrastructure deployment with 3D polygons and coverage visualization. Perfect for base stations and solar panels.
          </p>
        </div>

        <div className="space-y-3 p-6 border rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-up [animation-delay:400ms]">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">✈️</span>
            Travel Plan
          </h3>
          <p className="text-muted-foreground">
            Convert addresses to coordinates, create custom routes, and explore destinations with interactive camera controls.
          </p>
        </div>
      </section>

      {/* Call to Action - 添加呼吸灯效果 */}
      <section className="mt-12 text-center space-y-6">
        <h2 className="text-2xl font-semibold">Ready to Try?</h2>
        <div className="flex gap-4 justify-center">
          <a href="/location-parser" 
             className="px-6 py-3 bg-primary text-primary-foreground rounded-lg relative group overflow-hidden">
            <span className="relative z-10">Parse Logs</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0"></div>
          </a>
          <a href="/3d-map" 
             className="px-6 py-3 bg-primary text-primary-foreground rounded-lg relative group overflow-hidden">
            <span className="relative z-10">Explore 3D Map</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0"></div>
          </a>
        </div>
      </section>
    </div>
  );
}
