import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const FormInput = forwardRef(({ 
  label, 
  type = 'text', 
  error, 
  options = [], 
  className = '', 
  containerClassName = '',
  ...props 
}, ref) => {
  const baseClasses = `w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 bg-white font-bold transition-all disabled:bg-slate-50 disabled:text-slate-400 ${
    error 
      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' 
      : 'border-slate-200 focus:ring-primary/20 focus:border-primary'
  } ${className}`;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>}
      {type === 'select' ? (
        <select ref={ref} className={baseClasses} {...props}>
          {options.map((opt, i) => {
            const isObject = typeof opt === 'object' && opt !== null;
            const value = isObject ? opt.value : opt;
            const text = isObject ? opt.label : opt;
            return (
              <option key={i} value={value}>
                {text}
              </option>
            );
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea ref={ref} className={baseClasses} {...props} />
      ) : (
        <input ref={ref} type={type} className={baseClasses} {...props} />
      )}
      {error && <span className="text-[10px] text-red-500 font-bold px-1">{error}</span>}
    </div>
  );
});

FormInput.displayName = 'FormInput';

FormInput.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  error: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string
      })
    ])
  ),
  className: PropTypes.string,
  containerClassName: PropTypes.string
};

export default FormInput;
