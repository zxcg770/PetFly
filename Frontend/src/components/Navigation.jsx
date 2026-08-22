import { useNavigate } from "react-router-dom";

export function Navigation() {
  const navigate = useNavigate();
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg"
              style={{ backgroundColor: "#5AACDC" }}>
              ✈
            </div>
            <span className="text-xl font-semibold text-foreground">PetFly</span>
          </div>
          <div className="hidden md:flex items-center gap-8"></div>
          {/* Goes to /browse  */}
          <button
            onClick={() => navigate("/browse")}
            className="px-5 py-2.5 rounded-full transition-colors text-white"
              style={{ backgroundColor: "#E8724A" }}
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}