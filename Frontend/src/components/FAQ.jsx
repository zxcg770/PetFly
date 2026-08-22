import { useState } from "react";

//Example Quesrtions and answers, will be replaced with real data later
const faqs = [
  {
    question: "Is it legal?",
    answer: "Yes, completely. Most airlines allow passengers to travel with pets in-cabin or as accompanied checked baggage."
  },
  {
    question: "What if my flight is delayed?",
    answer: "Your traveler will stay with your pet until the rescheduled flight. We'll coordinate everything and keep you updated."
  },
  {
    question: "What about vaccinations and health certificates?",
    answer: "You're responsible for ensuring your pet meets all destination requirements. We provide a destination-specific checklist, plus a regulation AI chatbot where you can ask specific questions about your destination's rules."
  },
  {
    question: "How does payment work?",
    answer: "When you create a post, you pay a small posting fee. If no matching traveler is found, this fee is fully refunded. Once a traveler is matched, you and the traveler negotiate the travel fee and pet flight ticket price directly. PetFly takes a 15% commission on top of the agreed travel fee."
  }
];

export function FAQ() {
  // ✅ removed TypeScript type <number | null>
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl lg:text-5xl font-semibold text-foreground">
            Frequently asked questions
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-secondary/50 transition-colors"
              >
                <span className="text-lg font-semibold text-foreground pr-8">
                  {faq.question}
                </span>
                <span
                  className={`material-symbols-outlined text-foreground/60 flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-foreground/70 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
