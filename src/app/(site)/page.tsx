import { BestProperties } from "@/components/site/sections/BestProperties";
import { BusinessFeature } from "@/components/site/sections/BusinessFeature";
import { ShareProjectFeatures } from "@/components/site/sections/FeaturesSection";
import FloatingContact from "@/components/site/sections/floating-contact";
import { Hero, StatsStrip } from "@/components/site/sections/Hero";
import {
  BenefitsBento,
  FeaturedProjects,
  HowItWorks,
  ReturnsCalculator,
  TestimonialsCta,
} from "@/components/site/sections/HomeSections";
import { RealEstateFeature } from "@/components/site/sections/RealEstateFeature";
import ArchitectureServices from "@/components/ui/ArchitectureServices";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProjects />
      <ShareProjectFeatures />
      <ArchitectureServices />
      <StatsStrip />
      <BestProperties />
      <BusinessFeature />
      <BenefitsBento />
      <ReturnsCalculator />
      <TestimonialsCta />
    </>
  );
}
