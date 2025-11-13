import React from 'react';

interface HeaderProps {
  currentPage: string;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, toggleSidebar }) => {
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
        <div className="relative">
          <img
            className="h-10 w-10 rounded-full object-cover"
            src="https://picsum.photos/id/237/100/100"
            alt="User avatar"
          />
           <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
        </div>
      </div>
    </header>
  );
};

export default Header;
