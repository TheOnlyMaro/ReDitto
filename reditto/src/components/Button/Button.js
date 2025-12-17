import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = ''
}) => {
  const buttonClass = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full-width' : ''} ${className}`.trim();

  return (
    <button 
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
