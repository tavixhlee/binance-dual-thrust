'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Symbol {
  symbol: string;
  volume: number;
  price: number;
}

interface SymbolListProps {
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
}

interface Binance24hrTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export default function SymbolList({ onSelectSymbol, selectedSymbol }: SymbolListProps) {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await axios.get<Binance24hrTicker[]>('https://api.binance.com/api/v3/ticker/24hr');
        const filteredSymbols = response.data
          .filter((item) => {
            const isUSDT = item.symbol.endsWith('USDT');
            const volume = parseFloat(item.quoteVolume);
            return isUSDT && volume > 10000000; // 1000万 USDT
          })
          .map((item) => ({
            symbol: item.symbol,
            volume: parseFloat(item.quoteVolume),
            price: parseFloat(item.lastPrice)
          }))
          .sort((a, b) => b.volume - a.volume);

        setSymbols(filteredSymbols);
        setLoading(false);
      } catch (error) {
        console.error('获取交易对数据失败:', error);
        setLoading(false);
      }
    };

    fetchSymbols();
    const interval = setInterval(fetchSymbols, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          交易量大于1000万USDT的交易对
        </h3>
      </div>
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {symbols.map((symbol) => (
            <li
              key={symbol.symbol}
              className={`px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer ${
                selectedSymbol === symbol.symbol ? 'bg-indigo-50' : ''
              }`}
              onClick={() => onSelectSymbol(symbol.symbol)}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-indigo-600">{symbol.symbol}</div>
                <div className="flex space-x-4">
                  <div className="text-sm text-gray-500">
                    价格: ${symbol.price.toFixed(4)}
                  </div>
                  <div className="text-sm text-gray-500">
                    24h成交量: ${(symbol.volume / 1000000).toFixed(2)}M
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 