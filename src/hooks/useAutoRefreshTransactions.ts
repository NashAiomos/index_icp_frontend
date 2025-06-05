import { useState, useEffect, useRef, useCallback } from 'react';
import { Transaction } from '../types';

interface UseAutoRefreshOptions {
  fetchFunction: () => Promise<Transaction[]>;
  interval?: number; // 刷新间隔，默认30秒
  enabled?: boolean; // 是否启用自动刷新
}

interface TransactionWithAnimation extends Transaction {
  isNew?: boolean;
  _tokenSymbol?: string;
}

export const useAutoRefreshTransactions = ({
  fetchFunction,
  interval = 30000, // 默认30秒
  enabled = true
}: UseAutoRefreshOptions) => {
  const [isVisible, setIsVisible] = useState(false);
  const [transactions, setTransactions] = useState<TransactionWithAnimation[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransactionIndexesRef = useRef<Set<string>>(new Set());
  const isRefreshingRef = useRef(false);

  // 生成交易的唯一标识符
  const getTransactionKey = useCallback((tx: Transaction & { _tokenSymbol?: string }) => {
    const tokenSymbol = tx._tokenSymbol || 'LIKE';
    return `${tx.index}-${tokenSymbol}`;
  }, []);

  // 对比并更新交易列表
  const updateTransactions = useCallback((newTransactions: TransactionWithAnimation[]) => {
    setTransactions(prevTransactions => {
      // 如果新交易列表为空，直接返回原数组
      if (newTransactions.length === 0) return prevTransactions;

      // 创建现有交易的映射
      const existingTxMap = new Map<string, TransactionWithAnimation>();
      prevTransactions.forEach(tx => {
        const key = getTransactionKey(tx);
        existingTxMap.set(key, tx);
      });

      // 找出真正的新交易（不在现有列表中的）
      const reallyNewTransactions: TransactionWithAnimation[] = [];
      newTransactions.forEach(tx => {
        const key = getTransactionKey(tx);
        if (!existingTxMap.has(key)) {
          // 这是一个新交易
          reallyNewTransactions.push({ ...tx, isNew: true });
          // 添加到已知交易索引
          lastTransactionIndexesRef.current.add(key);
        }
      });

      // 如果没有新交易，返回原数组
      if (reallyNewTransactions.length === 0) {
        return prevTransactions;
      }

      // 将新交易插入到列表顶部，保留所有旧交易
      const updatedTransactions = [...reallyNewTransactions, ...prevTransactions];

      // 对合并后的列表进行排序（按时间戳降序）
      updatedTransactions.sort((a, b) => b.timestamp - a.timestamp);

      // 去重（基于交易key）
      const uniqueTransactions = updatedTransactions.filter((tx, index, self) => {
        const key = getTransactionKey(tx);
        return index === self.findIndex(t => getTransactionKey(t) === key);
      });

      // 清理过大的索引集合（保留最近1000个）
      if (lastTransactionIndexesRef.current.size > 1000) {
        const indexes = Array.from(lastTransactionIndexesRef.current);
        lastTransactionIndexesRef.current = new Set(indexes.slice(-1000));
      }

      return uniqueTransactions;
    });
  }, [getTransactionKey]);

  // 刷新交易数据
  const refreshTransactions = useCallback(async () => {
    // 如果正在刷新中，跳过本次刷新
    if (isRefreshingRef.current || !isVisible || !enabled) return;

    isRefreshingRef.current = true;
    try {
      const newTransactions = await fetchFunction();
      updateTransactions(newTransactions);
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [isVisible, enabled, fetchFunction, updateTransactions]);

  // 设置 Intersection Observer 监听头部区域
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '50px', // 提前50px开始加载
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      const newIsVisible = entry.isIntersecting;
      
      // 只有状态真正改变时才更新
      setIsVisible(prev => {
        if (prev !== newIsVisible) {
          return newIsVisible;
        }
        return prev;
      });
    }, options);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // 设置定时刷新
  useEffect(() => {
    if (isVisible && enabled) {
      // 延迟100ms后开始第一次刷新，避免页面加载时的阻塞
      const initialTimeout = setTimeout(() => {
        refreshTransactions();
      }, 100);

      // 设置定时器
      intervalRef.current = setInterval(refreshTransactions, interval);

      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // 清除定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isVisible, enabled, interval, refreshTransactions]);

  // 设置头部引用
  const setHeaderRef = useCallback((element: HTMLDivElement | null) => {
    if (element) {
      headerRef.current = element;
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    } else if (headerRef.current && observerRef.current) {
      observerRef.current.unobserve(headerRef.current);
    }
  }, []);

  // 清除新交易标记
  const clearNewFlags = useCallback(() => {
    setTransactions(prev => {
      // 检查是否有需要清除的标记
      const hasNewFlags = prev.some(tx => tx.isNew);
      if (!hasNewFlags) return prev;
      
      // 只有当确实有新标记时才创建新数组
      return prev.map(tx => tx.isNew ? { ...tx, isNew: false } : tx);
    });
  }, []);

  return {
    transactions,
    setTransactions,
    setHeaderRef,
    isRefreshing: isVisible && enabled,
    clearNewFlags
  };
}; 