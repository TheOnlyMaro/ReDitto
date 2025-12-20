import './PostPage.css';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Loading from '../../components/Loading/Loading';
import Comment from '../../components/Comment/Comment';
import Alert from '../../components/Alert/Alert';
import { authService } from '../../services/authService';

const PostPage = ({ user, onLogout, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded, onSearch, searchResults, isSearching }) => {
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
  const [optimisticCommentIds, setOptimisticCommentIds] = useState(new Set());

  // Fetch post data (always fetch to get fresh vote counts and data)
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_URL}/posts/${postId}`);
        
        if (!response.ok) {
          throw new Error('Post not found');
        }
        
        const data = await response.json();
        const fetchedPost = data.post;
        
        // Handle deleted author gracefully
        if (!fetchedPost.author) {
          fetchedPost.author = {
            _id: 'deleted',
            username: '[deleted]',
            displayName: '[deleted]'
          };
        }
        
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
          flags: data.post.flags,
          community: {
            id: data.post.community._id,
            name: data.post.community.name,
            icon: data.post.community.icon || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png'
          },
          author: {
            username: data.post.author.username,
            displayName: data.post.author.displayName,
            avatar: data.post.author.avatar,
            flags: data.post.author.flags
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
    const MAX_FETCH_DEPTH = 2; // Only auto-fetch 2 levels deep
    
    const fetchComments = async () => {
      if (!postId) return;
      
      try {
        setCommentsLoading(true);
        
        // Get user's voted comments for initial state
        const upvotedCommentIds = (user?.upvotedComments || []).map(id => id.toString());
        const downvotedCommentIds = (user?.downvotedComments || []).map(id => id.toString());
        
        // Fetch top-level comments
        const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/post/${postId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        const data = await response.json();
        const topLevelComments = (data.comments || []).map(c => {
          // Handle deleted authors
          if (!c.author) {
            c.author = { username: '[deleted]' };
          }
          
          // Determine user's vote on this comment
          const commentIdString = c._id.toString();
          if (upvotedCommentIds.includes(commentIdString)) {
            c.userVote = 'upvote';
          } else if (downvotedCommentIds.includes(commentIdString)) {
            c.userVote = 'downvote';
          } else {
            c.userVote = null;
          }
          
          return c;
        });
        
        // Store all fetched comments in a flat array
        const allFetchedComments = [...topLevelComments];
        
        // Recursively fetch replies up to MAX_FETCH_DEPTH
        const fetchRepliesRecursive = async (comment, currentDepth) => {
          if (currentDepth >= MAX_FETCH_DEPTH || !comment.replies || comment.replies.length === 0) {
            return;
          }
          
          // Fetch all replies for this comment
          const replyPromises = comment.replies.map(async (replyId) => {
            try {
              const replyResponse = await fetch(`${process.env.REACT_APP_API_URL}/comments/${replyId}`);
              if (!replyResponse.ok) return null;
              const replyData = await replyResponse.json();
              const replyComment = replyData.comment;
              
              // Add to our flat array
              allFetchedComments.push(replyComment);
              
              // Handle deleted author
              if (!replyComment.author) {
                replyComment.author = { username: '[deleted]' };
              }
              
              // Determine user's vote on this reply
              const replyIdString = replyComment._id.toString();
              if (upvotedCommentIds.includes(replyIdString)) {
                replyComment.userVote = 'upvote';
              } else if (downvotedCommentIds.includes(replyIdString)) {
                replyComment.userVote = 'downvote';
              } else {
                replyComment.userVote = null;
              }
              
              // Recursively fetch this reply's replies
              await fetchRepliesRecursive(replyComment, currentDepth + 1);
              
              return replyComment;
            } catch (error) {
              console.error('Error fetching reply:', error);
              return null;
            }
          });
          
          await Promise.all(replyPromises);
        };
        
        // Fetch replies for all top-level comments
        await Promise.all(
          topLevelComments.map(comment => fetchRepliesRecursive(comment, 0))
        );
        
        // Clean up any failed optimistic comments
        // If we have optimistic comment IDs, check if they're in the fetched data
        // Only remove them if the fetch is complete and they're not found
        const fetchedIds = new Set(allFetchedComments.map(c => c._id.toString()));
        const failedOptimisticIds = Array.from(optimisticCommentIds).filter(
          id => !id.startsWith('temp_') || !fetchedIds.has(id)
        );
        
        if (failedOptimisticIds.length > 0) {
          // Remove failed optimistic comments
          setComments(prevComments => 
            prevComments.filter(c => !failedOptimisticIds.includes(c._id))
          );
          
          // Clean up optimistic IDs
          setOptimisticCommentIds(prev => {
            const newSet = new Set(prev);
            failedOptimisticIds.forEach(id => newSet.delete(id));
            return newSet;
          });
        } else {
          // Normal update - merge with any optimistic comments still pending
          setComments(prevComments => {
            const optimisticOnly = prevComments.filter(c => 
              optimisticCommentIds.has(c._id)
            );
            return [...allFetchedComments, ...optimisticOnly];
          });
        }
        
        setCommentsLoading(false);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        setComments([]);
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [postId, optimisticCommentIds, user?.upvotedComments, user?.downvotedComments]);

  // Function to fetch additional replies on demand
  const handleFetchReplies = async (replyIds, currentDepth) => {
    const MAX_FETCH_DEPTH = 5; // Allow deeper fetching on manual load
    
    if (currentDepth >= MAX_FETCH_DEPTH) {
      return;
    }
    
    // Get user's voted comments for initial state
    const upvotedCommentIds = (user?.upvotedComments || []).map(id => id.toString());
    const downvotedCommentIds = (user?.downvotedComments || []).map(id => id.toString());
    
    const newComments = [];
    
    const fetchRepliesRecursive = async (replyId, depth) => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/${replyId}`);
        if (!response.ok) return;
        const data = await response.json();
        const comment = data.comment;
        
        // Handle deleted author
        if (!comment.author) {
          comment.author = { username: '[deleted]' };
        }
        
        // Determine user's vote on this comment
        const commentIdString = comment._id.toString();
        if (upvotedCommentIds.includes(commentIdString)) {
          comment.userVote = 'upvote';
        } else if (downvotedCommentIds.includes(commentIdString)) {
          comment.userVote = 'downvote';
        } else {
          comment.userVote = null;
        }
        
        newComments.push(comment);
        
        // Recursively fetch nested replies if within depth limit
        if (depth < MAX_FETCH_DEPTH && comment.replies && comment.replies.length > 0) {
          await Promise.all(
            comment.replies.map(childReplyId => fetchRepliesRecursive(childReplyId, depth + 1))
          );
        }
      } catch (error) {
        console.error('Error fetching reply:', error);
      }
    };
    
    // Fetch all requested replies
    await Promise.all(replyIds.map(replyId => fetchRepliesRecursive(replyId, currentDepth)));
    
    // Add new comments to state
    if (newComments.length > 0) {
      setComments(prev => [...prev, ...newComments]);
    }
  };

  const handleSearch = (query) => {
    if (onSearch) {
      onSearch(query);
    }
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

    // Store previous state for rollback
    const previousVote = userVote;
    const previousScore = post.voteScore;

    try {
      const token = localStorage.getItem('reditto_auth_token');
      let endpoint = '';
      
      if (voteType === 'upvote') {
        endpoint = `${process.env.REACT_APP_API_URL}/posts/${postId}/upvote`;
      } else if (voteType === 'downvote') {
        endpoint = `${process.env.REACT_APP_API_URL}/posts/${postId}/downvote`;
      } else if (voteType === 'unvote') {
        endpoint = `${process.env.REACT_APP_API_URL}/posts/${postId}/vote`;
      }

      const method = voteType === 'unvote' ? 'DELETE' : 'POST';
      
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
          const userResponse = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            authService.saveUser(userData.user);
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
      // Rollback optimistic update on network error
      setUserVote(previousVote);
      setPost(prev => ({ ...prev, voteScore: previousScore, userVote: previousVote }));
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

  const handleCommentVote = async (commentId, voteType) => {
    if (!user) {
      setAlert({
        type: 'warning',
        message: 'You must be logged in to vote'
      });
      return;
    }

    // Find the comment in state
    const updateCommentVote = (commentsArray, id, updateFn) => {
      return commentsArray.map(c => {
        if ((c._id || c.id) === id) {
          return updateFn(c);
        }
        return c;
      });
    };

    // Store previous state for rollback
    const targetComment = comments.find(c => (c._id || c.id) === commentId);
    if (!targetComment) return;
    
    const previousVote = targetComment.userVote;
    const previousScore = targetComment.voteCount;

    try {
      const token = localStorage.getItem('reditto_auth_token');
      let endpoint = '';
      
      if (voteType === 'upvote') {
        endpoint = `${process.env.REACT_APP_API_URL}/comments/${commentId}/upvote`;
      } else if (voteType === 'downvote') {
        endpoint = `${process.env.REACT_APP_API_URL}/comments/${commentId}/downvote`;
      } else if (voteType === 'unvote') {
        endpoint = `${process.env.REACT_APP_API_URL}/comments/${commentId}/vote`;
      }

      const method = voteType === 'unvote' ? 'DELETE' : 'POST';
      
      // Calculate new vote score
      const currentVote = previousVote;
      let newVoteScore = previousScore;
      
      if (voteType === 'unvote') {
        if (currentVote === 'upvote') newVoteScore -= 1;
        else if (currentVote === 'downvote') newVoteScore += 1;
      } else if (voteType === 'upvote') {
        if (currentVote === 'downvote') newVoteScore += 2;
        else if (!currentVote) newVoteScore += 1;
      } else if (voteType === 'downvote') {
        if (currentVote === 'upvote') newVoteScore -= 2;
        else if (!currentVote) newVoteScore -= 1;
      }
      
      // Optimistically update comment in state
      setComments(prev => updateCommentVote(prev, commentId, (c) => ({
        ...c,
        voteCount: newVoteScore,
        userVote: voteType === 'unvote' ? null : voteType
      })));
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Rollback optimistic update
        setComments(prev => updateCommentVote(prev, commentId, (c) => ({
          ...c,
          voteCount: previousScore,
          userVote: previousVote
        })));
        setAlert({
          type: 'error',
          message: 'Failed to vote. Please try again.'
        });
      }
    } catch (error) {
      console.error('Failed to vote on comment:', error);
      // Rollback optimistic update
      setComments(prev => updateCommentVote(prev, commentId, (c) => ({
        ...c,
        voteCount: previousScore,
        userVote: previousVote
      })));
      setAlert({
        type: 'error',
        message: 'Failed to vote. Please try again.'
      });
    }
  };

  const handleCommentSubmit = async (e, parentCommentId = null) => {
    e.preventDefault();

    if (!user) {
      setAlert({
        type: 'warning',
        message: 'You must be logged in to comment'
      });
      return;
    }

    const textToSubmit = parentCommentId ? e.target.elements[0].value : commentText;

    if (!textToSubmit.trim()) {
      setAlert({
        type: 'warning',
        message: 'Comment cannot be empty'
      });
      return;
    }

    if (textToSubmit.length > 10000) {
      setAlert({
        type: 'error',
        message: 'Comment cannot exceed 10,000 characters'
      });
      return;
    }

    setIsSubmittingComment(true);

    // Generate temporary ID for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    // Create optimistic comment object
    const optimisticComment = {
      _id: tempId,
      content: textToSubmit,
      author: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      },
      post: postId,
      parentComment: parentCommentId,
      voteCount: 0,
      replyCount: 0,
      replies: [],
      createdAt: new Date().toISOString(),
      flags: { isDeleted: false }
    };

    // Add optimistic comment to UI immediately
    setComments(prevComments => [...prevComments, optimisticComment]);
    setOptimisticCommentIds(prev => new Set([...prev, tempId]));
    
    // Update post comment count optimistically
    setPost(prevPost => ({
      ...prevPost,
      commentCount: (prevPost.commentCount || 0) + 1
    }));

    try {
      const token = localStorage.getItem('reditto_auth_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: textToSubmit,
          post: postId,
          parentComment: parentCommentId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create comment');
      }
      
      const data = await response.json();
      
      // Replace optimistic comment with real comment from server
      setComments(prevComments => 
        prevComments.map(c => 
          c._id === tempId ? data.comment : c
        )
      );
      
      // Remove from optimistic IDs since it's now confirmed
      setOptimisticCommentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });

      // Clear input only if it's a top-level comment
      if (!parentCommentId) {
        setCommentText('');
      }

      setAlert({
        type: 'success',
        message: parentCommentId ? 'Reply posted successfully' : 'Comment posted successfully'
      });
    } catch (error) {
      console.error('Failed to post comment:', error);
      
      // Remove optimistic comment on failure
      setComments(prevComments => 
        prevComments.filter(c => c._id !== tempId)
      );
      
      setOptimisticCommentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
      
      // Revert post comment count
      setPost(prevPost => ({
        ...prevPost,
        commentCount: Math.max(0, (prevPost.commentCount || 0) - 1)
      }));
      
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

  const handleCopyCommentLink = (commentId) => {
    const commentUrl = `${window.location.origin}/r/comments/${commentId}`;
    navigator.clipboard.writeText(commentUrl).then(() => {
      setAlert({ type: 'success', message: 'Link copied to clipboard!' });
    }).catch(err => {
      console.error('Failed to copy comment link:', err);
      setAlert({ type: 'error', message: 'Failed to copy link' });
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
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)}
          className="post-page-alert"
        />
      )}
      <Navbar 
        user={user} 
        onSearch={handleSearch}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={onLogout}
      />
      <Sidebar isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} user={user} />

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
                      <Link 
                        to={post.author?.flags?.isDeleted || !post.author ? '#' : `/u/${post.author?.username}`} 
                        className="post-detail-author"
                        onClick={(e) => {
                          if (post.author?.flags?.isDeleted || !post.author) e.preventDefault();
                        }}
                      >
                        u/{post.author?.flags?.isDeleted || !post.author ? '[deleted]' : post.author?.username}
                      </Link>
                    </div>
                    <span className="post-detail-divider">•</span>
                    <span className="post-detail-time">{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>

                {/* Post Title */}
                <h1 className="post-detail-title">{post.flags?.isDeleted ? '[deleted]' : post.title}</h1>

                {/* Post Flair */}
                {post.flair && !post.flags?.isDeleted && (
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
                  <p className="post-detail-content">{post.flags?.isDeleted ? '[deleted]' : post.content}</p>
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
                  <h2>{post?.commentCount || 0} Comments</h2>
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
                            author: comment.author?.username || '[deleted]',
                            content: comment.content,
                            createdAt: comment.createdAt,
                            voteScore: comment.voteCount,
                            parentId: comment.parentComment,
                            replies: comment.replies || [],
                            replyCount: comment.replyCount || 0,
                            flags: comment.flags,
                            userVote: comment.userVote
                          }} 
                          depth={0}
                          allComments={comments.map(c => ({
                            id: c._id,
                            author: c.author?.username || '[deleted]',
                            content: c.content,
                            createdAt: c.createdAt,
                            voteScore: c.voteCount,
                            parentId: c.parentComment,
                            replies: c.replies || [],
                            replyCount: c.replyCount || 0,
                            flags: c.flags,
                            userVote: c.userVote
                          }))}
                          onFetchReplies={handleFetchReplies}
                          onVote={handleCommentVote}
                          onReplySubmit={(parentCommentId, replyText) => {
                            const fakeEvent = {
                              preventDefault: () => {},
                              target: { elements: [{ value: replyText }] }
                            };
                            return handleCommentSubmit(fakeEvent, parentCommentId);
                          }}
                          user={user}
                          postId={postId}
                          onCopyLink={handleCopyCommentLink}
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
