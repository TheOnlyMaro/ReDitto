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
  const [postType, setPostType] = useState('text'); // 'text', 'link', 'image'
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: '',
    imageUrl: '',
    community: searchParams.get('community') || '',
    flairText: '',
    flairColor: '#0079D3',
    nsfw: false,
    spoiler: false
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
        // TODO: Fetch user's joined communities from API
        // For now, using mock data
        const mockCommunities = [
          { _id: '1', name: 'gaming', icon: 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png' },
          { _id: '2', name: 'technology', icon: 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png' },
          { _id: '3', name: 'movies', icon: 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_3.png' }
        ];
        setCommunities(mockCommunities);
        setLoadingCommunities(false);
      } catch (error) {
        console.error('Failed to fetch communities:', error);
        setLoadingCommunities(false);
      }
    };

    fetchCommunities();
  }, [user]);

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

    // TODO: Implement API call to create post
    const postData = {
      title: formData.title,
      type: postType,
      community: formData.community,
      ...(postType === 'text' && { content: formData.content }),
      ...(postType === 'link' && { url: formData.url }),
      ...(postType === 'image' && { imageUrl: formData.imageUrl }),
      ...(formData.flairText && {
        flair: {
          text: formData.flairText,
          backgroundColor: formData.flairColor
        }
      }),
      flags: {
        nsfw: formData.nsfw,
        spoiler: formData.spoiler
      }
    };

    console.log('Creating post with data:', postData);
    setAlert({
      type: 'info',
      message: 'Post creation coming soon...'
    });
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
        />
      )}

      <Sidebar isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} />

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
                <label htmlFor="flairText">Flair (optional)</label>
                <div className="flair-input-group">
                  <Input
                    id="flairText"
                    name="flairText"
                    type="text"
                    value={formData.flairText}
                    onChange={handleInputChange}
                    placeholder="Add a flair"
                    maxLength={64}
                  />
                  <input
                    type="color"
                    name="flairColor"
                    value={formData.flairColor}
                    onChange={handleInputChange}
                    className="color-picker-small"
                    title="Flair color"
                  />
                </div>
                {formData.flairText && (
                  <div className="flair-preview">
                    <span className="flair-badge" style={{ backgroundColor: formData.flairColor }}>
                      {formData.flairText}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group-checkbox">
                <input
                  type="checkbox"
                  id="nsfw"
                  name="nsfw"
                  checked={formData.nsfw}
                  onChange={handleInputChange}
                />
                <label htmlFor="nsfw">
                  <strong>NSFW</strong>
                  <span className="checkbox-hint">Not safe for work content</span>
                </label>
              </div>

              <div className="form-group-checkbox">
                <input
                  type="checkbox"
                  id="spoiler"
                  name="spoiler"
                  checked={formData.spoiler}
                  onChange={handleInputChange}
                />
                <label htmlFor="spoiler">
                  <strong>Spoiler</strong>
                  <span className="checkbox-hint">Contains spoilers</span>
                </label>
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
