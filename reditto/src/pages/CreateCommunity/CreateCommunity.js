import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Alert from '../../components/Alert/Alert';
import './CreateCommunity.css';

const CreateCommunity = ({ user, userLoading, onLogout, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded }) => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    isPrivate: false,
    allowTextPosts: true,
    allowLinkPosts: true,
    allowImagePosts: true,
    icon: '',
    banner: '',
    primaryColor: '#0079D3'
  });

  // Redirect if not logged in
  React.useEffect(() => {
    if (!userLoading && !user) {
      setAlert({
        type: 'error',
        message: 'You must be logged in to create a community'
      });
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [user, userLoading, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.name.length < 3) {
      setAlert({
        type: 'error',
        message: 'Community name must be at least 3 characters'
      });
      return;
    }

    if (formData.name.length > 21) {
      setAlert({
        type: 'error',
        message: 'Community name cannot exceed 21 characters'
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.name)) {
      setAlert({
        type: 'error',
        message: 'Community name can only contain letters, numbers, and underscores'
      });
      return;
    }

    if (formData.description.length > 500) {
      setAlert({
        type: 'error',
        message: 'Description cannot exceed 500 characters'
      });
      return;
    }

    try {
      const token = localStorage.getItem('reditto_auth_token');
      
      if (!token) {
        setAlert({
          type: 'error',
          message: 'You must be logged in to create a community'
        });
        return;
      }

      // Prepare data for API
      const communityData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        settings: {
          isPrivate: formData.isPrivate,
          allowedPostTypes: {
            text: formData.allowTextPosts,
            link: formData.allowLinkPosts,
            image: formData.allowImagePosts
          }
        },
        appearance: {
          icon: formData.icon || undefined,
          banner: formData.banner || undefined,
          primaryColor: formData.primaryColor
        }
      };

      // Call API to create community
      const response = await fetch('http://localhost:5000/api/communities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(communityData)
      });

      const data = await response.json();

      if (!response.ok) {
        setAlert({
          type: 'error',
          message: data.error || 'Failed to create community'
        });
        return;
      }

      // Update user data if returned (auto-join functionality)
      if (data.user) {
        // Dispatch custom event to update user in App.js
        window.dispatchEvent(new CustomEvent('userDataUpdated', {
          detail: { user: data.user }
        }));
      }

      // Success - show success message and navigate to the new community
      setAlert({
        type: 'success',
        message: `Community r/${formData.name} created successfully!`
      });

      // Navigate to the new community page after a short delay
      setTimeout(() => {
        navigate(`/r/${formData.name}`);
      }, 1500);

    } catch (error) {
      console.error('Error creating community:', error);
      setAlert({
        type: 'error',
        message: 'Failed to create community. Please try again.'
      });
    }
  };

  const categories = [
    'General', 'Gaming', 'Sports', 'Technology', 'Entertainment', 
    'News', 'Education', 'Science', 'Art', 'Music', 'Other'
  ];

  if (userLoading) {
    return null;
  }

  return (
    <div className="create-community-page">
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
            <h1>Create a Community</h1>
            <p>Build and grow a community about something you care about</p>
          </div>

          <form className="create-form" onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <h2>Community Information</h2>
              
              <div className="form-group">
                <label htmlFor="name">
                  Name <span className="required">*</span>
                </label>
                <div className="name-input-wrapper">
                  <span className="name-prefix">r/</span>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="CommunityName"
                    required
                    maxLength={21}
                  />
                </div>
                <span className="char-count">{formData.name.length}/21</span>
                <p className="field-hint">Community names must be between 3-21 characters. Only letters, numbers, and underscores allowed.</p>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="What is your community about?"
                  maxLength={500}
                  rows={4}
                  className="form-textarea"
                />
                <span className="char-count">{formData.description.length}/500</span>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Community Settings */}
            <div className="form-section">
              <h2>Community Settings</h2>
              
              <div className="form-group-checkbox">
                <input
                  type="checkbox"
                  id="isPrivate"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleInputChange}
                />
                <label htmlFor="isPrivate">
                  <strong>Private Community</strong>
                  <span className="checkbox-hint">Only approved users can view and submit to this community</span>
                </label>
              </div>

              <div className="form-group-checkbox">
                <input
                  type="checkbox"
                  id="allowTextPosts"
                  name="allowTextPosts"
                  checked={formData.allowTextPosts}
                  onChange={handleInputChange}
                />
                <label htmlFor="allowTextPosts">
                  <strong>Allow Text Posts</strong>
                  <span className="checkbox-hint">Users can create text-based posts</span>
                </label>
              </div>

              <div className="form-group-checkbox">
                <input
                  type="checkbox"
                  id="allowLinkPosts"
                  name="allowLinkPosts"
                  checked={formData.allowLinkPosts}
                  onChange={handleInputChange}
                />
                <label htmlFor="allowLinkPosts">
                  <strong>Allow Link Posts</strong>
                  <span className="checkbox-hint">Users can share links</span>
                </label>
              </div>

              <div className="form-group-checkbox">
                <input
                  type="checkbox"
                  id="allowImagePosts"
                  name="allowImagePosts"
                  checked={formData.allowImagePosts}
                  onChange={handleInputChange}
                />
                <label htmlFor="allowImagePosts">
                  <strong>Allow Image Posts</strong>
                  <span className="checkbox-hint">Users can upload images</span>
                </label>
              </div>
            </div>

            {/* Appearance */}
            <div className="form-section">
              <h2>Appearance</h2>
              
              <div className="form-group">
                <label htmlFor="icon">Community Icon URL</label>
                <Input
                  id="icon"
                  name="icon"
                  type="url"
                  value={formData.icon}
                  onChange={handleInputChange}
                  placeholder="https://example.com/icon.png"
                />
                <p className="field-hint">Square image recommended (256x256 or larger)</p>
              </div>

              <div className="form-group">
                <label htmlFor="banner">Banner Image URL</label>
                <Input
                  id="banner"
                  name="banner"
                  type="url"
                  value={formData.banner}
                  onChange={handleInputChange}
                  placeholder="https://example.com/banner.png"
                />
                <p className="field-hint">Wide banner image (1920x384 recommended)</p>
              </div>

              <div className="form-group">
                <label htmlFor="primaryColor">Primary Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    id="primaryColor"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleInputChange}
                    className="color-picker"
                  />
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={handleInputChange}
                    name="primaryColor"
                    placeholder="#0079D3"
                  />
                </div>
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
                Create Community
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunity;
