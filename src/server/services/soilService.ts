import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';

export interface SoilData {
  district: string;
  state: string;
  pH: number;
  pHCategory: string;
  moistureLevel: number;
  soilType: string;
  organicMatter: number;
  coordinates: {
    lat: number;
    lon: number;
  };
  suitableCrops: string[];
  recommendations: string[];
}

export interface LocationBasedSoilData {
  pH: number;
  pHCategory: string;
  moistureEstimate: number;
  soilType: string;
  organicMatterEstimate: number;
  district: string;
  state: string;
  confidence: number;
  recommendations: string[];
}

export class SoilService {
  private static soilDatabase: Map<string, any[]> = new Map();
  private static isInitialized = false;

  /**
   * Initialize soil database from all available datasets
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🌱 Initializing Soil Intelligence Database...');
      
      // Load pH data for all states
      await Promise.all([
        this.loadStatePhData('kerala'),
        this.loadStatePhData('karnataka'),
        this.loadStatePhData('uttarpradesh'),
        this.loadStatePhData('goa')
      ]);

      this.isInitialized = true;
      console.log('✅ Soil Intelligence Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Soil Database:', error);
    }
  }

  /**
   * Load pH data for a specific state
   */
  private static async loadStatePhData(state: string): Promise<void> {
    const datasetPaths: { [key: string]: string } = {
      kerala: 'kerala_dataset/kerala_district_soil_pH_estimates.csv',
      karnataka: 'Karnataka_dataset/Karnataka_district-wise_soil_pH__synthetic_estimates__sourced_.csv',
      uttarpradesh: 'utterpradesh_dataset/uttar_pradesh_district_soil_pH_estimates.csv',
      goa: 'Goa_dataset/Goa_district-wise_soil_pH__synthetic_estimates__sourced_.csv'
    };

    const filePath = path.join(process.cwd(), datasetPaths[state]);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Soil pH data not found for ${state}: ${filePath}`);
      return;
    }

    return new Promise((resolve, reject) => {
      const phData: any[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Normalize column names (some datasets have different naming)
          const normalizedRow = {
            district: row.district || row.District,
            pH: parseFloat(row.mean_pH_estimate || row.pH_estimate || row.pH || '6.5'),
            pHCategory: row.pH_category || row.category || this.categorizePH(parseFloat(row.mean_pH_estimate || row.pH_estimate || row.pH || '6.5')),
            state: state
          };
          phData.push(normalizedRow);
        })
        .on('end', () => {
          this.soilDatabase.set(`${state}_ph`, phData);
          console.log(`✅ Loaded ${phData.length} pH records for ${state}`);
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Get comprehensive soil data based on GPS coordinates
   */
  static async getSoilDataByLocation(lat: number, lon: number): Promise<LocationBasedSoilData> {
    await this.initialize();

    // Determine state and district from coordinates
    const locationInfo = this.getLocationFromCoordinates(lat, lon);
    
    // Get pH data for the location
    const phData = this.getPhDataForLocation(locationInfo.state, locationInfo.district);
    
    // Estimate other soil properties based on location and climate
    const moistureEstimate = this.estimateSoilMoisture(lat, lon, locationInfo.climateZone);
    const soilType = this.determineSoilType(lat, lon, locationInfo.state, locationInfo.district);
    const organicMatter = this.estimateOrganicMatter(locationInfo.climateZone, soilType, phData.pH);

    return {
      pH: phData.pH,
      pHCategory: phData.pHCategory,
      moistureEstimate,
      soilType,
      organicMatterEstimate: organicMatter,
      district: locationInfo.district,
      state: locationInfo.state,
      confidence: phData.confidence,
      recommendations: this.generateSoilRecommendations(phData.pH, moistureEstimate, soilType, organicMatter)
    };
  }

  /**
   * Determine location details from GPS coordinates using precise boundaries
   */
  private static getLocationFromCoordinates(lat: number, lon: number): any {
    console.log(`🌍 GPS Location Detection: ${lat}, ${lon}`);
    
    // Kerala: 8.2°N to 12.8°N, 74.9°E to 77.4°E (More precise boundaries)
    if (lat >= 8.2 && lat <= 12.8 && lon >= 74.9 && lon <= 77.4) {
      const district = this.getKeralaDistrict(lat, lon);
      console.log(`✅ Detected: ${district}, Kerala`);
      return {
        state: 'kerala',
        district: district,
        climateZone: 'tropical_coastal'
      };
    }
    
    // Karnataka: 11.5°N to 18.4°N, 74.0°E to 78.6°E (Fixed overlapping ranges)
    if (lat >= 11.5 && lat <= 18.4 && lon >= 74.0 && lon <= 78.6 && 
        !(lat >= 8.2 && lat <= 12.8 && lon >= 74.9 && lon <= 77.4)) { // Exclude Kerala overlap
      const district = this.getKarnatakaDistrict(lat, lon);
      console.log(`✅ Detected: ${district}, Karnataka`);
      return {
        state: 'karnataka',
        district: district,
        climateZone: 'tropical_dry'
      };
    }
    
    // Uttar Pradesh: 23.8°N to 30.4°N, 77.0°E to 84.6°E
    if (lat >= 23.8 && lat <= 30.4 && lon >= 77.0 && lon <= 84.6) {
      const district = this.getUPDistrict(lat, lon);
      console.log(`✅ Detected: ${district}, Uttar Pradesh`);
      return {
        state: 'uttarpradesh',
        district: district,
        climateZone: 'subtropical_continental'
      };
    }

    // Goa: 15.0°N to 15.8°N, 73.7°E to 74.3°E
    if (lat >= 15.0 && lat <= 15.8 && lon >= 73.7 && lon <= 74.3) {
      const district = this.getGoaDistrict(lat, lon);
      console.log(`✅ Detected: ${district}, Goa`);
      return {
        state: 'goa',
        district: district,
        climateZone: 'tropical_coastal'
      };
    }

    // Extended support for more Indian regions based on coordinates
    
    // Maharashtra: 15.6°N to 22.0°N, 72.6°E to 80.9°E
    if (lat >= 15.6 && lat <= 22.0 && lon >= 72.6 && lon <= 80.9) {
      const district = this.getMaharashtraDistrict(lat, lon);
      console.log(`✅ Detected: ${district}, Maharashtra`);
      return {
        state: 'maharashtra',
        district: district,
        climateZone: 'tropical_dry'
      };
    }
    
    // Tamil Nadu: 8.0°N to 13.6°N, 76.2°E to 80.3°E
    if (lat >= 8.0 && lat <= 13.6 && lon >= 76.2 && lon <= 80.3) {
      const district = this.getTamilNaduDistrict(lat, lon);
      console.log(`✅ Detected: ${district}, Tamil Nadu`);
      return {
        state: 'tamilnadu',
        district: district,
        climateZone: 'tropical_dry'
      };
    }
    
    // Determine best match if no exact boundaries match
    const bestMatch = this.determineBestStateMatch(lat, lon);
    console.log(`🎯 Best Match: ${bestMatch.district}, ${bestMatch.state}`);
    
    return bestMatch;
  }

  /**
   * Determine best state match when coordinates don't fall in exact boundaries
   */
  private static determineBestStateMatch(lat: number, lon: number): any {
    // Calculate distance to each state center and choose closest
    const stateCenters = {
      kerala: { lat: 10.8505, lon: 76.2711, name: 'Kerala' },
      karnataka: { lat: 15.3173, lon: 75.7139, name: 'Karnataka' },
      uttarpradesh: { lat: 26.8467, lon: 80.9462, name: 'Uttar Pradesh' },
      tamilnadu: { lat: 11.1271, lon: 78.6569, name: 'Tamil Nadu' },
      maharashtra: { lat: 19.7515, lon: 75.7139, name: 'Maharashtra' },
      goa: { lat: 15.2993, lon: 74.1240, name: 'Goa' }
    };

    let minDistance = Infinity;
    let closestState = null;

    for (const [stateKey, center] of Object.entries(stateCenters)) {
      const distance = Math.sqrt(
        Math.pow(lat - center.lat, 2) + Math.pow(lon - center.lon, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestState = {
          state: stateKey,
          name: center.name,
          distance: distance
        };
      }
    }

    if (closestState) {
      const district = this.getDistrictForState(closestState.state, lat, lon);
      return {
        state: closestState.state,
        district: district,
        climateZone: this.getClimateZone(closestState.state),
        confidence: Math.max(0.6, 1 - (minDistance / 10)) // Reduce confidence for distant matches
      };
    }

    // Ultimate fallback
    return {
      state: 'kerala',
      district: 'Kochi',
      climateZone: 'tropical_coastal',
      confidence: 0.5
    };
  }

  /**
   * Get district for any state
   */
  private static getDistrictForState(state: string, lat: number, lon: number): string {
    switch (state) {
      case 'kerala':
        return this.getKeralaDistrict(lat, lon);
      case 'karnataka':
        return this.getKarnatakaDistrict(lat, lon);
      case 'uttarpradesh':
        return this.getUPDistrict(lat, lon);
      case 'tamilnadu':
        return this.getTamilNaduDistrict(lat, lon);
      case 'maharashtra':
        return this.getMaharashtraDistrict(lat, lon);
      case 'goa':
        return this.getGoaDistrict(lat, lon);
      default:
        return 'Unknown';
    }
  }

  /**
   * Get climate zone for state
   */
  private static getClimateZone(state: string): string {
    const climateMap: { [key: string]: string } = {
      kerala: 'tropical_coastal',
      karnataka: 'tropical_dry',
      uttarpradesh: 'subtropical_continental',
      tamilnadu: 'tropical_dry',
      maharashtra: 'tropical_dry',
      goa: 'tropical_coastal'
    };
    return climateMap[state] || 'tropical_dry';
  }

  /**
   * Get pH data for specific location
   */
  private static getPhDataForLocation(state: string, district: string): any {
    const phDataset = this.soilDatabase.get(`${state}_ph`) || [];
    
    // Find exact district match
    let districtData = phDataset.find(d => 
      d.district.toLowerCase() === district.toLowerCase()
    );
    
    // If no exact match, find similar district or use average
    if (!districtData && phDataset.length > 0) {
      districtData = phDataset.find(d => 
        d.district.toLowerCase().includes(district.toLowerCase()) ||
        district.toLowerCase().includes(d.district.toLowerCase())
      );
    }
    
    // Use state average if no district match
    if (!districtData && phDataset.length > 0) {
      const avgPH = phDataset.reduce((sum, d) => sum + d.pH, 0) / phDataset.length;
      districtData = {
        district: district,
        pH: avgPH,
        pHCategory: this.categorizePH(avgPH),
        state: state
      };
    }
    
    return {
      pH: districtData?.pH || 6.5,
      pHCategory: districtData?.pHCategory || 'neutral',
      confidence: districtData ? 0.9 : 0.6
    };
  }

  /**
   * Estimate soil moisture based on location and climate
   */
  private static estimateSoilMoisture(lat: number, lon: number, climateZone: string): number {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    let baseMoisture = 40; // Default moderate moisture
    
    // Climate zone adjustments
    switch (climateZone) {
      case 'tropical_coastal':
        baseMoisture = 60; // Higher moisture in coastal areas
        break;
      case 'tropical_dry':
        baseMoisture = 35; // Lower moisture in dry areas
        break;
      case 'subtropical_continental':
        baseMoisture = 30; // Even lower in continental areas
        break;
    }
    
    // Seasonal adjustments
    if (month >= 6 && month <= 9) { // Monsoon season
      baseMoisture += 20;
    } else if (month >= 3 && month <= 5) { // Pre-monsoon (dry season)
      baseMoisture -= 15;
    } else if (month >= 10 && month <= 2) { // Post-monsoon/winter
      baseMoisture += 5;
    }
    
    // Ensure moisture stays within realistic bounds
    return Math.max(10, Math.min(90, baseMoisture));
  }

  /**
   * Determine soil type based on location
   */
  private static determineSoilType(lat: number, lon: number, state: string, district: string): string {
    // Soil type mapping based on geographical regions
    const soilTypeMap: { [key: string]: string } = {
      // Kerala - laterite soils predominant
      'kerala': 'Laterite',
      // Karnataka - red soils and black soils
      'karnataka': lat < 15 ? 'Red Soil' : 'Black Soil',
      // Uttar Pradesh - alluvial soils
      'uttarpradesh': 'Alluvial',
      // Goa - laterite soils
      'goa': 'Laterite'
    };
    
    return soilTypeMap[state] || 'Mixed';
  }

  /**
   * Estimate organic matter content
   */
  private static estimateOrganicMatter(climateZone: string, soilType: string, pH: number): number {
    let baseOrganic = 2.5; // Default moderate organic matter
    
    // Climate adjustments
    if (climateZone === 'tropical_coastal') {
      baseOrganic += 0.8; // Higher organic matter in tropical areas
    } else if (climateZone === 'subtropical_continental') {
      baseOrganic -= 0.5; // Lower in continental areas
    }
    
    // Soil type adjustments
    if (soilType === 'Alluvial') {
      baseOrganic += 1.0; // Alluvial soils are generally rich
    } else if (soilType === 'Laterite') {
      baseOrganic -= 0.5; // Laterite soils have lower organic content
    }
    
    // pH adjustments
    if (pH < 6.0) {
      baseOrganic -= 0.3; // Acidic soils may have lower available organic matter
    } else if (pH > 7.5) {
      baseOrganic -= 0.2; // Alkaline soils may have reduced organic availability
    }
    
    return Math.max(1.0, Math.min(6.0, baseOrganic));
  }

  /**
   * Generate soil-specific recommendations
   */
  private static generateSoilRecommendations(pH: number, moisture: number, soilType: string, organicMatter: number): string[] {
    const recommendations = [];
    
    // pH recommendations
    if (pH < 6.0) {
      recommendations.push('Apply lime to increase soil pH for better nutrient availability');
      recommendations.push('Consider acid-tolerant crop varieties');
    } else if (pH > 8.0) {
      recommendations.push('Add organic matter or sulfur to lower soil pH');
      recommendations.push('Use gypsum for alkaline soil improvement');
    } else {
      recommendations.push('Soil pH is optimal for most crops');
    }
    
    // Moisture recommendations
    if (moisture < 25) {
      recommendations.push('Implement drip irrigation or mulching to conserve moisture');
      recommendations.push('Consider drought-resistant crop varieties');
    } else if (moisture > 75) {
      recommendations.push('Ensure proper drainage to prevent waterlogging');
      recommendations.push('Monitor for fungal diseases in high moisture conditions');
    } else {
      recommendations.push('Soil moisture levels are good for most crops');
    }
    
    // Organic matter recommendations
    if (organicMatter < 2.0) {
      recommendations.push('Increase organic matter with compost or farmyard manure');
      recommendations.push('Practice crop rotation with legumes to improve soil fertility');
    } else if (organicMatter > 4.0) {
      recommendations.push('Excellent organic matter content - maintain with regular additions');
    }
    
    // Soil type specific recommendations
    if (soilType === 'Laterite') {
      recommendations.push('Laterite soil: Focus on water retention and organic matter addition');
    } else if (soilType === 'Alluvial') {
      recommendations.push('Alluvial soil: Excellent for most crops, maintain fertility with balanced nutrition');
    } else if (soilType === 'Red Soil') {
      recommendations.push('Red soil: Good drainage but may need phosphorus supplementation');
    } else if (soilType === 'Black Soil') {
      recommendations.push('Black soil: Excellent water retention, suitable for cotton and cereals');
    }
    
    return recommendations;
  }

  /**
   * Accurate district mapping functions based on precise GPS coordinates
   */
  private static getKeralaDistrict(lat: number, lon: number): string {
    // Kerala districts mapped more accurately by coordinates
    // North to South order
    if (lat >= 12.0) return 'Kasaragod';
    if (lat >= 11.5) return 'Kannur';
    if (lat >= 11.0) return 'Wayanad'; // Inland district
    if (lat >= 10.5) return 'Kozhikode';
    if (lat >= 10.2) return 'Malappuram';
    if (lat >= 10.0) return 'Palakkad';
    if (lat >= 9.7) return 'Thrissur';
    if (lat >= 9.4) return 'Ernakulam'; // Kochi area
    if (lat >= 9.2) return 'Idukki'; // Hill district
    if (lat >= 9.0) return 'Kottayam';
    if (lat >= 8.7) return 'Alappuzha';
    if (lat >= 8.4) return 'Pathanamthitta';
    if (lat >= 8.2) return 'Kollam';
    return 'Thiruvananthapuram'; // Southern most
  }

  private static getKarnatakaDistrict(lat: number, lon: number): string {
    // Karnataka districts - more comprehensive mapping
    // North to South
    if (lat >= 17.5) return 'Bidar';
    if (lat >= 16.8) return 'Kalaburagi';
    if (lat >= 16.0) return 'Raichur';
    if (lat >= 15.8) {
      // Western vs Eastern Karnataka
      if (lon <= 75.5) return 'Belagavi'; // Western
      return 'Yadgir'; // Eastern
    }
    if (lat >= 15.0) {
      if (lon <= 75.0) return 'Dharwad';
      return 'Koppal';
    }
    if (lat >= 14.5) {
      if (lon <= 75.5) return 'Haveri';
      return 'Vijayanagara';
    }
    if (lat >= 14.0) {
      if (lon <= 76.0) return 'Shivamogga';
      return 'Ballari';
    }
    if (lat >= 13.5) {
      if (lon <= 75.5) return 'Udupi';
      return 'Chitradurga';
    }
    if (lat >= 13.0) {
      if (lon <= 75.0) return 'Dakshina Kannada'; // Mangalore area
      return 'Tumakuru';
    }
    if (lat >= 12.5) {
      if (lon <= 75.5) return 'Kodagu';
      return 'Bengaluru Urban'; // Bangalore
    }
    if (lat >= 12.0) return 'Hassan';
    return 'Mysuru'; // Mysore area
  }

  private static getUPDistrict(lat: number, lon: number): string {
    // Uttar Pradesh districts - major cities and regions
    // East to West by longitude, then North to South by latitude
    if (lon >= 83.0) {
      // Eastern UP
      if (lat >= 26.5) return 'Gorakhpur';
      if (lat >= 25.5) return 'Varanasi';
      return 'Mirzapur';
    }
    if (lon >= 81.0) {
      // Central-Eastern UP
      if (lat >= 27.0) return 'Faizabad';
      if (lat >= 26.0) return 'Lucknow';
      return 'Allahabad';
    }
    if (lon >= 79.0) {
      // Central UP
      if (lat >= 27.5) return 'Bareilly';
      if (lat >= 26.5) return 'Kanpur';
      return 'Jhansi';
    }
    if (lon >= 77.5) {
      // Western UP
      if (lat >= 28.5) return 'Meerut';
      if (lat >= 27.0) return 'Aligarh';
      return 'Agra';
    }
    // Far Western UP
    if (lat >= 29.0) return 'Saharanpur';
    return 'Mathura';
  }

  private static getGoaDistrict(lat: number, lon: number): string {
    // Goa has only 2 districts - more precise boundary
    return lat > 15.4 ? 'North Goa' : 'South Goa';
  }

  private static getTamilNaduDistrict(lat: number, lon: number): string {
    // Tamil Nadu districts - major regions
    // North to South
    if (lat >= 13.0) {
      if (lon <= 78.0) return 'Vellore';
      return 'Tiruvannamalai';
    }
    if (lat >= 12.5) {
      if (lon <= 77.5) return 'Krishnagiri';
      return 'Villupuram';
    }
    if (lat >= 12.0) {
      if (lon <= 77.0) return 'Salem';
      return 'Cuddalore';
    }
    if (lat >= 11.5) {
      if (lon <= 77.5) return 'Namakkal';
      return 'Thanjavur';
    }
    if (lat >= 11.0) {
      if (lon <= 77.0) return 'Erode';
      if (lon <= 78.5) return 'Tiruchirappalli';
      return 'Nagapattinam';
    }
    if (lat >= 10.5) {
      if (lon <= 77.0) return 'Coimbatore';
      return 'Pudukkottai';
    }
    if (lat >= 10.0) {
      if (lon <= 77.5) return 'Dindigul';
      return 'Sivaganga';
    }
    if (lat >= 9.5) {
      if (lon <= 77.5) return 'Theni';
      return 'Ramanathapuram';
    }
    if (lat >= 9.0) return 'Virudhunagar';
    if (lat >= 8.5) return 'Tuticorin';
    return 'Kanyakumari'; // Southernmost
  }

  private static getMaharashtraDistrict(lat: number, lon: number): string {
    // Maharashtra districts - major regions
    // Broadly North to South, West to East
    if (lat >= 21.0) {
      // Northern Maharashtra
      if (lon <= 74.0) return 'Dhule';
      if (lon <= 76.0) return 'Jalgaon';
      if (lon <= 78.0) return 'Buldhana';
      return 'Akola';
    }
    if (lat >= 20.0) {
      // Central Maharashtra
      if (lon <= 73.5) return 'Nashik';
      if (lon <= 75.0) return 'Ahmednagar';
      if (lon <= 77.0) return 'Aurangabad';
      return 'Jalna';
    }
    if (lat >= 19.0) {
      // Mumbai-Pune region
      if (lon <= 73.0) return 'Mumbai Suburban';
      if (lon <= 74.0) return 'Thane';
      if (lon <= 74.5) return 'Pune';
      if (lon <= 76.0) return 'Ahmednagar';
      return 'Beed';
    }
    if (lat >= 18.0) {
      if (lon <= 73.5) return 'Raigad';
      if (lon <= 74.5) return 'Satara';
      if (lon <= 76.0) return 'Solapur';
      return 'Osmanabad';
    }
    if (lat >= 17.0) {
      if (lon <= 74.0) return 'Sindhudurg';
      if (lon <= 75.0) return 'Kolhapur';
      return 'Sangli';
    }
    return 'Ratnagiri'; // Coastal southern
  }

  /**
   * Categorize pH levels
   */
  private static categorizePH(pH: number): string {
    if (pH < 5.5) return 'strongly_acidic';
    if (pH < 6.0) return 'moderately_acidic';
    if (pH < 6.5) return 'slightly_acidic';
    if (pH < 7.5) return 'neutral';
    if (pH < 8.5) return 'slightly_alkaline';
    return 'alkaline';
  }
}
