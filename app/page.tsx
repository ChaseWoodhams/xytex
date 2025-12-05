import dynamic from "next/dynamic";
import { HeroSection, WhyXytex } from "@/components/home";

// Revalidate homepage every hour
export const revalidate = 3600;

// Lazy load below-the-fold components
const PersonaPathways = dynamic(() => import("@/components/home/PersonaPathways"), {
  loading: () => (
    <div className="section-padding bg-gradient-subtle">
      <div className="container-custom">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    </div>
  ),
  ssr: true,
});

const FeaturedDonors = dynamic(() => import("@/components/home/FeaturedDonors"), {
  loading: () => (
    <div className="section-padding bg-gradient-subtle">
      <div className="container-custom">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    </div>
  ),
  ssr: true,
});

const CTASection = dynamic(() => import("@/components/home/CTASection"), {
  loading: () => null,
  ssr: true,
});

export default function Home() {
  return (
    <>
      <HeroSection />
      <PersonaPathways />
      <WhyXytex />
      <FeaturedDonors />
      <CTASection />
    </>
  );
}
