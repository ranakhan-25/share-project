import type { Metadata } from "next";
import { PageHero } from "@/components/site/sections/PageHero";
import { AboutStory, AboutTeam, AboutTimeline } from "@/components/site/sections/AboutContactSections";

export const metadata: Metadata = { title: "About | আমাদের সম্পর্কে" };

export default function AboutPage() {
  return (
    <>
      <PageHero
        variant="about"
        eyebrow={{ bn: " আমাদের সম্পর্কে ", en: "About" }}
        title={{ bn: "আমরা বিশ্বাস করি,", en: "We believe" }}
        highlight={{ bn: "মালিকানা হওয়া উচিত সবার জন্য", en: "ownership should be for everyone" }}
        subtitle={{ bn: "Share Project একটি স্বচ্ছ, প্রযুক্তি-নির্ভর শেয়ার প্ল্যাটফর্ম — যেখানে প্রতিটি শেয়ারহোল্ডার সমান মর্যাদা পান।", en: "Share Project is a transparent, technology-driven share platform where every shareholder is treated equally." }}
      />
      <AboutStory />
      <AboutTimeline />
      <AboutTeam />
    </>
  );
}
