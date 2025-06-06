import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCopy, FiCheckCircle, FiArrowUpRight, FiArrowDownLeft, FiPlus, FiShield } from 'react-icons/fi';
import { HiFire } from 'react-icons/hi';
import Header from '../components/Header';
import { ApiService } from '../services/api';
import { Transaction, Token } from '../types';
import { formatDateTime, formatTokenAmount, accountToString } from '../utils/format';
import { useTheme } from '../hooks/useTheme';

const TransactionDetail: React.FC = () => {
  const { index } = useParams<{ index: string }>();
  const navigate = useNavigate();
  const isDark = useTheme();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 根据主题设置 body 的 class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const fetchTransactionDetail = async () => {
      if (!index) return;
      
      try {
        setLoading(true);
        // 获取所有支持的代币
        const tokens = await ApiService.getTokens();
        
        // 尝试从每个代币获取交易（因为我们不知道这个交易属于哪个代币）
        let txData: Transaction | null = null;
        let txToken: Token | null = null;
        
        for (const t of tokens) {
          try {
            const tx = await ApiService.getTransaction(parseInt(index), t.symbol);
            txData = tx;
            txToken = t;
            break;
          } catch (err) {
            // 继续尝试下一个代币
            continue;
          }
        }
        
        if (txData && txToken) {
          setTransaction(txData);
          setToken(txToken);
        } else {
          setError('Transaction not found');
        }
      } catch (err) {
        console.error('Failed to fetch transaction:', err);
        setError('Failed to load transaction details');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetail();
  }, [index]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getTransactionTypeInfo = (kind: string) => {
    switch (kind?.toLowerCase()) {
      case 'transfer':
        return {
          label: 'Transfer',
          icon: <FiArrowUpRight className="mr-1" />,
          bgColor: 'bg-blue-500/10',
          textColor: 'text-blue-500',
          borderColor: 'border-blue-500'
        };
      case 'mint':
        return {
          label: 'Mint',
          icon: <FiPlus className="mr-1" />,
          bgColor: 'bg-green-500/10',
          textColor: 'text-green-500',
          borderColor: 'border-green-500'
        };
      case 'burn':
        return {
          label: 'Burn',
          icon: <HiFire className="mr-1" />,
          bgColor: 'bg-red-500/10',
          textColor: 'text-red-500',
          borderColor: 'border-red-500'
        };
      case 'approve':
        return {
          label: 'Approve',
          icon: <FiShield className="mr-1" />,
          bgColor: 'bg-purple-500/10',
          textColor: 'text-purple-500',
          borderColor: 'border-purple-500'
        };
      default:
        return {
          label: 'Unknown',
          icon: <FiArrowDownLeft className="mr-1" />,
          bgColor: 'bg-gray-500/10',
          textColor: 'text-gray-500',
          borderColor: 'border-gray-500'
        };
    }
  };

  const handleAddressClick = (address: string) => {
    if (address && address !== 'Unknown') {
      navigate(`/address/${address}`);
    }
  };

  const renderCopyButton = (text: string, field: string) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className={`ml-2 ${
        isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
      } transition-colors cursor-pointer`}
    >
      {copiedField === field ? (
        <FiCheckCircle className="text-green-500" />
      ) : (
        <FiCopy className="text-sm" />
      )}
    </button>
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}>
        <Header isDark={isDark} />
        <div className="container mx-auto px-4 py-8">
          <div className={`${
            isDark 
              ? 'bg-dark-card border-dark-border' 
              : 'bg-white border-gray-200 shadow-sm'
          } border rounded-lg p-8 text-center`}>
            <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading transaction details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !transaction || !token) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}>
        <Header isDark={isDark} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
            {error || 'Transaction not found'}
          </div>
        </div>
      </div>
    );
  }

  // 根据交易类型提取正确的地址和金额信息
  const getTransactionData = () => {
    const kind = transaction.kind?.toLowerCase();
    
    switch (kind) {
      case 'transfer':
        if (transaction.transfer) {
          return {
            fromAddress: transaction.transfer.from ? accountToString(transaction.transfer.from) : 'Unknown',
            toAddress: transaction.transfer.to ? accountToString(transaction.transfer.to) : 'Unknown',
            amount: transaction.transfer.amount && transaction.transfer.amount.length > 0 ? transaction.transfer.amount[0] : '0',
            fee: transaction.transfer.fee && transaction.transfer.fee.length > 0 ? transaction.transfer.fee[0] : '0'
          };
        }
        break;
      
      case 'burn':
        if (transaction.burn) {
          return {
            fromAddress: transaction.burn.from ? accountToString(transaction.burn.from) : 'Unknown',
            toAddress: 'Burned',
            amount: transaction.burn.amount && transaction.burn.amount.length > 0 ? transaction.burn.amount[0] : '0',
            fee: '0'
          };
        }
        break;
      
      case 'approve':
        if (transaction.approve) {
          return {
            fromAddress: transaction.approve.from ? accountToString(transaction.approve.from) : 'Unknown',
            toAddress: transaction.approve.spender ? accountToString(transaction.approve.spender) : 'Unknown',
            amount: transaction.approve.amount && transaction.approve.amount.length > 0 ? transaction.approve.amount[0] : '0',
            fee: transaction.approve.fee && transaction.approve.fee.length > 0 ? transaction.approve.fee[0] : '0'
          };
        }
        break;
      
      case 'mint':
        if (transaction.mint) {
          return {
            fromAddress: 'Minted',
            toAddress: transaction.mint.to ? accountToString(transaction.mint.to) : 'Unknown',
            amount: transaction.mint.amount && transaction.mint.amount.length > 0 ? transaction.mint.amount[0] : '0',
            fee: '0'
          };
        }
        break;
    }
    
    // 向后兼容：处理旧格式
    return {
      fromAddress: transaction.from 
        ? (typeof transaction.from === 'string' ? transaction.from : accountToString(transaction.from))
        : 'Unknown',
      toAddress: transaction.to 
        ? (typeof transaction.to === 'string' ? transaction.to : accountToString(transaction.to))
        : (transaction.spender 
            ? (typeof transaction.spender === 'string' ? transaction.spender : accountToString(transaction.spender))
            : 'Unknown'),
      amount: transaction.amount || '0',
      fee: transaction.fee || '0'
    };
  };

  const { fromAddress, toAddress, amount: rawAmount, fee: rawFee } = getTransactionData();
  const amount = formatTokenAmount(rawAmount, token.decimals);
  const fee = formatTokenAmount(rawFee, token.decimals);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}>
      <Header isDark={isDark} />
      <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-12" style={{ paddingTop: '0.5rem', paddingBottom: '1rem' }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className={`flex items-center space-x-2 mb-6 ${
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          } transition-colors`}
        >
          <FiArrowLeft />
          <span>Back to Explorer</span>
        </button>

        {/* Transaction details card */}
        <div className={`${
          isDark 
            ? 'bg-dark-card border-dark-border' 
            : 'bg-white border-gray-200 shadow-sm'
        } border rounded-lg overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-dark-border' : 'border-gray-200'}`}>
            <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Transaction Details
            </h1>
          </div>

          <div className="p-6 space-y-4">
            {/* Transaction ID */}
            <div className="flex items-center justify-between">
              <span className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Transaction Index :</span>
              <div className="flex items-center">
                <span className={`font-mono font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {transaction.index}
                </span>
                {renderCopyButton(transaction.index.toString(), 'tx')}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status :</span>
              <span className="flex items-center text-green-500 font-bold">
                <FiCheckCircle className="mr-1" />
                Completed
              </span>
            </div>

            {/* Transaction Type */}
            <div className="flex items-center justify-between">
              <span className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Type: </span>
              <div className={`flex items-center px-3 py-1.5 rounded-full border ${getTransactionTypeInfo(transaction.kind).bgColor} ${getTransactionTypeInfo(transaction.kind).textColor} ${getTransactionTypeInfo(transaction.kind).borderColor} font-bold text-sm`}>
                {getTransactionTypeInfo(transaction.kind).icon}
                {getTransactionTypeInfo(transaction.kind).label}
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <span className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Timestamp :</span>
              <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {formatDateTime(transaction.timestamp)} UTC
              </span>
            </div>

            <div className={`border-t ${isDark ? 'border-dark-border' : 'border-gray-200'} pt-6 sm:pt-0`} />

            {/* From */}
            <div className="space-y-1 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center">
                <span className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>From :</span>
              </div>
              <div className="flex items-center">
                <span 
                  onClick={() => handleAddressClick(fromAddress)}
                  className={`font-mono font-bold text-primary-blue hover:underline cursor-pointer break-all text-sm sm:text-base`}
                >
                  {fromAddress}
                </span>
                {renderCopyButton(fromAddress, 'from')}
              </div>
            </div>

            {/* To */}
            <div className="space-y-1 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center">
                <span className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {transaction.kind === 'approve' ? 'Spender:' : 'To :'}
                </span>
              </div>
              <div className="flex items-center">
                <span 
                  onClick={() => handleAddressClick(toAddress)}
                  className={`font-mono font-bold text-primary-blue hover:underline cursor-pointer break-all text-sm sm:text-base`}
                >
                  {toAddress}
                </span>
                {renderCopyButton(toAddress, 'to')}
              </div>
            </div>

            <div className={`border-t ${isDark ? 'border-dark-border' : 'border-gray-200'} pt-6 sm:pt-0`} />

            {/* Amount */}
            <div className="flex items-center justify-between">
              <span className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Amount :</span>
              <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {amount} {token.symbol}
              </span>
            </div>

            {/* Fee */}
            <div className="flex items-center justify-between">
              <span className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Fee :</span>
              <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {fee} {token.symbol}
              </span>
            </div>

            {/* Memo */}
            <div className="flex items-center justify-between">
              <span className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Memo :</span>
              <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {transaction.memo || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail; 