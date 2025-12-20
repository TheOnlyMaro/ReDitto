import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Loading from '../Loading/Loading';
import './Comment.css';

const MAX_NESTING_LEVEL = 5;
const INITIAL_REPLIES_SHOWN = 3;

// Utility function to fetch comment by ID from the data structure
const fetchCommentById = (commentId, allComments) => {
  return allComments.find(c => c.id === commentId || c._id === commentId);
};

const Comment = ({ comment, depth = 0, allComments = [], onFetchReplies, onReplySubmit, onVote, user, postId, onCopyLink }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Use comment.userVote and comment.voteScore directly from props
  // Parent (PostPage) handles vote state management

  // Function to load unfetched replies
  const handleLoadReplies = async () => {
    if (!comment.replies || comment.replies.length === 0 || !onFetchReplies) {
      return;
    }
    
    setIsLoadingReplies(true);
    try {
      // Fetch all replies for this comment
      await onFetchReplies(comment.replies, depth + 1);
      //setRepliesExpanded(true);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim() || !onReplySubmit) {
      return;
    }
    
    setIsSubmittingReply(true);
    try {
      await onReplySubmit(comment.id || comment._id, replyText);
      setReplyText('');
      setReplyOpen(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
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

  const formatVoteScore = (score) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score;
  };

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleUpvote = () => {
    if (!user) {
      return;
    }
    
    const commentId = comment.id || comment._id;
    
    if (comment.userVote === 'upvote') {
      // Remove upvote
      if (onVote) {
        onVote(commentId, 'unvote');
      }
    } else {
      // Add upvote (removes downvote if exists)
      if (onVote) {
        onVote(commentId, 'upvote');
      }
    }
  };

  const handleDownvote = () => {
    if (!user) {
      return;
    }
    
    const commentId = comment.id || comment._id;
    
    if (comment.userVote === 'downvote') {
      // Remove downvote
      if (onVote) {
        onVote(commentId, 'unvote');
      }
    } else {
      // Add downvote (removes upvote if exists)
      if (onVote) {
        onVote(commentId, 'downvote');
      }
    }
  };

  const hasReplies = comment.replies && comment.replies.length > 0;
  
  // Get actual reply objects from allComments array
  const replyObjects = hasReplies 
    ? comment.replies.map(replyId => fetchCommentById(replyId, allComments)).filter(r => r !== undefined)
    : [];
  
  const hiddenRepliesCount = replyObjects.length > 0 && !showAllReplies ? Math.max(0, replyObjects.length - INITIAL_REPLIES_SHOWN) : 0;
  const visibleReplies = replyObjects.length > 0 && !showAllReplies ? replyObjects.slice(0, INITIAL_REPLIES_SHOWN) : replyObjects;

  // Check if we've reached max nesting depth
  const atMaxDepth = depth >= MAX_NESTING_LEVEL;

  // Check if comment is deleted
  const isDeleted = comment.flags?.isDeleted || comment.content === '[deleted]';
  const displayAuthor = isDeleted ? '[deleted]' : (comment.author || '[deleted]');
  const displayContent = isDeleted ? '[deleted]' : comment.content;

  // Generate avatar URL - using DiceBear API for consistent avatars
  const avatarUrl = isDeleted ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=deleted' : (comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`);

  return (
    <div className={`comment ${isCollapsed ? 'comment-collapsed' : ''}`} style={{ marginLeft: depth > 0 ? '40px' : '0' }}>
      <div className="comment-main">
        {/* Left side: Avatar and collapse line */}
        <div className="comment-left">
          <Link to={isDeleted ? '#' : `/u/${comment.author}`} className="comment-avatar-link" onClick={(e) => isDeleted && e.preventDefault()}>
            <img src={avatarUrl} alt={displayAuthor} className="comment-avatar" />
          </Link>
          <div className="comment-collapse-controls">
            <div className="comment-collapse-line" onClick={handleCollapse}></div>
            <button className="comment-collapse-btn" onClick={handleCollapse} aria-label={isCollapsed ? 'Expand' : 'Collapse'}>
              {isCollapsed ? '+' : '−'}
            </button>
          </div>
        </div>

        {/* Right side: Content */}
        <div className="comment-content-wrapper">
          {/* Comment Header */}
          <div className="comment-header">
            <Link to={isDeleted ? '#' : `/u/${comment.author}`} className="comment-author" onClick={(e) => isDeleted && e.preventDefault()}>
              {isDeleted ? '[deleted]' : `u/${displayAuthor}`}
            </Link>
            <span className="comment-divider">•</span>
            <span className="comment-time">{formatTimeAgo(comment.createdAt)}</span>
            {isCollapsed && hasReplies && (
              <span className="comment-reply-count">({comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'})</span>
            )}
          </div>

          {/* Comment Content - Hidden when collapsed */}
          {!isCollapsed && (
            <>
              <div className="comment-body">
                <p className="comment-text" style={{ fontStyle: isDeleted ? 'italic' : 'normal', color: isDeleted ? '#999' : 'inherit' }}>
                  {displayContent}
                </p>
              </div>

              {/* Comment Actions */}
              <div className="comment-actions">
                <div className="comment-vote">
                  <button 
                    className={`comment-vote-btn ${comment.userVote === 'upvote' ? 'upvoted' : ''}`}
                    onClick={handleUpvote}
                    aria-label="Upvote"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4L3 15H9V20H15V15H21L12 4Z" fill="currentColor"/>
                    </svg>
                  </button>
                  <span className="comment-vote-score">{formatVoteScore(comment.voteScore || 0)}</span>
                  <button 
                    className={`comment-vote-btn ${comment.userVote === 'downvote' ? 'downvoted' : ''}`}
                    onClick={handleDownvote}
                    aria-label="Downvote"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 20L21 9H15V4H9V9H3L12 20Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>

                <button 
                  className="comment-action-btn" 
                  disabled={isDeleted}
                  onClick={() => setReplyOpen(!replyOpen)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Reply</span>
                </button>

                <button className="comment-action-btn" onClick={() => {
                  const commentId = comment.id || comment._id;
                  if (onCopyLink) {
                    onCopyLink(commentId, postId);
                    return;
                  }

                  // Fallback: copy route to /r/comments/:commentId
                  const commentUrl = `${window.location.origin}/r/comments/${commentId}`;
                  navigator.clipboard.writeText(commentUrl).then(() => {
                    // Best-effort local feedback: use alert if available in global scope
                    try { window.dispatchEvent(new CustomEvent('appAlert', { detail: { type: 'success', message: 'Link copied to clipboard!' } })); } catch (e) {}
                  }).catch(err => {
                    console.error('Failed to copy comment link:', err);
                  });
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Share</span>
                </button>
              </div>

              {/* Reply Input Box */}
              {replyOpen && (
                <div className="comment-reply-input">
                  <div className="comment-input-header">
                    <span className="comment-as">Reply as <strong>{user?.username || 'Guest'}</strong></span>
                  </div>
                  <form onSubmit={handleReplySubmit}>
                    <textarea
                      className="comment-input-textarea"
                      placeholder={user ? "What are your thoughts?" : "Login to reply"}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={!user || isSubmittingReply}
                      rows={3}
                    />
                    <div className="comment-input-footer">
                      <button
                        type="button"
                        className="comment-cancel-btn"
                        onClick={() => {
                          setReplyOpen(false);
                          setReplyText('');
                        }}
                        disabled={isSubmittingReply}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="comment-submit-btn"
                        disabled={!user || !replyText.trim() || isSubmittingReply}
                      >
                        {isSubmittingReply ? 'Posting...' : 'Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {!isCollapsed && hasReplies && (
        <div className="comment-replies">
          {atMaxDepth ? (
            <div className="comment-continue-thread">
              <Link 
                to={`/r/comments/${comment.id || comment._id}`}
                className="continue-thread-link"
                state={{ comment: fetchCommentById(comment.id || comment._id, allComments), postId }}
              >
                Continue this thread →
              </Link>
            </div>
          ) : replyObjects.length === 0 ? (
            <div className="comment-lazy-load">
              {isLoadingReplies ? (
                <div className="comment-loading">
                  <Loading size="small" />
                  <span>Loading replies...</span>
                </div>
              ) : (
                <button 
                  className="load-replies-btn"
                  onClick={handleLoadReplies}
                >
                  Load {comment.replyCount || 0} {(comment.replyCount || 0) === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          ) : (
            <>
              {visibleReplies.map((reply) => (
                <Comment key={reply.id || reply._id} comment={reply} depth={depth + 1} allComments={allComments} onFetchReplies={onFetchReplies} onVote={onVote} onReplySubmit={onReplySubmit} user={user} postId={postId} />
              ))}
              
              {hiddenRepliesCount > 0 && (
                <button 
                  className="show-more-replies-btn"
                  onClick={() => setShowAllReplies(true)}
                >
                  Show {hiddenRepliesCount} more {hiddenRepliesCount === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Comment;
