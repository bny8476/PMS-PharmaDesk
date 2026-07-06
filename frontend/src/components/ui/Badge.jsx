import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

const variants = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['success', 'warning', 'danger', 'info', 'default']),
  className: PropTypes.string,
};
