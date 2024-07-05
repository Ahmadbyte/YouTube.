import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import axios from 'axios';
import './Home.css';
import YouTubeLogo from '../logo.png';
import UserLogo from '../user.png';
import LikeLogo from '../like.png';
import CommentLogo from '../cmt.png';

const API_KEY = 'AIzaSyAMfjkTiVru8DaqGjSa1ps0QspxNJSBbrE'; // Replace with your YouTube API key

const Home = () => {
  const [videos, setVideos] = useState([
    {
      _id: '1',
      title: 'List of Surah',
      videoUrl: 'https://www.youtube.com/watch?v=sjS8vkvycmw&list=PLF-AzhmyjY8xEojcjawrgQ8P21MJRuVfM&index=2',
      description: 'All Quran Surah Available in this Video',
      likes: 0,
      comments: [],
    },
    {
      _id: '2',
      title: 'Surah Mulk',
      videoUrl: 'https://www.youtube.com/watch?v=JwXN2fnc8Uk',
      description: 'This is Surah Mulk',
      likes: 0,
      comments: [],
    },
    {
      _id: '3',
      title: 'Arabic',
      videoUrl: 'https://www.youtube.com/watch?v=_Fwf45pIAtM&list=PL8UhM2ZIAXwt9LTHYZ74L6i3cO2xa_qYz',
      description: 'Arabic',
      likes: 0,
      comments: [],
    },
    {
      _id: '4',
      title: 'Kissi ki Muskurahato',
      videoUrl: 'https://www.youtube.com/watch?v=69pPYkGiEAQ',
      description: 'Vintage song',
      likes: 0,
      comments: [],
    },
    {
      _id: '5',
      title: 'Kalam eneih',
      videoUrl: 'https://www.youtube.com/watch?v=R8I3FOX7aZY',
      description: 'Arabic Song',
      likes: 0,
      comments: [],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState(''); // Default search query
  const [currentVideoId, setCurrentVideoId] = useState(null);

  const fetchVideos = async (query) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=${query}&part=snippet,id&order=date&maxResults=5`
      );
      console.log('Response:', response.data); // Log response data to inspect
      const videoData = response.data.items.map(item => ({
        _id: item.id.videoId,
        title: item.snippet.title,
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        description: item.snippet.description,
        likes: 0,
        comments: [],
      }));
      setVideos(videoData);
    } catch (error) {
      console.error('Error fetching videos', error); // Log any errors that occur
    }
  };

  const handleLike = (id) => {
    setVideos(videos.map(video => video._id === id ? { ...video, likes: video.likes + 1 } : video));
  };

  const handleComment = (id, comment) => {
    setVideos(videos.map(video => video._id === id ? { ...video, comments: [...video.comments, comment] } : video));
  };

  const handleSearch = () => {
    fetchVideos(searchQuery);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentVideoId) {
        // const videoElement = document.getElementById(currentVideoId);
        // if (videoElement) videoElement.play();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentVideoId]);

  const handlePlay = (id) => {
    setCurrentVideoId(id);
  };

  return (
    <div className="videos-container">
      <header className="header">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
          <Link to='https://www.youtube.com'>
            <img src={YouTubeLogo} alt="YouTube Logo" className="youtube-logo" />
          </Link>
          <h1 className="youtube-text">YouTube</h1>
        </div>
        <div className="user-info">
          <span className="username">Self</span>
          <img src={UserLogo} alt="User Logo" className="user-logo" />
        </div>
      </header>

      <div className="search-container">
        <input
          type="text"
          placeholder="   Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <ul>
        {videos.map((video) => (
          <li key={video._id} className="video-item">
            <h3>{video.title}</h3>
            <div className="video-player">
              <ReactPlayer
                id={video._id}
                url={video.videoUrl}
                width="100%"
                height="100%"
                controls
                playing={currentVideoId === video._id}
                onPlay={() => handlePlay(video._id)}
                config={{
                  youtube: {
                    playerVars: { showinfo: 1 },
                  },
                }}
              />
            </div>
            <p>{video.description}</p>
            <div className="video-actions">
              <button className="btnn" onClick={() => handleLike(video._id)}>
                <img src={LikeLogo} alt="Like" className="btn" /> {video.likes}
              </button>
              <button className="btnn" onClick={() => handleComment(video._id, prompt('Enter your comment:'))}>
                <img src={CommentLogo} alt="Comment" className="btn" /> {video.comments.length}
              </button>
            </div>
            <div className="comments-section">
              {video.comments.map((comment, index) => (
                <p key={index} className="comment">{comment}</p>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
