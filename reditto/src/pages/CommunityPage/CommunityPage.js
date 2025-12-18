import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Post from '../../components/Post/Post';
import Loading from '../../components/Loading/Loading';
import Alert from '../../components/Alert/Alert';
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
  }, [communityName, user]);

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
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      const data = await response.json();
      
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                voteScore: data.post.voteCount,
                userVote: voteType === 'unvote' ? null : voteType
              }
            : post
        )
      );

      window.dispatchEvent(new CustomEvent('userDataUpdated', {
        detail: { user: data.user }
      }));
    } catch (error) {
      console.error('Failed to vote:', error);
      setAlert({
        type: 'error',
        message: 'Failed to vote. Please try again.'
      });
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
    // TODO: Navigate to create post page
    setAlert({
      type: 'info',
      message: 'Create post functionality coming soon'
    });
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
        />
      )}

      <Sidebar isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} />

      <div className={`community-page-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        {/* Community Header */}
        {community && (
          <div className="community-header">
            <div className="community-banner" style={{ backgroundColor: community.appearance?.bannerColor || '#0079D3' }}>
              {community.appearance?.banner && (
                <img src={community.appearance.banner} alt={community.name} className="community-banner-img" />
              )}
            </div>
            <div className="community-info-bar">
              <div className="community-info-left">
                <img 
                  src={community.icon || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png'} 
                  alt={community.name} 
                  className="community-icon"
                />
                <div className="community-title-section">
                  <h1 className="community-title">r/{community.name}</h1>
                  <p className="community-members">{community.memberCount?.toLocaleString() || 0} members</p>
                </div>
              </div>
              <div className="community-info-right">
                <button 
                  className={`community-join-btn ${isJoined ? 'joined' : ''}`}
                  onClick={handleJoinCommunity}
                >
                  {isJoined ? 'Joined' : 'Join'}
                </button>
                <button className="community-create-post-btn" onClick={handleCreatePost}>
                  Create Post
                </button>
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
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar - Placeholder */}
          <div className="community-right-sidebar">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
