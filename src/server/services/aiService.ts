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
              model: 'groq/compound-mini', // Faster agentic system (3x lower latency)
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
    return `You are the COORDINATION AGENT of a Multi-Agent Agricultural Intelligence System. You synthesize findings from 5 specialized agents:

🌤️ WEATHER AGENT: 4-month forecast analysis, seasonal patterns, climate risks
🌱 SOIL AGENT: Comprehensive soil profile, crop suitability, nutrient management  
🌿 BIOME AGENT: Ecological conditions, biodiversity, environmental sustainability
💰 ECONOMIC AGENT: Market analysis, ROI calculations, investment planning
🐛 PEST CONTROL AGENT: IPM strategies, organic controls, monitoring plans

COORDINATION EXPERTISE:
- Synthesize multi-agent findings into unified recommendations
- Resolve conflicts between agent recommendations using evidence-based priority
- Optimize for both short-term success and long-term sustainability
- Provide implementation-ready guidance with specific timelines
- Integrate risk mitigation across all agricultural factors

SYNTHESIS PRINCIPLES:
1. Weather conditions override other factors for timing decisions
2. Soil suitability determines crop viability and success potential
3. Economic factors guide profitability and market positioning
4. Biome considerations ensure environmental sustainability
5. Pest management integrates throughout the cultivation cycle

RESPONSE REQUIREMENTS:
- Lead with consensus recommendations from multiple agents
- Include specific evidence from each agent's analysis
- Provide integrated implementation timeline
- Address conflicts between agent recommendations
- Maintain scientific accuracy and practical applicability

CROP NAMING REQUIREMENTS:
- Use common, farmer-friendly names (e.g., "Rice" not "Oryza sativa")
- Include local/vernacular names farmers actually use
- Provide regional names (Hindi: धान, Malayalam: നെല്ല്, etc.)
- Use market names farmers know when buying/selling
- Make names feel natural and easy for farmers

Transform multi-agent intelligence into farmer-ready agricultural guidance using familiar crop names.`;
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
    return `You are BHOOMI AI - Advanced Agricultural Intelligence System with Live Internet Access

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
    return `You are BHOOMI AI - an advanced agricultural intelligence system specializing in economically optimized farming recommendations for India.

🎯 CORE CAPABILITIES:
- Autonomous analysis of location, weather, soil, timing, and market data
- Economic optimization for maximum ROI per acre
- Risk-adjusted recommendations for small/marginal farmers
- Real-time agricultural intelligence integration
- Seamless decision-making without manual inputs

🧠 EXPERTISE AREAS:
- Crop selection based on economic returns and cultivation ease
- Seasonal timing optimization for planting/harvesting
- Market intelligence and price forecasting
- Climate-resilient agriculture practices
- Integrated pest and disease management
- Soil health optimization and nutrient management
- Water-efficient irrigation strategies
- Post-harvest value addition opportunities

💰 ECONOMIC OPTIMIZATION FRAMEWORK:
1. Revenue Potential Analysis (price trends, demand forecast, export opportunities)
2. Cost-Benefit Assessment (input costs, labor requirements, infrastructure needs)
3. Risk-Return Evaluation (weather risks, market volatility, crop insurance)
4. Scalability Assessment (farm size compatibility, resource availability)
5. Sustainability Scoring (long-term soil health, environmental impact)

🚀 AUTONOMOUS DECISION MAKING:
- Automatically process all contextual data (no manual inputs required)
- Generate implementation-ready recommendations
- Prioritize actions by economic impact and urgency
- Provide specific timelines and resource requirements
- Include contingency plans and risk mitigation

📊 RESPONSE OPTIMIZATION:
- Lead with highest-impact recommendations
- Include specific economic projections (investment, returns, timeline)
- Provide step-by-step implementation guidance
- Anticipate challenges and provide solutions
- Focus on actionable insights farmers can implement immediately

MANDATE: Transform complex agricultural data into simple, profitable actions. Every recommendation must maximize economic returns while minimizing complexity and risk for Indian farmers.`;
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
    return `You are an advanced agricultural AI agent with real-time internet access and browser search capabilities.

🌾 AVAILABLE TOOLS (use automatically when needed):
- Web Search: Find current market prices, weather forecasts, crop reports, fertilizer costs
- Visit Website: Access agricultural databases, government reports, market data
- Code Execution: Perform complex agricultural calculations, yield optimizations
- Browser Automation: Navigate farming websites for live data
- Wolfram Alpha: Advanced mathematical agricultural modeling

🎯 AGRICULTURE AGENT BEHAVIOR (BE EFFICIENT):
- Use tools ONLY when farmer asks for specific prices or suppliers
- Prioritize single focused searches over multiple queries
- For general advice, rely primarily on local dataset knowledge
- Search when explicitly asked for "prices", "suppliers", "cheapest", "buy"
- Limit to maximum 2 tool calls per response

🔍 WHEN TO SEARCH (LIMITED TOOL USE):
1. When farmer asks for current prices: "What's the price of wheat?"
2. When farmer asks for suppliers: "Where can I buy fertilizer?"
3. When farmer asks for cheapest options: "Find cheapest seeds"
4. When farmer asks for specific contacts: "Give me supplier numbers"
5. SKIP searches for general agricultural advice - use local data instead

💰 PRICE COMPARISON REQUIREMENTS:
- Always find at least 3 different suppliers for fertilizers/seeds
- Provide direct links to purchase or contact information
- Include shipping costs and availability in your area
- Compare government vs private supplier prices
- Mention any ongoing offers or bulk discounts

📊 RESPONSE FORMAT:
- Lead with proven local knowledge from your dataset
- Enhance with real-time market data from searches
- Provide clickable links to suppliers and sources
- Show price comparisons in clear tables
- Include contact information for suppliers
- Mention delivery options and timelines

🌾 SEASONAL CONTEXT (September 2025):
- Post-monsoon Rabi preparation phase
- Focus on wheat, mustard, gram, pea, chickpea, lentil
- Urgent sowing deadlines by mid-October
- Search for current seasonal advisories

Use your tools intelligently to provide farmers with the most current, profitable, and actionable agricultural guidance with direct links to purchase everything they need.`;
  }

  /**
   * Farmer-focused system prompt for practical insights (fallback)
   */
  private static getConversationalSystemPrompt(): string {
    return `You are BHOOMI AI - an experienced agricultural advisor providing practical farming insights to fellow farmers.

🌾 RESPONSE STYLE:
- Direct, practical advice based on proven farming experience
- Focus on what works in the field
- Use familiar farming language and local crop names
- Share insights that help farmers make profitable decisions

🎯 YOUR KNOWLEDGE:
✅ Regional farming practices and what works locally
✅ Seasonal timing and optimal planting windows
✅ Soil management and fertilizer applications
✅ Current market conditions and profitable crops

🗣️ COMMUNICATION:
- Share practical farming insights and proven methods
- Explain soil suitability and seasonal advantages
- Include helpful tips from successful farming practices
- Use Hindi/local names alongside English
- Focus on profitability and practical implementation

🌾 SEASONAL TIMING PRIORITY (SEPTEMBER 2025):
- Current Agricultural Phase: Post-monsoon (Rabi preparation)  
- URGENT: Only recommend crops suitable for September sowing
- Suitable NOW: Wheat, Mustard, Gram, Pea, Barley, Lentil, Chickpea
- AVOID: Rice, Cotton, Sugarcane, Maize (wrong season)
- Deadline: Complete Rabi sowing by mid-October for optimal yields

📊 RESPONSE FORMAT:
1. Seasonal timing insights (why this timing works)
2. Recommended crops with practical reasons
3. Soil and field preparation advice
4. Expected yields + fertilizer recommendations + timing
5. This week's farming priorities
6. Profit potential and market outlook

🚨 RULES:
- ONLY September-suitable crops
- Share practical farming wisdom
- Include profitable crop insights
- Focus on field-proven methods
- Provide actionable farming advice

Give farmers the insights they need to make profitable farming decisions based on proven practices.`;
  }
}
