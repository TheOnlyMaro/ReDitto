import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Post from '../../components/Post/Post';
import Loading from '../../components/Loading/Loading';
import Alert from '../../components/Alert/Alert';
import './Home.css';

const Home = ({ user, userLoading, onLogout, onJoinCommunity, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [shareMenuPostId, setShareMenuPostId] = useState(null);

  // Fetch posts from database ONLY after user is loaded
  useEffect(() => {
    if (userLoading) return; // Wait until user fetch is complete
    
    const fetchPosts = async () => {
      //TODO: Replace with relevant feed fetching logic
      try {
        const response = await fetch('http://localhost:5000/api/posts');
        const data = await response.json();
        
        // Get user's joined communities if logged in
        const joinedCommunityIds = user?.communities?.joined || [];
        const upvotedPostIds = (user?.upvotedPosts || []).map(id => id.toString());
        const downvotedPostIds = (user?.downvotedPosts || []).map(id => id.toString());
        console.log('User joined community IDs:', joinedCommunityIds);
        console.log('User upvoted posts:', upvotedPostIds);
        console.log('User downvoted posts:', downvotedPostIds);
        console.log('User object:', user);
        
        // Transform posts to match expected format
        const transformedPosts = data.posts.map(post => {
          // Determine user's vote on this post
          let userVote = null;
          const postIdString = post._id.toString();
          if (upvotedPostIds.includes(postIdString)) {
            userVote = 'upvote';
          } else if (downvotedPostIds.includes(postIdString)) {
            userVote = 'downvote';
          }
          
          console.log(`Post ${post.title.substring(0, 20)}... ID: ${postIdString}, userVote: ${userVote}`);
          
          return {
            id: post._id,
            type: post.type,
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl,
            community: {
              id: post.community._id,
              name: post.community.name,
              icon: post.community.icon || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png'
            },
            voteScore: post.voteCount,
            commentCount: post.commentCount,
            createdAt: new Date(post.createdAt),
            isFollowing: joinedCommunityIds.includes(post.community._id),
            userVote: userVote
          };
        });
        
        setPosts(transformedPosts);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userLoading]); // Only depend on userLoading, not user
  
  const handleSearch = (query) => {
    console.log('Search query:', query);
    // TODO: Implement search functionality
  };

  const handleVote = async (postId, voteType) => {
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
      
      // Optimistically update UI before API call
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const currentVote = post.userVote;
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
            
            return {
              ...post,
              voteScore: newVoteScore,
              userVote: voteType === 'unvote' ? null : voteType
            };
          }
          return post;
        })
      );
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Vote succeeded - optimistic update already applied, no need to update again
        console.log(`Vote ${voteType} successful for post ${postId}`);
        
        // Update user data in background without affecting posts state
        fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(userResponse => {
          if (userResponse.ok) {
            return userResponse.json();
          }
        }).then(userData => {
          if (userData) {
            const authService = require('../../services/authService');
            authService.default.saveUser(userData.user);
          }
        }).catch(err => console.error('Failed to update user data:', err));
      } else {
        console.error('Vote failed:', await response.json());
        // Rollback optimistic update by reversing the vote
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              const currentVote = post.userVote;
              let revertedVoteScore = post.voteScore;
              
              // Reverse the vote change
              if (voteType === 'unvote') {
                // Was trying to remove vote, restore it
                if (currentVote === null) {
                  // Figure out what the original vote was based on score change
                  // This is complex, simpler to just re-fetch or store original
                  revertedVoteScore = post.voteScore; // Keep as is for now
                }
              } else if (voteType === 'upvote') {
                if (currentVote === 'upvote') {
                  // Reverse upvote
                  revertedVoteScore -= 1;
                }
              } else if (voteType === 'downvote') {
                if (currentVote === 'downvote') {
                  // Reverse downvote
                  revertedVoteScore += 1;
                }
              }
              
              return {
                ...post,
                voteScore: revertedVoteScore,
                userVote: null // Reset to no vote on failure
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      // Rollback optimistic update on network error
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            let revertedVoteScore = post.voteScore;
            const currentVote = post.userVote;
            
            // Reverse the optimistic change
            if (voteType === 'upvote' && currentVote === 'upvote') {
              revertedVoteScore -= 1;
            } else if (voteType === 'downvote' && currentVote === 'downvote') {
              revertedVoteScore += 1;
            }
            
            return {
              ...post,
              voteScore: revertedVoteScore,
              userVote: null
            };
          }
          return post;
        })
      );
    }
  };

  const handleComment = (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      navigate(`/r/${post.community.name}/posts/${post.id}`, { 
        state: { post, fromPath: window.location.pathname } 
      });
    }
  };

  const handleShare = (postId) => {
    setShareMenuPostId(shareMenuPostId === postId ? null : postId);
  };

  const handleCopyLink = (postId, communityName) => {
    const postUrl = `${window.location.origin}/r/${communityName}/posts/${postId}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      setAlert({
        type: 'success',
        message: 'Link copied to clipboard!'
      });
      setShareMenuPostId(null);
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
      if (shareMenuPostId && !event.target.closest('.share-menu-container')) {
        setShareMenuPostId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [shareMenuPostId]);

  const handleJoin = async (communityName, isJoining, communityId) => {
    console.log(`${isJoining ? 'Join' : 'Unjoin'} community:`, communityName);
    if (onJoinCommunity) {
      await onJoinCommunity(communityName, isJoining, communityId);
    }
  };

  const handleSave = async (postId, isSaved) => {
    if (!user) {
      console.log('User must be logged in to save posts');
      return;
    }

    try {
      const token = localStorage.getItem('reditto_auth_token');
      
      // Update user's savedPosts array
      let updatedSavedPosts = [...(user.savedPosts || [])];
      
      if (isSaved) {
        // Remove from saved
        updatedSavedPosts = updatedSavedPosts.filter(id => id !== postId);
      } else {
        // Add to saved
        updatedSavedPosts.push(postId);
      }

      const response = await fetch(`http://localhost:5000/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          savedPosts: updatedSavedPosts
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update user in parent component via localStorage
        const authService = require('../../services/authService');
        authService.default.saveUser(data.user);
        console.log(`Post ${isSaved ? 'unsaved' : 'saved'} successfully`);
      } else {
        console.error('Save failed:', await response.json());
      }
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  // Use real user prop or null for logged out state
  const currentUser = user || null;

  return (
    <div className="home">
      <Navbar 
        user={currentUser} 
        onSearch={handleSearch}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={onLogout}
      />
      <Sidebar isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} />
      
      {alert && (
        <Alert 
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="home-alert"
        />
      )}

      <div className={`home-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <div className="home-hero">
          <h1>Welcome to ReDitto</h1>
          <p>Your community-driven platform for discussions and content sharing</p>
        </div>
        
        <div className="home-main">
          <div className="home-feed">
            {loading ? (
              <Loading size="large" />
            ) : posts.length === 0 ? (
              <p>No posts yet. Be the first to create one!</p>
            ) : (
              posts.map(post => (
                <Post 
                  key={post.id}
                  post={post}
                  user={currentUser}
                  isFollowing={post.isFollowing}
                  onVote={handleVote}
                  onComment={handleComment}
                  onShare={handleShare}
                  onCopyLink={handleCopyLink}
                  shareMenuOpen={shareMenuPostId === post.id}
                  onJoin={handleJoin}
                  onSave={handleSave}
                />
              ))
            )}
          </div>
          
          <aside className="home-sidebar">
            <div className="sidebar-placeholder">
              <p>Sidebar content coming soon</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Home;
