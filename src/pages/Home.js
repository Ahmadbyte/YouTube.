import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import axios from 'axios';
import './Home.css';
import YouTubeLogo from '../youtube.png';
import UserLogo from '../user.png';
import LikeLogo from '../like.png';
import CommentLogo from '../cmt.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faSearch, faMicrophone } from '@fortawesome/free-solid-svg-icons';

const API_KEYS = [
  'AIzaSyCHLcT5XF4DqwyDJ3rPIDkV2DwvyAGee8Q',
  'AIzaSyA-Olt7-UB9p5tEhbNzkGxbUnjLjzaLv7I',
  'AIzaSyAMfjkTiVru8DaqGjSa1ps0QspxNJSBbrE',
  'AIzaSyAh--OFztAec_Q4pYhGb1JUdZFdWfE0oPY',
  // Add more API keys as needed
];

let currentApiKeyIndex = 0;

const getApiKey = () => {
  const key = API_KEYS[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % API_KEYS.length;
  return key;
};

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('light');
  const recognitionRef = useRef(null);
  const playerRefs = useRef([]);

  useEffect(() => {
    fetchDefaultVideos();
  }, []);

  const fetchDefaultVideos = async () => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?key=${getApiKey()}&q=reactjs&part=snippet,id&order=date&maxResults=20`
      );
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
      console.error('Error fetching videos', error);
    }
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const speechToText = event.results[0][0].transcript;
        setSearchQuery(speechToText);
        fetchVideos(speechToText);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const fetchVideos = async (query) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?key=${getApiKey()}&q=${query}&part=snippet,id&order=date&maxResults=20`
      );
      const videoData = response.data.items.map(item => ({
        _id: item.id.videoId,
        title: item.snippet.title,
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        description: item.snippet.description,
        likes: 0,
        comments: [],
      }));
      setVideos(videoData);
      setCurrentVideoId(null); // Reset current video when fetching new videos
    } catch (error) {
      console.error('Error fetching videos', error);
    }
  };

  const fetchRelatedVideos = async (videoId) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&key=${getApiKey()}&maxResults=10`
      );
      const relatedVideoData = response.data.items.map(item => ({
        _id: item.id.videoId,
        title: item.snippet.title,
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        description: item.snippet.description,
        likes: 0,
        comments: [],
      }));
      setVideos(relatedVideoData); // Replace current videos with related videos
    } catch (error) {
      console.error('Error fetching related videos', error);
    }
  };

  const handleLike = (id) => {
    const updatedVideos = videos.map(video => {
      if (video._id === id) {
        return { ...video, likes: video.likes + 1 };
      }
      return video;
    });
    setVideos(updatedVideos);
  };

  const handleComment = (id, comment) => {
    const updatedVideos = videos.map(video => {
      if (video._id === id) {
        return { ...video, comments: [...video.comments, comment] };
      }
      return video;
    });
    setVideos(updatedVideos);
  };

  const handleSearch = () => {
    fetchVideos(searchQuery);
  };

  const handlePlay = async (id) => {
    setCurrentVideoId(id); // Set current video id to play
    await fetchRelatedVideos(id); // Fetch related videos when a video is played
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleSpeechSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentVideoId) {
        const videoElement = playerRefs.current.find(ref => ref && ref.props.id === currentVideoId);
        if (videoElement) videoElement.getInternalPlayer().pauseVideo();
      } else if (!document.hidden && currentVideoId) {
        const videoElement = playerRefs.current.find(ref => ref && ref.props.id === currentVideoId);
        if (videoElement) videoElement.getInternalPlayer().playVideo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentVideoId]);

  useEffect(() => {
    // Pause video when navigating away from the page
    const handleUnload = () => {
      const videoElement = playerRefs.current.find(ref => ref && ref.props.id === currentVideoId);
      if (videoElement) videoElement.getInternalPlayer().pauseVideo();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [currentVideoId]);

  return (
    <div className={`videos-container ${theme}`}>
      <header className="header">
        <div className="header-left">
          <Link to='https://www.youtube.com'>
            <img src={YouTubeLogo} alt="YouTube Logo" className="youtube-logo" />
          </Link>
          <h1 className="youtube-text">YouTube</h1>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <FontAwesomeIcon icon={faSearch} className="search-icon" onClick={handleSearch} />
          <FontAwesomeIcon icon={faMicrophone} className="microphone-icon" onClick={handleSpeechSearch} />
        </div>
        <div className="user-info">
          <button className={`theme-toggle ${theme === 'dark' ? 'dark' : 'light'}`} onClick={toggleTheme}>
            <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
          </button>
          <span className="username">Self</span>
          <img src={UserLogo} alt="User Logo" className="user-logo" />
        </div>
      </header>

      {currentVideoId && (
        <div className="current-video">
          <h3>{videos.find(video => video._id === currentVideoId)?.title}</h3>
          <div className="video-player-large">
            <ReactPlayer
              id={currentVideoId}
              url={`https://www.youtube.com/watch?v=${currentVideoId}`}
              width="100%"
              height="100%"
              playing={true}
              controls
              config={{
                youtube: {
                  playerVars: {
                    autoplay: 1,
                    playsinline: 1,
                    modestbranding: 1,
                    rel: 0,
                    loop: 0, // Set to 0 to prevent auto-loop
                    // Add other parameters as required
                  },
                },
              }}
            />
          </div>
          <p>{videos.find(video => video._id === currentVideoId)?.description}</p>
          <div className="video-actions">
            <button className="btnn" onClick={() => handleLike(currentVideoId)}>
              <img src={LikeLogo} alt="Like" className="btn" /> {videos.find(video => video._id === currentVideoId)?.likes}
            </button>
            <button className="btnn" onClick={() => handleComment(currentVideoId, prompt('Enter your comment:'))}>
              <img src={CommentLogo} alt="Comment" className="btn" /> {videos.find(video => video._id === currentVideoId)?.comments.length}
            </button>
          </div>
          <div className="comments-section">
            {videos.find(video => video._id === currentVideoId)?.comments.map((comment, index) => (
              <p key={index} className="comment">{comment}</p>
            ))}
          </div>
        </div>
      )}

      <ul className="video-list">
        {videos.filter(video => video._id !== currentVideoId).map((video, index) => (
          <li key={video._id} className="video-item">
            <h3>{video.title}</h3>
            <div className="video-player">
              <ReactPlayer
                id={video._id}
                ref={el => playerRefs.current[index] = el}
                url={video.videoUrl}
                width="100%"
                height="100%"
                playing={false}
                controls
                onPlay={() => handlePlay(video._id)}
                config={{
                  youtube: {
                    playerVars: {
                      autoplay: 0, // Set to 0 to prevent auto-play on initial load
                      playsinline: 1,
                      modestbranding: 1,
                      rel: 0,
                      loop: 0, // Optional: Loop video playback
                      // Add other parameters as required
                    },
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

      <footer className="footer">
        <p>&copy; 2024 YouTube Pvt Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
