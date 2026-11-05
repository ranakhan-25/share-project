import { PublicPortfolioView } from "@/components/site/PublicPortfolioView";

export const metadata = {
  title: "My Shares | Share Project",
  description: "View and verify your shares without login.",
};

export default function PublicSharesPage() {
  return <PublicPortfolioView mode="shares" />;
}

