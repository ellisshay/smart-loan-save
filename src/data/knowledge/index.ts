import type { KnowledgeArticle } from "./types";
import { firstMortgageArticles } from "./articles/firstMortgage";
import { refinanceArticles } from "./articles/refinance";
import { mixRateArticles } from "./articles/mixRates";
import { preApprovalArticles } from "./articles/preApproval";
import { selfEmployedArticles } from "./articles/selfEmployed";
import { advisorArticles } from "./articles/advisor";
import { documentsArticles } from "./articles/documents";
import { bankAuctionArticles } from "./articles/bankAuction";

export * from "./types";
export { clusters, getCluster } from "./clusters";
export { knowledgeImages } from "./images";

export const knowledgeArticles: KnowledgeArticle[] = [
  ...firstMortgageArticles,
  ...refinanceArticles,
  ...mixRateArticles,
  ...preApprovalArticles,
  ...selfEmployedArticles,
  ...advisorArticles,
  ...documentsArticles,
  ...bankAuctionArticles,
];

export const getArticle = (slug: string): KnowledgeArticle | undefined =>
  knowledgeArticles.find((a) => a.slug === slug);

export const getArticlesByCluster = (clusterId: string): KnowledgeArticle[] =>
  knowledgeArticles.filter((a) => a.clusterId === clusterId);

export const getPillarArticles = (): KnowledgeArticle[] =>
  knowledgeArticles.filter((a) => a.isPillar);

export const getRelatedArticles = (article: KnowledgeArticle): KnowledgeArticle[] =>
  article.related
    .map((slug) => getArticle(slug))
    .filter((a): a is KnowledgeArticle => Boolean(a))
    .slice(0, 3);
