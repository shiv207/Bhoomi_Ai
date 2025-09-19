import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ApiService } from '../services/api';
import { LocationData, WeatherData } from '../types';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (message: Omit<TerminalMessage, 'id'>) => {
    const newMessage: TerminalMessage = {
      ...message,
      id: Date.now().toString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const initializeTerminal = useCallback(async () => {
    addMessage({
      type: 'system',
      content: '🌾 BHOOMI AI TERMINAL v1.0',
      timestamp: new Date()
    });

    addMessage({
      type: 'system',
      content: 'Initializing agricultural advisory system...',
      timestamp: new Date()
    });

    // Auto-detect location
    if (navigator.geolocation) {
      addMessage({
        type: 'system',
        content: 'Detecting your location...',
        timestamp: new Date()
      });

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData: LocationData = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setLocation(locationData);

          addMessage({
            type: 'system',
            content: `Location detected: ${locationData.lat.toFixed(4)}, ${locationData.lon.toFixed(4)}`,
            timestamp: new Date()
          });

          // Fetch weather and determine state
          await loadWeatherAndState(locationData);
        },
        (error) => {
          addMessage({
            type: 'error',
            content: 'Location access denied. Using default location (Kerala).',
            timestamp: new Date()
          });
          setUserState('kerala');
          showReadyMessage();
        }
      );
    } else {
      addMessage({
        type: 'error',
        content: 'Geolocation not supported. Using default location (Kerala).',
        timestamp: new Date()
      });
      setUserState('kerala');
      showReadyMessage();
    }
  }, []);

  useEffect(() => {
    initializeTerminal();
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [initializeTerminal]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadWeatherAndState = async (locationData: LocationData) => {
    try {
      addMessage({
        type: 'system',
        content: 'Fetching weather data...',
        timestamp: new Date()
      });

      const weatherData = await ApiService.getCurrentWeatherByCoords(
        locationData.lat,
        locationData.lon
      );
      setWeather(weatherData);

      addMessage({
        type: 'system',
        content: `Weather: ${weatherData.current.temp}°C, ${weatherData.current.weather[0].description}`,
        timestamp: new Date()
      });

      // Determine state based on location (simplified mapping)
      const detectedState = determineStateFromLocation(locationData.lat, locationData.lon);
      setUserState(detectedState);

      addMessage({
        type: 'system',
        content: `Detected region: ${detectedState.toUpperCase()}`,
        timestamp: new Date()
      });

      showReadyMessage();

    } catch (error) {
      addMessage({
        type: 'error',
        content: 'Failed to fetch weather data. Continuing without weather context.',
        timestamp: new Date()
      });
      setUserState('kerala'); // Default fallback
      showReadyMessage();
    }
  };

  const determineStateFromLocation = (lat: number, lon: number): string => {
    // Simplified state detection based on coordinates
    if (lat >= 8 && lat <= 12 && lon >= 74 && lon <= 78) return 'kerala';
    if (lat >= 11 && lat <= 18 && lon >= 74 && lon <= 78) return 'karnataka';
    if (lat >= 21 && lat <= 25 && lon >= 83 && lon <= 88) return 'jharkhand';
    if (lat >= 23 && lat <= 31 && lon >= 77 && lon <= 85) return 'uttarpradesh';
    return 'kerala'; // Default fallback
  };

  const showReadyMessage = () => {
    addMessage({
      type: 'system',
      content: 'System ready. Type your farming questions below.',
      timestamp: new Date()
    });

    addMessage({
      type: 'system',
      content: 'Examples: "What crops to plant now?", "How to control pests?", "Soil management tips?"',
      timestamp: new Date()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    addMessage({
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    setIsLoading(true);

    try {
      // Show thinking indicator
      addMessage({
        type: 'system',
        content: 'Processing your query...',
        timestamp: new Date()
      });

      // Prepare AI query with context
      const aiQuery = {
        query: userMessage,
        state: userState,
        location: location || undefined
      };

      // Get AI response
      const aiResponse = await ApiService.askAI(aiQuery);

      // Remove thinking indicator and add AI response
      setMessages(prev => prev.slice(0, -1));
      
      addMessage({
        type: 'assistant',
        content: aiResponse.response,
        timestamp: new Date()
      });

    } catch (error: any) {
      // Remove thinking indicator
      setMessages(prev => prev.slice(0, -1));
      
      addMessage({
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getMessagePrefix = (type: string) => {
    switch (type) {
      case 'system': return '[SYSTEM]';
      case 'user': return '[USER]';
      case 'assistant': return '[BHOOMI-AI]';
      case 'error': return '[ERROR]';
      default: return '[INFO]';
    }
  };

  return (
    <div className="terminal-chat">
      <div className="terminal-header">
        <div className="terminal-title">BHOOMI AI TERMINAL</div>
        <div className="terminal-status">
          {location && `LAT: ${location.lat.toFixed(4)} LON: ${location.lon.toFixed(4)}`}
          {weather && ` | ${weather.current.temp}°C`}
          {userState && ` | ${userState.toUpperCase()}`}
        </div>
      </div>

      <div className="terminal-messages">
        {messages.map((message) => (
          <div key={message.id} className={`terminal-message ${message.type}`}>
            <span className="message-timestamp">[{formatTimestamp(message.timestamp)}]</span>
            <span className="message-prefix">{getMessagePrefix(message.type)}</span>
            <span className="message-content">{message.content}</span>
          </div>
        ))}
        
        {isLoading && (
          <div className="terminal-message system">
            <span className="message-timestamp">[{formatTimestamp(new Date())}]</span>
            <span className="message-prefix">[SYSTEM]</span>
            <span className="message-content typing">Thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="terminal-input-form">
        <div className="terminal-prompt">
          <span className="prompt-symbol">$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your farming question..."
            disabled={isLoading}
            className="terminal-input"
            autoComplete="off"
          />
        </div>
      </form>
    </div>
  );
};
