import { Navigation } from "../components/Navigation";
import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { WhyPetFly } from "../components/WhyPetFly";
import { ForTravelers } from "../components/ForTravelers";
import { FAQ } from "../components/FAQ";
import { Footer } from "../components/Footer";

export function LandingPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <Hero />
            <HowItWorks />
            <WhyPetFly />
            <ForTravelers />
            <FAQ />
            <Footer />
        </div>
    );
}
