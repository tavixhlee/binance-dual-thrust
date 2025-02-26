'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { createChart } from 'lightweight-charts';

interface KlineData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface DualThrustProps {
  symbol: string;
  k1: number;
  k2: number;
}

type BinanceKlineData = [
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

export default function DualThrust({ symbol, k1 = 0.5, k2 = 0.5 }: DualThrustProps) {
  const [klines, setKlines] = useState<KlineData[]>([]);
  const [buySignal, setBuySignal] = useState<number | null>(null);
  const [sellSignal, setSellSignal] = useState<number | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchKlines = async () => {
      try {
        const response = await axios.get<BinanceKlineData[]>(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`
        );
        
        const formattedKlines = response.data.map((kline) => ({
          time: new Date(kline[0]).toISOString(),
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4])
        }));

        setKlines(formattedKlines);
        calculateSignals(formattedKlines);
      } catch (error) {
        console.error('获取K线数据失败:', error);
      }
    };

    const calculateSignals = (klineData: KlineData[]) => {
      if (klineData.length < 2) return;

      const lastKline = klineData[klineData.length - 1];
      const prevKlines = klineData.slice(-24, -1); // 使用前23根K线

      const hh = Math.max(...prevKlines.map(k => k.high));
      const ll = Math.min(...prevKlines.map(k => k.low));
      const hc = Math.max(...prevKlines.map(k => k.close));
      const lc = Math.min(...prevKlines.map(k => k.close));

      const range = Math.max(hh - lc, hc - ll);
      
      const buyLine = lastKline.open + k1 * range;
      const sellLine = lastKline.open - k2 * range;

      setBuySignal(buyLine);
      setSellSignal(sellLine);
      setCurrentPrice(lastKline.close);
    };

    fetchKlines();
    const interval = setInterval(fetchKlines, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, [symbol, k1, k2]);

  useEffect(() => {
    const chartElement = document.getElementById('chart');
    if (!chartElement || klines.length === 0) return;

    const chart = createChart(chartElement, {
      width: chartElement.clientWidth,
      height: 300,
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#333',
      },
      grid: {
        vertLines: {
          color: '#f0f0f0',
        },
        horzLines: {
          color: '#f0f0f0',
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#4CAF50',
      downColor: '#FF5252',
      borderVisible: false,
      wickUpColor: '#4CAF50',
      wickDownColor: '#FF5252',
    });

    candleSeries.setData(klines);

    if (buySignal !== null) {
      const buyLine = chart.addLineSeries({
        color: '#4CAF50',
        lineWidth: 2,
      });
      buyLine.setData(
        klines.map(k => ({
          time: k.time,
          value: buySignal,
        }))
      );
    }

    if (sellSignal !== null) {
      const sellLine = chart.addLineSeries({
        color: '#FF5252',
        lineWidth: 2,
      });
      sellLine.setData(
        klines.map(k => ({
          time: k.time,
          value: sellSignal,
        }))
      );
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({
        width: chartElement.clientWidth,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [klines, buySignal, sellSignal]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-4">{symbol} Dual Thrust 信号</h3>
      <div id="chart" className="mb-4 w-full"></div>
      {currentPrice && buySignal && sellSignal && (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-gray-600">
            当前价格: <span className="font-medium">${currentPrice.toFixed(4)}</span>
          </div>
          <div className="text-green-600">
            买入信号: <span className="font-medium">${buySignal.toFixed(4)}</span>
          </div>
          <div className="text-red-600">
            卖出信号: <span className="font-medium">${sellSignal.toFixed(4)}</span>
          </div>
        </div>
      )}
    </div>
  );
} 