import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import TokenCard from '../components/TokenCard';
import TransactionTable from '../components/TransactionTable';
import BackToTopButton from '../components/BackToTopButton';
import { ApiService } from '../services/api';
import { useTheme } from '../hooks/useTheme';
import { useAutoRefreshTransactions } from '../hooks/useAutoRefreshTransactions';
import { useGlobalCache } from '../contexts/GlobalCacheContext';

const HomePage: React.FC = () => {
  const { data: cacheData, isLoading: cacheLoading } = useGlobalCache();
  const [error, setError] = useState<string | null>(null);
  const isDark = useTheme();

  // 显示的交易数量
  const DISPLAY_TRANSACTIONS = 20;

  // 使用自动刷新 hook
  const { 
    transactions, 
    setTransactions, 
    setHeaderRef, 
    clearNewFlags 
  } = useAutoRefreshTransactions({
    fetchFunction: async () => {
      // 获取所有代币的最新交易
      const result = await ApiService.getAllTokensLatestTransactions(DISPLAY_TRANSACTIONS);
      return result.transactions;
    },
    interval: 20000, // 20秒
    enabled: true
  });

  // 根据主题设置 body 的 class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // 初始加载交易
  useEffect(() => {
    const fetchInitialTransactions = async () => {
      try {
        const result = await ApiService.getAllTokensLatestTransactions(DISPLAY_TRANSACTIONS);
        setTransactions(result.transactions);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError('Failed to load transactions');
      }
    };

    fetchInitialTransactions();
  }, [setTransactions]);

  // 清除新交易标记（当用户滚动或点击时）
  useEffect(() => {
    const handleInteraction = () => {
      clearNewFlags();
    };

    window.addEventListener('scroll', handleInteraction);
    window.addEventListener('click', handleInteraction);

    return () => {
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [clearNewFlags]);

  // 创建代币映射表
  const tokenMap: { [key: string]: { symbol: string; decimals: number } } = {};
  cacheData.tokens.forEach(token => {
    tokenMap[token.symbol] = { symbol: token.symbol, decimals: token.decimals };
  });

  // 从全局缓存获取代币统计数据
  const likeStats = cacheData.tokenStats.LIKE;
  const vusdStats = cacheData.tokenStats.VUSD;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}>
      <Header isDark={isDark} />
      
      <main className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-12" style={{ paddingTop: '0.5rem', paddingBottom: '1rem' }}>
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Token Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          {/* LIKE Token Card */}
          {likeStats && cacheData.tokens.find(t => t.symbol === 'LIKE') && (
            <TokenCard
              token={{
                ...cacheData.tokens.find(t => t.symbol === 'LIKE')!,
                totalSupply: likeStats.totalSupply,
                txCount: parseInt(likeStats.totalTransactionCount),
                accountCount: likeStats.totalAddresses
              }}
              isDark={isDark}
            />
          )}
          
          {/* vUSD Token Card */}
          {vusdStats && cacheData.tokens.find(t => t.symbol === 'VUSD') && (
            <TokenCard
              token={{
                ...cacheData.tokens.find(t => t.symbol === 'VUSD')!,
                totalSupply: vusdStats.totalSupply,
                txCount: parseInt(vusdStats.totalTransactionCount),
                accountCount: vusdStats.totalAddresses
              }}
              isDark={isDark}
            />
          )}
        </div>

        {/* Loading state for cards */}
        {cacheLoading && (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
            {[1, 2].map(i => (
              <div key={i} className={`${
                isDark 
                  ? 'bg-dark-card border-dark-border' 
                  : 'bg-white border-gray-200 shadow-sm'
              } border rounded-lg p-6 animate-pulse`}>
                <div className="h-12 w-12 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Transactions Table */}
        {transactions.length === 0 && !cacheLoading ? (
          <div className={`${
            isDark 
              ? 'bg-dark-card border-dark-border' 
              : 'bg-white border-gray-200 shadow-sm'
          } border rounded-lg p-8 text-center`}>
            <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading transactions...</div>
          </div>
        ) : (
          <TransactionTable 
            transactions={transactions} 
            tokens={tokenMap} 
            isDark={isDark}
            headerRef={setHeaderRef}
          />
        )}
      </main>

      {/* 返回顶部按钮 */}
      <BackToTopButton threshold={300} isDark={isDark} />
    </div>
  );
};

export default HomePage; 