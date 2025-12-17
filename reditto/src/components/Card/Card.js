import React from 'react';
import './Card.css';

const Card = ({ children, className = '', padding = true, hover = false }) => {
  return (
    <div className={`card ${padding ? 'card-padding' : ''} ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
