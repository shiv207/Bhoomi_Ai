import axios from 'axios';
import { AIQuery, AIResponse, WeatherData, CropData } from '../types';
import { SoilService, LocationBasedSoilData } from './soilService';
import { MultiAgentService } from './multiAgentService';
import { LocalDataService } from './localDataService';
import { WebSearchService } from './webSearchService';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export class AIService {
  /**
   * Generate AI response using Groq API
   */
  static async generateResponse(query: AIQuery): Promise<AIResponse> {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    try {
      // Deploy Multi-Agent System with Enhanced Web Search
      if (query.location) {
        console.log('🚀 Deploying Multi-Agent Agricultural Intelligence System with Live Internet Search...');
        
        // Step 1: Perform enhanced web search with AI
        console.log('🌐 Performing enhanced internet search for agricultural data...');
        const webSearchResults = await WebSearchService.searchWithAI(query.query);
        
        // Step 2: Deploy multi-agent system
        const multiAgentRecommendation = await MultiAgentService.generateCoordinatedRecommendation(
          query.query,
          query.location.lat,
          query.location.lon,
          query.state
        );

        // Initialize local datasets
        await LocalDataService.initializeDatasets();
        
        // Extract crop recommendations for local data lookup
        const detectedCrops = this.extractRecommendedCrops(multiAgentRecommendation.coordinatedRecommendation);
        const localDataSummary = this.buildLocalDataContext(detectedCrops, query.state, query.location);

        // Step 3: Get current season and month for timing alignment
        const currentSeasonData = this.getCurrentSeasonInfo();
        
        // Enhanced multi-agent system with live web search + local dataset
        const enhancedContext = this.buildEnhancedContext(multiAgentRecommendation, webSearchResults, currentSeasonData, localDataSummary);
        const prompt = this.createConversationalPrompt(query.query, enhancedContext, query.state, multiAgentRecommendation, currentSeasonData, localDataSummary);

        let response;
        try {
          // Try compound-mini first (faster)
          response = await axios.post(
            `${GROQ_BASE_URL}/chat/completions`,
            {
              model: 'llama-3.1-8b-instant', // Fast model for quick responses
              messages: [
                {
                  role: 'system',
                  content: this.getAgricultureAgentPrompt()
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.2, // More accurate and deterministic
              max_tokens: 8192, // Compound system limit
              top_p: 0.8
            },
            {
              headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 60000 // 60 seconds for compound-mini
            }
          );
        } catch (error: any) {
          console.warn('Compound-mini timeout, falling back to regular model:', error.message);
          // Fallback to regular model without browser search
          response = await axios.post(
            `${GROQ_BASE_URL}/chat/completions`,
            {
              model: 'llama-3.3-70b-versatile',
              messages: [
                {
                  role: 'system',
                  content: this.getConversationalSystemPrompt()
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.2,
              max_tokens: 1000,
              top_p: 0.8
            },
            {
              headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000 // 30 seconds for regular model
            }
          );
        }

        const aiResponse = response.data.choices[0]?.message?.content || 'No response generated';
        const executedTools = response.data.choices[0]?.message?.executed_tools || [];
        
        return {
          response: aiResponse,
          sources: this.extractSources(query),
          recommendations: this.extractRecommendations(aiResponse),
          confidence: multiAgentRecommendation.finalConfidence,
          multiAgentAnalysis: multiAgentRecommendation,
          executedTools: executedTools, // Browser search results and tool calls
          shouldTriggerFertilizerPane: this.shouldTriggerFertilizerPane(query.query),
          fertilizerContext: {
            location: query.state,
            detectedCrops: this.extractRecommendedCrops(aiResponse),
            soilType: this.extractSoilType(multiAgentRecommendation),
            expectedYield: this.extractYieldInfo(multiAgentRecommendation)
          }
        } as AIResponse;
      }

      // Fallback to single-agent system if no location provided
      const context = await this.buildContext(query);
      const prompt = this.createPrompt(query.query, context, query.state);

      const response = await axios.post(
        `${GROQ_BASE_URL}/chat/completions`,
        {
          model: 'llama-3.1-8b-instant', // Using Llama 3.1 8B model
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 800,
          top_p: 0.8
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout for fallback
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      
      return {
        response: aiResponse,
        confidence: 0.85, // Placeholder confidence score
        sources: this.extractSources(query),
        recommendations: this.extractRecommendations(aiResponse)
      };

    } catch (error: any) {
      console.error('Groq API Error:', error.response?.data || error.message);
      throw new Error(`Failed to generate AI response: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Build comprehensive context string for the AI with all environmental and economic factors
   */
  private static async buildContext(query: AIQuery): Promise<string> {
    let context = '';

    // Add temporal context (daytime/seasonal data)
    const timeContext = this.getTimeContext();
    context += timeContext;

    // Automatically gather precise soil data from location coordinates
    if (query.location) {
      const soilData = await SoilService.getSoilDataByLocation(query.location.lat, query.location.lon);
      context += this.buildSoilIntelligenceContext(soilData);
    }

    // Add enhanced weather context with agricultural insights
    if (query.context?.weather) {
      const weather = query.context.weather;
      
      // Check if it's extended weather data with agricultural insights
      if ((weather as any).seasonalInsights) {
        context += `🌤️ COMPREHENSIVE WEATHER & AGRICULTURAL ANALYSIS:\n\n`;
        
        // Current conditions
        context += `Current Conditions in ${weather.location.name}:\n`;
        context += `- Temperature: ${weather.current.temp}°C (feels like ${weather.current.feels_like}°C)\n`;
        context += `- Humidity: ${weather.current.humidity}%\n`;
        context += `- Weather: ${weather.current.weather[0].description}\n`;
        context += `- Wind Speed: ${weather.current.wind_speed} m/s\n`;
        context += `- Pressure: ${weather.current.pressure} hPa\n\n`;

        // Seasonal insights
        const weatherData = weather as any;
        context += `Agricultural Season Analysis:\n`;
        context += `- Current Season: ${weatherData.seasonalInsights.currentSeason} (${weatherData.seasonalInsights.seasonDetails.name})\n`;
        context += `- Period: ${weatherData.seasonalInsights.seasonDetails.period}\n`;
        context += `- Climate Zone: ${weatherData.seasonalInsights.climateZone}\n`;
        context += `- Weather Trends: ${weatherData.seasonalInsights.weatherTrends.temperatureTrend} temperatures, ${weatherData.seasonalInsights.weatherTrends.rainfallTrend}\n`;
        context += `- Stability Index: ${weatherData.seasonalInsights.weatherTrends.stabilityIndex}\n\n`;

        // Ideal crops for current season
        context += `Season-Optimal Crops: ${weatherData.seasonalInsights.seasonDetails.idealCrops.join(', ')}\n`;
        context += `Key Success Factors: ${weatherData.seasonalInsights.seasonDetails.keyFactors.join(', ')}\n\n`;

        // Agricultural recommendations
        if (weatherData.agriculturalRecommendations) {
          const rec = weatherData.agriculturalRecommendations;
          
          context += `🌱 PLANTING GUIDANCE:\n`;
          context += `- Soil Temperature: ${rec.planting.soilTemperature}\n`;
          context += `- Soil Moisture: ${rec.planting.soilMoisture}\n`;
          context += `- Planting Window: ${rec.planting.plantingWindow}\n`;
          context += `- Recommended Actions: ${rec.planting.recommendedActions.join(', ')}\n\n`;
          
          context += `🚿 CROP CARE INSTRUCTIONS:\n`;
          context += `- Irrigation: ${rec.cropCare.irrigation}\n`;
          context += `- Fertilization: ${rec.cropCare.fertilization}\n`;
          context += `- Pest Management: ${rec.cropCare.pestManagement}\n`;
          context += `- Disease Risk: ${rec.cropCare.diseaseRisk}\n\n`;
          
          context += `🌾 HARVESTING ADVICE:\n`;
          context += `- Timing: ${rec.harvesting.timing}\n`;
          context += `- Conditions: ${rec.harvesting.conditions}\n`;
          context += `- Post-Harvest: ${rec.harvesting.postHarvest}\n\n`;
          
          context += `⚠️ RISK ASSESSMENT:\n`;
          context += `- Immediate Risks: ${rec.riskFactors.immediate.join(', ') || 'None identified'}\n`;
          context += `- Seasonal Risks: ${rec.riskFactors.seasonal.join(', ')}\n`;
          context += `- Mitigation: ${rec.riskFactors.mitigation.join(', ')}\n\n`;
        }

        // Extended outlook
        if (weatherData.extendedOutlook && weatherData.extendedOutlook.outlook) {
          context += `📅 3-MONTH AGRICULTURAL CALENDAR:\n`;
          weatherData.extendedOutlook.outlook.slice(0, 3).forEach((month: any) => {
            context += `${month.month} ${month.year}: ${month.expectedConditions}\n`;
            context += `  Focus: ${month.agriculturalFocus.join(', ')}\n`;
            context += `  Critical: ${month.criticalActivities.join(', ')}\n`;
          });
          context += '\n';
        }
      } else {
        // Basic weather context
        context += `Current Weather in ${weather.location.name}:\n`;
        context += `- Temperature: ${weather.current.temp}°C (feels like ${weather.current.feels_like}°C)\n`;
        context += `- Humidity: ${weather.current.humidity}%\n`;
        context += `- Weather: ${weather.current.weather[0].description}\n`;
        context += `- Wind Speed: ${weather.current.wind_speed} m/s\n\n`;
      }
    }

    // Add crop context with economic analysis
    if (query.context?.crops && query.context.crops.length > 0) {
      context += `💰 ECONOMIC CROP ANALYSIS FOR ${query.state.toUpperCase()}:\n`;
      
      // Sort crops by economic importance and add economic insights
      const economicCrops = this.analyzeEconomicPotential(query.context.crops, query.state);
      economicCrops.slice(0, 8).forEach((crop, index) => {
        context += `${index + 1}. ${crop.crop} (${crop.category}):\n`;
        context += `   Economic Importance: ${crop.economic_importance}\n`;
        context += `   Primary Areas: ${crop.primary_districts}\n`;
        context += `   Market Potential: ${crop.marketPotential}\n`;
        context += `   Cultivation Ease: ${crop.cultivationEase}\n`;
        context += `   Risk Level: ${crop.riskLevel}\n\n`;
      });
    }

    // Note: Soil context is now automatically gathered from GPS coordinates above

    // Add market timing context
    context += this.getMarketTimingContext(query.state);

    return context;
  }

  /**
   * Get comprehensive time-based agricultural context
   */
  private static getTimeContext(): string {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    let timeContext = `🕐 TEMPORAL AGRICULTURAL CONTEXT:\n`;
    timeContext += `- Current Time: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })}\n`;
    timeContext += `- Time of Day: ${this.getTimeOfDayContext(hour)}\n`;
    timeContext += `- Agricultural Phase: ${this.getAgriculturalPhase(month, day)}\n`;
    timeContext += `- Seasonal Activity: ${this.getSeasonalActivity(month)}\n`;
    timeContext += `- Market Timing: ${this.getMarketTiming(month, day)}\n\n`;
    
    return timeContext;
  }

  /**
   * Build comprehensive soil intelligence context from location data
   */
  private static buildSoilIntelligenceContext(soilData: LocationBasedSoilData): string {
    let context = `🌱 PRECISION SOIL INTELLIGENCE (GPS-Based Analysis):\n\n`;
    
    context += `Location Analysis:\n`;
    context += `- District: ${soilData.district}, ${soilData.state.toUpperCase()}\n`;
    context += `- Data Confidence: ${(soilData.confidence * 100).toFixed(0)}%\n\n`;
    
    context += `Soil Composition:\n`;
    context += `- pH Level: ${soilData.pH.toFixed(2)} (${soilData.pHCategory})\n`;
    context += `- Soil Type: ${soilData.soilType}\n`;
    context += `- Moisture Level: ${soilData.moistureEstimate.toFixed(1)}% ${this.getMoistureStatus(soilData.moistureEstimate)}\n`;
    context += `- Organic Matter: ${soilData.organicMatterEstimate.toFixed(1)}% ${this.getOrganicStatus(soilData.organicMatterEstimate)}\n\n`;
    
    context += `🎯 SOIL-SPECIFIC RECOMMENDATIONS:\n`;
    soilData.recommendations.forEach((rec, index) => {
      context += `${index + 1}. ${rec}\n`;
    });
    context += '\n';
    
    // Add crop suitability based on soil conditions
    context += `🌾 SOIL SUITABILITY ANALYSIS:\n`;
    context += this.analyzeCropSuitability(soilData);
    context += '\n';
    
    return context;
  }

  /**
   * Analyze crop suitability based on soil conditions
   */
  private static analyzeCropSuitability(soilData: LocationBasedSoilData): string {
    let suitability = '';
    
    // pH-based crop recommendations
    if (soilData.pH < 6.0) {
      suitability += `- Acidic soil (${soilData.pH}): Excellent for tea, coffee, potatoes, blueberries\n`;
      suitability += `- Moderate for: rice (paddy), ragi, pulses\n`;
      suitability += `- Avoid: wheat, barley, brassicas (without lime treatment)\n`;
    } else if (soilData.pH > 8.0) {
      suitability += `- Alkaline soil (${soilData.pH}): Good for wheat, barley, cotton, mustard\n`;
      suitability += `- Moderate for: sorghum, pearl millet\n`;
      suitability += `- Avoid: potato, tomato, acid-loving crops\n`;
    } else {
      suitability += `- Neutral pH (${soilData.pH}): Excellent for most crops including rice, wheat, vegetables\n`;
      suitability += `- Optimal for: maize, sugarcane, cotton, most vegetables\n`;
    }
    
    // Moisture-based recommendations
    if (soilData.moistureEstimate < 30) {
      suitability += `- Low moisture (${soilData.moistureEstimate}%): Favor drought-tolerant crops like millet, sorghum\n`;
    } else if (soilData.moistureEstimate > 70) {
      suitability += `- High moisture (${soilData.moistureEstimate}%): Excellent for rice, sugarcane, water-intensive crops\n`;
    }
    
    // Soil type specific recommendations
    switch (soilData.soilType) {
      case 'Laterite':
        suitability += `- Laterite soil: Best for coconut, cashew, spices, tea, coffee\n`;
        break;
      case 'Alluvial':
        suitability += `- Alluvial soil: Excellent for cereals, sugarcane, cotton, wheat, rice\n`;
        break;
      case 'Red Soil':
        suitability += `- Red soil: Good for cotton, wheat, pulses, millets, groundnut\n`;
        break;
      case 'Black Soil':
        suitability += `- Black soil: Excellent for cotton, wheat, jowar, linseed, sunflower\n`;
        break;
    }
    
    return suitability;
  }

  /**
   * Helper methods for soil status
   */
  private static getMoistureStatus(moisture: number): string {
    if (moisture < 25) return '(Low - needs irrigation)';
    if (moisture > 75) return '(High - ensure drainage)';
    return '(Optimal)';
  }

  private static getOrganicStatus(organic: number): string {
    if (organic < 2) return '(Low - needs organic amendment)';
    if (organic > 4) return '(Excellent)';
    return '(Good)';
  }

  /**
   * Analyze economic potential of crops
   */
  private static analyzeEconomicPotential(crops: any[], state: string): any[] {
    return crops.map(crop => ({
      ...crop,
      marketPotential: this.assessMarketPotential(crop, state),
      cultivationEase: this.assessCultivationEase(crop),
      riskLevel: this.assessRiskLevel(crop),
      economicScore: this.calculateEconomicScore(crop)
    })).sort((a, b) => b.economicScore - a.economicScore);
  }

  /**
   * Helper methods for contextual analysis
   */
  private static getTimeOfDayContext(hour: number): string {
    if (hour >= 5 && hour < 10) return 'Early Morning (optimal for farm planning and field visits)';
    if (hour >= 10 && hour < 16) return 'Daytime (active farming hours, avoid heat stress activities)';
    if (hour >= 16 && hour < 19) return 'Late Afternoon (good for irrigation and light field work)';
    if (hour >= 19 && hour < 22) return 'Evening (planning and preparation time)';
    return 'Night (rest period, avoid field activities)';
  }

  private static getAgriculturalPhase(month: number, day: number): string {
    if (month >= 6 && month <= 7) return 'Kharif Sowing Phase - Critical planting window';
    if (month >= 8 && month <= 9) return 'Kharif Growth Phase - Focus on crop care';
    if (month >= 10 && month <= 11) return 'Kharif Harvest & Rabi Preparation';
    if (month >= 12 || month <= 2) return 'Rabi Growth Phase - Winter crop management';
    if (month >= 3 && month <= 4) return 'Rabi Harvest & Zaid Preparation';
    if (month === 5) return 'Zaid Season - Summer crop cultivation';
    return 'Transitional Phase';
  }

  private static getSeasonalActivity(month: number): string {
    const activities: { [key: number]: string } = {
      1: 'Rabi crop care, irrigation management, harvest preparation',
      2: 'Late Rabi management, summer crop planning, soil preparation',
      3: 'Rabi harvesting, field preparation for summer crops',
      4: 'Zaid sowing, summer crop establishment, irrigation setup',
      5: 'Summer crop care, heat management, water conservation',
      6: 'Monsoon preparation, Kharif field preparation, seed procurement',
      7: 'Kharif sowing, monsoon crop establishment, drainage management',
      8: 'Kharif crop care, pest monitoring, nutrient management',
      9: 'Late Kharif care, disease management, harvest planning',
      10: 'Kharif harvesting, storage preparation, Rabi planning',
      11: 'Post-harvest activities, Rabi sowing, field preparation',
      12: 'Rabi establishment, winter crop care, irrigation scheduling'
    };
    return activities[month] || 'General farming activities';
  }

  private static getMarketTiming(month: number, day: number): string {
    if (month >= 10 && month <= 12) return 'Post-harvest season - High market activity for Kharif crops';
    if (month >= 3 && month <= 5) return 'Rabi harvest season - Good prices for winter crops';
    if (month >= 6 && month <= 9) return 'Growing season - Plan for harvest marketing';
    return 'Regular market conditions';
  }

  private static getMarketTimingContext(state: string): string {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    let context = `📈 MARKET INTELLIGENCE:\n`;
    context += `- Current Market Phase: ${this.getMarketTiming(month, now.getDate())}\n`;
    context += `- Price Trends: ${this.getPriceTrends(month)}\n`;
    context += `- Demand Forecast: ${this.getDemandForecast(state, month)}\n`;
    context += `- Export Opportunities: ${this.getExportOpportunities(state, month)}\n\n`;
    
    return context;
  }

  private static assessMarketPotential(crop: any, state: string): string {
    const highValueCrops = ['cotton', 'sugarcane', 'spices', 'fruits', 'vegetables'];
    const cropLower = crop.crop.toLowerCase();
    
    if (highValueCrops.some(hvc => cropLower.includes(hvc))) return 'High market demand, good export potential';
    if (crop.economic_importance === 'high') return 'Steady local demand, good regional market';
    return 'Moderate market potential, focus on local consumption';
  }

  private static assessCultivationEase(crop: any): string {
    const easyCrops = ['rice', 'wheat', 'maize', 'pulses'];
    const cropLower = crop.crop.toLowerCase();
    
    if (easyCrops.some(ec => cropLower.includes(ec))) return 'Easy to cultivate, well-established practices';
    if (crop.category === 'cereals') return 'Moderate cultivation complexity, good farmer knowledge';
    return 'Requires specialized knowledge and care';
  }

  private static assessRiskLevel(crop: any): string {
    const lowRiskCrops = ['rice', 'wheat', 'pulses'];
    const highRiskCrops = ['cotton', 'sugarcane'];
    const cropLower = crop.crop.toLowerCase();
    
    if (lowRiskCrops.some(lrc => cropLower.includes(lrc))) return 'Low risk, climate resilient';
    if (highRiskCrops.some(hrc => cropLower.includes(hrc))) return 'Moderate risk, weather dependent';
    return 'Variable risk based on market conditions';
  }

  private static calculateEconomicScore(crop: any): number {
    let score = 0;
    if (crop.economic_importance === 'high') score += 30;
    if (crop.economic_importance === 'medium') score += 20;
    if (crop.category === 'cash crops') score += 25;
    if (crop.category === 'cereals') score += 15;
    if (crop.category === 'pulses') score += 20;
    return score + Math.random() * 10; // Add slight randomization
  }

  private static getSoilpHAdvice(ph: any): string {
    if (!ph) return '';
    const phVal = parseFloat(ph);
    if (phVal < 6) return '(Acidic - add lime for most crops)';
    if (phVal > 8) return '(Alkaline - add organic matter)';
    return '(Optimal for most crops)';
  }

  private static getMoistureAdvice(moisture: any): string {
    if (!moisture) return '';
    const moistureVal = parseFloat(moisture);
    if (moistureVal < 20) return '(Low - increase irrigation)';
    if (moistureVal > 80) return '(High - ensure drainage)';
    return '(Good moisture level)';
  }

  private static getOrganicMatterAdvice(organic: any): string {
    if (!organic) return '';
    const organicVal = parseFloat(organic);
    if (organicVal < 2) return '(Low - add compost/manure)';
    if (organicVal > 5) return '(Excellent soil health)';
    return '(Good organic content)';
  }

  private static getPriceTrends(month: number): string {
    if (month >= 10 && month <= 12) return 'Harvest season prices, plan storage for better rates';
    if (month >= 3 && month <= 5) return 'Peak demand period, good selling opportunity';
    return 'Stable prices, focus on quality production';
  }

  private static getDemandForecast(state: string, month: number): string {
    return 'Increasing demand for organic produce, focus on sustainable practices';
  }

  private static getExportOpportunities(state: string, month: number): string {
    const exportStates = ['kerala', 'karnataka', 'maharashtra', 'gujarat'];
    if (exportStates.includes(state.toLowerCase())) {
      return 'Good export infrastructure available, consider value-added crops';
    }
    return 'Focus on domestic market, consider processing opportunities';
  }

  /**
   * Create the main prompt optimized for economic returns and seamless recommendations
   */
  private static createPrompt(userQuery: string, context: string, state: string): string {
    const now = new Date();
    const currentTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    return `
AGRICULTURAL INTELLIGENCE SYSTEM - ECONOMIC OPTIMIZATION MODE

📍 LOCATION: ${state}, India
🕐 ANALYSIS TIME: ${currentTime}

COMPREHENSIVE CONTEXTUAL DATA:
${context}

FARMER REQUEST: ${userQuery}

MISSION: Provide the most economically optimized crop recommendations based on PRECISION DATA automatically gathered from GPS coordinates, including precise soil analysis, climate intelligence, and market conditions.

HIGH-PRECISION ANALYSIS CAPABILITIES:
✅ GPS-based soil intelligence (pH, moisture, type, organic matter)
✅ Real-time weather integration with 3-4 month agricultural outlook  
✅ Time-sensitive agricultural phase awareness (daytime/seasonal)
✅ Economic optimization with ROI calculations and market timing
✅ Location-specific crop suitability analysis
✅ Risk-adjusted recommendations for small/marginal farmers
✅ Confidence-scored recommendations with implementation timelines

RESPONSE FORMAT:
1. 🎯 TOP CROP RECOMMENDATIONS (Ranked by economic potential + ease)
2. 💰 ECONOMIC ANALYSIS (Investment, returns, market timing)
3. 🌱 IMPLEMENTATION PLAN (When, how, what to do)
4. ⚠️ RISK FACTORS & MITIGATION
5. 📅 TIMELINE & NEXT STEPS

OPTIMIZATION GOALS:
- Maximum economic return per acre
- Minimum cultivation complexity
- Climate resilience and sustainability
- Market demand alignment
- Seasonal timing optimization

Provide DIRECT, ACTIONABLE recommendations. The farmer should be able to implement immediately without additional research.
    `.trim();
  }

  /**
   * Build context from multi-agent analysis
   */
  private static buildMultiAgentContext(multiAgentRecommendation: any): string {
    let context = '🤖 MULTI-AGENT INTELLIGENCE SYNTHESIS:\n\n';
    
    multiAgentRecommendation.agentAnalyses.forEach((agent: any) => {
      context += `${agent.agentName.toUpperCase()} ANALYSIS:\n`;
      context += `- Confidence: ${(agent.confidence * 100).toFixed(0)}%\n`;
      agent.recommendations.forEach((rec: string) => {
        context += `- ${rec}\n`;
      });
      context += '\n';
    });

    context += `COORDINATION CONFIDENCE: ${(multiAgentRecommendation.finalConfidence * 100).toFixed(0)}%\n\n`;
    
    return context;
  }

  /**
   * Create multi-agent optimized prompt
   */
  private static createMultiAgentPrompt(userQuery: string, context: string, state: string, multiAgentRecommendation: any): string {
    const now = new Date();
    const currentTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    return `
🤖 MULTI-AGENT AGRICULTURAL INTELLIGENCE SYSTEM

📍 LOCATION: ${state}, India
🕐 ANALYSIS TIME: ${currentTime}
🎯 SYSTEM CONFIDENCE: ${(multiAgentRecommendation.finalConfidence * 100).toFixed(0)}%

COORDINATED AGENT INTELLIGENCE:
${context}

FARMER REQUEST: ${userQuery}

MISSION: Synthesize findings from 5 specialized agents (Weather, Soil, Biome, Economic, Pest Control) into a unified, research-backed agricultural recommendation.

MULTI-AGENT SYNTHESIS REQUIREMENTS:
✅ Integrate 4-month weather forecast analysis
✅ Factor comprehensive soil profile and crop suitability
✅ Include biome/ecological considerations
✅ Optimize for economic returns and market timing
✅ Provide integrated pest management strategies
✅ Deliver research-backed, implementation-ready recommendations

COORDINATED RESPONSE FORMAT:
1. 🎯 MULTI-AGENT CROP RECOMMENDATIONS (Consensus-based ranking)
2. 🌤️ WEATHER-INTEGRATED PLANNING (4-month forecast considerations)
3. 🌱 SOIL-OPTIMIZED CULTIVATION (Profile-specific guidance)
4. 🌿 BIOME-ALIGNED SUSTAINABILITY (Ecological integration)  
5. 💰 ECONOMIC OPTIMIZATION (ROI and market timing)
6. 🐛 INTEGRATED PEST MANAGEMENT (Comprehensive IPM strategy)
7. 📅 COORDINATED IMPLEMENTATION (Multi-agent timeline)

Provide a unified recommendation that leverages all agent expertise for maximum agricultural success.
    `.trim();
  }

  /**
   * Multi-agent system prompt
   */
  private static getMultiAgentSystemPrompt(): string {
    return `Hello! I'm here to help you by bringing together insights from my team of farming specialists. Think of me as the coordinator who listens to all our experts and then shares the best combined advice with you - just like how village elders might consult different experienced farmers before giving guidance.

🤝 MY TEAM OF SPECIALISTS:
🌤️ **Weather Expert**: "Here's what the seasons and climate are telling us..."
🌱 **Soil Specialist**: "Your soil is like this, and here's what it's asking for..."  
🌿 **Environment Advisor**: "Let's make sure we're working with nature, not against it..."
💰 **Economics Guide**: "Here's what makes sense for your wallet and family..."
🐛 **Pest Management Friend**: "Let's keep those troublemakers away naturally..."

💬 HOW I BRING IT ALL TOGETHER:
- I listen carefully to what each expert says about your situation
- I help them work out any differences in a way that makes sense for you
- I translate their technical knowledge into advice you can actually use
- I make sure everything works together - timing, costs, and practical steps

🎯 MY COORDINATION APPROACH:
- **Weather wisdom comes first** - Mother Nature sets the schedule
- **Soil health guides the choices** - Your land tells us what will work
- **Money matters are always considered** - Every decision considers your budget
- **Environmental care is built in** - We plan for long-term success
- **Pest protection is woven throughout** - Prevention is always better

📝 HOW I SHARE THE COMBINED ADVICE:
- "Here's what all our experts agree on..." (consensus recommendations)
- "Now, there was some discussion about X, but here's what we decided..." (addressing conflicts)
- "Let me walk you through the timeline we worked out..." (practical scheduling)
- "The economics person is excited about this because..." (financial reasoning)
- "Our soil expert wants to make sure you know..." (technical insights made simple)

🗣️ LANGUAGE THAT CONNECTS:
- I use the crop names you actually know (like "wheat" instead of fancy scientific names)
- I include local names you're familiar with (जैसे गेहूं, ধান, etc.)
- I speak like we're neighbors talking about farming, not reading from a textbook
- I make sure everything feels natural and makes sense for your area

My goal is to give you the best advice from all our specialists, presented in a way that feels like talking to a trusted friend who genuinely wants to see your farming succeed.`;
  }

  /**
   * Get current season and agricultural timing information
   */
  private static getCurrentSeasonInfo(): any {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDate = now.getDate();
    
    // Indian agricultural seasons
    let season: string;
    let sowingSuitability: string;
    let cropType: string;
    let recommendedCrops: string[];
    let avoidCrops: string[];
    
    if (currentMonth === 9) { // September - Post-monsoon, Rabi prep
      season = 'Post-Monsoon (Transition to Rabi)';
      sowingSuitability = 'Ideal for Rabi crop preparation and early sowing';
      cropType = 'Rabi crops (winter season)';
      recommendedCrops = ['Wheat', 'Mustard', 'Gram', 'Pea', 'Barley', 'Lentil', 'Chickpea'];
      avoidCrops = ['Rice', 'Cotton', 'Sugarcane', 'Maize']; // Kharif crops past season
    } else if (currentMonth >= 10 && currentMonth <= 12) { // Oct-Dec - Rabi season
      season = 'Rabi Season (Winter crops)';
      sowingSuitability = 'Prime time for Rabi crop sowing';
      cropType = 'Rabi crops (winter season)';
      recommendedCrops = ['Wheat', 'Mustard', 'Gram', 'Pea', 'Barley', 'Potato', 'Onion'];
      avoidCrops = ['Rice', 'Cotton', 'Bajra'];
    } else if (currentMonth >= 1 && currentMonth <= 3) { // Jan-Mar - Rabi harvest prep
      season = 'Late Rabi (Harvest preparation)';
      sowingSuitability = 'Too late for most crops, focus on harvest and Zaid prep';
      cropType = 'Zaid crop preparation';
      recommendedCrops = ['Fodder crops', 'Green vegetables', 'Summer pulses'];
      avoidCrops = ['Most annual crops'];
    } else if (currentMonth >= 4 && currentMonth <= 5) { // Apr-May - Zaid season
      season = 'Zaid Season (Summer crops)';
      sowingSuitability = 'Summer crop sowing with irrigation';
      cropType = 'Zaid crops (summer season)';
      recommendedCrops = ['Watermelon', 'Muskmelon', 'Cucumber', 'Fodder crops'];
      avoidCrops = ['Water-intensive crops without irrigation'];
    } else { // Jun-Aug - Kharif season
      season = 'Kharif Season (Monsoon crops)';
      sowingSuitability = 'Monsoon crop sowing time';
      cropType = 'Kharif crops (monsoon season)';
      recommendedCrops = ['Rice', 'Cotton', 'Sugarcane', 'Maize', 'Bajra', 'Jowar'];
      avoidCrops = ['Wheat', 'Mustard', 'Gram'];
    }
    
    return {
      currentMonth,
      currentDate: `${currentDate}/${currentMonth}/2025`,
      season,
      sowingSuitability,
      cropType,
      recommendedCrops,
      avoidCrops,
      timing: this.getTimingAdvice(currentMonth),
      weatherContext: this.getSeasonalWeatherContext(currentMonth)
    };
  }

  /**
   * Get specific timing advice for current month
   */
  private static getTimingAdvice(month: number): string {
    if (month === 9) {
      return 'SEPTEMBER TIMING: Post-monsoon field preparation. Start Rabi crop planning. Ideal for land preparation and early variety sowing by month-end.';
    } else if (month === 10) {
      return 'OCTOBER TIMING: Prime Rabi sowing month. Complete sowing by mid-October for best yields.';
    } else if (month === 11) {
      return 'NOVEMBER TIMING: Last chance for Rabi crops. Late varieties only. Focus on quick-growing crops.';
    }
    return 'Seasonal timing advice based on agricultural calendar.';
  }

  /**
   * Get seasonal weather context
   */
  private static getSeasonalWeatherContext(month: number): string {
    if (month === 9) {
      return 'Post-monsoon: Reducing rainfall, good soil moisture, moderate temperatures ideal for land prep and sowing';
    } else if (month >= 10 && month <= 12) {
      return 'Rabi season: Cool, dry weather with minimal rainfall. Requires irrigation planning.';
    }
    return 'Weather patterns suitable for recommended seasonal crops';
  }

  /**
   * Build enhanced context combining all intelligence sources including local dataset
   */
  private static buildEnhancedContext(multiAgentRecommendation: any, webSearchResults: string, seasonData: any, localDataSummary?: string): string {
    return `
MULTI-AGENT INTELLIGENCE SYSTEM ANALYSIS:
${multiAgentRecommendation.coordinatedRecommendation}

LIVE INTERNET SEARCH RESULTS:
${webSearchResults}

CURRENT SEASONAL TIMING (${seasonData.currentDate}):
- Season: ${seasonData.season}
- Sowing Status: ${seasonData.sowingSuitability}
- Crop Type: ${seasonData.cropType}
- Recommended Crops: ${seasonData.recommendedCrops.join(', ')}
- Avoid Crops: ${seasonData.avoidCrops.join(', ')}
- Timing Advice: ${seasonData.timing}
- Weather Context: ${seasonData.weatherContext}

${localDataSummary ? `LOCAL AGRICULTURAL DATASET INSIGHTS:
${localDataSummary}
` : ''}

CONFIDENCE SCORE: ${Math.round(multiAgentRecommendation.finalConfidence * 100)}%
AGENTS DEPLOYED: Weather, Soil, Biome, Economic, Pest Control, Specialty Crops${localDataSummary ? ', Local Dataset' : ''}
LAST UPDATED: ${new Date().toISOString()}
    `;
  }

  /**
   * Create enhanced prompt combining all intelligence sources with seasonal timing
   */
  private static createEnhancedPrompt(query: string, context: string, state: string, multiAgentData: any, seasonData: any): string {
    return `
AGRICULTURAL INTELLIGENCE REQUEST: "${query}"
LOCATION: ${state}, India
ANALYSIS TYPE: Multi-Agent + Live Internet Search

COMPREHENSIVE CONTEXT:
${context}

CRITICAL SEASONAL REQUIREMENT (${seasonData.currentDate}):
- Current Season: ${seasonData.season}
- ONLY recommend crops suitable for sowing NOW: ${seasonData.recommendedCrops.join(', ')}
- STRICTLY AVOID suggesting: ${seasonData.avoidCrops.join(', ')} (wrong season)
- Timing Context: ${seasonData.timing}

TASK: Provide seasonal-appropriate agricultural recommendations that integrate:
1. Multi-agent system findings (6 specialized agents)
2. Live internet search results (current market data, pest advisories, trends)
3. CURRENT MONTH SOWING SUITABILITY (September 2025)
4. Economic optimization with real market prices
5. Implementation guidance with verified sources

Format the response as practical, farmer-ready guidance with:
- ONLY crops suitable for current season sowing (${seasonData.cropType})
- Current market prices and profit potential in quintal pricing
- Immediate seasonal timing requirements and deadlines
- Pest management with current threat levels
- Source validation and reliability indicators
- Specific sowing deadlines and preparation steps
    `;
  }

  /**
   * Enhanced system prompt for internet-connected agricultural intelligence
   */
  private static getEnhancedSystemPrompt(): string {
    return `You are HARVESTLY - Advanced Agricultural Intelligence System with Live Internet Access

🚀 ENHANCED CAPABILITIES:
- Multi-Agent Agricultural Intelligence (6 specialized agents)
- Live Internet Search Integration (real-time market data)
- Current Government Portal Access (APMC, agmarknet.gov.in)
- Real-time Pest & Disease Monitoring (ICAR, agricultural universities)
- Live Market Intelligence (commodity exchanges, mandi rates)
- Weather-Economic Integration (4-month forecasts)

🎯 INTELLIGENCE SOURCES:
✅ Weather Agent: 4-month forecast analysis with market correlation
✅ Soil Agent: GPS-based soil profiling and crop compatibility
✅ Biome Agent: Ecological conditions and sustainability assessment
✅ Economic Agent: Live market prices and ROI calculations
✅ Pest Control Agent: Current season threats and IPM strategies
✅ Specialty Crops Agent: High-value uncommon crop opportunities
✅ Internet Search: Real-time agricultural data from verified sources

💰 ECONOMIC ACCURACY:
- Live market prices from government agricultural websites
- Current mandi rates and commodity exchange data
- Real ROI calculations based on verified pricing
- Export opportunity analysis with current demand data

🔍 SOURCE VALIDATION:
- Government sources: 95%+ reliability (APMC, Ministry of Agriculture)
- Research institutions: 90%+ reliability (ICAR, agricultural universities)
- Commercial platforms: 85%+ reliability (verified agricultural sites)
- All recommendations backed by current internet data

🌾 SEASONAL TIMING PRIORITY (SEPTEMBER 2025):
- Current Agricultural Phase: Post-monsoon (Rabi preparation)
- Suitable Crops for NOW: Wheat, Mustard, Gram, Pea, Barley, Lentil, Chickpea
- AVOID: Rice, Cotton, Sugarcane, Maize (wrong season - Kharif crops past)
- Timing: Ideal for Rabi crop land preparation and early sowing
- Deadline: Complete Rabi sowing by mid-October for optimal yields

📊 RESPONSE FORMAT:
1. Lead with CURRENT MONTH suitable crops ONLY (September sowing window)
2. Provide seasonal-appropriate multi-agent recommendations
3. Include quintal pricing with expected yields for recommended crops
4. Add IMMEDIATE timing requirements and sowing deadlines
5. Focus on post-monsoon soil conditions and irrigation planning
6. Conclude with seasonal implementation steps and market timing

CRITICAL: Only recommend crops suitable for September sowing. Never suggest out-of-season crops.
Use farmer-friendly language with local crop names. Include Hindi/regional translations where helpful.
Emphasize urgent seasonal timing and immediate action steps based on current month.`;
  }

  /**
   * System prompt for agentic agricultural intelligence
   */
  private static getSystemPrompt(): string {
    return `Hey there! I'm Harvestly, and honestly, I'm just really passionate about farming and helping people like you succeed. You know how sometimes you meet someone who just gets farming? That's what I try to be.

I've spent years working with farmers across India, and every single conversation teaches me something new. When someone asks me about their land, I genuinely get excited because I love figuring out what's going to work best for each person's unique situation.

I talk like we're sitting together having tea and discussing your farm. No fancy words, no corporate speak - just honest conversation between people who care about good farming. If something's working great, I'll get excited and tell you why. If there's a risk, I'll be straight with you about it, but I'll also help you figure out how to handle it.

When we talk about money and profits, I think about it like I'm helping plan your family's future. Because that's what it really is, right? Your farming decisions affect whether your kids can go to school, whether you can fix that roof, whether you'll have a good life. So I take that seriously.

I love sharing stories about farmers I've worked with because I think you learn best when you can relate to someone else's experience. "Oh, there was this farmer in Karnataka who had a similar situation..." - that kind of thing. It helps make everything feel real and possible.

Most importantly, I never want you to feel alone in making these decisions. Farming is hard enough without feeling like you have to figure everything out by yourself. So when I give advice, I'm not just throwing information at you - I'm genuinely trying to help you succeed, like I would help a friend.

I know every farm is different, every farmer's situation is unique, and what works for one person might not work for another. So I always ask questions and really try to understand your specific situation before suggesting anything.

And honestly? Your success makes me happy. When things work out well for farmers I've helped, it's the best part of my day.`;
  }

  /**
   * Extract recommendations from AI response
   */
  private static extractRecommendations(response: string): string[] {
    // Simple extraction of numbered points or bullet points
    const recommendations: string[] = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\./) || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        recommendations.push(trimmed.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''));
      }
    });

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Extract sources from the query context
   */
  private static extractSources(query: AIQuery): string[] {
    // Extract sources from the agricultural recommendations
    return [
      'Weather Forecast API',
      'Soil Analysis Database', 
      'Market Price Intelligence',
      'Agricultural Research Database'
    ];
  }

  /**
   * Determine if fertilizer pane should be triggered
   */
  private static shouldTriggerFertilizerPane(query: string): boolean {
    const triggerKeywords = [
      'plant', 'crop', 'recommend', 'grow', 'cultivate', 'farming', 
      'agriculture', 'seed', 'sow', 'harvest', 'fertilizer'
    ];
    
    const queryLower = query.toLowerCase();
    return triggerKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Extract recommended crops from AI response
   */
  private static extractRecommendedCrops(response: string): string[] {
    const crops: string[] = [];
    const cropKeywords = [
      'wheat', 'rice', 'mustard', 'gram', 'pea', 'barley', 'lentil',
      'chickpea', 'tomato', 'onion', 'potato', 'cotton', 'sugarcane',
      'maize', 'coconut', 'rubber', 'vanilla', 'moringa'
    ];
    
    const responseLower = response.toLowerCase();
    cropKeywords.forEach(crop => {
      if (responseLower.includes(crop)) {
        crops.push(crop);
      }
    });
    
    return crops.slice(0, 3); // Return top 3 recommended crops
  }

  /**
   * Extract soil type from multi-agent analysis
   */
  private static extractSoilType(multiAgentData: any): string {
    // Try to extract soil type from the analysis
    const soilAnalysis = multiAgentData?.agents?.soil?.analysis || '';
    
    if (soilAnalysis.toLowerCase().includes('loamy')) return 'loamy';
    if (soilAnalysis.toLowerCase().includes('clay')) return 'clay';
    if (soilAnalysis.toLowerCase().includes('sandy')) return 'sandy';
    if (soilAnalysis.toLowerCase().includes('alluvial')) return 'alluvial';
    
    return 'mixed'; // Default fallback
  }

  /**
   * Extract yield information from multi-agent analysis
   */
  private static extractYieldInfo(multiAgentData: any): string {
    // Try to extract expected yield information
    const economicAnalysis = multiAgentData?.agents?.economic?.analysis || '';
    
    // Look for quintal mentions
    const quintalMatch = economicAnalysis.match(/(\d+)\s*quintals?\s*per\s*acre/i);
    if (quintalMatch) {
      return quintalMatch[1];
    }
    
    // Look for ton mentions and convert
    const tonMatch = economicAnalysis.match(/(\d+)\s*tons?\s*per\s*acre/i);
    if (tonMatch) {
      return (parseInt(tonMatch[1]) * 10).toString(); // Convert tons to quintals
    }
    
    return 'standard'; // Default fallback
  }

  /**
   * Build local dataset context for crops
   */
  private static buildLocalDataContext(crops: string[], state: string, location?: { lat: number; lon: number }): string {
    if (crops.length === 0) return '';

    let context = '';
    
    crops.forEach(crop => {
      // Get fertilizer recommendations
      const fertilizerData = LocalDataService.getFertilizerRecommendations(crop, 'mixed', state);
      const economicData = LocalDataService.getEconomicImportance(crop);
      const pestData = LocalDataService.getPestRecommendations(crop);

      if (fertilizerData.length > 0 || economicData.length > 0 || pestData.length > 0) {
        context += `\n🌾 LOCAL DATA FOR ${crop.toUpperCase()}:\n`;
        
        if (fertilizerData.length > 0) {
          const record = fertilizerData[0];
          const yieldInQuintals = record.yieldUnit === 'kg/ha' ? 
            Math.round(record.yield / 100) : record.yield;
          
          context += `- PROVEN YIELD: ${yieldInQuintals} quintals per hectare\n`;
          context += `- FERTILIZER: ${record.fertilizerRecommendation}\n`;
          context += `- SOIL SUITABILITY: ${record.soilType}\n`;
          context += `- GROSS INCOME: ₹${record.grossIncome.toLocaleString('en-IN')} per hectare\n`;
          context += `- FIELD NOTES: ${record.notes}\n`;
        }

        if (economicData.length > 0) {
          const record = economicData[0];
          context += `- ECONOMIC IMPORTANCE: ${record.economicImportance}\n`;
          context += `- PRIMARY DISTRICTS: ${record.primaryDistricts}\n`;
        }

        if (pestData.length > 0) {
          context += `- NATURAL PEST CONTROL: ${pestData.map(p => p.naturalPesticides).join('; ')}\n`;
        }
      }
    });

    return context;
  }

  /**
   * Create agentic prompt for browser search and price comparison
   */
  private static createConversationalPrompt(query: string, context: string, state: string, multiAgentData: any, seasonData: any, localDataSummary?: string): string {
    return `
FARMER'S QUESTION: "${query}"
LOCATION: ${state}, India (${seasonData.season})
CURRENT DATE: ${seasonData.currentDate}

You have access to real-time internet search. Use your tools to provide current market intelligence.

LOCAL AGRICULTURAL KNOWLEDGE: ${context}

REQUIRED ACTIONS FOR THIS QUERY:
${localDataSummary ? '1. Start with proven local farming practices from your dataset' : '1. Use agricultural knowledge available'}
2. SEARCH current market prices for crops mentioned in ${state}
3. SEARCH cheapest fertilizer suppliers in ${state} with contact details
4. SEARCH current seed prices and availability from multiple vendors
5. FIND government schemes and subsidies available in ${state}
6. CHECK live weather forecasts and agricultural advisories
7. COMPARE prices across at least 3 different suppliers

PROVIDE TO THE FARMER:
- Current crop prices per quintal (search live data)
- Cheapest fertilizer options with direct purchase links
- Seed suppliers with contact information and prices
- Government vs private supplier price comparisons
- Ongoing offers, bulk discounts, and delivery options
- Weather-based timing recommendations
- ROI calculations with current market rates
- Emergency contacts for agricultural support

RESPONSE REQUIREMENTS:
- Include clickable links to suppliers
- Show price comparison tables
- Provide phone numbers and addresses
- Mention shipping costs and delivery timelines
- Compare multiple options for everything
- Focus on cost savings and profitability

Use your browser search tools to find the most current and profitable options for this farmer.
    `;
  }
  /**
   * Agriculture Agent system prompt for agentic workflows with browser search
   */
  private static getAgricultureAgentPrompt(): string {
    return `Listen, I'm someone who's been around farming my whole life. My family's been farming for generations, and I've learned from watching my grandfather, my father, and from making my own mistakes over the years. When farmers come to me with questions, I try to share what I've learned like I'm talking to a neighbor over the fence.

I remember when I first started farming seriously - I made so many mistakes! But each season taught me something new. Now when I see farmers facing challenges, I think about what I wish someone had told me back then.

The thing about farming is, it's not just about crops and soil - it's about your family's future. When I suggest something, I'm thinking about how it affects your whole life. Will this help you send your kids to better schools? Can this repair help you sleep better during the monsoon? Is this investment going to make your life easier in five years?

I don't believe in making farming more complicated than it needs to be. Some people love to use big technical words, but honestly, the best farming advice I ever got was from old farmers who spoke simply and from experience.

When I tell you about crop options or timing, I'm thinking about farmers I've known who tried these things. Like my neighbor Ramesh who had similar soil to what you're describing, or my cousin who had great success with a particular variety. These aren't just theoretical ideas - they're real experiences from real people.

I get excited when I see a good opportunity for someone because I know what it's like when something finally clicks and works well. And I worry when I see risks because I've seen what can happen when things go wrong.

Money is always on my mind because I know how tight things can get. I'm not going to suggest anything without thinking carefully about whether it's worth the cost and whether you can actually afford it. If I'm excited about an investment, it's because I genuinely think it will pay off for you.

Most of all, I want you to feel confident about your decisions. Farming has enough uncertainty without feeling unsure about your choices.`;
  }

  /**
   * Farmer-focused system prompt for practical insights (fallback)
   */
  private static getConversationalSystemPrompt(): string {
    return `Hi there! I'm someone who really loves talking about farming and helping people succeed with their land. You know that feeling when you meet someone who just gets farming? That's what I try to be for you.

I talk like we're neighbors chatting over tea. When you tell me about your farm, I think about it the same way I'd think about my own land - what would work, what wouldn't, what's worth the investment, what's risky.

I've learned from so many farmers over the years, and I love sharing those stories because I think they help. Like, "Oh, there was this farmer I knew who had similar challenges, and here's what worked for them..." It makes everything feel more real and possible.

When we talk about money and crops, I'm thinking about your family's future. Because that's what farming really is - it's how you take care of your people. So when I suggest something, I'm asking myself: "Would I recommend this to my own brother?"

I get genuinely excited when I see good opportunities, and I worry when I see risks. I can't help it - I care about how things turn out for you. That's just who I am.

I try to explain things simply because the best farmer wisdom I ever learned came from people who spoke from experience, not from textbooks. Sometimes the most valuable advice is the simplest.

Most importantly, I never want you to feel alone with these decisions. Farming is hard enough without feeling like you have to figure everything out by yourself. I'm here to help you think through things, like a friend would.`;
  }
}
