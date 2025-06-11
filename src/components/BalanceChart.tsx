import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BalanceHistory } from '../types';
import { formatNumber } from '../utils/format';
import { ApiService } from '../services/api';

interface BalanceChartProps {
  tokenSymbol: 'LIKE' | 'VUSD';
  address: string;
  isDark: boolean;
  decimals?: number;
  className?: string;
}

type TimeRange = '1d' | '7d' | '1m' | '6m' | '1y' | 'all';

interface ChartDataPoint {
  timestamp: number;
  balance: number;
  date: string;
  formattedBalance: string;
}

const BalanceChart: React.FC<BalanceChartProps> = ({
  tokenSymbol,
  address,
  isDark,
  decimals: propDecimals,
  className = ''
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('7d');
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const timeRangeConfig = {
    '1d': { label: '1D', days: 1 },
    '7d': { label: '7D', days: 7 },
    '1m': { label: '1M', days: 30 },
    '6m': { label: '6M', days: 180 },
    '1y': { label: '1Y', days: 365 },
    'all': { label: 'All', days: Infinity }
  };

  useEffect(() => {
    const fetchBalanceHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const stats = await ApiService.getBalanceStats(address, tokenSymbol);
        setTotalRecords(stats.total_records);

        if (stats.total_records === 0) {
          setBalanceHistory([]);
          setLoading(false);
          return;
        }

        // 获取当前时间戳（毫秒）
        const nowMs = Date.now();
        
        const options: any = {
          token: tokenSymbol,
          sort: 'asc'
        };

        if (selectedTimeRange === 'all') {
          // 对于All模式，不设置时间范围，获取所有数据
          options.limit = Math.min(stats.total_records, 10000);
          // 不设置start_time和end_time，让API返回所有数据

        } else {
          const daysAgo = timeRangeConfig[selectedTimeRange].days;
          
          // 对于1年，使用更精确的计算
          let startTimeMs;
          if (selectedTimeRange === '1y') {
            // 精确到一年前的今天
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            startTimeMs = oneYearAgo.getTime();
          } else {
            startTimeMs = nowMs - (daysAgo * 24 * 60 * 60 * 1000);
          }
          
          options.start_time = startTimeMs * 1e6; // 转换为纳秒
          options.end_time = nowMs * 1e6; // 转换为纳秒
          options.limit = 10000;

        }

        let allHistory: BalanceHistory[] = [];
        let skip = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await ApiService.getBalanceHistory(address, {
            ...options,
            skip
          });

          if (response.history.length > 0) {
            allHistory = [...allHistory, ...response.history];
            skip += response.history.length;

            // 对于All和1Y，获取更多数据
            const maxRecords = (selectedTimeRange === 'all' || selectedTimeRange === '1y') ? 
              stats.total_records : 50000;

            if (response.history.length < (options.limit || 10000)) {
              hasMore = false;
            }

            // 检查是否已经到达开始时间（仅适用于有时间范围的情况）
            if (options.start_time && selectedTimeRange !== 'all') {
              const earliestRecord = response.history[0];
              if (earliestRecord.timestamp <= options.start_time) {
                hasMore = false;
              }
            }

            if (allHistory.length >= maxRecords) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
                
        // 过滤时间范围内的记录（除了All模式）
        if (options.start_time && options.end_time && selectedTimeRange !== 'all') {
          allHistory = allHistory.filter(record => 
            record.timestamp >= options.start_time && record.timestamp <= options.end_time
          );
        }

        setBalanceHistory(allHistory);
      } catch (err) {
        console.error('Failed to fetch balance history:', err);
        setError('Failed to load balance history');
        setBalanceHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, tokenSymbol, selectedTimeRange]);

  const chartData = useMemo(() => {
    if (balanceHistory.length === 0) return [];

    const decimals = propDecimals || balanceHistory[0]?.decimals || 6;
    const dataPoints: ChartDataPoint[] = [];
    
    balanceHistory.forEach((record) => {
      const balance = parseFloat(record.balance_after) / Math.pow(10, decimals);
      // record.timestamp是纳秒，转换为毫秒
      const timestamp = record.timestamp / 1e6;

      dataPoints.push({
        timestamp,
        balance: Math.max(0, balance),
        date: new Date(timestamp).toLocaleDateString('en-US'),
        formattedBalance: formatNumber(Math.max(0, balance))
      });
    });

    const maxPoints = {
      '1d': 288,
      '7d': 336,
      '1m': 720,
      '6m': 360,
      '1y': 365,
      'all': 500
    };
    
    const targetPoints = maxPoints[selectedTimeRange] || 500;
    
    if (dataPoints.length > targetPoints) {
      const samplingInterval = Math.floor(dataPoints.length / targetPoints);
      const sampled: ChartDataPoint[] = [];
      
      sampled.push(dataPoints[0]);

      for (let i = samplingInterval; i < dataPoints.length - 1; i += samplingInterval) {
        sampled.push(dataPoints[i]);
      }

      sampled.push(dataPoints[dataPoints.length - 1]);

      return sampled;
    }

    return dataPoints;
  }, [balanceHistory, selectedTimeRange, propDecimals]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className={`${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        } border rounded-lg p-3 shadow-lg`}>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
            {new Date(data.timestamp).toLocaleString('en-US')}
          </p>
          <p className={`${
            tokenSymbol === 'LIKE' ? 'text-blue-500' : 'text-purple-500'
          } font-semibold text-lg`}>
            {data.formattedBalance} {tokenSymbol}
                </p>
        </div>
      );
    }
    return null;
  };



  const chartColor = tokenSymbol === 'LIKE' ? '#3B82F6' : '#8B5CF6';

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {Object.entries(timeRangeConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedTimeRange(key as TimeRange)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedTimeRange === key
                  ? tokenSymbol === 'LIKE' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-purple-500 text-white'
                  : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {config.label}
            </button>
          ))}
        </div>
        
        {!loading && totalRecords > 0 && (
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {selectedTimeRange === 'all' 
              ? `Total ${totalRecords.toLocaleString()} records`
              : `Showing ${chartData.length} data points`}
          </div>
        )}
      </div>

      <div className="h-64">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                Loading balance history...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                No {tokenSymbol} balance history available
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tick={false}
                axisLine={true}
                tickLine={false}
                stroke={isDark ? '#9CA3AF' : '#6B7280'}
              />
              <YAxis
                tickFormatter={(value) => formatNumber(value)}
                stroke={isDark ? '#9CA3AF' : '#6B7280'}
                fontSize={11}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="balance"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: chartColor, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default BalanceChart; 
