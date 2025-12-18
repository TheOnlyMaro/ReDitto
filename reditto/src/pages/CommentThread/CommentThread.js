import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Loading from '../../components/Loading/Loading';
import Comment from '../../components/Comment/Comment';
import Alert from '../../components/Alert/Alert';
import './CommentThread.css';

const CommentThread = ({ user, onLogout, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded }) => {
  const { commentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [rootComment, setRootComment] = useState(location.state?.comment || null);
  const [post, setPost] = useState(location.state?.post || null);
  const [loading, setLoading] = useState(!rootComment);
  const [alert, setAlert] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [optimisticCommentIds, setOptimisticCommentIds] = useState(new Set());
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fetch root comment if not provided via props
  useEffect(() => {
    const fetchRootComment = async () => {
      if (rootComment) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/comments/${commentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch comment');
        }
        
        const data = await response.json();
        
        // Handle deleted author
        if (!data.comment.author) {
          data.comment.author = { username: '[deleted]', flags: { isDeleted: true } };
        }
        
        setRootComment(data.comment);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch comment:', error);
        setLoading(false);
        navigate('/');
      }
    };

    fetchRootComment();
  }, [commentId, rootComment, navigate]);

  // Fetch post data if not provided via props
  useEffect(() => {
    const fetchPost = async () => {
      if (post || !rootComment) return;

      try {
        const response = await fetch(`http://localhost:5000/api/posts/${rootComment.post}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data.post);
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
      }
    };

    fetchPost();
  }, [rootComment, post]);

  // Fetch replies for the root comment
  useEffect(() => {
    const MAX_FETCH_DEPTH = 2;
    
    const fetchComments = async () => {
      if (!rootComment) return;
      
      try {
        setCommentsLoading(true);
        
        // Start with the root comment as the base
        const allFetchedComments = [rootComment];
        
        // Recursively fetch replies up to MAX_FETCH_DEPTH
        const fetchRepliesRecursive = async (comment, currentDepth) => {
          if (currentDepth >= MAX_FETCH_DEPTH || !comment.replies || comment.replies.length === 0) {
            return;
          }
          
          const replyPromises = comment.replies.map(async (replyId) => {
            try {
              const replyResponse = await fetch(`http://localhost:5000/api/comments/${replyId}`);
              if (!replyResponse.ok) return null;
              const replyData = await replyResponse.json();
              const replyComment = replyData.comment;
              
              allFetchedComments.push(replyComment);
              
              if (!replyComment.author) {
                replyComment.author = { username: '[deleted]' };
              }
              
              await fetchRepliesRecursive(replyComment, currentDepth + 1);
              
              return replyComment;
            } catch (error) {
              console.error('Error fetching reply:', error);
              return null;
            }
          });
          
          await Promise.all(replyPromises);
        };
        
        // Fetch replies starting from root
        await fetchRepliesRecursive(rootComment, 0);
        
        // Clean up any failed optimistic comments
        const fetchedIds = new Set(allFetchedComments.map(c => c._id.toString()));
        const failedOptimisticIds = Array.from(optimisticCommentIds).filter(
          id => !id.startsWith('temp_') || !fetchedIds.has(id)
        );
        
        if (failedOptimisticIds.length > 0) {
          setComments(prevComments => 
            prevComments.filter(c => !failedOptimisticIds.includes(c._id))
          );
          
          setOptimisticCommentIds(prev => {
            const newSet = new Set(prev);
            failedOptimisticIds.forEach(id => newSet.delete(id));
            return newSet;
          });
        } else {
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
        setComments([rootComment]);
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [rootComment, optimisticCommentIds]);

  // Handle on-demand reply fetching
  const handleFetchReplies = async (replyIds, currentDepth) => {
    const MAX_MANUAL_FETCH_DEPTH = 5;
    
    if (currentDepth >= MAX_MANUAL_FETCH_DEPTH) {
      return;
    }
    
    try {
      const newComments = [];
      
      // Fetch all direct replies
      for (const replyId of replyIds) {
        if (comments.find(c => c._id === replyId || c.id === replyId)) {
          continue;
        }
        
        const response = await fetch(`http://localhost:5000/api/comments/${replyId}`);
        if (!response.ok) continue;
        
        const data = await response.json();
        const comment = data.comment;
        
        if (!comment.author) {
          comment.author = { username: '[deleted]' };
        }
        
        newComments.push(comment);
      }
      
      // Recursively fetch replies of the newly fetched comments (up to 2 more levels)
      const fetchNestedReplies = async (comment, depth) => {
        if (depth >= 2 || !comment.replies || comment.replies.length === 0) {
          return;
        }
        
        for (const nestedReplyId of comment.replies) {
          if (comments.find(c => c._id === nestedReplyId || c.id === nestedReplyId) || 
              newComments.find(c => c._id === nestedReplyId || c.id === nestedReplyId)) {
            continue;
          }
          
          try {
            const nestedResponse = await fetch(`http://localhost:5000/api/comments/${nestedReplyId}`);
            if (!nestedResponse.ok) continue;
            
            const nestedData = await nestedResponse.json();
            const nestedComment = nestedData.comment;
            
            if (!nestedComment.author) {
              nestedComment.author = { username: '[deleted]' };
            }
            
            newComments.push(nestedComment);
            
            // Recursively fetch deeper
            await fetchNestedReplies(nestedComment, depth + 1);
          } catch (error) {
            console.error('Error fetching nested reply:', error);
          }
        }
      };
      
      // Fetch nested replies for each newly fetched comment
      for (const comment of newComments) {
        await fetchNestedReplies(comment, 0);
      }
      
      if (newComments.length > 0) {
        setComments(prevComments => [...prevComments, ...newComments]);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
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

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    const optimisticComment = {
      _id: tempId,
      content: textToSubmit,
      author: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      },
      post: rootComment.post,
      parentComment: parentCommentId || rootComment._id,
      voteCount: 0,
      replyCount: 0,
      replies: [],
      createdAt: new Date().toISOString(),
      flags: { isDeleted: false }
    };

    setComments(prevComments => [...prevComments, optimisticComment]);
    setOptimisticCommentIds(prev => new Set([...prev, tempId]));

    try {
      const token = localStorage.getItem('reditto_auth_token');
      const response = await fetch(`http://localhost:5000/api/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: textToSubmit,
          post: rootComment.post,
          parentComment: parentCommentId || rootComment._id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create comment');
      }
      
      const data = await response.json();
      
      setComments(prevComments => 
        prevComments.map(c => 
          c._id === tempId ? data.comment : c
        )
      );
      
      setOptimisticCommentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });

      if (!parentCommentId) {
        setCommentText('');
      }

      setAlert({
        type: 'success',
        message: parentCommentId ? 'Reply posted successfully' : 'Comment posted successfully'
      });
    } catch (error) {
      console.error('Failed to post comment:', error);
      
      setComments(prevComments => 
        prevComments.filter(c => c._id !== tempId)
      );
      
      setOptimisticCommentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
      
      setAlert({
        type: 'error',
        message: 'Failed to post comment. Please try again.'
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleBackToPost = async () => {
    if (post && post.community?.name) {
      navigate(`/r/${post.community.name}/posts/${post._id}`);
    } else if (rootComment && rootComment.post) {
      // Fetch post data if not available
      try {
        const response = await fetch(`http://localhost:5000/api/posts/${rootComment.post}`);
        if (response.ok) {
          const data = await response.json();
          if (data.post && data.post.community?.name) {
            navigate(`/r/${data.post.community.name}/posts/${data.post._id}`);
          } else {
            navigate(-1);
          }
        } else {
          navigate(-1);
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="comment-thread-page">
      <Navbar 
        user={user} 
        onLogout={onLogout} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
      />
      
      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)} 
        />
      )}

      <Sidebar isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} />

      <div className={`comment-thread-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <div className="comment-thread-container">
          {loading ? (
            <Loading size="large" />
          ) : rootComment ? (
            <div className="comment-thread-main">
              {/* Back to Post Button */}
              <button className="comment-thread-back-btn" onClick={handleBackToPost} aria-label="Back to post">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Back to post</span>
              </button>

              {/* Post Context Info */}
              {post && (
                <div className="comment-thread-post-info">
                  <Link to={`/r/${post.community?.name}/posts/${post._id}`} className="thread-post-link">
                    <h3>{post.title}</h3>
                  </Link>
                  <div className="thread-post-meta">
                    <Link to={`/r/${post.community?.name}`} className="thread-community">
                      r/{post.community?.name}
                    </Link>
                    <span className="divider">•</span>
                    <span>Posted by u/{post.author?.username || '[deleted]'}</span>
                  </div>
                </div>
              )}

              {/* Root Comment Card */}
              <div className="comment-thread-card">
                <div className="thread-header">
                  <h2>Comment Thread</h2>
                </div>

                {/* Root Comment Display */}
                <div className="root-comment-wrapper">
                  {commentsLoading ? (
                    <Loading size="medium" />
                  ) : (
                    <Comment 
                      comment={{
                        id: rootComment._id,
                        author: rootComment.author?.username || '[deleted]',
                        content: rootComment.content,
                        createdAt: rootComment.createdAt,
                        voteScore: rootComment.voteCount,
                        parentId: rootComment.parentComment,
                        replies: rootComment.replies || [],
                        replyCount: rootComment.replyCount || 0,
                        flags: rootComment.flags
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
                        flags: c.flags
                      }))}
                      onFetchReplies={handleFetchReplies}
                      onReplySubmit={(parentCommentId, replyText) => {
                        const fakeEvent = {
                          preventDefault: () => {},
                          target: { elements: [{ value: replyText }] }
                        };
                        return handleCommentSubmit(fakeEvent, parentCommentId);
                      }}
                      user={user}
                      postId={rootComment.post}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="comment-thread-main">
              <div className="comment-thread-card">
                <h1>Comment not found</h1>
                <p>The comment you're looking for doesn't exist or has been removed.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentThread;
