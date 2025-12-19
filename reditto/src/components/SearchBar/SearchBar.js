import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = ({ onSearch, placeholder = 'Search ReDitto', className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query.trim());
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Search results:', data); // Debug log
        setResults(data); // Backend returns { communities, users, posts } directly
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
      setShowDropdown(false);
    }
  };

  const handleCommunityClick = (communityName) => {
    navigate(`/r/${communityName}`);
    setShowDropdown(false);
    setQuery('');
  };

  const handleUserClick = (username) => {
    navigate(`/u/${username}`);
    setShowDropdown(false);
    setQuery('');
  };

  const handlePostClick = (post) => {
    navigate(`/r/${post.community.name}/posts/${post.id}`);
    setShowDropdown(false);
    setQuery('');
  };

  const hasResults = results && (results.communities?.length > 0 || results.users?.length > 0 || results.posts?.length > 0);

  return (
    <div className="search-bar-wrapper" ref={searchRef}>
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
            onFocus={() => query.trim() && hasResults && setShowDropdown(true)}
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => {
                setQuery('');
                setResults(null);
                setShowDropdown(false);
              }}
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

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div className="search-dropdown">
          {isLoading ? (
            <div className="search-dropdown-loading">Searching...</div>
          ) : hasResults ? (
            <>
              {/* Communities Section */}
              {results.communities?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">Communities</div>
                  {results.communities.map((community) => (
                    <div
                      key={community.id}
                      className="search-result-item"
                      onClick={() => handleCommunityClick(community.name)}
                    >
                      <img 
                        src={community.icon} 
                        alt={community.name}
                        className="search-result-icon"
                      />
                      <div className="search-result-content">
                        <div className="search-result-title">r/{community.name}</div>
                        <div className="search-result-meta">
                          {community.memberCount.toLocaleString()} members
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Users Section */}
              {results.users?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">Users</div>
                  {results.users.map((user) => (
                    <div
                      key={user.id}
                      className="search-result-item"
                      onClick={() => handleUserClick(user.username)}
                    >
                      <img 
                        src={user.avatar} 
                        alt={user.username}
                        className="search-result-avatar"
                      />
                      <div className="search-result-content">
                        <div className="search-result-title">u/{user.username}</div>
                        <div className="search-result-meta">
                          {user.karma.toLocaleString()} karma
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Posts Section */}
              {results.posts?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">Posts</div>
                  {results.posts.map((post) => (
                    <div
                      key={post.id}
                      className="search-result-item"
                      onClick={() => handlePostClick(post)}
                    >
                      <div className="search-result-content search-result-post">
                        <div className="search-result-title">{post.title}</div>
                        <div className="search-result-meta">
                          r/{post.community.name} • {post.voteCount} upvotes • {post.commentCount} comments
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="search-dropdown-empty">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
