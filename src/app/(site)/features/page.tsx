import type { Metadata } from "next";
import { PageHero } from "@/components/site/sections/PageHero";
import { FeatureGrid, LifecycleTabs, SecurityCta } from "@/components/site/sections/FeaturesSections";
import { FeaturedProjects } from "@/components/site/sections/HomeSections";

export const metadata: Metadata = { title: "Features | ফিচার" };

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        variant="features"
        eyebrow={{ bn: "ফিচার", en: "Features" }}
        title={{ bn: "শক্তিশালী ফিচারে", en: "Powerful features for" }}
        highlight={{ bn: "স্মার্ট শেয়ার ব্যবস্থাপনা", en: "smarter share management" }}
        subtitle={{ bn: "শেয়ার বরাদ্দ, কালেকশন, রিপোর্ট ও পয়েন্ট — সবকিছুর জন্য প্রয়োজনীয় সব টুল এক জায়গায়।", en: "Share allocation, collection, reports and points — all the tools you need in one place." }}
      />
      <FeatureGrid />
      <LifecycleTabs />
      <SecurityCta />
    </>
  );
}
