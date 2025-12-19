import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Post from '../../components/Post/Post';
import Loading from '../../components/Loading/Loading';
import Alert from '../../components/Alert/Alert';
import './UserPage.css';

const UserPage = ({ user: currentUser, onLogout, darkMode, setDarkMode, sidebarExpanded, setSidebarExpanded, onSearch }) => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${username}`);
        if (!response.ok) throw new Error('User not found');
        const data = await response.json();
        setUser(data.user);
        setPosts(data.posts || []);
        if (currentUser && data.user.followers?.includes(currentUser._id)) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) return;
    setFollowLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${username}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (err) {
      // Optionally show error
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <Alert type="error" message={error} />;
  if (!user) return <Alert type="error" message="User not found" />;

  return (
    <div className="user-page">
      <div className="user-header">
        <img className="user-avatar" src={user.avatar || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png'} alt={user.username} />
        <div className="user-info">
          <h2>u/{user.username}</h2>
          {user.displayName && <div className="user-displayName">{user.displayName}</div>}
          <div className="user-karma">{user.karma?.toLocaleString()} karma</div>
          <div className="user-followers">{user.followers?.length || 0} followers</div>
        </div>
        {currentUser && currentUser.username !== user.username && (
          <button className="follow-btn" onClick={handleFollow} disabled={followLoading}>
            {isFollowing ? 'Following' : '+ Follow'}
          </button>
        )}
      </div>
      <div className="user-posts-section">
        <h3>Posts</h3>
        {posts.length === 0 ? (
          <div className="user-no-posts">No posts yet.</div>
        ) : (
          posts.map(post => (
            <Post key={post._id} post={post} user={currentUser} onVote={() => {}} />
          ))
        )}
      </div>
    </div>
  );
};

export default UserPage;
