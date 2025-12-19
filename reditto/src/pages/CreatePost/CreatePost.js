import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Alert from '../../components/Alert/Alert';
import './CreatePost.css';

const CreatePost = ({ user, userLoading, onLogout, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [alert, setAlert] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [availableFlairs, setAvailableFlairs] = useState([]);
  const [loadingFlairs, setLoadingFlairs] = useState(false);
  const [postType, setPostType] = useState('text'); // 'text', 'link', 'image'
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: '',
    imageUrl: '',
    community: searchParams.get('community') || '',
    flairId: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      setAlert({
        type: 'error',
        message: 'You must be logged in to create a post'
      });
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [user, userLoading, navigate]);

  // Fetch user's joined communities
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user) return;

      try {
        setLoadingCommunities(true);
        
        // Fetch all communities and filter by user's joined list
        const response = await fetch('http://localhost:5000/api/communities');
        
        if (response.ok) {
          const data = await response.json();
          
          // Filter to only communities user has joined
          if (user.communities?.joined && user.communities.joined.length > 0) {
            const joinedCommunityIds = user.communities.joined.map(id => id.toString());
            const userCommunities = data.communities.filter(community => 
              joinedCommunityIds.includes(community._id.toString())
            );
            setCommunities(userCommunities);
          } else {
            setCommunities([]);
          }
        }
        
        setLoadingCommunities(false);
      } catch (error) {
        console.error('Failed to fetch communities:', error);
        setLoadingCommunities(false);
      }
    };

    fetchCommunities();
  }, [user]);

  // Fetch available flairs when community is selected
  useEffect(() => {
    const fetchFlairs = async () => {
      if (!formData.community) {
        setAvailableFlairs([]);
        return;
      }

      try {
        setLoadingFlairs(true);
        
        // Find the selected community to get its name
        const selectedCommunity = communities.find(comm => comm._id === formData.community);
        
        if (!selectedCommunity) {
          setAvailableFlairs([]);
          setLoadingFlairs(false);
          return;
        }

        // Fetch community details including flairs
        const response = await fetch(`http://localhost:5000/api/communities/${selectedCommunity.name}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch community details');
        }

        const data = await response.json();
        
        // Set flairs from community data
        if (data.community && data.community.flairs) {
          setAvailableFlairs(data.community.flairs);
        } else {
          setAvailableFlairs([]);
        }
        
        setLoadingFlairs(false);
      } catch (error) {
        console.error('Failed to fetch flairs:', error);
        setAvailableFlairs([]);
        setLoadingFlairs(false);
      }
    };

    fetchFlairs();
  }, [formData.community, communities]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePostTypeChange = (type) => {
    setPostType(type);
    // Clear type-specific fields when switching
    setFormData(prev => ({
      ...prev,
      content: type === 'text' ? prev.content : '',
      url: type === 'link' ? prev.url : '',
      imageUrl: type === 'image' ? prev.imageUrl : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      setAlert({
        type: 'error',
        message: 'Post title is required'
      });
      return;
    }

    if (formData.title.length > 300) {
      setAlert({
        type: 'error',
        message: 'Title cannot exceed 300 characters'
      });
      return;
    }

    if (!formData.community) {
      setAlert({
        type: 'error',
        message: 'Please select a community'
      });
      return;
    }

    if (postType === 'text' && formData.content.length > 40000) {
      setAlert({
        type: 'error',
        message: 'Content cannot exceed 40000 characters'
      });
      return;
    }

    if (postType === 'link' && !formData.url.trim()) {
      setAlert({
        type: 'error',
        message: 'URL is required for link posts'
      });
      return;
    }

    if (postType === 'link' && !/^https?:\/\/.+/.test(formData.url)) {
      setAlert({
        type: 'error',
        message: 'Invalid URL format. Must start with http:// or https://'
      });
      return;
    }

    if (postType === 'image' && !formData.imageUrl.trim()) {
      setAlert({
        type: 'error',
        message: 'Image URL is required for image posts'
      });
      return;
    }

    if (postType === 'image' && !/^https?:\/\/.+/.test(formData.imageUrl)) {
      setAlert({
        type: 'error',
        message: 'Invalid image URL format. Must start with http:// or https://'
      });
      return;
    }

    // Create post via API
    try {
      const token = localStorage.getItem('reditto_auth_token');
      
      if (!token) {
        setAlert({
          type: 'error',
          message: 'You must be logged in to create a post'
        });
        return;
      }

      const selectedFlair = availableFlairs.find(f => f._id === formData.flairId);
      
      // Find the selected community to get its name
      const selectedCommunity = communities.find(comm => comm._id === formData.community);
      if (!selectedCommunity) {
        setAlert({ type: 'error', message: 'Selected community not found' });
        return;
      }
      
      const postData = {
        title: formData.title,
        type: postType,
        community: selectedCommunity.name, // Send community name instead of ID
        ...(postType === 'text' && { content: formData.content }),
        ...(postType === 'link' && { url: formData.url }),
        ...(postType === 'image' && { imageUrl: formData.imageUrl }),
        ...(selectedFlair && {
          flair: {
            text: selectedFlair.text,
            backgroundColor: selectedFlair.backgroundColor
          }
        })
      };

      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      const data = await response.json();

      if (!response.ok) {
        setAlert({
          type: 'error',
          message: data.error || 'Failed to create post'
        });
        return;
      }

      // Success - show message and navigate to the post
      setAlert({
        type: 'success',
        message: 'Post created successfully!'
      });
      
      // Navigate to the new post after a short delay
      setTimeout(() => {
        navigate(`/r/${selectedCommunity.name}/posts/${data.post._id}`);
      }, 1000);

    } catch (error) {
      console.error('Error creating post:', error);
      setAlert({
        type: 'error',
        message: 'Failed to create post. Please try again.'
      });
    }
  };

  if (userLoading) {
    return null;
  }

  return (
    <div className="create-post-page">
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
          className="create-post-alert"
        />
      )}

      <Sidebar isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} user={user} />

      <div className={`create-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <div className="create-container">
          <div className="create-header">
            <h1>Create a Post</h1>
            <p>Share something with your community</p>
          </div>

          <form className="create-form" onSubmit={handleSubmit}>
            {/* Community Selection */}
            <div className="form-section">
              <h2>Choose Community</h2>
              
              <div className="form-group">
                <label htmlFor="community">
                  Community <span className="required">*</span>
                </label>
                <select
                  id="community"
                  name="community"
                  value={formData.community}
                  onChange={handleInputChange}
                  className="form-select community-select"
                  required
                  disabled={loadingCommunities}
                >
                  <option value="">Select a community</option>
                  {communities.map(comm => (
                    <option key={comm._id} value={comm._id}>
                      r/{comm.name}
                    </option>
                  ))}
                </select>
                {communities.length === 0 && !loadingCommunities && (
                  <p className="field-hint">You haven't joined any communities yet. Join communities to post!</p>
                )}
              </div>
            </div>

            {/* Post Type Selection */}
            <div className="form-section">
              <h2>Post Type</h2>
              <div className="post-type-tabs">
                <button
                  type="button"
                  className={`post-type-tab ${postType === 'text' ? 'active' : ''}`}
                  onClick={() => handlePostTypeChange('text')}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4h12v2H4V4zm0 4h12v2H4V8zm0 4h8v2H4v-2z"/>
                  </svg>
                  Text
                </button>
                <button
                  type="button"
                  className={`post-type-tab ${postType === 'link' ? 'active' : ''}`}
                  onClick={() => handlePostTypeChange('link')}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.465 11.535a3.5 3.5 0 114.95-4.95l1.06-1.06a5 5 0 00-7.07 7.07l1.06-1.06zm3.07-8.07l-1.06 1.06a3.5 3.5 0 014.95 4.95l1.06 1.06a5 5 0 00-4.95-7.07z"/>
                  </svg>
                  Link
                </button>
                <button
                  type="button"
                  className={`post-type-tab ${postType === 'image' ? 'active' : ''}`}
                  onClick={() => handlePostTypeChange('image')}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                  </svg>
                  Image
                </button>
              </div>
            </div>

            {/* Post Content */}
            <div className="form-section">
              <h2>Post Content</h2>
              
              <div className="form-group">
                <label htmlFor="title">
                  Title <span className="required">*</span>
                </label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="An interesting title"
                  required
                  maxLength={300}
                />
                <span className="char-count">{formData.title.length}/300</span>
              </div>

              {postType === 'text' && (
                <div className="form-group">
                  <label htmlFor="content">Text (optional)</label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="What are your thoughts?"
                    maxLength={40000}
                    rows={8}
                    className="form-textarea"
                  />
                  <span className="char-count">{formData.content.length}/40000</span>
                </div>
              )}

              {postType === 'link' && (
                <div className="form-group">
                  <label htmlFor="url">
                    URL <span className="required">*</span>
                  </label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    required
                  />
                  <p className="field-hint">Must start with http:// or https://</p>
                </div>
              )}

              {postType === 'image' && (
                <div className="form-group">
                  <label htmlFor="imageUrl">
                    Image URL <span className="required">*</span>
                  </label>
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                  <p className="field-hint">Direct link to an image file</p>
                  {formData.imageUrl && /^https?:\/\/.+/.test(formData.imageUrl) && (
                    <div className="image-preview">
                      <img src={formData.imageUrl} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="form-section">
              <h2>Options</h2>
              
              <div className="form-group">
                <label htmlFor="flairId">Flair (optional)</label>
                <select
                  id="flairId"
                  name="flairId"
                  value={formData.flairId}
                  onChange={handleInputChange}
                  className="form-select"
                  disabled={!formData.community || loadingFlairs}
                >
                  <option value="">No flair</option>
                  {availableFlairs.map(flair => (
                    <option key={flair._id} value={flair._id}>
                      {flair.text}
                    </option>
                  ))}
                </select>
                {!formData.community && (
                  <p className="field-hint">Select a community first to see available flairs</p>
                )}
                {formData.flairId && (() => {
                  const selectedFlair = availableFlairs.find(f => f._id === formData.flairId);
                  return selectedFlair ? (
                    <div className="flair-preview">
                      <span className="flair-badge" style={{ backgroundColor: selectedFlair.backgroundColor }}>
                        {selectedFlair.text}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <Button 
                type="button" 
                variant="text" 
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
              >
                Create Post
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
