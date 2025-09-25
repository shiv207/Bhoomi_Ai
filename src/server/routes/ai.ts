import express from 'express';
import { AIService } from '../services/aiService';
import { WeatherService } from '../services/weatherService';
import { DataService } from '../services/dataService';
import { ApiResponse, AIResponse, AIQuery, SupportedState } from '../types';

export const aiRouter = express.Router();

/**
 * POST /api/ai/ask
 * Main AI advisory endpoint
 */
aiRouter.post('/ask', async (req, res) => {
  try {
    const { query, state, location } = req.body;

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string'
      } as ApiResponse<never>);
    }

    // Use provided state or default to kerala
    const stateValue = state && typeof state === 'string' ? state : 'kerala';
    
    // Normalize state name
    const normalizedState = stateValue.toLowerCase() as SupportedState;
    const supportedStates = ['kerala', 'karnataka', 'jharkhand', 'uttarpradesh', 'up'];
    
    if (!supportedStates.includes(normalizedState)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported state. Supported states: ${supportedStates.join(', ')}`
      } as ApiResponse<never>);
    }

    // Build AI query with context
    const aiQuery: AIQuery = {
      query,
      state: normalizedState,
      location,
      context: {}
    };

    let weatherData;

    // Fetch extended weather data if location is provided
    if (location) {
      try {
        weatherData = await WeatherService.getExtendedForecast(
          location.lat,
          location.lon
        );
      } catch (error) {
        console.error('Failed to fetch extended weather data:', error);
        // Fallback to basic weather data
        try {
          weatherData = await WeatherService.getCurrentWeatherByCoords(
            location.lat,
            location.lon
          );
        } catch (fallbackError) {
          console.error('Failed to fetch basic weather data:', fallbackError);
          // Continue without weather data
        }
      }
    }

    // Fetch relevant crop data
    try {
      const stateDataset = await DataService.getStateDataset(normalizedState);
      aiQuery.context!.crops = stateDataset.crops;
      
      // Add soil data if available
      if (stateDataset.soilMoisture && stateDataset.soilMoisture.length > 0) {
        aiQuery.context!.soilData = {
          state: normalizedState,
          moisture_content: stateDataset.soilMoisture[0]?.moisture || undefined
        };
      }
    } catch (dataError) {
      console.warn('Failed to fetch dataset:', dataError);
      // Continue without dataset
    }

    // Generate AI response
    const aiResponse = await AIService.generateResponse(aiQuery);

    res.json({
      success: true,
      data: aiResponse
    } as ApiResponse<AIResponse>);

  } catch (error: any) {
    console.error('AI ask route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<never>);
  }
});

/**
 * POST /api/ai/quick-advice
 * Quick advice endpoint for common queries
 */
aiRouter.post('/quick-advice', async (req, res) => {
  try {
    const { type, state, params } = req.body;

    if (!type || !state) {
      return res.status(400).json({
        success: false,
        error: 'Type and state are required'
      } as ApiResponse<never>);
    }

    let query = '';
    
    // Generate query based on type
    switch (type) {
      case 'crop-recommendation':
        query = `What crops should I plant in ${state} during the current season?`;
        break;
      case 'pest-control':
        query = `What are common pests in ${state} and how can I control them naturally?`;
        break;
      case 'weather-advice':
        query = `How should I adjust my farming practices based on current weather conditions?`;
        break;
      case 'soil-health':
        query = `How can I improve my soil health in ${state}?`;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid advice type'
        } as ApiResponse<never>);
    }

    // Use the main ask endpoint logic
    const aiQuery: AIQuery = {
      query,
      state: state.toLowerCase() as SupportedState,
      context: {}
    };

    // Fetch dataset
    try {
      const stateDataset = await DataService.getStateDataset(state.toLowerCase() as SupportedState);
      aiQuery.context!.crops = stateDataset.crops;
    } catch (error) {
      console.warn('Failed to fetch dataset for quick advice:', error);
    }

    const aiResponse = await AIService.generateResponse(aiQuery);

    res.json({
      success: true,
      data: aiResponse
    } as ApiResponse<AIResponse>);

  } catch (error: any) {
    console.error('Quick advice route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<never>);
  }
});
