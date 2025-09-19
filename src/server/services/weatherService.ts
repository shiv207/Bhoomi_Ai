import axios from 'axios';
import { WeatherData } from '../types';

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export class WeatherService {
  /**
   * Get current weather by city name
   */
  static async getCurrentWeatherByCity(city: string, state?: string): Promise<WeatherData> {
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    if (!API_KEY) {
      throw new Error('OpenWeather API key not configured');
    }

    const query = state ? `${city},${state},IN` : `${city},IN`;
    
    try {
      const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
          q: query,
          appid: API_KEY,
          units: 'metric'
        }
      });

      const data = response.data;
      
      return {
        location: {
          name: data.name,
          country: data.sys.country,
          lat: data.coord.lat,
          lon: data.coord.lon
        },
        current: {
          temp: data.main.temp,
          feels_like: data.main.feels_like,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          visibility: data.visibility / 1000, // Convert to km
          wind_speed: data.wind.speed,
          wind_deg: data.wind.deg,
          weather: data.weather.map((w: any) => ({
            main: w.main,
            description: w.description,
            icon: w.icon
          }))
        }
      };
    } catch (error: any) {
      console.error('Weather API Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch weather data: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get current weather by coordinates
   */
  static async getCurrentWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    if (!API_KEY) {
      throw new Error('OpenWeather API key not configured');
    }

    try {
      const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'metric'
        }
      });

      const data = response.data;
      
      return {
        location: {
          name: data.name,
          country: data.sys.country,
          lat: data.coord.lat,
          lon: data.coord.lon
        },
        current: {
          temp: data.main.temp,
          feels_like: data.main.feels_like,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          visibility: data.visibility / 1000,
          wind_speed: data.wind.speed,
          wind_deg: data.wind.deg,
          weather: data.weather.map((w: any) => ({
            main: w.main,
            description: w.description,
            icon: w.icon
          }))
        }
      };
    } catch (error: any) {
      console.error('Weather API Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch weather data: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get extended weather forecast (3-4 months) with agricultural insights
   */
  static async getExtendedForecast(lat: number, lon: number): Promise<any> {
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    if (!API_KEY) {
      throw new Error('OpenWeather API key not configured');
    }

    try {
      // Get current weather and 5-day forecast
      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
          params: { lat, lon, appid: API_KEY, units: 'metric' }
        }),
        axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
          params: { lat, lon, appid: API_KEY, units: 'metric' }
        })
      ]);

      const current = currentResponse.data;
      const forecast = forecastResponse.data;

      // Process extended forecast data
      const dailyForecast = forecast.list
        .filter((_: any, index: number) => index % 8 === 0) // Every 8th item (24h intervals)
        .slice(0, 5)
        .map((item: any) => ({
          date: new Date(item.dt * 1000).toISOString().split('T')[0],
          temp: {
            min: item.main.temp_min,
            max: item.main.temp_max,
            avg: item.main.temp
          },
          humidity: item.main.humidity,
          rainfall: item.rain ? item.rain['3h'] || 0 : 0,
          windSpeed: item.wind.speed,
          pressure: item.main.pressure,
          weather: item.weather[0].description,
          icon: item.weather[0].icon
        }));

      // Generate seasonal insights based on current date and location
      const seasonalInsights = this.generateSeasonalInsights(lat, lon, current, dailyForecast);
      
      // Generate agricultural recommendations
      const agriculturalRecommendations = this.generateAgriculturalRecommendations(
        current, dailyForecast, seasonalInsights
      );

      return {
        location: {
          name: current.name,
          country: current.sys.country,
          lat: current.coord.lat,
          lon: current.coord.lon
        },
        current: {
          temp: current.main.temp,
          feels_like: current.main.feels_like,
          humidity: current.main.humidity,
          pressure: current.main.pressure,
          visibility: current.visibility / 1000,
          wind_speed: current.wind.speed,
          wind_deg: current.wind.deg,
          weather: current.weather
        },
        forecast: dailyForecast,
        seasonalInsights,
        agriculturalRecommendations,
        extendedOutlook: this.generateExtendedOutlook(lat, lon, current)
      };

    } catch (error: any) {
      console.error('Extended Weather API Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch extended weather data: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Generate seasonal insights based on location and current conditions
   */
  static generateSeasonalInsights(lat: number, lon: number, current: any, forecast: any[]): any {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; // 1-12
    
    // Determine Indian agricultural season
    let season = '';
    let seasonDetails = {};
    
    if (month >= 6 && month <= 10) {
      season = 'Kharif';
      seasonDetails = {
        name: 'Kharif (Monsoon Season)',
        period: 'June - October',
        characteristics: 'Monsoon-dependent crops, high rainfall, warm temperatures',
        idealCrops: ['Rice', 'Maize', 'Cotton', 'Sugarcane', 'Pulses', 'Oilseeds'],
        keyFactors: ['Monsoon timing', 'Rainfall distribution', 'Humidity levels', 'Temperature range']
      };
    } else if (month >= 11 || month <= 3) {
      season = 'Rabi';
      seasonDetails = {
        name: 'Rabi (Winter Season)',
        period: 'November - March',
        characteristics: 'Cool, dry weather, irrigation-dependent',
        idealCrops: ['Wheat', 'Barley', 'Peas', 'Gram', 'Mustard', 'Chickpea'],
        keyFactors: ['Temperature control', 'Irrigation scheduling', 'Frost protection', 'Soil moisture']
      };
    } else {
      season = 'Zaid';
      seasonDetails = {
        name: 'Zaid (Summer Season)',
        period: 'April - June',
        characteristics: 'Hot, dry weather, short duration crops',
        idealCrops: ['Watermelon', 'Muskmelon', 'Cucumber', 'Fodder crops', 'Maize'],
        keyFactors: ['Heat tolerance', 'Water availability', 'Quick maturation', 'Market timing']
      };
    }

    return {
      currentSeason: season,
      seasonDetails,
      climateZone: this.determineClimateZone(lat, lon),
      weatherTrends: this.analyzeWeatherTrends(current, forecast)
    };
  }

  /**
   * Generate comprehensive agricultural recommendations
   */
  static generateAgriculturalRecommendations(current: any, forecast: any[], seasonalInsights: any): any {
    const temp = current.main.temp;
    const humidity = current.main.humidity;
    const avgRainfall = forecast.reduce((sum, day) => sum + day.rainfall, 0) / forecast.length;
    
    return {
      planting: {
        soilTemperature: temp > 15 ? 'Optimal for most crops' : 'Too cold for warm-season crops',
        soilMoisture: humidity > 60 ? 'Adequate moisture' : 'May need irrigation',
        plantingWindow: this.getPlantingWindow(seasonalInsights.currentSeason),
        recommendedActions: this.getPlantingActions(temp, humidity, avgRainfall)
      },
      cropCare: {
        irrigation: this.getIrrigationAdvice(avgRainfall, humidity, temp),
        fertilization: this.getFertilizationAdvice(seasonalInsights.currentSeason, avgRainfall),
        pestManagement: this.getPestManagementAdvice(temp, humidity),
        diseaseRisk: this.getDiseaseRiskAssessment(temp, humidity, avgRainfall)
      },
      harvesting: {
        timing: this.getHarvestingAdvice(seasonalInsights.currentSeason),
        conditions: this.getHarvestingConditions(forecast),
        postHarvest: this.getPostHarvestAdvice(temp, humidity)
      },
      riskFactors: this.assessRiskFactors(current, forecast, seasonalInsights)
    };
  }

  /**
   * Generate 3-4 month extended outlook
   */
  static generateExtendedOutlook(lat: number, lon: number, current: any): any {
    const currentDate = new Date();
    const months = [];
    
    for (let i = 0; i < 4; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(currentDate.getMonth() + i);
      
      months.push({
        month: futureDate.toLocaleString('default', { month: 'long' }),
        year: futureDate.getFullYear(),
        expectedConditions: this.getMonthlyExpectations(futureDate.getMonth() + 1, lat, lon),
        agriculturalFocus: this.getMonthlyAgriculturalFocus(futureDate.getMonth() + 1),
        criticalActivities: this.getCriticalActivities(futureDate.getMonth() + 1)
      });
    }
    
    return {
      outlook: months,
      seasonalTransitions: this.getSeasonalTransitions(),
      longTermRecommendations: this.getLongTermRecommendations(lat, lon)
    };
  }

  // Helper methods for agricultural insights
  static determineClimateZone(lat: number, lon: number): string {
    if (lat >= 8 && lat <= 12 && lon >= 74 && lon <= 78) return 'Tropical Coastal (Kerala)';
    if (lat >= 11 && lat <= 18 && lon >= 74 && lon <= 78) return 'Tropical Dry (Karnataka)';
    if (lat >= 21 && lat <= 25 && lon >= 83 && lon <= 88) return 'Subtropical Humid (Jharkhand)';
    if (lat >= 23 && lat <= 31 && lon >= 77 && lon <= 85) return 'Subtropical Continental (UP)';
    return 'Mixed Climate Zone';
  }

  static analyzeWeatherTrends(current: any, forecast: any[]): any {
    const temps = forecast.map(day => day.temp.avg);
    const rainfall = forecast.map(day => day.rainfall);
    
    return {
      temperatureTrend: temps[temps.length - 1] > temps[0] ? 'Rising' : 'Falling',
      rainfallTrend: rainfall.reduce((a, b) => a + b, 0) > 10 ? 'Wet period' : 'Dry period',
      stabilityIndex: this.calculateStabilityIndex(temps, rainfall)
    };
  }

  static getPlantingWindow(season: string): string {
    const windows: { [key: string]: string } = {
      'Kharif': 'June-July (with monsoon onset)',
      'Rabi': 'October-November (post-monsoon)',
      'Zaid': 'March-April (pre-summer)'
    };
    return windows[season] || 'Consult local agricultural calendar';
  }

  static getPlantingActions(temp: number, humidity: number, rainfall: number): string[] {
    const actions = [];
    
    if (temp > 25) actions.push('Consider heat-tolerant varieties');
    if (humidity < 50) actions.push('Ensure adequate irrigation setup');
    if (rainfall < 5) actions.push('Plan for supplemental watering');
    if (temp < 15) actions.push('Wait for warmer conditions or use protected cultivation');
    
    return actions.length > 0 ? actions : ['Conditions suitable for planting'];
  }

  static getIrrigationAdvice(rainfall: number, humidity: number, temp: number): string {
    if (rainfall > 10) return 'Reduce irrigation, monitor for waterlogging';
    if (rainfall < 2 && temp > 30) return 'Increase irrigation frequency, consider drip systems';
    if (humidity < 40) return 'Monitor soil moisture closely, may need daily watering';
    return 'Maintain regular irrigation schedule based on crop needs';
  }

  static getFertilizationAdvice(season: string, rainfall: number): string {
    if (rainfall > 15) return 'Delay fertilizer application, risk of nutrient leaching';
    if (season === 'Kharif') return 'Apply nitrogen in split doses, phosphorus at planting';
    if (season === 'Rabi') return 'Focus on phosphorus and potassium, moderate nitrogen';
    return 'Apply balanced fertilizers based on soil test results';
  }

  static getPestManagementAdvice(temp: number, humidity: number): string {
    if (temp > 28 && humidity > 70) return 'High pest activity expected, monitor closely';
    if (temp < 20) return 'Low pest pressure, routine monitoring sufficient';
    return 'Moderate pest risk, implement IPM practices';
  }

  static getDiseaseRiskAssessment(temp: number, humidity: number, rainfall: number): string {
    if (humidity > 80 && rainfall > 10) return 'High fungal disease risk';
    if (temp > 35 && humidity < 40) return 'Low disease pressure';
    return 'Moderate disease risk, maintain good field hygiene';
  }

  static getHarvestingAdvice(season: string): string {
    const advice: { [key: string]: string } = {
      'Kharif': 'September-October, avoid rainy periods',
      'Rabi': 'March-April, ideal dry conditions',
      'Zaid': 'May-June, harvest before peak summer'
    };
    return advice[season] || 'Follow crop-specific maturity indicators';
  }

  static getHarvestingConditions(forecast: any[]): string {
    const rainyDays = forecast.filter(day => day.rainfall > 2).length;
    if (rainyDays > 2) return 'Delay harvest, wet conditions expected';
    return 'Good harvesting conditions in forecast period';
  }

  static getPostHarvestAdvice(temp: number, humidity: number): string {
    if (humidity > 70) return 'Ensure proper drying, risk of spoilage';
    if (temp > 35) return 'Store in cool, ventilated areas';
    return 'Standard post-harvest handling recommended';
  }

  static assessRiskFactors(current: any, forecast: any[], seasonalInsights: any): any {
    const risks = [];
    
    if (current.main.temp > 40) risks.push('Heat stress on crops');
    if (current.main.humidity > 90) risks.push('High humidity disease risk');
    if (forecast.some(day => day.rainfall > 50)) risks.push('Heavy rainfall/flooding risk');
    if (forecast.every(day => day.rainfall < 1)) risks.push('Drought conditions');
    
    return {
      immediate: risks,
      seasonal: this.getSeasonalRisks(seasonalInsights.currentSeason),
      mitigation: this.getRiskMitigation(risks)
    };
  }

  static getMonthlyExpectations(month: number, lat: number, lon: number): string {
    // Simplified monthly expectations based on Indian climate patterns
    const expectations: { [key: number]: string } = {
      1: 'Cool, dry conditions',
      2: 'Warming trend begins',
      3: 'Pre-monsoon heat',
      4: 'Hot, dry weather',
      5: 'Peak summer heat',
      6: 'Monsoon onset',
      7: 'Heavy monsoon rains',
      8: 'Continued monsoon',
      9: 'Monsoon withdrawal',
      10: 'Post-monsoon transition',
      11: 'Cool, clear weather',
      12: 'Winter conditions'
    };
    return expectations[month] || 'Variable conditions';
  }

  static getMonthlyAgriculturalFocus(month: number): string[] {
    const focus: { [key: number]: string[] } = {
      1: ['Rabi crop management', 'Irrigation scheduling'],
      2: ['Pest monitoring', 'Fertilizer application'],
      3: ['Harvest preparation', 'Zaid crop planning'],
      4: ['Zaid sowing', 'Summer crop care'],
      5: ['Heat stress management', 'Water conservation'],
      6: ['Kharif preparation', 'Monsoon readiness'],
      7: ['Kharif sowing', 'Drainage management'],
      8: ['Crop monitoring', 'Pest control'],
      9: ['Disease management', 'Harvest planning'],
      10: ['Kharif harvest', 'Rabi preparation'],
      11: ['Rabi sowing', 'Storage management'],
      12: ['Winter crop care', 'Planning next year']
    };
    return focus[month] || ['General crop management'];
  }

  static getCriticalActivities(month: number): string[] {
    const activities: { [key: number]: string[] } = {
      1: ['Wheat irrigation', 'Vegetable harvesting'],
      2: ['Mustard flowering care', 'Summer crop planning'],
      3: ['Rabi harvest', 'Field preparation'],
      4: ['Zaid sowing', 'Irrigation system check'],
      5: ['Heat protection', 'Water management'],
      6: ['Field preparation', 'Seed treatment'],
      7: ['Timely sowing', 'Weed management'],
      8: ['Nutrient management', 'Pest scouting'],
      9: ['Disease control', 'Drainage maintenance'],
      10: ['Harvest timing', 'Storage preparation'],
      11: ['Timely sowing', 'Seed bed preparation'],
      12: ['Cold protection', 'Irrigation scheduling']
    };
    return activities[month] || ['Routine farm management'];
  }

  static getSeasonalTransitions(): any {
    return {
      'Rabi to Zaid': 'March-April: Prepare for heat, ensure water availability',
      'Zaid to Kharif': 'May-June: Monsoon preparation, drainage systems',
      'Kharif to Rabi': 'October-November: Field preparation, residue management'
    };
  }

  static getLongTermRecommendations(lat: number, lon: number): string[] {
    return [
      'Invest in climate-resilient crop varieties',
      'Implement water-efficient irrigation systems',
      'Develop integrated pest management strategies',
      'Build soil health through organic matter',
      'Diversify crops to reduce weather risks',
      'Adopt precision agriculture technologies'
    ];
  }

  static getSeasonalRisks(season: string): string[] {
    const risks: { [key: string]: string[] } = {
      'Kharif': ['Delayed monsoon', 'Excess rainfall', 'Pest outbreaks'],
      'Rabi': ['Frost damage', 'Water scarcity', 'Hailstorms'],
      'Zaid': ['Heat waves', 'Water stress', 'Market volatility']
    };
    return risks[season] || ['General weather risks'];
  }

  static getRiskMitigation(risks: string[]): string[] {
    const mitigation = [];
    
    if (risks.includes('Heat stress on crops')) {
      mitigation.push('Provide shade, increase irrigation frequency');
    }
    if (risks.includes('High humidity disease risk')) {
      mitigation.push('Improve air circulation, apply preventive fungicides');
    }
    if (risks.includes('Heavy rainfall/flooding risk')) {
      mitigation.push('Ensure proper drainage, avoid low-lying areas');
    }
    if (risks.includes('Drought conditions')) {
      mitigation.push('Implement water conservation, drought-tolerant varieties');
    }
    
    return mitigation.length > 0 ? mitigation : ['Monitor conditions regularly'];
  }

  static calculateStabilityIndex(temps: number[], rainfall: number[]): string {
    const tempVariation = Math.max(...temps) - Math.min(...temps);
    const rainfallVariation = Math.max(...rainfall) - Math.min(...rainfall);
    
    if (tempVariation < 5 && rainfallVariation < 10) return 'Stable';
    if (tempVariation > 10 || rainfallVariation > 20) return 'Highly Variable';
    return 'Moderately Variable';
  }

  /**
   * Get 5-day weather forecast (original method)
   */
  static async getForecast(lat: number, lon: number): Promise<WeatherData> {
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    if (!API_KEY) {
      throw new Error('OpenWeather API key not configured');
    }

    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
          params: { lat, lon, appid: API_KEY, units: 'metric' }
        }),
        axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
          params: { lat, lon, appid: API_KEY, units: 'metric' }
        })
      ]);

      const current = currentResponse.data;
      const forecast = forecastResponse.data;

      // Process forecast data (take one reading per day)
      const dailyForecast = forecast.list
        .filter((_: any, index: number) => index % 8 === 0) // Every 8th item (24h intervals)
        .slice(0, 5)
        .map((item: any) => ({
          date: new Date(item.dt * 1000).toISOString().split('T')[0],
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          humidity: item.main.humidity,
          weather: {
            main: item.weather[0].main,
            description: item.weather[0].description
          }
        }));

      return {
        location: {
          name: current.name,
          country: current.sys.country,
          lat: current.coord.lat,
          lon: current.coord.lon
        },
        current: {
          temp: current.main.temp,
          feels_like: current.main.feels_like,
          humidity: current.main.humidity,
          pressure: current.main.pressure,
          visibility: current.visibility / 1000,
          wind_speed: current.wind.speed,
          wind_deg: current.wind.deg,
          weather: current.weather.map((w: any) => ({
            main: w.main,
            description: w.description,
            icon: w.icon
          }))
        },
        forecast: dailyForecast
      };
    } catch (error: any) {
      console.error('Forecast API Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch forecast data: ${error.response?.data?.message || error.message}`);
    }
  }
}
