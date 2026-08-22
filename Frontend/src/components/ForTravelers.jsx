import { useNavigate } from "react-router-dom";

export function ForTravelers() {
  const navigate = useNavigate();

  return (
    <section id="for-travelers" className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img src="https://images.unsplash.com/photo-1604508225883-a0b152676b06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" alt="Happy dog" className="w-full rounded-2xl aspect-[3/4] object-cover shadow-lg" />
                <img src="https://images.unsplash.com/photo-1727893244929-117683f3b957?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" alt="Cat portrait" className="w-full rounded-2xl aspect-square object-cover shadow-lg" />
              </div>
              <div className="space-y-4 pt-8">
                <img src="https://images.unsplash.com/photo-1600364906358-46c2d712a646?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" alt="Dog outdoors" className="w-full rounded-2xl aspect-square object-cover shadow-lg" />
                <img src="https://images.unsplash.com/photo-1590100863696-fff64bb4e8f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" alt="Dog in shirt" className="w-full rounded-2xl aspect-[3/4] object-cover shadow-lg" />
              </div>
            </div>
          </div>
          <div className="space-y-6 order-1 lg:order-2">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full shadow-sm border"
              style={{ backgroundColor: "#5AACDC1A", borderColor: "#5AACDC33" }}
            >
              <span className="material-symbols-outlined text-base" style={{ color: "#5AACDC" }}>flight</span>
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#5AACDC" }}>For travelers</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-semibold text-foreground leading-tight">
              Flying anyway? Earn money chaperoning a pet
            </h2>
            <p className="text-lg text-foreground/70 leading-relaxed">
              Turn your flight into extra income. Browse pet transport requests on routes you're already taking.
            </p>
            <ul className="space-y-3">
              {[
                "Earn €100-250 per trip",
                "Choose pets that match your schedule",
                "Build trust through reviews"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                  </div>
                  <span className="text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
            {/* Goes to /browse */}
            <button
              onClick={() => navigate("/browse")}
              style={{ backgroundColor: "#E8724A" }}
              className="flex items-center gap-2 px-8 py-4 text-white rounded-full hover:opacity-90 transition-all hover:shadow-lg"
            >
              Start earning
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
