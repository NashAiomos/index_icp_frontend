import React from 'react';
import { useNavigate } from 'react-router-dom';
import RollingNumber from './RollingNumber';
import { Token } from '../types';
import { formatTokenAmount } from '../utils/format';

interface TokenCardProps {
  token: Token & { 
    totalSupply?: string; 
    txCount?: number; 
    accountCount?: number; 
    transactions24h?: number;
  };
  isDark?: boolean;
}

const TokenCard: React.FC<TokenCardProps> = ({
  token,
  isDark = false
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // 简化导航，不再传递数据
    navigate(`/token/${token.symbol}`);
  };

  // 根据symbol获取对应的logo路径
  const getLogoPath = (symbol: string) => {
    if (symbol === 'LIKE') {
      return '/logo_like.svg';
    } else if (symbol === 'vUSD' || symbol === 'VUSD') {
      return '/logo_vusd.svg';
    }
    return '/logo.svg'; // 默认logo
  };

  // 格式化总供应量，考虑代币小数位数
  const formattedTotalSupply = token.totalSupply
    ? formatTokenAmount(token.totalSupply, token.decimals)
    : '0';

  return (
    <div 
      onClick={handleClick}
      className={`${
        isDark 
          ? 'bg-dark-card border-dark-border' 
          : 'bg-white border-gray-200 shadow-sm'
      } border rounded-lg responsive-card-padding p-3 sm:p-4 lg:p-6 hover:border-gray-400 transition-colors cursor-pointer`}>
      <div className="flex items-center mb-3 sm:mb-4 lg:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center">
          <img 
            src={getLogoPath(token.symbol)} 
            alt={`${token.symbol} Logo`} 
            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain"
          />
        </div>
        <div className="ml-2 sm:ml-3 lg:ml-4">
          <h3 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{token.symbol}</h3>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{token.name}</p>
        </div>
      </div>

      {/* 响应式布局的统计数据 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        <div className="text-center sm:text-left">
          <p className={`responsive-text-sm text-xs sm:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Transactions</p>
          <p className={`responsive-text-base text-sm sm:text-base lg:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} break-all`}>
            <RollingNumber value={token.txCount?.toString() || ''} />
          </p>
        </div>
        <div className="text-center sm:text-left">
          <p className={`responsive-text-sm text-xs sm:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Supply</p>
          <p className={`responsive-text-base text-sm sm:text-base lg:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} break-all`}>
            <RollingNumber value={formattedTotalSupply} />
          </p>
        </div>
        <div className="text-center sm:text-left">
          <p className={`responsive-text-sm text-xs sm:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Holding Accounts</p>
          <p className={`responsive-text-base text-sm sm:text-base lg:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} break-all`}>
            <RollingNumber value={token.accountCount?.toString() || ''} />
          </p>
        </div>
      </div>
    </div>
  );
};

export default TokenCard; 