import React, { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, isDark }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<'like' | 'vusd'>('vusd');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // 当模态框打开时，自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 处理ESC键关闭模态框
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // 检测搜索查询类型
  const detectSearchType = (query: string): 'address' | 'transaction' | 'unknown' => {
    const trimmedQuery = query.trim();
    
    // 检测地址格式（ICP地址格式）
    if (trimmedQuery.includes('-') && trimmedQuery.length > 20) {
      return 'address';
    }
    
    // 检测交易索引（纯数字）
    if (/^\d+$/.test(trimmedQuery)) {
      return 'transaction';
    }
    
    return 'unknown';
  };

  // 处理搜索
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) {
      return;
    }

    setIsLoading(true);
    
    try {
      const searchType = detectSearchType(trimmedQuery);
      
      switch (searchType) {
        case 'address':
          navigate(`/address/${trimmedQuery}`);
          break;
        case 'transaction':
          // 确保代币参数正确转换为大写
          const tokenParam = selectedToken === 'like' ? 'LIKE' : 'VUSD';
          navigate(`/transaction/${trimmedQuery}?token=${tokenParam}`);
          break;
        default:
          // 未知类型，可以显示错误提示或尝试智能匹配
          console.log('未识别的搜索类型');
          break;
      }
      
      // 关闭模态框
      onClose();
      setSearchQuery('');
      // 保持代币选择状态，不重置
    } catch (error) {
      console.error('搜索错误:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 点击背景关闭模态框
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 获取搜索提示
  const getSearchHint = () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      return 'Enter an address or transaction index to search';
    }
    
    const searchType = detectSearchType(trimmedQuery);
    switch (searchType) {
      case 'address':
        return 'Address search';
      case 'transaction':
        return `Transaction index search (${selectedToken.toUpperCase()})`;
      default:
        return 'Please enter a valid address or transaction index';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-in-out ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* 背景遮罩 */}
      <div
        className={`absolute inset-0 transition-all duration-300 ease-in-out cursor-pointer ${
          isOpen ? 'bg-black bg-opacity-50 backdrop-blur-sm' : 'bg-transparent'
        }`}
        onClick={handleBackdropClick}
      />
      
      {/* 模态框内容 */}
      <div
        className={`relative w-full max-w-2xl mx-4 transition-all duration-300 ease-in-out transform ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        <div
          className={`${
            isDark
              ? 'bg-dark-card border-dark-border text-white'
              : 'bg-white border-gray-200 text-gray-900'
          } border rounded-2xl shadow-2xl overflow-hidden`}
        >
          {/* 头部 */}
          <div className={`px-6 py-4 border-b ${
            isDark ? 'border-dark-border' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-center">
              <h2 className="text-lg font-semibold">Search</h2>
            </div>
          </div>

          {/* 搜索表单 */}
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter address or transaction index..."
                  disabled={isLoading}
                  className={`w-full ${
                    isDark
                      ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  } border rounded-xl py-4 px-6 pl-14 pr-20 text-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all disabled:opacity-50`}
                />
                <FiSearch className={`absolute left-5 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                } text-xl`} />
                
                {/* 搜索按钮 */}
                <button
                  type="submit"
                  disabled={isLoading || !searchQuery.trim()}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                    isDark
                      ? 'bg-primary-blue hover:bg-blue-600 disabled:bg-gray-700'
                      : 'bg-primary-blue hover:bg-blue-600 disabled:bg-gray-300'
                  } text-white rounded-lg px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[60px]`}
                >
                  {isLoading ? (
                    <div className={`animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent`} />
                  ) : (
                    <FiSearch className="text-sm" />
                  )}
                </button>
              </div>
              
              {/* 代币选择按钮 */}
              {detectSearchType(searchQuery.trim()) === 'transaction' && (
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Select Token: 
                  </p>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setSelectedToken('vusd')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedToken === 'vusd'
                          ? 'bg-primary-blue text-white shadow-md'
                          : isDark
                          ? 'bg-dark-bg border border-dark-border text-gray-300 hover:text-white hover:border-gray-500'
                          : 'bg-gray-100 border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                      }`}
                    >
                      VUSD
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedToken('like')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedToken === 'like'
                          ? 'bg-primary-blue text-white shadow-md'
                          : isDark
                          ? 'bg-dark-bg border border-dark-border text-gray-300 hover:text-white hover:border-gray-500'
                          : 'bg-gray-100 border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                      }`}
                    >
                      LIKE
                    </button>
                  </div>
                </div>
              )}

              {/* 搜索提示 */}
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {getSearchHint()}
              </p>

              {/* 示例 */}
              <div className="space-y-2">
                <p className={`text-xs font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                } tracking-wider`}>
                  Search Examples:
                </p>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSearchQuery('hgqso-fkdrc-krtb4-qecaf-dcwux-ipzxz-5v7rd-lwu5o-knudt-2zn77-mae')}
                    className={`block text-sm ${
                      isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    } hover:underline transition-colors`}
                  >
                    • Address: hgqso-fkdrc-krtb4-qecaf-dcwux-ipzxz-5v7rd-lwu5o-knudt-2zn77-mae
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('201392')}
                    className={`block text-sm ${
                      isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    } hover:underline transition-colors`}
                  >
                    • Transaction Index: 201392 ( select token above )
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal; 