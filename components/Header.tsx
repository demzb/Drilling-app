import React from 'react';

interface HeaderProps {
  currentPage: string;
  toggleSidebar: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, toggleSidebar, onLogout }) => {
  return (
    <header className="flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex-shrink-0">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-gray-800 ml-4 lg:ml-0">{currentPage}</h2>
      </div>
      <div className="flex items-center">
        <button 
          onClick={onLogout}
          className="flex items-center text-sm font-medium text-gray-600 hover:text-red-600 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;