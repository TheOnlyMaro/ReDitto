import React from 'react';
import { Link } from 'react-router-dom';
import logoSvg from '../../logo.svg';
import './Logo.css';

const Logo = ({ size = 'medium', className = '' }) => {
  return (
    <Link to="/" className={`logo logo-${size} ${className}`}>
      <img src={logoSvg} alt="ReDitto" className="logo-image" />
      <span className="logo-text">ReDitto</span>
    </Link>
  );
};

export default Logo;
