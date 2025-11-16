import React from 'react';
import BusinessFlowchart from './BusinessFlowchart';

interface FlowchartPageProps {
  setActivePage: (page: string) => void;
}

const FlowchartPage: React.FC<FlowchartPageProps> = ({ setActivePage }) => {
  return (
    <div className="space-y-6">
      <BusinessFlowchart setActivePage={setActivePage} />
    </div>
  );
};

export default FlowchartPage;
