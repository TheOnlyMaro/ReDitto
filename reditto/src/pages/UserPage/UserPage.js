
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Post from '../../components/Post/Post';
import Loading from '../../components/Loading/Loading';
import Alert from '../../components/Alert/Alert';
import Button from '../../components/Button/Button';
import { userAPI } from '../../services/api';
import { authService } from '../../services/authService';
import './UserPage.css';

const UserPage = ({ user, userLoading, userVoteVersion, onLogout, onJoinCommunity, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded, onSearch }) => {
  const { communityName, username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [shareMenuPostId, setShareMenuPostId] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch user/profile data (initial adaptation from CommunityPage)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const name = username || communityName;
        const response = await fetch(`${process.env.REACT_APP_API_URL}/users/username/${name}`);
        if (!response.ok) throw new Error('User not found');
        const data = await response.json();
        setProfile(data.user || data.profile || data.userProfile || data.user);
        // Check if current user follows this profile
        if (user && (data.user?.followers || data.profile?.followers)) {
          const followers = data.user?.followers || data.profile?.followers || [];
          setIsJoined(followers.includes(user._id));
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setAlert({ type: 'error', message: 'User not found' });
      }
    };

    fetchProfile();
  }, [communityName, username, refreshTrigger]);

  // Update follow state when user data changes
  useEffect(() => {
    if (profile && user) {
      const followers = profile.followers || [];
      setIsJoined(followers.includes(user._id));
    }
  }, [user, profile]);

  // Fetch posts for this user/profile (adapted)
  useEffect(() => {
    if (userLoading) return;
    
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const name = username || communityName;
        const response = await fetch(`${process.env.REACT_APP_API_URL}/posts?author=${name}`);
        const data = await response.json();
        
        // Get user's joined communities if logged in
        const joinedCommunityIds = user?.communities?.joined || [];
        const upvotedPostIds = (user?.upvotedPosts || []).map(id => id.toString());
        const downvotedPostIds = (user?.downvotedPosts || []).map(id => id.toString());

        // Transform posts to match expected format (same as Home)
        const transformedPosts = (data.posts || []).map(post => {
          // Determine user's vote on this post
          let userVote = null;
          const postIdString = post._id.toString();
          if (upvotedPostIds.includes(postIdString)) {
            userVote = 'upvote';
          } else if (downvotedPostIds.includes(postIdString)) {
            userVote = 'downvote';
          }
          
          return {
            id: post._id,
            type: post.type,
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl,
            author: post.author?.username || '[deleted]',
            authorDeleted: post.author?.flags?.isDeleted || !post.author,
            postDeleted: post.flags?.isDeleted || false,
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
  }, [communityName, username, userLoading, userVoteVersion]);

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
        endpoint = `${process.env.REACT_APP_API_URL}/posts/${postId}/upvote`;
      } else if (voteType === 'downvote') {
        endpoint = `${process.env.REACT_APP_API_URL}/posts/${postId}/downvote`;
      } else if (voteType === 'unvote') {
        endpoint = `${process.env.REACT_APP_API_URL}/posts/${postId}/vote`;
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
        
        // Update user data synchronously to ensure it's ready before navigation
        try {
          const userResponse = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const authService = require('../../services/authService');
            authService.default.saveUser(userData.user);
            window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: { user: userData.user } }));
          }
        } catch (err) {
          console.error('Failed to update user data:', err);
        }
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

  const handleShare = (postId) => {
    setShareMenuPostId(shareMenuPostId === postId ? null : postId);
  };

  const handleCopyLink = (post) => {
    const url = `${window.location.origin}/r/${post.community.name}/posts/${post.id}`;
    navigator.clipboard.writeText(url);
    setAlert({
      type: 'success',
      message: 'Link copied to clipboard!'
    });
    setShareMenuPostId(null);
  };

  const handleJoin = async (communityName, isJoining, communityId) => {
    console.log(`${isJoining ? 'Join' : 'Unjoin'} community:`, communityName);
    if (onJoinCommunity) {
      await onJoinCommunity(communityName, isJoining, communityId);
    }
  };

  const handleFollowUser = async () => {
    if (!user) {
      setAlert({ type: 'warning', message: 'You must be logged in to follow users' });
      return;
    }

    if (!profile) return;

    const newIsJoined = !isJoined;

    try {
      const token = authService.getToken();
      if (!token) throw new Error('Not authenticated');

      if (newIsJoined) {
        await userAPI.followUser(profile._id, token);
        // update local profile followers
        setProfile(prev => ({
          ...prev,
          followers: [...(prev.followers || []), user._id]
        }));
      } else {
        await userAPI.unfollowUser(profile._id, token);
        setProfile(prev => ({
          ...prev,
          followers: (prev.followers || []).filter(id => id.toString() !== user._id.toString())
        }));
      }

      setIsJoined(newIsJoined);

      // Refresh current user in local storage and notify listeners
      try {
        const { authAPI } = require('../../services/api');
        const refreshed = await authAPI.getCurrentUser(token);
        if (refreshed && refreshed.user) {
          authService.saveUser(refreshed.user);
          window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: { user: refreshed.user } }));
        }
      } catch (err) {
        // Non-fatal
        console.error('Failed to refresh current user after follow/unfollow:', err);
      }
    } catch (error) {
      console.error('Follow/unfollow failed:', error);
      setAlert({ type: 'error', message: error.message || 'Failed to update follow status' });
    }
  };

  const handleCreatePost = () => {
    if (!user) {
      setAlert({
        type: 'warning',
        message: 'You must be logged in to create a post'
      });
      return;
    }
    // Route to chat for this user (blank for now)
    navigate(`/u/${profile?.username || profile?.name}/chat`);
  };

  

  return (
    <div className="community-page">
      <Navbar 
        user={user} 
        onLogout={onLogout} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
        onSearch={onSearch}
      />
      
      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)}
          className="community-page-alert"
        />
      )}

      <Sidebar isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} user={user} />

      <div className={`community-page-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        {/* Profile Header */}
        {profile && (
          <div className="community-header">
            {/* Banner (user may have an avatar/banner) */}
            {profile.appearance?.banner || profile.banner ? (
              <div 
                className="community-banner" 
                style={{
                  backgroundImage: `url("${profile.appearance?.banner || profile.banner}")`,
                  backgroundColor: profile.appearance?.primaryColor || '#0079D3'
                }}
              />
            ) : (
              <div 
                className="community-banner" 
                style={{
                  backgroundColor: profile.appearance?.primaryColor || '#0079D3'
                }}
              />
            )}
            <div className="community-info-bar">
              <div className="community-info-left">
                <img 
                  src={profile.avatar || profile.appearance?.icon || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png'} 
                  alt={profile.username || profile.name} 
                  className="community-icon"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png';
                  }}
                />
                <div className="community-title-section">
                  <h1 className="community-title">u/{profile.username || profile.name}</h1>
                  <p className="community-members">{(profile.followers?.length || 0).toLocaleString()} followers</p>
                </div>
              </div>
              <div className="community-info-right">
                <Button 
                  variant={isJoined ? 'secondary' : 'primary'}
                  className={`community-join-btn ${isJoined ? 'joined' : ''}`}
                  onClick={handleFollowUser}
                >
                  {isJoined ? 'Following' : '+ Follow'}
                </Button>
                <Button 
                  variant="outline" 
                  className="community-create-post-btn" 
                  onClick={handleCreatePost}
                >
                  Chat (coming soon)
                </Button>
              </div>
            </div>
            {(profile.bio || profile.description) && (
              <div className="community-description">
                <p>{profile.bio || profile.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="community-main-content">
          <div className="community-posts-section">
            {loading ? (
              <Loading size="large" />
            ) : posts.length === 0 ? (
              <div className="no-posts">
                <h2>No posts yet</h2>
                <p>Be the first to post!</p>
              </div>
            ) : (
              <div className="posts-container">
                {posts.map((post) => (
                  <Post
                    key={post.id}
                    post={post}
                    user={user}
                    isFollowing={post.isFollowing}
                    onVote={handleVote}
                    onShare={() => handleShare(post.id)}
                    onCopyLink={() => handleCopyLink(post)}
                    shareMenuOpen={shareMenuPostId === post.id}
                    onJoin={handleJoin}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar - user info */}
          <div className="community-right-sidebar">
            <div className="community-sidebar-card">
                <h3>About User</h3>
                {profile && (
                  <>
                    {(profile.bio || profile.description) && (
                      <p className="sidebar-description">{profile.bio || profile.description}</p>
                    )}
                    <div className="sidebar-stats">
                      <div className="stat">
                        <strong>{(profile.followers?.length || 0).toLocaleString()}</strong>
                        <span>Followers</span>
                      </div>
                      <div className="stat">
                        <strong>{(profile.postCount || posts.length || 0).toLocaleString()}</strong>
                        <span>Posts</span>
                      </div>
                    </div>
                    <div className="sidebar-created">
                    <span>Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                  </>
                )}
              </div>
              {/* Moderated Subreddits */}
              {profile && (
                <div className="community-sidebar-card">
                  <h3>Moderated Subreddits</h3>
                  <div className="moderators-list">
                    {profile.communities && profile.communities.moderated && profile.communities.moderated.map((community) => (
                      <Link 
                        key={community._id} 
                        to={`/r/${community.name}`} 
                        className="moderator-item"
                      >
                        <img 
                          src={community.icon || `https://api.dicebear.com/7.x/avataaars/svg?seed=${community.name}`}
                          alt={community.name}
                          className="moderator-avatar"
                        />
                        <span className="moderator-username">r/{community.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default UserPage;
