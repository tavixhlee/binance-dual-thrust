'use client';

import { useState } from 'react';
import SymbolList from '@/components/SymbolList';
import DualThrust from '@/components/DualThrust';

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [k1, setK1] = useState<number>(0.5);
  const [k2, setK2] = useState<number>(0.5);

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Binance Dual Thrust 策略监控
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">参数设置</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">K1 (做多参数)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={k1}
                      onChange={(e) => setK1(parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">K2 (做空参数)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={k2}
                      onChange={(e) => setK2(parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <SymbolList
                selectedSymbol={selectedSymbol}
                onSelectSymbol={handleSymbolSelect}
              />
            </div>
            
            <div className="lg:col-span-2">
              <DualThrust symbol={selectedSymbol} k1={k1} k2={k2} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
