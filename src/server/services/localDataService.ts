/**
 * Local Agricultural Dataset Service
 * Integrates uploaded CSV datasets with AI recommendations
 */

import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

interface FertilizerRecord {
  region: string;
  soilType: string;
  crop: string;
  yield: number;
  yieldUnit: string;
  pricePerKg: number;
  grossIncome: number;
  fertilizerRecommendation: string;
  notes: string;
  source: string;
}

interface EconomicRecord {
  crop: string;
  category: string;
  economicImportance: string;
  primaryDistricts: string;
  notes: string;
  source: string;
}

interface PestRecord {
  pest: string;
  cropAffected: string;
  economicImpact: string;
  naturalPesticides: string;
  notes: string;
}

export class LocalDataService {
  private static fertilizerData: FertilizerRecord[] = [];
  private static economicData: EconomicRecord[] = [];
  private static pestData: PestRecord[] = [];
  private static dataLoaded = false;

  /**
   * Initialize and load all local datasets
   */
  static async initializeDatasets(): Promise<void> {
    if (this.dataLoaded) return;

    try {
      console.log('📊 Loading local agricultural datasets...');
      
      const datasetPath = path.join(__dirname, '../../../Jharkhand_dataset');
      
      // Load fertilizer data
      await this.loadFertilizerData(path.join(datasetPath, 'fertizlers_jharkhand.csv'));
      
      // Load economic data  
      await this.loadEconomicData(path.join(datasetPath, 'jharkhand_crops_economic_importance.csv'));
      
      // Load pest data
      await this.loadPestData(path.join(datasetPath, 'jharkhand_pests_natural_pesticides.csv'));
      
      this.dataLoaded = true;
      console.log(`✅ Local datasets loaded: ${this.fertilizerData.length} fertilizer records, ${this.economicData.length} economic records, ${this.pestData.length} pest records`);
      
    } catch (error) {
      console.error('❌ Failed to load local datasets:', error);
      // Continue without local data - fallback to AI only
    }
  }

  /**
   * Load fertilizer dataset
   */
  private static async loadFertilizerData(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const results: FertilizerRecord[] = [];
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Fertilizer file not found: ${filePath}`);
        resolve();
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csvParser({
          separator: '\t', // Tab-separated
          headers: ['region', 'soilType', 'crop', 'yield', 'yieldUnit', 'pricePerKg', 'grossIncome', 'fertilizerRecommendation', 'notes', 'source']
        }))
        .on('data', (data) => {
          results.push({
            region: data.region?.trim() || '',
            soilType: data.soilType?.trim() || '',
            crop: data.crop?.trim() || '',
            yield: parseFloat(data.yield) || 0,
            yieldUnit: data.yieldUnit?.trim() || 'kg/ha',
            pricePerKg: parseFloat(data.pricePerKg) || 0,
            grossIncome: parseFloat(data.grossIncome) || 0,
            fertilizerRecommendation: data.fertilizerRecommendation?.trim() || '',
            notes: data.notes?.trim() || '',
            source: data.source?.trim() || ''
          });
        })
        .on('end', () => {
          this.fertilizerData = results;
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Load economic importance dataset
   */
  private static async loadEconomicData(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const results: EconomicRecord[] = [];
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Economic file not found: ${filePath}`);
        resolve();
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => {
          results.push({
            crop: data.crop?.trim() || '',
            category: data.category?.trim() || '',
            economicImportance: data.economic_importance?.trim() || '',
            primaryDistricts: data.primary_districts?.trim() || '',
            notes: data.notes?.trim() || '',
            source: data.source?.trim() || ''
          });
        })
        .on('end', () => {
          this.economicData = results;
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Load pest and natural pesticide dataset
   */
  private static async loadPestData(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const results: PestRecord[] = [];
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Pest file not found: ${filePath}`);
        resolve();
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => {
          results.push({
            pest: data.pest?.trim() || '',
            cropAffected: data.crop_affected?.trim() || '',
            economicImpact: data.economic_impact?.trim() || '',
            naturalPesticides: data.natural_pesticides?.trim() || '',
            notes: data.notes?.trim() || ''
          });
        })
        .on('end', () => {
          this.pestData = results;
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Get fertilizer recommendations from local dataset
   */
  static getFertilizerRecommendations(crop: string, soilType: string, location: string): FertilizerRecord[] {
    if (!this.dataLoaded) return [];

    const cropLower = crop.toLowerCase();
    const soilLower = soilType.toLowerCase();
    const locationLower = location.toLowerCase();

    return this.fertilizerData.filter(record => {
      const recordCrop = record.crop.toLowerCase();
      const recordSoil = record.soilType.toLowerCase();
      const recordRegion = record.region.toLowerCase();

      // Match crop (exact or partial)
      const cropMatch = recordCrop.includes(cropLower) || cropLower.includes(recordCrop);
      
      // Match soil type (if soil info provided)
      const soilMatch = !soilType || soilType === 'mixed' || 
                       recordSoil.includes(soilLower) || soilLower.includes(recordSoil);
      
      // Match region (if location includes jharkhand or vice versa)
      const regionMatch = !location || locationLower.includes('jharkhand') || 
                         recordRegion.includes(locationLower);

      return cropMatch && soilMatch && regionMatch;
    });
  }

  /**
   * Get economic importance data for crops
   */
  static getEconomicImportance(crop: string): EconomicRecord[] {
    if (!this.dataLoaded) return [];

    const cropLower = crop.toLowerCase();
    return this.economicData.filter(record => {
      const recordCrop = record.crop.toLowerCase();
      return recordCrop.includes(cropLower) || cropLower.includes(recordCrop);
    });
  }

  /**
   * Get pest control recommendations
   */
  static getPestRecommendations(crop: string): PestRecord[] {
    if (!this.dataLoaded) return [];

    const cropLower = crop.toLowerCase();
    return this.pestData.filter(record => {
      const recordCrop = record.cropAffected.toLowerCase();
      return recordCrop.includes(cropLower) || cropLower.includes(recordCrop);
    });
  }

  /**
   * Generate comprehensive local data summary
   */
  static generateLocalDataSummary(crop: string, soilType: string, location: string): string {
    const fertilizer = this.getFertilizerRecommendations(crop, soilType, location);
    const economic = this.getEconomicImportance(crop);
    const pest = this.getPestRecommendations(crop);

    let summary = `LOCAL DATASET RECOMMENDATIONS FOR ${crop.toUpperCase()}:\n\n`;

    // Fertilizer data
    if (fertilizer.length > 0) {
      summary += `🌾 FERTILIZER DATA (Local Dataset):\n`;
      fertilizer.forEach(record => {
        const yieldInQuintals = record.yieldUnit === 'kg/ha' ? 
          Math.round(record.yield / 100) : record.yield;
        const grossIncomeFormatted = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(record.grossIncome);

        summary += `- Soil: ${record.soilType}\n`;
        summary += `- Expected Yield: ${yieldInQuintals} quintals/hectare\n`;
        summary += `- Gross Income: ${grossIncomeFormatted}/hectare\n`;
        summary += `- Fertilizer: ${record.fertilizerRecommendation}\n`;
        summary += `- Notes: ${record.notes}\n\n`;
      });
    }

    // Economic importance
    if (economic.length > 0) {
      summary += `💰 ECONOMIC IMPORTANCE (Local Dataset):\n`;
      economic.forEach(record => {
        summary += `- Category: ${record.category}\n`;
        summary += `- Importance: ${record.economicImportance}\n`;
        summary += `- Primary Districts: ${record.primaryDistricts}\n`;
        summary += `- Economic Notes: ${record.notes}\n\n`;
      });
    }

    // Pest management
    if (pest.length > 0) {
      summary += `🐛 PEST MANAGEMENT (Local Dataset):\n`;
      pest.forEach(record => {
        summary += `- Pest: ${record.pest}\n`;
        summary += `- Economic Impact: ${record.economicImpact}\n`;
        summary += `- Natural Control: ${record.naturalPesticides}\n`;
        summary += `- Management Notes: ${record.notes}\n\n`;
      });
    }

    if (fertilizer.length === 0 && economic.length === 0 && pest.length === 0) {
      summary += `No specific local dataset matches found for ${crop}. Using AI-generated recommendations.\n\n`;
    }

    return summary;
  }

  /**
   * Convert local data to fertilizer response format
   */
  static convertToFertilizerActions(fertilizer: FertilizerRecord[]): any[] {
    if (fertilizer.length === 0) return [];

    return fertilizer.map(record => {
      const yieldInQuintals = record.yieldUnit === 'kg/ha' ? 
        Math.round(record.yield / 100) : record.yield;

      // Parse fertilizer recommendation for NPK info
      const recommendation = record.fertilizerRecommendation;
      
      return {
        step: `Local Dataset Recommendation (${record.soilType})`,
        amount_per_ha: recommendation.includes('NPK') ? 
          `${recommendation} (see local dataset)` : 
          `Apply: ${recommendation}`,
        amount_per_quintal: `Calculated for ${yieldInQuintals} quintals/ha expected yield`,
        timing: 'As per local agricultural practices',
        source: 'Local Jharkhand Agricultural Dataset',
        yieldExpected: `${yieldInQuintals} quintals/hectare`,
        grossIncome: `₹${record.grossIncome.toLocaleString('en-IN')}/hectare`
      };
    });
  }

  /**
   * Check if local data is available and loaded
   */
  static isDataAvailable(): boolean {
    return this.dataLoaded && 
           (this.fertilizerData.length > 0 || 
            this.economicData.length > 0 || 
            this.pestData.length > 0);
  }

  /**
   * Get dataset statistics
   */
  static getDatasetStats(): any {
    return {
      fertilizerRecords: this.fertilizerData.length,
      economicRecords: this.economicData.length,
      pestRecords: this.pestData.length,
      dataLoaded: this.dataLoaded,
      availableCrops: [...new Set(this.fertilizerData.map(r => r.crop))],
      availableSoilTypes: [...new Set(this.fertilizerData.map(r => r.soilType))],
      availablePests: [...new Set(this.pestData.map(r => r.pest))]
    };
  }
}
