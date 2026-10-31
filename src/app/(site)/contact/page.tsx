import type { Metadata } from "next";
import { PageHero } from "@/components/site/sections/PageHero";
import { ContactBlock, ContactFaq } from "@/components/site/sections/AboutContactSections";

export const metadata: Metadata = { title: "Contact | যোগাযোগ" };

export default function ContactPage() {
  return (
    <>
      <PageHero
        variant="contact"
        eyebrow={{ bn: "যোগাযোগ", en: "Contact" }}
        title={{ bn: "আসুন,", en: "Let’s" }}
        highlight={{ bn: "কথা বলি", en: "talk" }}
        subtitle={{ bn: "শেয়ার, কিস্তি বা প্ল্যাটফর্ম নিয়ে যেকোনো প্রশ্ন থাকলে আমাদের জানান — আমরা সাহায্য করতে প্রস্তুত।", en: "Questions about shares, instalments or the platform? Tell us — we’re ready to help." }}
      />
      <ContactBlock />
      <ContactFaq />
    </>
  );
}
