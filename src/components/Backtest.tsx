'use client';

import { useState } from 'react';
import axios from 'axios';

interface BacktestProps {
  symbol: string;
  k1: number;
  k2: number;
}

interface Trade {
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  pnl: number;
  pnlPercent: number;
}

interface BacktestResult {
  trades: Trade[];
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  avgPnl: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

type BinanceKlineResponse = [
  number,     // Open time
  string,     // Open
  string,     // High
  string,     // Low
  string,     // Close
  string,     // Volume
  number,     // Close time
  string,     // Quote asset volume
  number,     // Number of trades
  string,     // Taker buy base asset volume
  string,     // Taker buy quote asset volume
  string      // Ignore
];

export default function Backtest({ symbol, k1, k2 }: BacktestProps) {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
      
      const response = await axios.get<BinanceKlineResponse[]>(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&startTime=${startTime}&endTime=${endTime}&limit=1000`
      );

      const klines = response.data.map((k: BinanceKlineResponse) => ({
        time: new Date(k[0]).toISOString(),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      }));

      const trades: Trade[] = [];
      let position: 'NONE' | 'LONG' | 'SHORT' = 'NONE';
      let entryPrice = 0;
      let entryTime = '';

      // 遍历K线数据进行回测
      for (let i = 24; i < klines.length; i++) {
        const lookback = timeframe === '1h' ? 24 : 6;
        const prevKlines = klines.slice(i - lookback, i);
        const currentKline = klines[i];

        // 计算Dual Thrust信号
        const hh = Math.max(...prevKlines.map(k => k.high));
        const ll = Math.min(...prevKlines.map(k => k.low));
        const hc = Math.max(...prevKlines.map(k => k.close));
        const lc = Math.min(...prevKlines.map(k => k.close));
        const range = Math.max(hh - lc, hc - ll);
        
        const buyLine = currentKline.open + k1 * range;
        const sellLine = currentKline.open - k2 * range;

        // 交易逻辑
        if (position === 'NONE') {
          if (currentKline.high > buyLine) {
            position = 'LONG';
            entryPrice = buyLine;
            entryTime = currentKline.time;
          } else if (currentKline.low < sellLine) {
            position = 'SHORT';
            entryPrice = sellLine;
            entryTime = currentKline.time;
          }
        } else if (position === 'LONG') {
          if (currentKline.low < sellLine) {
            trades.push({
              type: 'LONG',
              entryPrice,
              exitPrice: sellLine,
              entryTime,
              exitTime: currentKline.time,
              pnl: sellLine - entryPrice,
              pnlPercent: ((sellLine - entryPrice) / entryPrice) * 100
            });
            position = 'NONE';
          }
        } else if (position === 'SHORT') {
          if (currentKline.high > buyLine) {
            trades.push({
              type: 'SHORT',
              entryPrice,
              exitPrice: buyLine,
              entryTime,
              exitTime: currentKline.time,
              pnl: entryPrice - buyLine,
              pnlPercent: ((entryPrice - buyLine) / entryPrice) * 100
            });
            position = 'NONE';
          }
        }
      }

      // 计算回测统计数据
      const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
      const winningTrades = trades.filter(trade => trade.pnl > 0);
      const winRate = (winningTrades.length / trades.length) * 100;
      const avgPnl = totalPnl / trades.length;

      // 计算最大回撤
      let maxDrawdown = 0;
      let peak = -Infinity;
      let balance = 0;
      trades.forEach(trade => {
        balance += trade.pnl;
        if (balance > peak) {
          peak = balance;
        }
        const drawdown = ((peak - balance) / peak) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      });

      // 计算夏普比率
      const returns = trades.map(trade => trade.pnlPercent);
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const stdDev = Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      );
      const sharpeRatio = stdDev !== 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

      setResult({
        trades,
        totalPnl,
        winRate,
        totalTrades: trades.length,
        avgPnl,
        maxDrawdown,
        sharpeRatio
      });
    } catch (error) {
      console.error('回测失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-4">回测</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">开始日期</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">结束日期</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">时间周期</label>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="1h">1小时</option>
          <option value="4h">4小时</option>
        </select>
      </div>
      <button
        onClick={runBacktest}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
      >
        {loading ? '回测中...' : '开始回测'}
      </button>

      {result && (
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-4">回测结果</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">总收益</div>
              <div className={`text-lg font-medium ${result.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${result.totalPnl.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">胜率</div>
              <div className="text-lg font-medium text-gray-900">{result.winRate.toFixed(2)}%</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">交易次数</div>
              <div className="text-lg font-medium text-gray-900">{result.totalTrades}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">平均收益</div>
              <div className={`text-lg font-medium ${result.avgPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${result.avgPnl.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">最大回撤</div>
              <div className="text-lg font-medium text-red-600">{result.maxDrawdown.toFixed(2)}%</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">夏普比率</div>
              <div className="text-lg font-medium text-gray-900">{result.sharpeRatio.toFixed(2)}</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-medium mb-4">交易记录</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      入场价格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      出场价格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      收益
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      收益率
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.trades.map((trade, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          trade.type === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.type === 'LONG' ? '做多' : '做空'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${trade.entryPrice.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${trade.exitPrice.toFixed(4)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${trade.pnl.toFixed(4)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        trade.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trade.pnlPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 