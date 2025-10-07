import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ApiService } from '../services/api';
import { LocationData, WeatherData } from '../types';
import LLMMarkdownRenderer from './LLMMarkdownRenderer';
import './TerminalChat.css';

interface TerminalMessage {
  id: string;
  type: 'system' | 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

export const TerminalChat: React.FC = () => {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [userState, setUserState] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (message: Omit<TerminalMessage, 'id'>) => {
    const newMessage: TerminalMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const initializeTerminal = useCallback(async () => {
    // Minimal initialization - location detection happens on page load
    console.log('🚀 Terminal initialized');
  }, []);

  const loadWeatherAndState = useCallback(async (locationData: LocationData) => {
    try {
      const weatherData = await ApiService.getCurrentWeatherByCoords(
        locationData.lat, 
        locationData.lon
      );
      setWeather(weatherData);

      // Determine state from coordinates
      const detectedState = determineStateFromLocation(locationData.lat, locationData.lon);
      setUserState(detectedState);

    } catch (error) {
      console.log('Failed to fetch weather data, using defaults');
      setUserState('kerala'); // Default fallback
    }
  }, []);

  useEffect(() => {
    // Focus input on mount (only for welcome screen)
    if (messages.length === 0 && inputRef.current) {
      inputRef.current.focus();
    }
    
    // Auto-detect location immediately on mount
    if (!location && navigator.geolocation) {
      console.log('🌍 Requesting location permission...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('📍 Location detected:', position.coords.latitude, position.coords.longitude);
          const locationData: LocationData = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setLocation(locationData);
          // Fetch weather and determine state
          await loadWeatherAndState(locationData);
        },
        (error) => {
          console.log('❌ Location access denied or failed:', error.message);
          setUserState('kerala'); // Only set default if location completely fails
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  }, [messages.length, loadWeatherAndState, location]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const determineStateFromLocation = (lat: number, lon: number): string => {
    // Enhanced state detection for major Indian regions
    console.log(`🗺️ Determining state for coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    
    // Kerala (Southern India)
    if (lat >= 8.2 && lat <= 12.8 && lon >= 74.8 && lon <= 77.4) {
      console.log('🌴 Detected: Kerala');
      return 'kerala';
    }
    
    // Karnataka (South-West)
    if (lat >= 11.5 && lat <= 18.5 && lon >= 74.0 && lon <= 78.5) {
      console.log('🏛️ Detected: Karnataka');
      return 'karnataka';
    }
    
    // Uttar Pradesh (Northern plains)
    if (lat >= 23.8 && lat <= 30.4 && lon >= 77.0 && lon <= 84.6) {
      console.log('🌾 Detected: Uttar Pradesh');
      return 'uttarpradesh';
    }
    
    // Jharkhand (Eastern)
    if (lat >= 21.9 && lat <= 25.3 && lon >= 83.3 && lon <= 87.9) {
      console.log('🌲 Detected: Jharkhand');
      return 'jharkhand';
    }
    
    // Maharashtra (West-Central)
    if (lat >= 15.6 && lat <= 22.0 && lon >= 72.6 && lon <= 80.9) {
      console.log('🏭 Detected: Maharashtra (using Karnataka data)');
      return 'karnataka'; // Use Karnataka as similar region
    }
    
    // Tamil Nadu (South-East)
    if (lat >= 8.0 && lat <= 13.6 && lon >= 76.2 && lon <= 80.3) {
      console.log('🏯 Detected: Tamil Nadu (using Karnataka data)');
      return 'karnataka'; // Use Karnataka as similar region
    }
    
    // Andhra Pradesh & Telangana (South-Central)
    if (lat >= 12.6 && lat <= 19.9 && lon >= 77.0 && lon <= 84.8) {
      console.log('💎 Detected: Andhra Pradesh/Telangana (using Karnataka data)');
      return 'karnataka'; // Use Karnataka as similar region
    }
    
    // Rajasthan (North-West)
    if (lat >= 23.0 && lat <= 30.2 && lon >= 69.5 && lon <= 78.3) {
      console.log('🐪 Detected: Rajasthan (using UP data)');
      return 'uttarpradesh'; // Use UP as similar northern region
    }
    
    // Punjab & Haryana (North)
    if (lat >= 27.4 && lat <= 32.5 && lon >= 73.9 && lon <= 77.6) {
      console.log('🌾 Detected: Punjab/Haryana (using UP data)');
      return 'uttarpradesh'; // Use UP as similar northern region
    }
    
    // Gujarat (West)
    if (lat >= 20.1 && lat <= 24.7 && lon >= 68.2 && lon <= 74.5) {
      console.log('🦁 Detected: Gujarat (using Karnataka data)');
      return 'karnataka'; // Use Karnataka as similar region
    }
    
    // West Bengal (East)
    if (lat >= 21.8 && lat <= 27.2 && lon >= 85.8 && lon <= 89.9) {
      console.log('🐅 Detected: West Bengal (using Jharkhand data)');
      return 'jharkhand'; // Use Jharkhand as similar eastern region
    }
    
    // Default fallback based on general region
    if (lat >= 8 && lat <= 20) {
      console.log('🌴 Southern India - defaulting to Kerala');
      return 'kerala';
    } else if (lat >= 20 && lat <= 28) {
      console.log('🏭 Central India - defaulting to Karnataka');
      return 'karnataka';  
    } else if (lat >= 28) {
      console.log('🌾 Northern India - defaulting to UP');
      return 'uttarpradesh';
    } else {
      console.log('❓ Unknown region - defaulting to Kerala');
      return 'kerala';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    const isFirstMessage = messages.length === 0;
    setInputValue('');

    // Trigger cloth-like animation on first message
    if (isFirstMessage) {
      setIsTransitioning(true);
      
      // Start the transition animation
      setTimeout(async () => {
        await initializeTerminal();
        
        // Add user message after initialization
        addMessage({
          type: 'user',
          content: userMessage,
          timestamp: new Date()
        });

        setIsLoading(true);
        
        // Continue with AI processing...
        try {

          // Prepare AI query with context
          const aiQuery = {
            query: userMessage,
            state: userState || 'kerala', // Default to kerala if no state detected
            location: location || undefined
          };

          // Get AI response
          const aiResponse = await ApiService.askAI(aiQuery);

          // Add AI response
          addMessage({
            type: 'assistant',
            content: aiResponse.response,
            timestamp: new Date()
          });

        } catch (error: any) {
          addMessage({
            type: 'error',
            content: `Error: ${error.message}`,
            timestamp: new Date()
          });
        } finally {
          setIsLoading(false);
          setIsTransitioning(false);
        }
      }, 100);
      
      return;
    }

    // For subsequent messages, normal flow
    addMessage({
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    setIsLoading(true);

    try {
      // Prepare AI query with context
      const aiQuery = {
        query: userMessage,
        state: userState || 'kerala', // Default to kerala if no state detected
        location: location || undefined
      };

      // Get AI response
      const aiResponse = await ApiService.askAI(aiQuery);

      // Add AI response
      addMessage({
        type: 'assistant',
        content: aiResponse.response,
        timestamp: new Date()
      });

    } catch (error: any) {
      addMessage({
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show welcome screen if no messages
  const showWelcome = messages.length === 0;

  if (showWelcome && !isTransitioning) {
    return (
      <div className="terminal-chat">
        <div className={`welcome-screen ${isTransitioning ? 'welcome-to-chat' : ''}`}>
          <div className="welcome-container">
            {/* Animated Logo */}
            <div className="harvestly-logo">
              <div className="harvestly-logo-icon">
                <img 
                  src="/harvestly-logo.png" 
                  alt="Harvestly Logo" 
                  style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                />
              </div>
              <div className="harvestly-logo-text">Harvestly</div>
            </div>

            {/* Neumorphic Input */}
            <div className={`chatgpt-input-container ${isTransitioning ? 'input-transition' : ''}`}>
              <form onSubmit={handleSubmit}>
                <div className="chatgpt-input-wrapper">
                  <div className="input-leading">
                    <button type="button" className="input-btn" title="Add attachments">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.33496 16.5V10.665H3.5C3.13273 10.665 2.83496 10.3673 2.83496 10C2.83496 9.63273 3.13273 9.33496 3.5 9.33496H9.33496V3.5C9.33496 3.13273 9.63273 2.83496 10 2.83496C10.3673 2.83496 10.665 3.13273 10.665 3.5V9.33496H16.5L16.6338 9.34863C16.9369 9.41057 17.165 9.67857 17.165 10C17.165 10.3214 16.9369 10.5894 16.6338 10.6514L16.5 10.665H10.665V16.5C10.665 16.8673 10.3673 17.165 10 17.165C9.63273 17.165 9.33496 16.8673 9.33496 16.5Z"/>
                      </svg>
                    </button>
                  </div>
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything about farming..."
                    disabled={isLoading}
                    className="chatgpt-input"
                    rows={1}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <div className="input-trailing">
                    <button type="button" className="input-btn" title="Voice input">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.167 15.416V4.583a.75.75 0 0 1 1.5 0v10.833a.75.75 0 0 1-1.5 0Zm4.166-2.5V7.083a.75.75 0 0 1 1.5 0v5.833a.75.75 0 0 1-1.5 0ZM3 11.25V8.75a.75.75 0 0 1 1.5 0v2.5a.75.75 0 0 1-1.5 0Zm12.5 0V8.75a.75.75 0 0 1 1.5 0v2.5a.75.75 0 0 1-1.5 0Z"/>
                      </svg>
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading || !inputValue.trim()} 
                      className="input-btn send-btn"
                      title="Send message"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Pill-shaped Recommendations */}
            <div className="pill-recommendations">
              <button 
                className="pill-btn"
                onClick={() => setInputValue("What crops should I plant this season?")}
              >
                🌾 Seasonal Crop Planning
              </button>
              <button 
                className="pill-btn"
                onClick={() => setInputValue("How to analyze my soil conditions?")}
              >
                🌍 Soil Health Analysis
              </button>
              <button 
                className="pill-btn"
                onClick={() => setInputValue("What are the weather insights for farming?")}
              >
                ☁️ Weather Insights
              </button>
              <button 
                className="pill-btn"
                onClick={() => setInputValue("How to control pests naturally?")}
              >
                🐛 Natural Pest Control
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat mode
  return (
    <div className="terminal-chat chat-mode">
      <div className="chat-header">
        <div className="chat-title">Harvestly</div>
        <div className="chat-status">
          {location ? (
            <>
              📍 {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              {weather && ` • 🌡️ ${weather.current.temp}°C`}
              {userState && ` • 🗺️ ${userState.toUpperCase()}`}
            </>
          ) : (
            <span style={{ color: '#FF6B35' }}>📍 Detecting location...</span>
          )}
        </div>
      </div>

      <div className="terminal-messages">
        {messages.map((message) => (
          <div key={message.id} className={`terminal-message ${message.type}`}>
            <div className="message-content">
              {message.type === 'assistant' ? (
                <LLMMarkdownRenderer content={message.content} isStreamFinished={true} />
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="terminal-message assistant">
            <div className="message-content loading">
              Harvestly is thinking...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Harvestly about farming..."
            disabled={isLoading}
            className="chat-input"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="send-button"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};
