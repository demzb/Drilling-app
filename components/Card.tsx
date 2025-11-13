import React from 'react';

interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative';
}

const Card: React.FC<CardProps> = ({ title, value, icon, change, changeType }) => {
  const changeColor = changeType === 'positive' ? 'text-green-500' : 'text-red-500';
  const changeIcon = changeType === 'positive' ? '▲' : '▼';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex items-start">
      <div className="bg-blue-100 text-blue-500 p-3 rounded-full mr-4">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {change && (
          <p className={`text-xs mt-2 flex items-center ${changeColor}`}>
            <span className="mr-1">{changeIcon}</span>
            {change} vs last month
          </p>
        )}
      </div>
    </div>
  );
};

export default Card;
