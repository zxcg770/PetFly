import { useNavigate } from "react-router-dom"; 

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-semibold text-foreground leading-tight">
                Trusted Pet Transport across borders
              </h1>
              <p className="text-xl text-foreground/70 leading-relaxed">
                Connect with verified travelers flying your route. Give your pet an affordable, accompanied journey instead of cargo shipping.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Goes to /browse not /auth */}
              <button
                onClick={() => navigate("/browse")}
                className="px-8 py-4 rounded-full transition-all hover:shadow-lg text-white"
                style={{ backgroundColor: "#E8724A" }}
              >
                Get Started
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1687992485064-8605c228a434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                alt="Traveler at airport"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -top-6 -right-6 w-40 h-40 bg-accent/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}