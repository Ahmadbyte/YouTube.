import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';
import ReactPlayer from 'react-player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faMicrophone, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import YouTubeLogo from '../youtube.png';
import UserLogo from '../user.png';
import LikeLogo from '../like.png';
import CommentLogo from '../cmt.png';

const API_KEYS = [
  'AIzaSyCHLcT5XF4DqwyDJ3rPIDkV2DwvyAGee8Q',
  'AIzaSyA-Olt7-UB9p5tEhbNzkGxbUnjLjzaLv7I',
  'AIzaSyAMfjkTiVru8DaqGjSa1ps0QspxNJSBbrE',
  'AIzaSyAh--OFztAec_Q4pYhGb1JUdZFdWfE0oPY',
  'AIzaSyA86LyjZ1t4BIOhe26B0DDnXnwwA5Ds2-E',
  'AIzaSyBSynr6Sts-ATnbOPM-7sHjGe6TLHtR92A',
];

let currentApiKeyIndex = 0;

const getApiKey = () => API_KEYS[currentApiKeyIndex];

const handleApiError = (error, fetchFunction, ...args) => {
  if (error.response && error.response.status === 403) {
    currentApiKeyIndex = (currentApiKeyIndex + 1) % API_KEYS.length;
    fetchFunction(...args);
  } else {
    console.error('Error fetching videos', error);
  }
};

const fetchVideoStats = async (videoId) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${getApiKey()}&part=statistics`
    );
    const { viewCount, likeCount } = response.data.items[0].statistics;
    return {
      views: parseInt(viewCount, 10),
      likes: parseInt(likeCount, 10),
    };
  } catch (error) {
    console.error('Error fetching video stats', error);
    return {
      views: 0,
      likes: 0,
    };
  }
};

const formatNumber = (number) => {
  if (number >= 1e6) {
    return (number / 1e6).toFixed(1) + 'M';
  }
  if (number >= 1e3) {
    return (number / 1e3).toFixed(1) + 'K';
  }
  return number.toString();
};

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('light');
  const recognitionRef = useRef(null);
  const playerRefs = useRef([]);
  const currentVideoContainerRef = useRef(null);

  const fetchDefaultVideos = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?key=${getApiKey()}&q=reactjs tutorials&part=snippet,id&order=relevance&type=video&videoDuration=long&maxResults=20`
      );
      const videoData = await Promise.all(response.data.items.map(async (item) => {
        const stats = await fetchVideoStats(item.id.videoId);
        return {
          _id: item.id.videoId,
          title: item.snippet.title,
          videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          description: item.snippet.description,
          likes: stats.likes,
          views: stats.views,
          comments: [],
        };
      }));
      setVideos(videoData);
    } catch (error) {
      handleApiError(error, fetchDefaultVideos);
    }
  }, []);

  useEffect(() => {
    fetchDefaultVideos();
  }, [fetchDefaultVideos]);

  const fetchVideos = useCallback(async (query) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?key=${getApiKey()}&q=${query}&part=snippet,id&type=video&order=relevance&maxResults=20&videoDuration=long`
      );
      const videoData = await Promise.all(response.data.items.map(async (item) => {
        const stats = await fetchVideoStats(item.id.videoId);
        return {
          _id: item.id.videoId,
          title: item.snippet.title,
          videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          description: item.snippet.description,
          likes: stats.likes,
          views: stats.views,
          comments: [],
        };
      }));
      setVideos(videoData);
      setCurrentVideoId(null); // Reset current video when fetching new videos
    } catch (error) {
      handleApiError(error, fetchVideos, query);
    }
  }, []);

  const fetchRelatedVideos = useCallback(async (videoId) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&key=${getApiKey()}&maxResults=10`
      );
      const relatedVideoData = await Promise.all(response.data.items.map(async (item) => {
        const stats = await fetchVideoStats(item.id.videoId);
        return {
          _id: item.id.videoId,
          title: item.snippet.title,
          videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          description: item.snippet.description,
          likes: stats.likes,
          views: stats.views,
          comments: [],
        };
      }));
      setVideos(relatedVideoData); // Replace current videos with related videos
    } catch (error) {
      handleApiError(error, fetchRelatedVideos, videoId);
    }
  }, []);

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
  }, [fetchVideos]);

  const handleLike = (id) => {
    const updatedVideos = videos.map((video) => {
      if (video._id === id) {
        return { ...video, likes: video.likes + 1 };
      }
      return video;
    });
    setVideos(updatedVideos);
  };

  const handleComment = (id, comment) => {
    const updatedVideos = videos.map((video) => {
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
    currentVideoContainerRef.current.scrollIntoView({ behavior: 'smooth' }); // Scroll to the current video container
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleSpeechSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentVideoId) {
        const videoElement = playerRefs.current.find((ref) => ref && ref.props.id === currentVideoId);
        if (videoElement) videoElement.getInternalPlayer().pauseVideo();
      } else if (!document.hidden && currentVideoId) {
        const videoElement = playerRefs.current.find((ref) => ref && ref.props.id === currentVideoId);
        if (videoElement) videoElement.getInternalPlayer().playVideo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentVideoId]);

  useEffect(() => {
    const handleUnload = () => {
      const videoElement = playerRefs.current.find((ref) => ref && ref.props.id === currentVideoId);
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
        <div className="current-video" ref={currentVideoContainerRef}>
          <h3 className='title'>{videos.find((video) => video._id === currentVideoId)?.title}</h3>
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
                  },
                },
              }}
            />
          </div>
          <p className='description'>{videos.find((video) => video._id === currentVideoId)?.description}</p>
          <div className="video-actions">
            <button className="btnn" onClick={() => handleLike(currentVideoId)}>
              <img src={LikeLogo} alt="Like" className="btn" /> {formatNumber(videos.find((video) => video._id === currentVideoId)?.likes)}
            </button>
            <button className="btnn" onClick={() => handleComment(currentVideoId, prompt('Enter your comment:'))}>
              <img src={CommentLogo} alt="Comment" className="btn" /> {videos.find((video) => video._id === currentVideoId)?.comments.length}
            </button>
          </div>
          <div className="comments-section">
            {videos.find((video) => video._id === currentVideoId)?.comments.map((comment, index) => (
              <p key={index} className="comment">{comment}</p>
            ))}
          </div>
        </div>
      )}

      <ul className="video-list">
        {videos.filter((video) => video._id !== currentVideoId).map((video, index) => (
          <li key={video._id} className="video-item">
            <h3 className='title'>{video.title}</h3>
            <div className="video-player">
              <ReactPlayer
                id={video._id}
                ref={(el) => playerRefs.current[index] = el}
                url={video.videoUrl}
                width="100%"
                height="100%"
                playing={false}
                controls
                onPlay={() => handlePlay(video._id)}
                config={{
                  youtube: {
                    playerVars: {
                      autoplay: 0,
                      playsinline: 1,
                      modestbranding: 1,
                      rel: 0,
                      loop: 0,
                    },
                  },
                }}
              />
            </div>
            <p className='description'>{video.description}</p>
            <div className="video-stats">
              <span>{formatNumber(video.views)} views </span>
              <span>{formatNumber(video.likes)} likes</span>
            </div>
            <div className="video-actions">
              <button className="btnn" onClick={() => handleLike(video._id)}>
                <img src={LikeLogo} alt="Like" className="btn" /> {formatNumber(video.likes)}
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
        <p>&copy; 2024 YouTube Pvt Ltd. All rights reserved by @_Ahmad.</p>
      </footer>
    </div>
  );
};

export default Home;
