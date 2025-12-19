
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Post from '../../components/Post/Post';
import Loading from '../../components/Loading/Loading';
import Alert from '../../components/Alert/Alert';
import Button from '../../components/Button/Button';
import './UserPage.css';

const UserPage = ({ user, userLoading, userVoteVersion, onLogout, onJoinCommunity, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded, onSearch }) => {
  const { communityName, username } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [moderatedCommunities, setModeratedCommunities] = useState([]);
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

  // Fetch user/profile data (initial adaptation from CommunityPage)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const name = username || communityName;
        const response = await fetch(`${process.env.REACT_APP_API_URL}/users/username/${name}`);
        if (!response.ok) throw new Error('User not found');
        const data = await response.json();
        const profile = data.user || data.profile || data.userProfile || data.user;
        setCommunity(profile);
        // Normalize karma to numeric value if needed
        if (profile) {
          const karmaObj = profile.karma;
          profile._computedKarma = (typeof karmaObj === 'object' && karmaObj !== null)
            ? ((karmaObj.post || 0) + (karmaObj.comment || 0))
            : (Number(profile.karma) || 0);
        }

        // Fetch moderated community details if user has moderated community ids
        const moderatedIds = profile?.communities?.moderated || [];
        if (moderatedIds && moderatedIds.length > 0) {
          try {
            // fetch a larger list of communities and match by id (server doesn't expose batch by ids)
            const commResp = await fetch(`${process.env.REACT_APP_API_URL}/communities?limit=1000`);
            if (commResp.ok) {
              const commData = await commResp.json();
              const matched = (commData.communities || []).filter(c => moderatedIds.map(String).includes(String(c._id)));
              setModeratedCommunities(matched);
            }
          } catch (err) {
            console.error('Failed to fetch moderated communities:', err);
          }
        }
        // Check if current user follows this profile
        if (user && profile?.followers) {
          setIsJoined(profile.followers.map(String).includes(String(user._id)));
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
    if (community && user && user.communities?.joined) {
      setIsJoined(user.communities.joined.includes(community._id));
    }
    
    // Check if user is a moderator (kept from community logic for later adaptation)
    if (community && user && user.communities?.moderated) {
      setIsModerator(user.communities.moderated.includes(community._id));
    }
  }, [user, community]);

  // Fetch posts for this user/profile (adapted)
  useEffect(() => {
    if (userLoading) return;
    
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const name = username || communityName;
        const response = await fetch(`${process.env.REACT_APP_API_URL}/posts?author=${name}`);
        const data = await response.json();
        
        // Defensive normalization: user arrays may contain ObjectIds or nested objects
        const upvotedPostIds = (user?.upvotedPosts || []).map(id => (id && id._id) ? String(id._id) : String(id));
        const downvotedPostIds = (user?.downvotedPosts || []).map(id => (id && id._id) ? String(id._id) : String(id));
        const viewerJoinedCommunityIds = (user?.communities?.joined || []).map(id => (id && id._id) ? String(id._id) : String(id));

        console.log('UserPage.fetchPosts: userId=', user?._id, 'upvotedPostIds=', upvotedPostIds, 'downvotedPostIds=', downvotedPostIds, 'joinedCommunityIds=', viewerJoinedCommunityIds);
        
        const transformedPosts = (data.posts || []).map(post => {
          let userVote = null;
          const postIdString = post._id.toString();
          if (upvotedPostIds.includes(postIdString)) {
            userVote = 'upvote';
          } else if (downvotedPostIds.includes(postIdString)) {
            userVote = 'downvote';
          }
          
          return {
            id: String(post._id),
            type: post.type,
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl,
            flair: post.flair,
            author: post.author?.username || '[deleted]',
            authorDeleted: post.author?.flags?.isDeleted || !post.author,
            postDeleted: post.flags?.isDeleted || false,
            community: post.community ? {
              id: String(post.community._id),
              name: post.community.name,
              icon: post.community.icon || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png'
            } : null,
            voteScore: post.voteCount,
            commentCount: post.commentCount,
            createdAt: new Date(post.createdAt),
            isFollowing: post.community ? viewerJoinedCommunityIds.includes(String(post.community._id)) : false,
            userVote: userVote
          };
        });
        
        console.log('UserPage.fetchPosts: mapped posts summary=', transformedPosts.map(p => ({ id: p.id, userVote: p.userVote, isFollowing: p.isFollowing })));
        setPosts(transformedPosts);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, [communityName, username, userLoading, user, userVoteVersion]);

  // Keep per-post vote/follow state in sync with the current `user` without refetching
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const upvotedPostIds = (user?.upvotedPosts || []).map(id => (id && id._id) ? String(id._id) : String(id));
    const downvotedPostIds = (user?.downvotedPosts || []).map(id => (id && id._id) ? String(id._id) : String(id));
    const viewerJoinedCommunityIds = (user?.communities?.joined || []).map(id => (id && id._id) ? String(id._id) : String(id));

    console.log('UserPage.syncEffect: syncing posts with user; upvoted=', upvotedPostIds, 'downvoted=', downvotedPostIds, 'joined=', viewerJoinedCommunityIds);

    setPosts(prevPosts => {
      const newPosts = prevPosts.map(p => {
        const postId = String(p.id || p._id || '');
        const userVote = upvotedPostIds.includes(postId) ? 'upvote' : (downvotedPostIds.includes(postId) ? 'downvote' : null);
        const isFollowing = p.community ? viewerJoinedCommunityIds.includes(String(p.community.id || p.community._id || p.community)) : false;
        return { ...p, userVote, isFollowing };
      });
      console.log('UserPage.syncEffect: result sample=', newPosts.map(p => ({ id: p.id, userVote: p.userVote, isFollowing: p.isFollowing })));
      return newPosts;
    });
  }, [user, user?.upvotedPosts, user?.downvotedPosts, user?.communities?.joined]);

  const handleVote = async (postId, voteType) => {
    if (!user) {
      setAlert({
        type: 'warning',
        message: 'You must be logged in to vote'
      });
      return;
    }

    console.log('UserPage.handleVote START', { postId, voteType, userId: user?._id, userUpvotedCount: (user?.upvotedPosts || []).length, userDownvotedCount: (user?.downvotedPosts || []).length });

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
      const currentPost = posts.find(p => String(p.id) === String(postId));
      console.log('UserPage.handleVote currentPost before update', { id: currentPost?.id, userVote: currentPost?.userVote, voteScore: currentPost?.voteScore });

      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const currentVote = post.userVote;
            let newVoteScore = post.voteScore;
            
            // Calculate new vote score based on vote changes
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
        console.log(`Vote ${voteType} successful for post ${postId}`);
      } else {
        const data = await response.json();
        console.log('UserPage.handleVote RESPONSE NOT OK', { postId, voteType, status: response.status, body: data });
        setAlert({
          type: 'error',
          message: data.message || 'Failed to vote. Please try again.'
        });
        
        // Revert by re-fetching posts or reversing the change
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
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
                userVote: post.userVote
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
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
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
              userVote: post.userVote
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

  const handleFollowUser = async () => {
    if (!user) {
      setAlert({ type: 'warning', message: 'You must be logged in to follow users' });
      return;
    }

    if (!community) return;

    const newIsJoined = !isJoined;
    setIsJoined(newIsJoined);

    // If parent provided onJoinCommunity, reuse it for follow/unfollow flow for now
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
    navigate(`/create/post?community=${community?._id}`);
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/communities/${community.name}/flairs`, {
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/communities/${community.name}/rules`, {
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
                    src={community.avatar || community.appearance?.icon || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png'} 
                    alt={community.username || community.name} 
                    className="community-icon"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png';
                    }}
                  />
                  <div className="community-title-section">
                    <h1 className="community-title">u/{community.username || community.name}</h1>
                    <p className="community-members">{(community.followers?.length || community.followerCount || 0).toLocaleString()} followers</p>
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
              <h3>About User</h3>
              {community && (
                <>
                  {community.bio && (
                    <p className="sidebar-description">{community.bio}</p>
                  )}
                  <div className="sidebar-stats">
                    <div className="stat">
                      <strong>{(community.followers?.length || community.followerCount || 0).toLocaleString()}</strong>
                      <span>Followers</span>
                    </div>
                    <div className="stat">
                      <strong>{(posts?.length || 0).toLocaleString()}</strong>
                      <span>Posts</span>
                    </div>
                    <div className="stat">
                      <strong>{(
                        community._computedKarma != null
                          ? community._computedKarma
                          : (typeof community.karma === 'object' && community.karma !== null)
                              ? ((community.karma.post || 0) + (community.karma.comment || 0))
                              : (Number(community.karma) || community.karmaPoints || 0)
                      ).toLocaleString()}</strong>
                      <span>Karma</span>
                    </div>
                  </div>
                  <div className="sidebar-created">
                    <span>Joined {community.createdAt ? new Date(community.createdAt).toLocaleDateString() : ''}</span>
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

            {/* Moderates (subreddits this user moderates) */}
            {community && (
              <div className="community-sidebar-card">
                <h3>Moderates</h3>
                <div className="moderators-list">
                        {moderatedCommunities && moderatedCommunities.length === 0 && (
                          <p className="sidebar-description">This user does not moderate any subreddits.</p>
                        )}
                        {moderatedCommunities && moderatedCommunities.length > 0 && moderatedCommunities.map((c) => (
                          <Link key={c._id} to={`/r/${c.name}`} className="moderator-item">
                            <img src={c.icon || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.name}`} alt={c.name} className="moderator-avatar" />
                            <span className="moderator-username">r/{c.name}</span>
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
