import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Post from '../../components/Post/Post';
import './Home.css';

const Home = ({ user, onLogout, darkMode, setDarkMode }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [followedCommunities, setFollowedCommunities] = useState(['r/reactjs']); // Example: user follows r/reactjs
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts from database
  useEffect(() => {
    const fetchPosts = async () => {
      //TODO: Replace with relevant feed fetching logic
      try {
        const response = await fetch('http://localhost:5000/api/posts');
        const data = await response.json();
        
        // Transform posts to match expected format
        const transformedPosts = data.posts.map(post => ({
          id: post._id,
          type: post.type,
          title: post.title,
          content: post.content,
          imageUrl: post.imageUrl,
          community: {
            name: `r/${post.community.name}`,
            icon: post.community.icon || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png'
          },
          voteScore: post.voteCount,
          commentCount: post.commentCount,
          createdAt: new Date(post.createdAt),
          isFollowing: followedCommunities.includes(`r/${post.community.name}`)
        }));
        
        setPosts(transformedPosts);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);
  
  const handleSearch = (query) => {
    console.log('Search query:', query);
    // TODO: Implement search functionality
  };

  const handleVote = (postId, voteType) => {
    console.log(`Post ${postId} voted:`, voteType);
    // TODO: Implement voting functionality
  };

  const handleComment = (postId) => {
    console.log(`Comment on post ${postId}`);
    // TODO: Implement comment functionality
  };

  const handleShare = (postId) => {
    console.log(`Share post ${postId}`);
    // TODO: Implement share functionality
  };

  const handleJoin = (communityName, isJoining) => {
    console.log(`${isJoining ? 'Join' : 'Unjoin'} community:`, communityName);
    if (isJoining) {
      setFollowedCommunities(prev => [...prev, communityName]);
    } else {
      setFollowedCommunities(prev => prev.filter(name => name !== communityName));
    }
    // TODO: Implement join/unjoin functionality
  };

  const handleSave = (postId) => {
    console.log(`Save post:`, postId);
    // TODO: Implement save functionality
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

      <div className={`home-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <div className="home-hero">
          <h1>Welcome to ReDitto</h1>
          <p>Your community-driven platform for discussions and content sharing</p>
        </div>
        
        <div className="home-main">
          <div className="home-feed">
            {loading ? (
              <p>Loading posts...</p>
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
