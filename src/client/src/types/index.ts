// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Weather Types
export interface WeatherData {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    weather: {
      main: string;
      description: string;
      icon: string;
    }[];
  };
  forecast?: {
    date: string;
    temp_max: number;
    temp_min: number;
    humidity: number;
    weather: {
      main: string;
      description: string;
    };
  }[];
}

// AI Types
export interface AIResponse {
  response: string;
  confidence: number;
  sources: string[];
  recommendations?: string[];
}

export interface AIQuery {
  query: string;
  state: string;
  location?: {
    lat: number;
    lon: number;
  };
}

// Dataset Types
export interface CropData {
  crop: string;
  category: string;
  economic_importance: string;
  primary_districts: string;
  notes: string;
  source: string;
}

export interface StateInfo {
  code: string;
  name: string;
}

// UI Types
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  weather?: WeatherData;
  recommendations?: string[];
}

export interface LocationData {
  lat: number;
  lon: number;
  city?: string;
  state?: string;
}
