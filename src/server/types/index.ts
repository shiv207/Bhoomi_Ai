// Weather API Types
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

// AI Query Types
export interface AIQuery {
  query: string;
  state: string;
  location?: {
    lat: number;
    lon: number;
  };
  context?: {
    weather?: WeatherData;
    crops?: CropData[];
    soilData?: SoilData;
  };
}

export interface AIResponse {
  response: string;
  sources: string[];
  recommendations: string[];
  confidence: number;
  multiAgentAnalysis?: any;
  executedTools?: any[]; // Browser search results and tool executions
  shouldTriggerFertilizerPane?: boolean;
  fertilizerContext?: {
    location: string;
    detectedCrops: string[];
    soilType: string;
    expectedYield: string;
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

export interface PestData {
  pest_name: string;
  crop_affected: string;
  natural_pesticide: string;
  preparation_method: string;
  application_method: string;
  effectiveness: string;
}

export interface SoilData {
  state: string;
  district?: string;
  ph_level?: number;
  moisture_content?: number;
  organic_matter?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Supported States
export type SupportedState = 'kerala' | 'karnataka' | 'jharkhand' | 'uttarpradesh' | 'up';

export interface StateDataset {
  crops: CropData[];
  pests?: PestData[];
  soilMoisture?: any[];
}
