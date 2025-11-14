import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside className={`fixed lg:relative inset-y-0 left-0 bg-gray-800 text-white w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out z-40 flex flex-col`}>
        <div className="flex items-center justify-center h-20 border-b border-gray-700 flex-shrink-0">
          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h1 className="text-2xl font-bold ml-3">DrillSoft</h1>
        </div>
        <nav className="flex-grow mt-5">
          <ul>
            {NAVIGATION_ITEMS.map((item) => (
              <li key={item.name} className="px-4 mb-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActivePage(item.name);
                    setIsOpen(false);
                  }}
                  className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                    activePage === item.name
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="ml-4 text-md font-medium">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <div className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Borehole Inc.
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;