import express from 'express';
import { WeatherService } from '../services/weatherService';
import { ApiResponse, WeatherData } from '../types';

export const weatherRouter = express.Router();

/**
 * GET /api/weather/current?city=cityName&state=stateName
 * Get current weather by city name
 */
weatherRouter.get('/current', async (req, res) => {
  try {
    const { city, state } = req.query;

    if (!city || typeof city !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'City parameter is required'
      } as ApiResponse<never>);
    }

    const weatherData = await WeatherService.getCurrentWeatherByCity(
      city,
      state as string
    );

    res.json({
      success: true,
      data: weatherData
    } as ApiResponse<WeatherData>);

  } catch (error: any) {
    console.error('Weather route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/weather/coords?lat=latitude&lon=longitude
 * Get current weather by coordinates
 */
weatherRouter.get('/coords', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude parameters are required'
      } as ApiResponse<never>);
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude or longitude values'
      } as ApiResponse<never>);
    }

    const weatherData = await WeatherService.getCurrentWeatherByCoords(latitude, longitude);

    res.json({
      success: true,
      data: weatherData
    } as ApiResponse<WeatherData>);

  } catch (error: any) {
    console.error('Weather coords route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/weather/extended
 * Get extended weather forecast (3-4 months) with agricultural insights
 */
weatherRouter.get('/extended', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      } as ApiResponse<never>);
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude or longitude values'
      } as ApiResponse<never>);
    }

    const extendedWeatherData = await WeatherService.getExtendedForecast(latitude, longitude);

    res.json({
      success: true,
      data: extendedWeatherData,
      message: 'Extended weather forecast with agricultural insights retrieved successfully'
    } as ApiResponse<typeof extendedWeatherData>);

  } catch (error: any) {
    console.error('Extended weather route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/weather/forecast
 * Get 5-day weather forecast by coordinates
 */
weatherRouter.get('/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude parameters are required'
      } as ApiResponse<never>);
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude or longitude values'
      } as ApiResponse<never>);
    }

    const forecastData = await WeatherService.getForecast(latitude, longitude);

    res.json({
      success: true,
      data: forecastData
    } as ApiResponse<WeatherData>);

  } catch (error: any) {
    console.error('Weather forecast route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<never>);
  }
});
