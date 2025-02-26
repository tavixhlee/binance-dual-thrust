# Binance Dual Thrust 策略监控

这是一个用于监控币安现货交易所中交易量大于1000万USDT的交易对的 Dual Thrust 策略信号的网页应用。

## 功能特点

- 实时显示交易量大于1000万USDT的交易对列表
- 使用 Dual Thrust 策略计算买卖信号
- 可视化K线图表显示
- 可调整策略参数（K1、K2）
- 自动更新数据（每分钟）

## 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS
- Lightweight Charts
- Binance API

## 本地开发

1. 克隆仓库：
```bash
git clone https://github.com/tavixhlee/binance-dual-thrust.git
cd binance-dual-thrust
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 打开浏览器访问 http://localhost:3000

## 部署

项目已配置为可以直接部署到 Vercel 平台。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tavixhlee/binance-dual-thrust)

## 关于 Dual Thrust 策略

Dual Thrust 是一个经典的趋势跟踪策略，其核心思想是通过计算上下轨来确定突破方向。策略的主要参数：

- K1：上轨参数，用于计算做多信号
- K2：下轨参数，用于计算做空信号

计算方法：
1. Range = Max(HH-LC, HC-LL)
   - HH = 前N根K线的最高价中的最高价
   - LC = 前N根K线的收盘价中的最低价
   - HC = 前N根K线的收盘价中的最高价
   - LL = 前N根K线的最低价中的最低价

2. 上轨 = 开盘价 + K1 × Range
3. 下轨 = 开盘价 - K2 × Range

## 许可证

MIT
