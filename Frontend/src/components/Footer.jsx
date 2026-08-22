import { useState } from "react";

export function Footer() {
  const [activeModal, setActiveModal] = useState(null); // 'about' | 'terms' | 'contact' | null

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 mb-12">
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-foreground text-xl">
                  flight
                </span>
              </div>
              <span className="text-xl font-semibold">PetFly</span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              Your pet's flying companion, not their cargo.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-background">Company</h3>
            <ul className="space-y-3 text-sm text-background/70">
              <li>
                <button
                  onClick={() => setActiveModal("about")}
                  className="bg-transparent border-none p-0 cursor-pointer text-background/70 hover:text-background transition-colors"
                >
                  About us
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal("contact")}
                  className="bg-transparent border-none p-0 cursor-pointer text-background/70 hover:text-background transition-colors"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveModal("terms")}
                  className="bg-transparent border-none p-0 cursor-pointer text-background/70 hover:text-background transition-colors"
                >
                  Terms of service
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/60">© 2026 PetFly. All rights reserved.</p>
        </div>
      </div>

      {activeModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white text-foreground rounded-2xl max-w-md w-full p-8 relative shadow-xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center border-none cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary-foreground text-2xl">
                {activeModal === "about" ? "flight" : activeModal === "contact" ? "mail" : "gavel"}
              </span>
            </div>

            {activeModal === "about" ? (
              <>
                <h2 className="text-2xl font-bold mb-3">About PetFly</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  PetFly connects pet owners with verified travelers heading the same direction,
                  so pets can fly safely in the cabin with a companion instead of alone in cargo.
                  We're a student project built to make pet travel safer, cheaper, and less
                  stressful for everyone involved.
                </p>
              </>
            ) : activeModal === "contact" ? (
              <>
                <h2 className="text-2xl font-bold mb-3">Contact Us</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Have questions or feedback? We'd love to hear from you.
                </p>
                <p className="text-sm text-slate-600">
                  Email us at{" "}
                  <a href="mailto:petfly@tum.de" className="text-primary font-medium hover:underline">
                    petfly@tum.de
                  </a>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-3">Terms of Service</h2>
                <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                  <p>
                    PetFly is a student project created for educational purposes. By using this
                    platform, you agree to the following placeholder terms:
                  </p>
                  <p>
                    <strong>1. Use at your own risk.</strong> PetFly is not a licensed pet
                    transport company. We do not guarantee the safety, conduct, or reliability
                    of any owner or traveler using the platform.
                  </p>
                  <p>
                    <strong>2. No real payments.</strong> Any pricing, offers, or payments shown
                    are for demonstration purposes only.
                  </p>
                  <p>
                    <strong>3. Your data.</strong> Information you submit is used only to
                    demonstrate the platform's functionality and is not shared with third parties.
                  </p>
                  <p>
                    These terms are placeholders and have not been reviewed by legal counsel.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
