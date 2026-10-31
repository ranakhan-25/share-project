/**
 * Config for the generic report pages (see project-api-page.tsx).
 * `endpoint` is appended to `${NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/`.
 * NOTE: these endpoints are best guesses - adjust them to match your backend.
 */
export type ProjectPageConfig = {
  title: string;
  titleBn?: string;
  endpoint: string;
  description?: string;
};

export const projectPageConfigs = {
  // share project
  shareReport: { title: "Share Report", titleBn: "শেয়ার রিপোর্ট", endpoint: "project-share-assignments/reports/share" },
  shareCollectionReport: { title: "Share Collection Report", titleBn: "শেয়ার কালেকশন রিপোর্ট", endpoint: "project-share-assignments/reports/collection" },
  penaltyReport: { title: "Penalty Report", titleBn: "পেনাল্টি রিপোর্ট", endpoint: "project-share-assignments/reports/penalty" },
  holdersPointReport: { title: "Share Holders Point Report", titleBn: "শেয়ারহোল্ডার পয়েন্ট রিপোর্ট", endpoint: "project-share-assignments/reports/points" },

  // flat & land
  flatLandSale: { title: "Flat / Land Sale", titleBn: "ফ্ল্যাট/ল্যান্ড বিক্রয়", endpoint: "flat-land/sales" },
  flatLandSaleReport: { title: "Flat / Land Sale Report", titleBn: "ফ্ল্যাট/ল্যান্ড বিক্রয় রিপোর্ট", endpoint: "flat-land/reports/sale" },
  saleOffer: { title: "Sale Offer", titleBn: "সেল অফার", endpoint: "flat-land/sale-offers" },
  saleCollectionReport: { title: "Sale Collection Report", titleBn: "বিক্রয় কালেকশন রিপোর্ট", endpoint: "flat-land/reports/collection" },
  installmentReport: { title: "Installment Report", titleBn: "কিস্তি রিপোর্ট", endpoint: "flat-land/reports/installment" },
  agingReport: { title: "Aging Report", titleBn: "এজিং রিপোর্ট", endpoint: "flat-land/reports/aging" },
  plotDistributionReport: { title: "Plot Distribution Report", titleBn: "প্লট ডিস্ট্রিবিউশন রিপোর্ট", endpoint: "flat-land/reports/plot-distribution" },

  // contract & billing
  contractAtGlanceReport: { title: "Contract At A Glance", titleBn: "চুক্তি এক নজরে", endpoint: "contract/reports/at-a-glance" },
  contractSummaryReport: { title: "Contract Project Summary Report", titleBn: "চুক্তি প্রজেক্ট সারসংক্ষেপ", endpoint: "contract/reports/project-summary" },
  billingLabourWorkBillReport: { title: "Labour Work Bill Report", titleBn: "লেবার ওয়ার্ক বিল রিপোর্ট", endpoint: "billing/reports/labour-work-bill" },
} satisfies Record<string, ProjectPageConfig>;
