import React from 'react';

interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
}

const Card: React.FC<CardProps> = ({ title, value, icon, change, changeType, color = 'blue' }) => {
  const changeColor = changeType === 'positive' ? 'text-green-500' : 'text-red-500';
  const changeIcon = changeType === 'positive' ? '▲' : '▼';

  const colorStyles = {
    blue: {
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-500',
      border: 'border-blue-300',
    },
    green: {
      iconBg: 'bg-green-100',
      iconText: 'text-green-500',
      border: 'border-green-300',
    },
    red: {
      iconBg: 'bg-red-100',
      iconText: 'text-red-500',
      border: 'border-red-300',
    },
    yellow: {
      iconBg: 'bg-yellow-100',
      iconText: 'text-yellow-500',
      border: 'border-yellow-300',
    },
    purple: {
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-500',
      border: 'border-purple-300',
    },
    orange: {
        iconBg: 'bg-orange-100',
        iconText: 'text-orange-500',
        border: 'border-orange-300',
    },
  };

  const styles = colorStyles[color];

  return (
    <div className={`bg-white p-6 rounded-lg shadow-xl border-t border-l border-gray-50 border-b-4 border-r-4 ${styles.border} hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex items-start`}>
      <div className={`${styles.iconBg} ${styles.iconText} p-3 rounded-full mr-4`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {change && (
          <p className={`text-xs mt-2 flex items-center ${changeColor}`}>
            <span className="mr-1">{changeIcon}</span>
            {change} vs previous period
          </p>
        )}
      </div>
    </div>
  );
};

export default Card;