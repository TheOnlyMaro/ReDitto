import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Post from '../../components/Post/Post';
import Loading from '../../components/Loading/Loading';
import Alert from '../../components/Alert/Alert';
import Button from '../../components/Button/Button';
import './CommunityPage.css';

const CommunityPage = ({ user, userLoading, userVoteVersion, onLogout, onJoinCommunity, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded }) => {
  const { communityName } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [shareMenuPostId, setShareMenuPostId] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [expandedRules, setExpandedRules] = useState({});
  const [isModerator, setIsModerator] = useState(false);
  const [showModTools, setShowModTools] = useState(false);
  const [showAddFlair, setShowAddFlair] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [flairForm, setFlairForm] = useState({ text: '', backgroundColor: '#0079D3' });
  const [ruleForm, setRuleForm] = useState({ title: '', description: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch community data
  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/communities/${communityName}`);
        
        if (!response.ok) {
          throw new Error('Community not found');
        }
        
        const data = await response.json();
        setCommunity(data.community);
        
        // Check if user has joined this community
        if (user && user.communities?.joined) {
          setIsJoined(user.communities.joined.includes(data.community._id));
        }
      } catch (error) {
        console.error('Failed to fetch community:', error);
        setAlert({
          type: 'error',
          message: 'Community not found'
        });
      }
    };

    fetchCommunity();
  }, [communityName, refreshTrigger]);

  // Update join state when user data changes
  useEffect(() => {
    if (community && user && user.communities?.joined) {
      setIsJoined(user.communities.joined.includes(community._id));
    }
    
    // Check if user is a moderator
    if (community && user && user.communities?.moderated) {
      setIsModerator(user.communities.moderated.includes(community._id));
    }
  }, [user, community]);

  // Fetch posts from this community
  useEffect(() => {
    if (userLoading) return;
    
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/posts?community=${communityName}`);
        const data = await response.json();
        
        const upvotedPostIds = (user?.upvotedPosts || []).map(id => id.toString());
        const downvotedPostIds = (user?.downvotedPosts || []).map(id => id.toString());
        const joinedCommunityIds = user?.communities?.joined || [];
        
        const transformedPosts = data.posts.map(post => {
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
            flair: post.flair,
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
  }, [communityName, userLoading, user, userVoteVersion]);

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
        // If vote failed, revert the optimistic update
        const data = await response.json();
        setAlert({
          type: 'error',
          message: data.message || 'Failed to vote. Please try again.'
        });
        
        // Revert by re-fetching posts or reversing the change
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              // Reverse the vote change
              const currentVote = voteType === 'unvote' ? null : voteType;
              let revertedScore = post.voteScore;
              
              if (voteType === 'unvote') {
                if (post.userVote === 'upvote') revertedScore += 1;
                else if (post.userVote === 'downvote') revertedScore -= 1;
              } else if (voteType === 'upvote') {
                if (post.userVote === 'downvote') revertedScore -= 2;
                else if (!post.userVote) revertedScore -= 1;
              } else if (voteType === 'downvote') {
                if (post.userVote === 'upvote') revertedScore += 2;
                else if (!post.userVote) revertedScore += 1;
              }
              
              return {
                ...post,
                voteScore: revertedScore,
                userVote: post.userVote // Keep original vote state
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      setAlert({
        type: 'error',
        message: 'Failed to vote. Please try again.'
      });
      
      // Revert the optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            // Reverse the vote change
            let revertedScore = post.voteScore;
            const currentVote = voteType === 'unvote' ? null : voteType;
            
            if (voteType === 'unvote') {
              if (post.userVote === 'upvote') revertedScore += 1;
              else if (post.userVote === 'downvote') revertedScore -= 1;
            } else if (voteType === 'upvote') {
              if (post.userVote === 'downvote') revertedScore -= 2;
              else if (!post.userVote) revertedScore -= 1;
            } else if (voteType === 'downvote') {
              if (post.userVote === 'upvote') revertedScore += 2;
              else if (!post.userVote) revertedScore += 1;
            }
            
            return {
              ...post,
              voteScore: revertedScore,
              userVote: post.userVote // Keep original vote state
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

  const handleJoinCommunity = async () => {
    if (!user) {
      setAlert({
        type: 'warning',
        message: 'You must be logged in to join communities'
      });
      return;
    }

    if (!community) return;

    const newIsJoined = !isJoined;
    setIsJoined(newIsJoined);

    if (onJoinCommunity) {
      await onJoinCommunity(community.name, newIsJoined, community._id);
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
    // Navigate to create post page with community pre-filled
    navigate(`/create/post?community=${community._id}`);
  };

  const toggleRule = (ruleIndex) => {
    setExpandedRules(prev => ({
      ...prev,
      [ruleIndex]: !prev[ruleIndex]
    }));
  };

  const handleAddFlair = async (e) => {
    e.preventDefault();
    
    if (!flairForm.text.trim()) {
      setAlert({ type: 'error', message: 'Flair text is required' });
      return;
    }

    try {
      const token = localStorage.getItem('reditto_auth_token');
      const response = await fetch(`http://localhost:5000/api/communities/${community.name}/flairs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flairForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add flair');
      }

      setAlert({ type: 'success', message: 'Flair added successfully' });
      setFlairForm({ text: '', backgroundColor: '#0079D3' });
      setShowAddFlair(false);
      // Trigger re-fetch to get updated community data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error adding flair:', error);
      setAlert({ type: 'error', message: error.message });
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    
    if (!ruleForm.title.trim()) {
      setAlert({ type: 'error', message: 'Rule title is required' });
      return;
    }

    try {
      const token = localStorage.getItem('reditto_auth_token');
      const response = await fetch(`http://localhost:5000/api/communities/${community.name}/rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ruleForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add rule');
      }

      setAlert({ type: 'success', message: 'Rule added successfully' });
      setRuleForm({ title: '', description: '' });
      setShowAddRule(false);
      // Trigger re-fetch to get updated community data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error adding rule:', error);
      setAlert({ type: 'error', message: error.message });
    }
  };

  return (
    <div className="community-page">
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
          className="community-page-alert"
        />
      )}

      <Sidebar isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} user={user} />

      <div className={`community-page-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        {/* Community Header */}
        {community && (
          <div className="community-header">
            {/* Banner */}
            {community.appearance?.banner ? (
              <div 
                className="community-banner" 
                style={{
                  backgroundImage: `url("${community.appearance.banner}")`,
                  backgroundColor: community.appearance?.primaryColor || '#0079D3'
                }}
              />
            ) : (
              <div 
                className="community-banner" 
                style={{
                  backgroundColor: community.appearance?.primaryColor || '#0079D3'
                }}
              />
            )}
            <div className="community-info-bar">
              <div className="community-info-left">
                <img 
                  src={community.appearance?.icon || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png'} 
                  alt={community.name} 
                  className="community-icon"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png';
                  }}
                />
                <div className="community-title-section">
                  <h1 className="community-title">r/{community.name}</h1>
                  <p className="community-members">{community.memberCount?.toLocaleString() || 0} members</p>
                </div>
              </div>
              <div className="community-info-right">
                <Button 
                  variant={isJoined ? 'secondary' : 'primary'}
                  className={`community-join-btn ${isJoined ? 'joined' : ''}`}
                  onClick={handleJoinCommunity}
                >
                  {isJoined ? 'Joined' : 'Join'}
                </Button>
                <Button 
                  variant="outline" 
                  className="community-create-post-btn" 
                  onClick={handleCreatePost}
                >
                  Create Post
                </Button>
              </div>
            </div>
            {community.description && (
              <div className="community-description">
                <p>{community.description}</p>
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
                <p>Be the first to post in r/{communityName}!</p>
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
                    fromSub={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar - Placeholder */}
          <div className="community-right-sidebar">
            {/* Moderator Tools */}
            {isModerator && (
              <div className="community-sidebar-card mod-tools-card">
                <div 
                  className="mod-tools-header" 
                  onClick={() => setShowModTools(!showModTools)}
                >
                  <h3>⚙️ Moderator Tools</h3>
                  <button className="mod-tools-toggle" type="button">
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      style={{ transform: showModTools ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {showModTools && (
                  <div className="mod-tools-content">
                    {/* Add Flair */}
                    <div className="mod-tool-section">
                      <button 
                        className="mod-tool-btn"
                        onClick={() => setShowAddFlair(!showAddFlair)}
                        type="button"
                      >
                        {showAddFlair ? '− Cancel' : '+ Add Flair'}
                      </button>
                      
                      {showAddFlair && (
                        <form onSubmit={handleAddFlair} className="mod-form">
                          <input
                            type="text"
                            placeholder="Flair text"
                            value={flairForm.text}
                            onChange={(e) => setFlairForm({ ...flairForm, text: e.target.value })}
                            maxLength={64}
                            className="mod-input"
                          />
                          <div className="color-picker-group">
                            <label>Color:</label>
                            <input
                              type="color"
                              value={flairForm.backgroundColor}
                              onChange={(e) => setFlairForm({ ...flairForm, backgroundColor: e.target.value })}
                              className="mod-color-input"
                            />
                          </div>
                          <button type="submit" className="mod-submit-btn">Add Flair</button>
                        </form>
                      )}
                    </div>

                    {/* Add Rule */}
                    <div className="mod-tool-section">
                      <button 
                        className="mod-tool-btn"
                        onClick={() => setShowAddRule(!showAddRule)}
                        type="button"
                      >
                        {showAddRule ? '− Cancel' : '+ Add Rule'}
                      </button>
                      
                      {showAddRule && (
                        <form onSubmit={handleAddRule} className="mod-form">
                          <input
                            type="text"
                            placeholder="Rule title"
                            value={ruleForm.title}
                            onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
                            maxLength={100}
                            className="mod-input"
                          />
                          <textarea
                            placeholder="Rule description (optional)"
                            value={ruleForm.description}
                            onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                            maxLength={500}
                            rows={3}
                            className="mod-textarea"
                          />
                          <button type="submit" className="mod-submit-btn">Add Rule</button>
                        </form>
                      )}
                    </div>

                    {/* View current flairs */}
                    {community && community.flairs && community.flairs.length > 0 && (
                      <div className="mod-tool-section">
                        <h4>Current Flairs ({community.flairs.length})</h4>
                        <div className="current-flairs">
                          {community.flairs.map((flair, idx) => (
                            <span 
                              key={idx}
                              className="flair-preview"
                              style={{ backgroundColor: flair.backgroundColor, color: flair.textColor || '#FFFFFF' }}
                            >
                              {flair.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="community-sidebar-card">
              <h3>About Community</h3>
              {community && (
                <>
                  {community.description && (
                    <p className="sidebar-description">{community.description}</p>
                  )}
                  <div className="sidebar-stats">
                    <div className="stat">
                      <strong>{community.memberCount?.toLocaleString() || 0}</strong>
                      <span>Members</span>
                    </div>
                    <div className="stat">
                      <strong>{community.postCount?.toLocaleString() || 0}</strong>
                      <span>Posts</span>
                    </div>
                  </div>
                  <div className="sidebar-created">
                    <span>Created {new Date(community.createdAt).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </div>

            {/* Community Rules */}
            {community && community.rules && community.rules.length > 0 && (
              <div className="community-sidebar-card">
                <h3>r/{community.name} rules</h3>
                <div className="rules-list">
                  {community.rules
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((rule, index) => (
                      <div key={index} className="rule-item">
                        <div className="rule-header" onClick={() => toggleRule(index)}>
                          <span className="rule-number">{index + 1}.</span>
                          <span className="rule-title">{rule.title}</span>
                          <button className="rule-expand-btn" aria-label={expandedRules[index] ? 'Collapse' : 'Expand'} type="button">
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 16 16" 
                              style={{ transform: expandedRules[index] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                            >
                              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                        {expandedRules[index] && rule.description && (
                          <div className="rule-description">
                            {rule.description}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Moderators */}
            {community && (
              <div className="community-sidebar-card">
                <h3>Moderators</h3>
                <div className="moderators-list">
                  {/* Creator first */}
                  {community.creator && (
                    <Link 
                      to={`/user/${community.creator.username}`} 
                      className="moderator-item"
                    >
                      <img 
                        src={community.creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${community.creator.username}`}
                        alt={community.creator.username}
                        className="moderator-avatar"
                      />
                      <span className="moderator-username">u/{community.creator.username}</span>
                    </Link>
                  )}
                  
                  {/* Other moderators (excluding creator if they're in the list) */}
                  {community.moderators && community.moderators
                    .filter(mod => mod._id !== community.creator?._id)
                    .map((moderator) => (
                      <Link 
                        key={moderator._id}
                        to={`/user/${moderator.username}`} 
                        className="moderator-item"
                      >
                        <img 
                          src={moderator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${moderator.username}`}
                          alt={moderator.username}
                          className="moderator-avatar"
                        />
                        <span className="moderator-username">u/{moderator.username}</span>
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

export default CommunityPage;
