import React, { useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Post from '../../components/Post/Post';
import './Home.css';

// Dummy post data
const dummyPosts = [
  {
    id: 1,
    type: 'text',
    title: 'Just finished implementing the backend API for ReDitto!',
    content: 'After days of work, I finally got all the controllers, models, and routes working. The test suite shows 202/202 tests passing! What a relief. Now onto the frontend...',
    community: {
      name: 'r/webdev',
      icon: 'https://styles.redditmedia.com/t5_2qh5s/styles/communityIcon_xagsn9qtfwy51.png'
    },
    voteScore: 142,
    commentCount: 23,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: 2,
    type: 'image',
    title: 'My new desk setup for coding',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800',
    community: {
      name: 'r/battlestations',
      icon: 'https://styles.redditmedia.com/t5_2sfkp/styles/communityIcon_u1xvy51tekq41.png'
    },
    voteScore: 1247,
    commentCount: 87,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
  },
  {
    id: 3,
    type: 'text',
    title: 'What are your thoughts on dark mode by default?',
    content: 'I\'m building a Reddit clone and set dark mode as the default theme. Do you think this is a good UX decision? I know some people prefer light mode, but dark mode seems to be more popular among developers.',
    community: {
      name: 'r/reactjs',
      icon: 'https://styles.redditmedia.com/t5_2zldd/styles/communityIcon_dtoxqw7bmkn91.png'
    },
    voteScore: 89,
    commentCount: 45,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
  }
];

const Home = ({ user, onLogout, darkMode, setDarkMode }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [followedCommunities, setFollowedCommunities] = useState(['r/reactjs']); // Example: user follows r/reactjs
  
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
            {dummyPosts.map(post => (
              <Post 
                key={post.id}
                post={post}
                user={currentUser}
                isFollowing={followedCommunities.includes(post.community.name)}
                onVote={handleVote}
                onComment={handleComment}
                onShare={handleShare}
                onJoin={handleJoin}
                onSave={handleSave}
              />
            ))}
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
