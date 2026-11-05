import { PublicPortfolioView } from "@/components/site/PublicPortfolioView";

export const metadata = {
  title: "My Investments | Share Project",
  description: "View and verify your investments without login.",
};

export default function PublicMyInvestmentsPage() {
  return <PublicPortfolioView mode="investments" />;
}

