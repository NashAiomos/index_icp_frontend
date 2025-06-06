import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import SearchModal from './SearchModal';

interface HeaderProps {
  onSearch?: (query: string) => void;
  isDark?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isDark }) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false);
  };

  return (
    <>
      <header className={`${isDark ? 'bg-dark-bg border-dark-border' : 'border-gray-200'}`}>
        <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-12 py-2 sm:py-3 lg:py-4">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="cursor-pointer no-preload">
                <img 
                  src="/logo.svg" 
                  alt="Vly Explorer" 
                  style={{ height: '4.3rem' }} 
                  className="w-auto hover:opacity-70 transition-opacity sm:h-24 md:h-28 lg:h-32 xl:h-36" 
                />
              </Link>
            </div>

            {/* Search Bar - 点击打开模态框 */}
            <div className="max-w-xl w-full md:w-96">
              <div 
                className="relative cursor-pointer"
                onClick={handleSearchClick}
              >
                <div
                  className={`w-full ${isDark
                      ? 'bg-dark-card border-dark-border text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                    } border rounded-lg py-2.5 px-4 pl-10 focus:outline-none focus:border-primary-blue transition-colors hover:border-primary-blue cursor-pointer select-none`}
                >
                  <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className="hidden sm:inline">Search addresses or transaction index...</span>
                    <span className="inline sm:hidden">Search...</span>
                  </span>
                </div>
                <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'
                  } text-lg pointer-events-none`} />
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 搜索模态框 */}
      <SearchModal 
        isOpen={isSearchModalOpen}
        onClose={handleCloseSearchModal}
        isDark={isDark}
      />
    </>
  );
};

export default Header; 