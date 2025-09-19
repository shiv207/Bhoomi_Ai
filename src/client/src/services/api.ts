import axios from 'axios';
import { ApiResponse, WeatherData, AIResponse, AIQuery, CropData, StateInfo } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class ApiService {
  // Weather API calls
  static async getCurrentWeatherByCity(city: string, state?: string): Promise<WeatherData> {
    const response = await api.get<ApiResponse<WeatherData>>('/weather/current', {
      params: { city, state }
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch weather data');
    }
    
    return response.data.data;
  }

  static async getCurrentWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
    const response = await api.get<ApiResponse<WeatherData>>('/weather/coords', {
      params: { lat, lon }
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch weather data');
    }
    
    return response.data.data;
  }

  static async getWeatherForecast(lat: number, lon: number): Promise<WeatherData> {
    const response = await api.get<ApiResponse<WeatherData>>('/weather/forecast', {
      params: { lat, lon }
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch forecast data');
    }
    
    return response.data.data;
  }

  // AI API calls
  static async askAI(query: AIQuery): Promise<AIResponse> {
    const response = await api.post<ApiResponse<AIResponse>>('/ai/ask', query);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get AI response');
    }
    
    return response.data.data;
  }

  static async getQuickAdvice(type: string, state: string, params?: any): Promise<AIResponse> {
    const response = await api.post<ApiResponse<AIResponse>>('/ai/quick-advice', {
      type,
      state,
      params
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get quick advice');
    }
    
    return response.data.data;
  }

  // Data API calls
  static async getStateData(state: string): Promise<any> {
    const response = await api.get<ApiResponse<any>>(`/data/${state}`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch state data');
    }
    
    return response.data.data;
  }

  static async getStateCrops(state: string, search?: string, importance?: string): Promise<CropData[]> {
    const response = await api.get<ApiResponse<CropData[]>>(`/data/${state}/crops`, {
      params: { search, importance }
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch crops data');
    }
    
    return response.data.data;
  }

  static async getCropRecommendations(state: string, season?: string, soilType?: string): Promise<CropData[]> {
    const response = await api.get<ApiResponse<CropData[]>>(`/data/${state}/recommendations`, {
      params: { season, soilType }
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch crop recommendations');
    }
    
    return response.data.data;
  }

  static async getSupportedStates(): Promise<StateInfo[]> {
    const response = await api.get<ApiResponse<StateInfo[]>>('/data/states');
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch supported states');
    }
    
    return response.data.data;
  }

  // Health check
  static async healthCheck(): Promise<any> {
    const response = await api.get('/health');
    return response.data;
  }
}
