import express from 'express';
import { DataService } from '../services/dataService';
import { ApiResponse, StateDataset, CropData, SupportedState } from '../types';

export const dataRouter = express.Router();

/**
 * GET /api/data/states
 * Get list of supported states
 */
dataRouter.get('/states', (req, res) => {
  const supportedStates = [
    { code: 'kerala', name: 'Kerala' },
    { code: 'karnataka', name: 'Karnataka' },
    { code: 'jharkhand', name: 'Jharkhand' },
    { code: 'uttarpradesh', name: 'Uttar Pradesh' },
    { code: 'up', name: 'Uttar Pradesh (UP)' }
  ];

  res.json({
    success: true,
    data: supportedStates,
    message: 'Supported states retrieved successfully'
  } as ApiResponse<typeof supportedStates>);
});

/**
 * GET /api/data/ph-recommendations
 * Get pH-based crop recommendations
 */
dataRouter.get('/ph-recommendations', async (req, res) => {
  try {
    const phData = await DataService.getPHRecommendations();

    res.json({
      success: true,
      data: phData,
      message: `Found ${phData.length} pH-based recommendations`
    } as ApiResponse<any[]>);

  } catch (error: any) {
    console.error('pH recommendations route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<never>);
  }
});

/**
 * POST /api/data/clear-cache
 * Clear data cache (development endpoint)
 */
dataRouter.post('/clear-cache', (req, res) => {
  try {
    DataService.clearCache();
    
    res.json({
      success: true,
      message: 'Data cache cleared successfully'
    } as ApiResponse<never>);

  } catch (error: any) {
    console.error('Clear cache route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/data/:state
 * Get complete dataset for a state
 */
dataRouter.get('/:state', async (req, res) => {
  try {
    const { state } = req.params;
    
    if (!state) {
      return res.status(400).json({
        success: false,
        error: 'State parameter is required'
      } as ApiResponse<never>);
    }

    const normalizedState = state.toLowerCase() as SupportedState;
    const supportedStates = ['kerala', 'karnataka', 'jharkhand', 'uttarpradesh', 'up'];
    
    if (!supportedStates.includes(normalizedState)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported state. Supported states: ${supportedStates.join(', ')}`
      } as ApiResponse<never>);
    }

    const dataset = await DataService.getStateDataset(normalizedState);

    res.json({
      success: true,
      data: dataset,
      message: `Dataset for ${state} retrieved successfully`
    } as ApiResponse<StateDataset>);

  } catch (error: any) {
    console.error('Data route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/data/:state/crops
 * Get crops data for a state
 */
dataRouter.get('/:state/crops', async (req, res) => {
  try {
    const { state } = req.params;
    const { search, importance } = req.query;

    const normalizedState = state.toLowerCase() as SupportedState;
    const dataset = await DataService.getStateDataset(normalizedState);

    let crops = dataset.crops;

    // Filter by search term
    if (search && typeof search === 'string') {
      crops = await DataService.searchCrops(normalizedState, search);
    }

    // Filter by importance level
    if (importance && typeof importance === 'string') {
      crops = crops.filter(crop => 
        crop.economic_importance.toLowerCase() === importance.toLowerCase()
      );
    }

    res.json({
      success: true,
      data: crops,
      message: `Found ${crops.length} crops for ${state}`
    } as ApiResponse<CropData[]>);

  } catch (error: any) {
    console.error('Crops data route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<never>);
  }
});

/**
 * GET /api/data/:state/recommendations
 * Get crop recommendations for a state
 */
dataRouter.get('/:state/recommendations', async (req, res) => {
  try {
    const { state } = req.params;
    const { season, soilType } = req.query;

    const normalizedState = state.toLowerCase() as SupportedState;
    
    const recommendations = await DataService.getCropRecommendations(
      normalizedState,
      {
        season: season as string,
        soilType: soilType as string
      }
    );

    res.json({
      success: true,
      data: recommendations,
      message: `Found ${recommendations.length} crop recommendations for ${state}`
    } as ApiResponse<CropData[]>);

  } catch (error: any) {
    console.error('Recommendations route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    } as ApiResponse<never>);
  }
});
