import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Loading from '../../components/Loading/Loading';
import './PostPage.css';

const PostPage = ({ user, onLogout, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(location.state?.post || null);
  const [loading, setLoading] = useState(!location.state?.post);

  // Fetch post if not passed via navigation state
  useEffect(() => {
    if (!post) {
      const fetchPost = async () => {
        try {
          // TODO: Replace with actual API call
          // const response = await fetch(`http://localhost:5000/api/posts/${postId}`);
          // const data = await response.json();
          // setPost(data.post);
          console.log('TODO: Fetch post from API with ID:', postId);
          setLoading(false);
        } catch (error) {
          console.error('Failed to fetch post:', error);
          setLoading(false);
        }
      };

      fetchPost();
    }
  }, [postId, post]);

  const handleSearch = (query) => {
    console.log('Search query:', query);
    // TODO: Implement search functionality
  };

  return (
    <div className="post-page">
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
              <div className="post-detail">
                <h1>{post.title}</h1>
                <p>Post ID: {postId}</p>
                <p>Community: {post.community?.name}</p>
                <p>Type: {post.type}</p>
                {post.content && <p>Content: {post.content}</p>}
                {post.imageUrl && <img src={post.imageUrl} alt={post.title} style={{ maxWidth: '100%' }} />}
                {/* Full post component will be rendered here */}
              </div>

              <div className="post-comments-section">
                <h2>Comments</h2>
                {/* Comments will be rendered here */}
              </div>
            </div>
          ) : (
            <div className="post-page-main">
              <div className="post-detail">
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
