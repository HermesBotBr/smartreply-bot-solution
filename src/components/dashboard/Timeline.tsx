
import React from 'react';

interface TimelineProps {
  status: string;
}

const Timeline: React.FC<TimelineProps> = ({ status }) => {
  const timelineSteps = [
    { label: "Em preparação" },
    { label: "Em Trânsito" },
    { label: "Entregue" },
  ];

  let currentStep = -1;
  if (status === "ready_to_ship") {
    currentStep = 0;
  } else if (status === "shipped") {
    currentStep = 1;
  } else if (status === "delivered") {
    currentStep = 2;
  }

  return (
    <div className="flex flex-col space-y-2">
      {timelineSteps.map((step, index) => {
        const isActive = index <= currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border ${isActive ? 'bg-blue-500 border-blue-500' : 'bg-gray-300 border-gray-400'} ${isCurrent ? 'w-5 h-5' : ''}`}></div>
              {index < timelineSteps.length - 1 && (
                <div className={`w-0.5 h-8 ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              )}
            </div>
            <span className={`ml-3 ${isCurrent ? 'font-bold' : ''}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
