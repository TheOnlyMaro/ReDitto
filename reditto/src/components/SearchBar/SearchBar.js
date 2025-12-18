import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch, placeholder = 'Search ReDitto', className = '' }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form className={`search-bar ${className}`} onSubmit={handleSubmit}>
      <div className="search-bar-container">
        <svg 
          className="search-icon" 
          width="20" 
          height="20" 
          viewBox="0 0 20 20" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M14.386 14.386l4.0877 4.0877-1.4142 1.4142-4.0877-4.0877c-1.4953 1.1685-3.3633 1.8638-5.3858 1.8638C3.5786 17.75 0 14.1714 0 9.875S3.5786 2 7.875 2s7.875 3.5786 7.875 7.875c0 2.0225-.6953 3.8905-1.8638 5.3858zm-1.4142-1.4142C13.9462 11.7606 14.75 10.4016 14.75 8.875c0-3.7279-3.0221-6.75-6.75-6.75s-6.75 3.0221-6.75 6.75 3.0221 6.75 6.75 6.75c1.5266 0 2.8856-.8038 4.0984-1.7778z" 
            fill="currentColor"
          />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm4 10.9L10.9 12 8 9.1 5.1 12 4 10.9 6.9 8 4 5.1 5.1 4 8 6.9 10.9 4 12 5.1 9.1 8 12 10.9z" 
                fill="currentColor"
              />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
