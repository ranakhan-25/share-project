import { Hero, StatsStrip } from "@/components/site/sections/Hero";
import {
  BenefitsBento,
  FeaturedProjects,
  HowItWorks,
  ReturnsCalculator,
  TestimonialsCta,
} from "@/components/site/sections/HomeSections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <HowItWorks />
      <FeaturedProjects />
      <BenefitsBento />
      <ReturnsCalculator />
      <TestimonialsCta />
    </>
  );
}
