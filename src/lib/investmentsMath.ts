import type {
  InvestmentHolding,
  InvestmentPortfolio,
  MarketQuote,
} from "@/types/investments";

export interface HoldingMetrics {
  holdingId: string;
  symbol: string;
  quantity: number;
  investedAmount: number;
  currentPrice: number;
  marketValue: number;
  avgCost: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface PortfolioMetrics {
  totalInvested: number;
  totalMarketValue: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  byHolding: HoldingMetrics[];
  allocation: Array<{ symbol: string; value: number; percent: number }>;
}

export function computeAverageCost(
  quantity: number,
  investedAmount: number
): number {
  if (quantity <= 0) return 0;
  return investedAmount / quantity;
}

export function computeHoldingMetrics(
  holding: InvestmentHolding,
  quote?: MarketQuote
): HoldingMetrics {
  const currentPrice = quote?.price ?? 0;
  const marketValue = holding.quantity * currentPrice;
  const avgCost = computeAverageCost(holding.quantity, holding.investedAmount);
  const unrealizedPnL = marketValue - holding.investedAmount;
  const unrealizedPnLPercent =
    holding.investedAmount > 0 ? unrealizedPnL / holding.investedAmount : 0;

  return {
    holdingId: holding.id,
    symbol: holding.symbol,
    quantity: holding.quantity,
    investedAmount: holding.investedAmount,
    currentPrice,
    marketValue,
    avgCost,
    unrealizedPnL,
    unrealizedPnLPercent,
  };
}

export function computePortfolioMetrics(
  portfolio: InvestmentPortfolio,
  quoteBySymbol: Record<string, MarketQuote | undefined>
): PortfolioMetrics {
  const byHolding = portfolio.holdings.map((holding) =>
    computeHoldingMetrics(holding, quoteBySymbol[holding.symbol])
  );
  const totalInvested = byHolding.reduce((sum, h) => sum + h.investedAmount, 0);
  const totalMarketValue = byHolding.reduce((sum, h) => sum + h.marketValue, 0);
  const totalUnrealizedPnL = totalMarketValue - totalInvested;
  const totalUnrealizedPnLPercent =
    totalInvested > 0 ? totalUnrealizedPnL / totalInvested : 0;

  const allocation = byHolding.map((h) => ({
    symbol: h.symbol,
    value: h.marketValue,
    percent: totalMarketValue > 0 ? h.marketValue / totalMarketValue : 0,
  }));

  return {
    totalInvested,
    totalMarketValue,
    totalUnrealizedPnL,
    totalUnrealizedPnLPercent,
    byHolding,
    allocation,
  };
}

