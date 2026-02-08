export interface InvestmentLot {
  id: string;
  date: string;
  quantity: number;
  price: number;
}

export interface InvestmentHolding {
  id: string;
  symbol: string;
  name?: string;
  quantity: number;
  investedAmount: number;
  currency: "USD";
  lots?: InvestmentLot[];
}

export interface InvestmentPortfolio {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  holdings: InvestmentHolding[];
}

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  asOf: string;
}

export interface OhlcBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  region?: string;
  currency?: string;
}

