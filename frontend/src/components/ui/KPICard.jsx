import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

export default function KPICard({ title, value, subtext, icon: Icon, trend, className }) {
  return (
    <div className={cn("bg-white p-6 rounded-2xl shadow-sm border border-gray-100", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {subtext && (
            <p className={cn(
              "text-xs mt-2 font-medium flex items-center gap-1",
              trend === 'up' ? "text-green-600" : trend === 'down' ? "text-red-600" : "text-gray-500"
            )}>
              {subtext}
            </p>
          )}
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtext: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  className: PropTypes.string
};
