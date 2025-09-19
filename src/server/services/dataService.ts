import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { CropData, PestData, SoilData, SupportedState, StateDataset } from '../types';

export class DataService {
  private static dataCache: Map<string, any> = new Map();
  private static readonly DATA_ROOT = path.join(__dirname, '../../../');

  /**
   * Get dataset for a specific state
   */
  static async getStateDataset(state: SupportedState): Promise<StateDataset> {
    const normalizedState = this.normalizeStateName(state);
    const cacheKey = `dataset_${normalizedState}`;

    // Check cache first
    if (this.dataCache.has(cacheKey)) {
      return this.dataCache.get(cacheKey);
    }

    try {
      const dataset: StateDataset = {
        crops: [],
        pests: [],
        soilMoisture: []
      };

      // Load crop data
      const cropData = await this.loadCropData(normalizedState);
      if (cropData.length > 0) {
        dataset.crops = cropData;
      }

      // Load pest data
      const pestData = await this.loadPestData(normalizedState);
      if (pestData.length > 0) {
        dataset.pests = pestData;
      }

      // Load soil moisture data
      const soilData = await this.loadSoilMoistureData(normalizedState);
      if (soilData.length > 0) {
        dataset.soilMoisture = soilData;
      }

      // Cache the result
      this.dataCache.set(cacheKey, dataset);
      
      return dataset;
    } catch (error) {
      console.error(`Error loading dataset for ${state}:`, error);
      throw new Error(`Failed to load dataset for ${state}`);
    }
  }

  /**
   * Search crops by query
   */
  static async searchCrops(state: SupportedState, query: string): Promise<CropData[]> {
    const dataset = await this.getStateDataset(state);
    const searchTerm = query.toLowerCase();

    return dataset.crops.filter(crop => 
      crop.crop.toLowerCase().includes(searchTerm) ||
      crop.category.toLowerCase().includes(searchTerm) ||
      crop.notes.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get crop recommendations based on conditions
   */
  static async getCropRecommendations(
    state: SupportedState, 
    conditions?: { season?: string; soilType?: string }
  ): Promise<CropData[]> {
    const dataset = await this.getStateDataset(state);
    
    // For now, return high importance crops
    // TODO: Implement more sophisticated filtering based on conditions
    return dataset.crops
      .filter(crop => crop.economic_importance.toLowerCase() === 'high')
      .slice(0, 10);
  }

  /**
   * Load crop data from CSV
   */
  private static async loadCropData(state: string): Promise<CropData[]> {
    const possiblePaths = [
      `${state}_dataset/${state}_crops_economic_importance.csv`,
      `${state}_dataset/${state}_crops_economic_output.csv`,
      `${state}/${state}_crops_economic_importance.csv`
    ];

    for (const relativePath of possiblePaths) {
      const filePath = path.join(this.DATA_ROOT, relativePath);
      if (fs.existsSync(filePath)) {
        return this.readCSV<CropData>(filePath);
      }
    }

    console.warn(`No crop data found for state: ${state}`);
    return [];
  }

  /**
   * Load pest data from CSV
   */
  private static async loadPestData(state: string): Promise<PestData[]> {
    const possiblePaths = [
      `${state}_dataset/${state}_pests_natural_pesticides.csv`,
      `${state}_dataset/${state}_pests___natural_pesticides__common_names_.csv`
    ];

    for (const relativePath of possiblePaths) {
      const filePath = path.join(this.DATA_ROOT, relativePath);
      if (fs.existsSync(filePath)) {
        return this.readCSV<PestData>(filePath);
      }
    }

    console.warn(`No pest data found for state: ${state}`);
    return [];
  }

  /**
   * Load soil moisture data from CSV
   */
  private static async loadSoilMoistureData(state: string): Promise<any[]> {
    const filePath = path.join(this.DATA_ROOT, `Soil moisture/sm_${this.capitalizeFirst(state)}_2020.csv`);
    
    if (fs.existsSync(filePath)) {
      return this.readCSV<any>(filePath);
    }

    console.warn(`No soil moisture data found for state: ${state}`);
    return [];
  }

  /**
   * Generic CSV reader
   */
  private static readCSV<T>(filePath: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const results: T[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data as T))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Normalize state name for file system
   */
  private static normalizeStateName(state: SupportedState): string {
    const stateMap: Record<string, string> = {
      'kerala': 'kerala',
      'karnataka': 'Karnataka',
      'jharkhand': 'Jharkhand',
      'uttarpradesh': 'utterpradesh',
      'up': 'utterpradesh'
    };

    return stateMap[state.toLowerCase()] || state.toLowerCase();
  }

  /**
   * Capitalize first letter
   */
  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Get pH recommendation data
   */
  static async getPHRecommendations(): Promise<any[]> {
    const filePath = path.join(this.DATA_ROOT, 'PH data/Crop_recommendation.csv');
    
    if (fs.existsSync(filePath)) {
      return this.readCSV<any>(filePath);
    }

    return [];
  }

  /**
   * Clear cache (useful for development)
   */
  static clearCache(): void {
    this.dataCache.clear();
  }
}
