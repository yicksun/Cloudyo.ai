export const catalog = {
  "/": {
    title: "Cloud, Software & AI Advisory",
    component: "Home",
    description:
      "Cloudyo helps enterprises navigate software procurement, accelerate cloud migrations, and build AI-ready infrastructure.",
  },
  "/expertise": {
    title: "Our Expertise",
    component: "Expertise",
    description:
      "End-to-end software procurement, FinOps, cloud, and data & AI advisory.",
  },
  "/expertise/software-procurement": {
    title: "Software Procurement",
    component: "Procurement",
    description:
      "Optimize licensing, negotiate vendor agreements, and strengthen software compliance.",
  },
  "/expertise/it-cost-management": {
    title: "IT Cost Management",
    component: "FinOps",
    description:
      "Take control of cloud spend with FinOps, analytics, and rightsizing.",
  },
  "/expertise/cloud-services": {
    title: "Cloud Services",
    component: "Cloud",
    description:
      "Secure cloud migration, architecture, modernization, and managed services.",
  },
  "/expertise/data-ai-solutions": {
    title: "Data & AI Solutions",
    component: "AI",
    description:
      "Build AI-ready data platforms with data engineering, AI strategy, and MLOps.",
  },
  "/industries": {
    title: "Industries We Serve",
    component: "Industries",
    description:
      "Enterprise technology advice tailored to your industry's challenges.",
  },
  "/cloud-providers": {
    title: "Our Cloud Partners",
    component: "Providers",
    description:
      "Independent guidance across leading cloud and technology providers.",
  },
  "/resources": {
    title: "Resources & Insights",
    component: "Resources",
    description:
      "Cloud insights, software procurement guides, whitepapers, and client success stories.",
  },
  "/about": {
    title: "About Cloudyo",
    component: "About",
    description:
      "Meet your independent partner for enterprise technology lifecycle management.",
  },
  "/contact": {
    title: "Contact Us",
    component: "Contact",
    description:
      "Contact our cloud architects, procurement specialists, and FinOps practitioners.",
  },
  "/partner-with-us": {
    title: "Partner With Us",
    component: "Partner",
    description:
      "Join the Cloudyo ecosystem of technology providers and specialist consultancies.",
  },
  "/privacy": {
    title: "Privacy Policy",
    component: "Privacy",
    description:
      "How Cloudyo handles personal information and your privacy rights.",
  },
} as const;
export const articles = [
  { slug: "2025-guide-cloud-finops", title: "The 2025 Guide to Cloud FinOps" },
  {
    slug: "financial-services-oracle-renewal",
    title: "Financial Services: $12M Saved on Oracle Renewal",
  },
  {
    slug: "ai-ready-data-architecture",
    title: "Building AI-Ready Data Architecture",
  },
  {
    slug: "microsoft-new-commerce-experience",
    title: "Understanding Microsoft's New Commerce Experience",
  },
  {
    slug: "retail-aws-migration",
    title: "Retail: Zero-Downtime AWS Migration",
  },
  {
    slug: "state-of-software-asset-management",
    title: "The State of Software Asset Management",
  },
];
export function referencePage(path: string) {
  if (Object.hasOwn(catalog, path))
    return catalog[path as keyof typeof catalog];
  const article = articles.find((v) => path === `/resources/${v.slug}`);
  return article
    ? {
        title: article.title,
        component: "Article" as const,
        description: `${article.title}. Expert insights from Cloudyo.`,
      }
    : null;
}
