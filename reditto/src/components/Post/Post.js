import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Post.css';

const Post = ({ post, user, isFollowing, onVote, onComment, onShare, onCopyLink, shareMenuOpen, onJoin, onSave }) => {
  const navigate = useNavigate();
  const [userVote, setUserVote] = useState(post.userVote || null); // null, 'upvote', or 'downvote'
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const optionsRef = useRef(null);

  // Debug logging
  console.log(`Post ${post.title.substring(0, 30)}... - isFollowing:`, isFollowing, 'community:', post.community.name);

  // Update userVote when post changes (e.g., after refresh)
  useEffect(() => {
    setUserVote(post.userVote || null);
  }, [post.userVote]);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setOptionsOpen(false);
      }
    };

    if (optionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [optionsOpen]);

  const handleUpvote = () => {
    if (!user) {
      // Don't update local state if user is not logged in
      if (onVote) {
        onVote(post.id, 'upvote');
      }
      return;
    }
    
    if (userVote === 'upvote') {
      // Remove upvote
      setUserVote(null);
      if (onVote) {
        onVote(post.id, 'unvote');
      }
    } else {
      // Add upvote (removes downvote if exists)
      setUserVote('upvote');
      if (onVote) {
        onVote(post.id, 'upvote');
      }
    }
  };

  const handleDownvote = () => {
    if (!user) {
      // Don't update local state if user is not logged in
      if (onVote) {
        onVote(post.id, 'downvote');
      }
      return;
    }
    
    if (userVote === 'downvote') {
      // Remove downvote
      setUserVote(null);
      if (onVote) {
        onVote(post.id, 'unvote');
      }
    } else {
      // Add downvote (removes upvote if exists)
      setUserVote('downvote');
      if (onVote) {
        onVote(post.id, 'downvote');
      }
    }
  };

  const handleCommentClick = () => {
    // Navigate to post page when clicking comments
    navigate(`/r/${post.community.name}/posts/${post.id}`, { state: { post, fromPath: window.location.pathname } });
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (onShare) {
      onShare(post.id);
    }
  };

  const handleJoinClick = () => {
    const newJoinedState = !isJoined;
    setIsJoined(newJoinedState);
    if (onJoin) {
      onJoin(post.community.name, newJoinedState, post.community.id);
    }
  };

  const handleSaveClick = () => {
    if (onSave) {
      onSave(post.id);
    }
    setOptionsOpen(false);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const posted = new Date(timestamp);
    const diffInSeconds = Math.floor((now - posted) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const calculateVoteScore = () => {
    // Return the actual vote score from the post
    // Don't add local state - the backend handles this
    return post.voteScore || 0;
  };

  const handlePostClick = (e) => {
    // Don't navigate if clicking on interactive elements
    if (
      e.target.closest('.vote-btn') ||
      e.target.closest('.post-action-btn') ||
      e.target.closest('.share-menu-container') ||
      e.target.closest('.post-join-btn') ||
      e.target.closest('.post-options') ||
      e.target.tagName === 'A'
    ) {
      return;
    }
    navigate(`/r/${post.community.name}/posts/${post.id}`, { state: { post, fromPath: window.location.pathname } });
  };

  return (
    <div className="post" onClick={handlePostClick} style={{ cursor: 'pointer' }}>
      {/* Post Header */}
      <div className="post-header">
        <div className="post-header-left">
          <Link to={`/r/${post.community.name}`} className="community-link" onClick={(e) => e.stopPropagation()}>
            <img 
              src={post.community.icon} 
              alt={post.community.name} 
              className="community-icon"
            />
            <span className="community-name">r/{post.community.name}</span>
          </Link>
          <span className="post-divider">•</span>
          <span className="post-time">{formatTimeAgo(post.createdAt)}</span>
        </div>

        {user && (
          <div className="post-header-right">
            {/* Join Button - only show if not already following */}
            {!isFollowing && (
              <button 
                className={`post-join-btn ${isJoined ? 'joined' : ''}`}
                onClick={handleJoinClick}
              >
                {isJoined ? 'Joined' : 'Join'}
              </button>
            )}

            {/* Options Menu */}
            <div className="post-options" ref={optionsRef}>
              <button 
                className="post-options-btn"
                onClick={() => setOptionsOpen(!optionsOpen)}
                aria-label="Post options"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="4" r="1.5" fill="currentColor"/>
                  <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                  <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
                </svg>
              </button>

              {/* Options Dropdown */}
              {optionsOpen && (
                <div className="post-options-dropdown">
                  <button className="post-options-item" onClick={handleSaveClick}>
                    <svg width="18" height="18" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 2a2 2 0 00-2 2v14l7-4 7 4V4a2 2 0 00-2-2H5z" fill="currentColor"/>
                    </svg>
                    <span>Save post</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Post Title */}
      <h2 className="post-title">{post.title}</h2>

      {/* Post Content */}
      {post.type === 'text' && post.content && (
        <p className="post-content">{post.content}</p>
      )}

      {post.type === 'image' && post.imageUrl && (
        <div className="post-image-container">
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="post-image"
          />
        </div>
      )}

      {/* Interaction Bar */}
      <div className="post-interactions">
        {/* Vote Section */}
        <div className="post-vote">
          <button 
            className={`vote-btn upvote ${userVote === 'upvote' ? 'active' : ''}`}
            onClick={handleUpvote}
            aria-label="Upvote"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12H8V20H16V12H20L12 4Z" fill="currentColor"/>
            </svg>
          </button>
          <span className="vote-score">{calculateVoteScore()}</span>
          <button 
            className={`vote-btn downvote ${userVote === 'downvote' ? 'active' : ''}`}
            onClick={handleDownvote}
            aria-label="Downvote"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 20L20 12H16V4H8V12H4L12 20Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {/* Comment Section */}
        <button className="post-action-btn" onClick={handleCommentClick}>
          <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l.917-3.917A6.75 6.75 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" fill="currentColor"/>
          </svg>
          <span>{post.commentCount || 0} Comments</span>
        </button>

        {/* Share Section */}
        <div className="share-menu-container">
          <button className="post-action-btn" onClick={handleShareClick}>
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 13.442c-.633 0-1.204.246-1.637.642l-5.938-3.463c.046-.204.075-.412.075-.621s-.029-.417-.075-.621l5.938-3.463a2.49 2.49 0 001.637.642c1.379 0 2.5-1.121 2.5-2.5S16.379 1.558 15 1.558s-2.5 1.121-2.5 2.5c0 .209.029.417.075.621l-5.938 3.463a2.49 2.49 0 00-1.637-.642c-1.379 0-2.5 1.121-2.5 2.5s1.121 2.5 2.5 2.5c.633 0 1.204-.246 1.637-.642l5.938 3.463c-.046.204-.075.412-.075.621 0 1.379 1.121 2.5 2.5 2.5s2.5-1.121 2.5-2.5-1.121-2.5-2.5-2.5z" fill="currentColor"/>
            </svg>
            <span>Share</span>
          </button>
          {shareMenuOpen && (
            <div className="share-menu">
              <button className="share-menu-item" onClick={() => onCopyLink && onCopyLink(post.id, post.community.name)}>
                <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.586 2.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" fill="currentColor"/>
                </svg>
                <span>Copy link</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Post;
