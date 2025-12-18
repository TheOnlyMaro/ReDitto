import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Loading from '../../components/Loading/Loading';
import Comment from '../../components/Comment/Comment';
import Alert from '../../components/Alert/Alert';
import dummyComments from '../../data/dummyComments.json';
import './PostPage.css';

const PostPage = ({ user, onLogout, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(location.state?.post || null);
  const [loading, setLoading] = useState(!location.state?.post);
  const [userVote, setUserVote] = useState(null);
  const [alert, setAlert] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fetch post if not passed via navigation state
  useEffect(() => {
    if (!post) {
      const fetchPost = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/posts/${postId}`);
          
          if (!response.ok) {
            throw new Error('Post not found');
          }
          
          const data = await response.json();
          
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
            userVote: null // TODO: Determine user's vote if logged in
          };
          
          setPost(transformedPost);
          setLoading(false);
        } catch (error) {
          console.error('Failed to fetch post:', error);
          setLoading(false);
          // Redirect to home if post not found
          navigate('/');
        }
      };

      fetchPost();
    }
  }, [postId, post, navigate]);

  useEffect(() => {
    if (post) {
      setUserVote(post.userVote || null);
    }
  }, [post]);

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

  const handleUpvote = async () => {
    if (!user) {
      setAlert({
        type: 'warning',
        message: 'You must be logged in to vote'
      });
      return;
    }

    const previousVote = userVote;
    const previousScore = post.voteScore;
    const voteType = userVote === 'upvote' ? 'unvote' : 'upvote';

    // Optimistically update UI
    if (userVote === 'upvote') {
      setUserVote(null);
      setPost(prev => ({ ...prev, voteScore: prev.voteScore - 1 }));
    } else {
      setUserVote('upvote');
      setPost(prev => ({ 
        ...prev, 
        voteScore: prev.voteScore + (userVote === 'downvote' ? 2 : 1) 
      }));
    }

    try {
      const token = localStorage.getItem('reditto_auth_token');
      const endpoint = voteType === 'unvote' 
        ? `http://localhost:5000/api/posts/${postId}/vote`
        : `http://localhost:5000/api/posts/${postId}/upvote`;
      const method = voteType === 'unvote' ? 'DELETE' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Vote failed');
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      // Rollback on error
      setUserVote(previousVote);
      setPost(prev => ({ ...prev, voteScore: previousScore }));
      setAlert({
        type: 'error',
        message: 'Failed to vote. Please try again.'
      });
    }
  };

  const handleDownvote = async () => {
    if (!user) {
      setAlert({
        type: 'warning',
        message: 'You must be logged in to vote'
      });
      return;
    }

    const previousVote = userVote;
    const previousScore = post.voteScore;
    const voteType = userVote === 'downvote' ? 'unvote' : 'downvote';

    // Optimistically update UI
    if (userVote === 'downvote') {
      setUserVote(null);
      setPost(prev => ({ ...prev, voteScore: prev.voteScore + 1 }));
    } else {
      setUserVote('downvote');
      setPost(prev => ({ 
        ...prev, 
        voteScore: prev.voteScore - (userVote === 'upvote' ? 2 : 1) 
      }));
    }

    try {
      const token = localStorage.getItem('reditto_auth_token');
      const endpoint = voteType === 'unvote' 
        ? `http://localhost:5000/api/posts/${postId}/vote`
        : `http://localhost:5000/api/posts/${postId}/downvote`;
      const method = voteType === 'unvote' ? 'DELETE' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Vote failed');
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      // Rollback on error
      setUserVote(previousVote);
      setPost(prev => ({ ...prev, voteScore: previousScore }));
      setAlert({
        type: 'error',
        message: 'Failed to vote. Please try again.'
      });
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

      //TODO: Simulating adding comment to dummy data (replace with API integration)
      const newComment = {
        id: `c${Date.now()}`,
        author: user.username,
        content: commentText,
        createdAt: new Date().toISOString(),
        voteScore: 1,
        parentId: null,
        replies: []
      };

      // Add to dummy comments array
      dummyComments.comments.unshift(newComment);

      // Update post comment count
      setPost(prev => ({
        ...prev,
        commentCount: prev.commentCount + 1
      }));

      // Clear input
      setCommentText('');

      setAlert({
        type: 'success',
        message: 'Comment posted successfully!'
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

  return (
    <div className="post-page">
      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)}
        />
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
                  <button className="post-detail-action-btn">
                    <svg width="24" height="24" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 13.442c-.633 0-1.204.246-1.637.642l-5.938-3.463c.046-.204.075-.412.075-.621s-.029-.417-.075-.621l5.938-3.463a2.49 2.49 0 001.637.642c1.379 0 2.5-1.121 2.5-2.5S16.379 1.558 15 1.558s-2.5 1.121-2.5 2.5c0 .209.029.417.075.621l-5.938 3.463a2.49 2.49 0 00-1.637-.642c-1.379 0-2.5 1.121-2.5 2.5s1.121 2.5 2.5 2.5c.633 0 1.204-.246 1.637-.642l5.938 3.463c-.046.204-.075.412-.075.621 0 1.379 1.121 2.5 2.5 2.5s2.5-1.121 2.5-2.5-1.121-2.5-2.5-2.5z" fill="currentColor"/>
                    </svg>
                    <span>Share</span>
                  </button>
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
                  <h2>{dummyComments?.comments?.filter(c => c.parentId === null).length || 0} Comments</h2>
                </div>
                
                <div className="comments-list">
                  {(dummyComments?.comments || [])
                    .filter(comment => comment.parentId === null)
                    .map((comment) => (
                      <Comment 
                        key={comment.id} 
                        comment={comment} 
                        depth={0}
                        allComments={dummyComments?.comments || []}
                      />
                    ))}
                </div>
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
