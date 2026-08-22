const steps = [
  {
    icon: "description",
    title: "Post your request",
    description: "Share your pet's details and travel route. Set your budget."
  },
  {
    icon: "groups",
    title: "Match with a traveler",
    description: "Travelers on your route send offers. Pick who you trust."
  },
  {
    icon: "check_circle",
    title: "Pet arrives safely",
    description: "Get updates throughout the journey. Your pet travels with care."
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-semibold text-foreground">
            How it works
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Three simple steps.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-card border border-border rounded-2xl p-8 space-y-4 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    {step.icon}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-border"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
