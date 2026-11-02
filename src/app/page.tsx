import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import HomePage from "./(site)/page";

export default function RootPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <HomePage />
      </main>
      <Footer />
    </div>
  );
}
