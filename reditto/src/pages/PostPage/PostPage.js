import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Loading from '../../components/Loading/Loading';
import Comment from '../../components/Comment/Comment';
import Alert from '../../components/Alert/Alert';
import './PostPage.css';

const PostPage = ({ user, onLogout, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState(null);
  const [alert, setAlert] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Fetch post data (always fetch to get fresh vote counts and data)
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/posts/${postId}`);
        
        if (!response.ok) {
          throw new Error('Post not found');
        }
        
        const data = await response.json();
        
        // Determine user's vote on this post
        let userVote = null;
        if (user) {
          const postIdString = data.post._id.toString();
          const upvotedPostIds = (user.upvotedPosts || []).map(id => id.toString());
          const downvotedPostIds = (user.downvotedPosts || []).map(id => id.toString());
          
          if (upvotedPostIds.includes(postIdString)) {
            userVote = 'upvote';
          } else if (downvotedPostIds.includes(postIdString)) {
            userVote = 'downvote';
          }
        }
        
        // Transform the post data to match expected format
        const transformedPost = {
          id: data.post._id,
          type: data.post.type,
          title: data.post.title,
          content: data.post.content,
          imageUrl: data.post.imageUrl,
          url: data.post.url,
          flair: data.post.flair,
          community: {
            id: data.post.community._id,
            name: data.post.community.name,
            icon: data.post.community.icon || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png'
          },
          author: {
            username: data.post.author.username,
            displayName: data.post.author.displayName,
            avatar: data.post.author.avatar
          },
          voteScore: data.post.voteCount,
          commentCount: data.post.commentCount,
          createdAt: new Date(data.post.createdAt),
          userVote: userVote
        };
        
        setPost(transformedPost);
        setUserVote(userVote);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch post:', error);
        setLoading(false);
        // Redirect to home if post not found
        navigate('/');
      }
    };

    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, navigate, user?.upvotedPosts, user?.downvotedPosts]);

  // Fetch comments for the post
  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) return;
      
      try {
        setCommentsLoading(true);
        const response = await fetch(`http://localhost:5000/api/comments/post/${postId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        
        const data = await response.json();
        setComments(data.comments || []);
        setCommentsLoading(false);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        setComments([]);
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  const handleSearch = (query) => {
    console.log('Search query:', query);
    // TODO: Implement search functionality
  };

  const handleBack = () => {
    if (location.state?.fromPath) {
      navigate(-1);
    } else {
      // If no previous location, redirect to community page
      navigate(`/r/${post.community.name}`);
    }
  };

  const handleVote = async (voteType) => {
    if (!user) {
      setAlert({
        type: 'warning',
        message: 'You must be logged in to vote'
      });
      return;
    }

    try {
      const token = localStorage.getItem('reditto_auth_token');
      let endpoint = '';
      
      if (voteType === 'upvote') {
        endpoint = `http://localhost:5000/api/posts/${postId}/upvote`;
      } else if (voteType === 'downvote') {
        endpoint = `http://localhost:5000/api/posts/${postId}/downvote`;
      } else if (voteType === 'unvote') {
        endpoint = `http://localhost:5000/api/posts/${postId}/vote`;
      }

      const method = voteType === 'unvote' ? 'DELETE' : 'POST';
      
      // Store previous state for rollback
      const previousVote = userVote;
      const previousScore = post.voteScore;
      
      // Optimistically update UI before API call
      const currentVote = userVote;
      let newVoteScore = post.voteScore;
      
      // Calculate new vote score based on vote changes
      if (voteType === 'unvote') {
        // Remove vote: decrease by 1 if upvoted, increase by 1 if downvoted
        if (currentVote === 'upvote') newVoteScore -= 1;
        else if (currentVote === 'downvote') newVoteScore += 1;
      } else if (voteType === 'upvote') {
        if (currentVote === 'downvote') newVoteScore += 2; // Remove downvote (-1) and add upvote (+1)
        else if (!currentVote) newVoteScore += 1; // Add upvote
      } else if (voteType === 'downvote') {
        if (currentVote === 'upvote') newVoteScore -= 2; // Remove upvote (+1) and add downvote (-1)
        else if (!currentVote) newVoteScore -= 1; // Add downvote
      }
      
      setPost(prev => ({
        ...prev,
        voteScore: newVoteScore,
        userVote: voteType === 'unvote' ? null : voteType
      }));
      setUserVote(voteType === 'unvote' ? null : voteType);
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Vote succeeded - optimistic update already applied
        console.log(`Vote ${voteType} successful for post ${postId}`);
        
        // Update user data synchronously to ensure it's ready before navigation
        try {
          const userResponse = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const authService = require('../../services/authService');
            authService.default.saveUser(userData.user);
            // Dispatch event to notify App.js that user data has been updated
            window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: { user: userData.user } }));
          }
        } catch (err) {
          console.error('Failed to update user data:', err);
        }
      } else {
        console.error('Vote failed:', await response.json());
        // Rollback optimistic update
        setUserVote(previousVote);
        setPost(prev => ({ ...prev, voteScore: previousScore, userVote: previousVote }));
        setAlert({
          type: 'error',
          message: 'Failed to vote. Please try again.'
        });
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      setAlert({
        type: 'error',
        message: 'Failed to vote. Please try again.'
      });
    }
  };

  const handleUpvote = () => {
    if (userVote === 'upvote') {
      handleVote('unvote');
    } else {
      handleVote('upvote');
    }
  };

  const handleDownvote = () => {
    if (userVote === 'downvote') {
      handleVote('unvote');
    } else {
      handleVote('downvote');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setAlert({
        type: 'warning',
        message: 'You must be logged in to comment'
      });
      return;
    }

    if (!commentText.trim()) {
      setAlert({
        type: 'warning',
        message: 'Comment cannot be empty'
      });
      return;
    }

    if (commentText.length > 10000) {
      setAlert({
        type: 'error',
        message: 'Comment cannot exceed 10,000 characters'
      });
      return;
    }

    setIsSubmittingComment(true);

    try {
      //TODO: Replace with actual API call to create comment
      // const token = localStorage.getItem('reditto_auth_token');
      // const response = await fetch(`http://localhost:5000/api/comments`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     content: commentText,
      //     post: postId,
      //     parentComment: null
      //   })
      // });
      // if (!response.ok) throw new Error('Failed to create comment');
      // const data = await response.json();

      // For now, just show success message without adding to list
      // Once API is integrated, refetch comments after successful creation

      // Clear input
      setCommentText('');

      setAlert({
        type: 'success',
        message: 'Comment will be posted once API is integrated'
      });
    } catch (error) {
      console.error('Failed to post comment:', error);
      setAlert({
        type: 'error',
        message: 'Failed to post comment. Please try again.'
      });
    } finally {
      setIsSubmittingComment(false);
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

  const calculateVoteScore = () => {
    return post?.voteScore || 0;
  };

  const handleShare = () => {
    setShareMenuOpen(!shareMenuOpen);
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/r/${post.community?.name}/posts/${post.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      setAlert({
        type: 'success',
        message: 'Link copied to clipboard!'
      });
      setShareMenuOpen(false);
    }).catch(err => {
      console.error('Failed to copy link:', err);
      setAlert({
        type: 'error',
        message: 'Failed to copy link'
      });
    });
  };

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuOpen && !event.target.closest('.share-menu-container')) {
        setShareMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [shareMenuOpen]);

  return (
    <div className="post-page">
      {alert && (
        <div className="post-page-alert">
          <Alert 
            type={alert.type} 
            message={alert.message} 
            onClose={() => setAlert(null)}
          />
        </div>
      )}
      <Navbar 
        user={user} 
        onSearch={handleSearch}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={onLogout}
      />
      <Sidebar isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} />

      <div className={`post-page-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <div className="post-page-container">
          {loading ? (
            <Loading size="large" />
          ) : post ? (
            <div className="post-page-main">
              {/* Back Button */}
              <button className="post-page-back-btn" onClick={handleBack} aria-label="Go back">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Back</span>
              </button>

              {/* Post Detail Card */}
              <div className="post-detail-card">
                {/* Post Header */}
                <div className="post-detail-header">
                  <div className="post-detail-header-info">
                    <Link to={`/r/${post.community?.name}`} className="post-detail-community-link">
                      <img 
                        src={post.community?.icon} 
                        alt={post.community?.name} 
                        className="post-detail-community-icon"
                      />
                    </Link>
                    <div className="post-detail-header-text">
                      <Link to={`/r/${post.community?.name}`} className="post-detail-community-name">
                        r/{post.community?.name}
                      </Link>
                      <Link to={`/user/${post.author?.username}`} className="post-detail-author">
                        u/{post.author?.username || 'unknown'}
                      </Link>
                    </div>
                    <span className="post-detail-divider">•</span>
                    <span className="post-detail-time">{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>

                {/* Post Title */}
                <h1 className="post-detail-title">{post.title}</h1>

                {/* Post Flair */}
                {post.flair && (
                  <div 
                    className="post-detail-flair"
                    style={{
                      backgroundColor: post.flair.backgroundColor || '#0079D3',
                      color: post.flair.textColor || '#FFFFFF'
                    }}
                  >
                    {post.flair.text}
                  </div>
                )}

                {/* Post Content */}
                {post.type === 'text' && post.content && (
                  <p className="post-detail-content">{post.content}</p>
                )}

                {post.type === 'image' && post.imageUrl && (
                  <div className="post-detail-image-container">
                    <img 
                      src={post.imageUrl} 
                      alt={post.title} 
                      className="post-detail-image"
                    />
                  </div>
                )}

                {post.type === 'link' && post.url && (
                  <a 
                    href={post.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="post-detail-link"
                  >
                    {post.url}
                  </a>
                )}

                {/* Interaction Bar */}
                <div className="post-detail-interactions">
                  {/* Vote Section */}
                  <div className="post-detail-vote">
                    <button 
                      className={`post-detail-vote-btn upvote ${userVote === 'upvote' ? 'active' : ''}`}
                      onClick={handleUpvote}
                      aria-label="Upvote"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4L4 12H8V20H16V12H20L12 4Z" fill="currentColor"/>
                      </svg>
                    </button>
                    <span className="post-detail-vote-score">{calculateVoteScore()}</span>
                    <button 
                      className={`post-detail-vote-btn downvote ${userVote === 'downvote' ? 'active' : ''}`}
                      onClick={handleDownvote}
                      aria-label="Downvote"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 20L20 12H16V4H8V12H4L12 20Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>

                  {/* Comment Count */}
                  <div className="post-detail-comment-count">
                    <svg width="24" height="24" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l.917-3.917A6.75 6.75 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" fill="currentColor"/>
                    </svg>
                    <span>{post.commentCount || 0} Comments</span>
                  </div>

                  {/* Share Button */}
                  <div className="share-menu-container">
                    <button className="post-detail-action-btn" onClick={handleShare}>
                      <svg width="24" height="24" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 13.442c-.633 0-1.204.246-1.637.642l-5.938-3.463c.046-.204.075-.412.075-.621s-.029-.417-.075-.621l5.938-3.463a2.49 2.49 0 001.637.642c1.379 0 2.5-1.121 2.5-2.5S16.379 1.558 15 1.558s-2.5 1.121-2.5 2.5c0 .209.029.417.075.621l-5.938 3.463a2.49 2.49 0 00-1.637-.642c-1.379 0-2.5 1.121-2.5 2.5s1.121 2.5 2.5 2.5c.633 0 1.204-.246 1.637-.642l5.938 3.463c-.046.204-.075.412-.075.621 0 1.379 1.121 2.5 2.5 2.5s2.5-1.121 2.5-2.5-1.121-2.5-2.5-2.5z" fill="currentColor"/>
                      </svg>
                      <span>Share</span>
                    </button>
                    {shareMenuOpen && (
                      <div className="share-menu">
                        <button className="share-menu-item" onClick={handleCopyLink}>
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

              {/* Comments Section */}
              <div className="post-comments-section">
                {/* Comment Input */}
                <div className="comment-input-container">
                  <div className="comment-input-header">
                    <span className="comment-as">Comment as <strong>{user?.username || 'Guest'}</strong></span>
                  </div>
                  <form onSubmit={handleCommentSubmit}>
                    <textarea
                      className="comment-input-textarea"
                      placeholder={user ? "What are your thoughts?" : "Login to comment"}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      disabled={!user || isSubmittingComment}
                      rows={4}
                    />
                    <div className="comment-input-footer">
                      <span className="comment-input-count">
                        {commentText.length}/10000
                      </span>
                      <button 
                        type="submit" 
                        className="comment-submit-btn"
                        disabled={!user || !commentText.trim() || isSubmittingComment}
                      >
                        {isSubmittingComment ? 'Posting...' : 'Comment'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="comments-header">
                  <h2>{comments.filter(c => !c.parentComment).length || 0} Comments</h2>
                </div>
                
                {commentsLoading ? (
                  <Loading size="medium" />
                ) : (
                  <div className="comments-list">
                    {comments
                      .filter(comment => !comment.parentComment)
                      .map((comment) => (
                        <Comment 
                          key={comment._id} 
                          comment={{
                            id: comment._id,
                            author: comment.author.username,
                            content: comment.content,
                            createdAt: comment.createdAt,
                            voteScore: comment.voteCount,
                            parentId: comment.parentComment,
                            replies: comment.replies
                          }} 
                          depth={0}
                          allComments={comments.map(c => ({
                            id: c._id,
                            author: c.author.username,
                            content: c.content,
                            createdAt: c.createdAt,
                            voteScore: c.voteCount,
                            parentId: c.parentComment,
                            replies: c.replies
                          }))}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="post-page-main">
              <div className="post-detail-card">
                <h1>Post not found</h1>
                <p>The post you're looking for doesn't exist or has been removed.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostPage;
