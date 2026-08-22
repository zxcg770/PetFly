const benefits = [
  {
    icon: "euro",
    title: "Cheaper than cargo",
    description: "Save hundreds compared to traditional pet cargo shipping."
  },
  {
    icon: "favorite",
    title: "Accompanied the whole way",
    description: "A caring human travels with your pet from departure to arrival, with status updates along the way so owners always feel safe."
  },
  {
    icon: "reviews",
    title: "Trustworthy travelers",
    description: "Every traveler is reviewed by pet owners, so you can pick someone with a track record you trust."
  },
  {
    icon: "checklist",
    title: "Regulation checklist & AI",
    description: "Check destination-specific requirements before the trip, and ask our regulation AI any questions you have."
  }
];

export function WhyPetFly() {
  return (
    <section className="py-20 lg:py-28 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-semibold text-foreground">
            Why PetFly?
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Peace of mind for you. Comfort for your pet.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-card border border-border rounded-2xl p-6 space-y-3 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-accent text-3xl">
                  {benefit.icon}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {benefit.title}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
