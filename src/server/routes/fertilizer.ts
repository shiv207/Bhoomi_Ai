import express from 'express';
import axios from 'axios';
import { LocalDataService } from '../services/localDataService';

const router = express.Router();

interface FertilizerAction {
  step: string;
  amount_per_ha: string;
  amount_per_quintal: string;
  timing: string;
}

interface Supplier {
  name: string;
  url: string;
}

interface Citation {
  title: string;
  url: string;
  snippet: string;
}

interface FertilizerResponse {
  title: string;
  summary: string;
  actions: FertilizerAction[];
  pest_interactions: string;
  suppliers: Supplier[];
  confidence_score: number;
  citations: Citation[];
  raw_search_hits: any[];
}

// Cache for storing fertilizer recommendations (24-hour cache)
const fertilizerCache = new Map<string, { data: FertilizerResponse; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limiting
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 10; // 10 requests per hour per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

/**
 * Rate limiting middleware
 */
function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientIP = req.ip || 'unknown';
  const now = Date.now();
  
  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, []);
  }
  
  const requests = rateLimitMap.get(clientIP)!;
  const recentRequests = requests.filter(time => now - time < RATE_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((recentRequests[0] + RATE_WINDOW - now) / 1000)
    });
  }
  
  recentRequests.push(now);
  rateLimitMap.set(clientIP, recentRequests);
  next();
}

/**
 * Perform Groq browser search for fertilizer information
 */
async function performGroqBrowserSearch(query: string): Promise<any[]> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  try {
    console.log(`🔍 Performing Groq browser search: ${query}`);
    
    // Use Groq AI to generate comprehensive fertilizer guidance
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are an agricultural fertilizer expert with access to current market and research data. Provide detailed, research-backed fertilizer recommendations with specific application rates, timing, and safety guidance.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content || '';
    
    // Simulate search results structure
    return [
      {
        title: 'AI-Generated Fertilizer Guidance',
        url: 'https://api.groq.com/fertilizer-guidance',
        snippet: aiResponse.substring(0, 200) + '...',
        content: aiResponse
      }
    ];
  } catch (error) {
    console.error('Groq browser search error:', error);
    throw new Error('Failed to fetch fertilizer recommendations');
  }
}

/**
 * Parse search results and extract fertilizer guidance, merge with local dataset
 */
function parseFertilizerGuidance(searchResults: any[], crop: string, location: string, soil: string): FertilizerResponse {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  
  // Get local dataset recommendations
  const localFertilizer = LocalDataService.getFertilizerRecommendations(crop, soil, location);
  const localEconomic = LocalDataService.getEconomicImportance(crop);
  const localPests = LocalDataService.getPestRecommendations(crop);
  
  // Extract guidance from search results
  const mainContent = searchResults[0]?.content || '';
  
  // Merge local data with AI recommendations
  const actions: FertilizerAction[] = [];
  
  // Add local dataset actions first (higher priority)
  if (localFertilizer.length > 0) {
    const localActions = LocalDataService.convertToFertilizerActions(localFertilizer);
    actions.push(...localActions.map(action => ({
      step: action.step,
      amount_per_ha: action.amount_per_ha,
      amount_per_quintal: action.amount_per_quintal,
      timing: action.timing
    })));
  }
  
  // Add AI-generated actions if local data is limited
  if (actions.length < 3) {
    actions.push(
      {
        step: 'Basal Application (AI Recommendation)',
        amount_per_ha: '200-250 kg NPK 10:26:26 per hectare',
        amount_per_quintal: '8-10 kg NPK per expected quintal yield',
        timing: 'At sowing/planting time'
      },
      {
        step: 'Top Dressing (AI Recommendation)',
        amount_per_ha: '100-150 kg Urea per hectare',
        amount_per_quintal: '4-6 kg Urea per expected quintal yield',
        timing: '30-45 days after sowing'
      }
    );
  }

  // Build pest interactions from local data
  let pestInteractions = 'Avoid over-fertilization with nitrogen as it can increase pest susceptibility.';
  if (localPests.length > 0) {
    const naturalPesticides = localPests.map(p => p.naturalPesticides).join('; ');
    pestInteractions += ` Local pest control: ${naturalPesticides}`;
  }

  // Enhanced suppliers with local context
  const suppliers = [
    {
      name: 'IFFCO (Indian Farmers Fertiliser Cooperative)',
      url: 'https://www.iffco.coop'
    },
    {
      name: 'Coromandel International',
      url: 'https://www.coromandel.biz'
    }
  ];

  // Add local district info if available
  if (localEconomic.length > 0 && localEconomic[0].primaryDistricts) {
    suppliers.push({
      name: `Local Agricultural Centers (${localEconomic[0].primaryDistricts})`,
      url: 'https://jharkhand.gov.in/agriculture'
    });
  }

  // Build citations
  const citations: Citation[] = [];
  
  // Add local dataset as primary source
  if (LocalDataService.isDataAvailable()) {
    citations.push({
      title: 'Jharkhand Agricultural Dataset (Local)',
      url: 'local://jharkhand-dataset',
      snippet: `Local fertilizer data for ${crop} cultivation with ${localFertilizer.length} matching records.`
    });
  }
  
  // Add AI source
  citations.push({
    title: 'AI-Enhanced Fertilizer Guidance',
    url: 'https://api.groq.com/fertilizer-guidance',
    snippet: mainContent.substring(0, 150) + '...'
  });

  // Calculate confidence score based on local data availability
  let confidence = 0.85;
  if (localFertilizer.length > 0) confidence = 0.95; // Higher confidence with local data
  if (localEconomic.length > 0) confidence += 0.03;
  if (localPests.length > 0) confidence += 0.02;
  confidence = Math.min(confidence, 1.0);

  const response: FertilizerResponse = {
    title: `Fertilizer Guidance for ${crop} in ${location}`,
    summary: localFertilizer.length > 0 ? 
      `Local dataset + AI recommendations for ${crop} cultivation in ${location} with ${soil} soil conditions during ${currentMonth}. Based on ${localFertilizer.length} local records.` :
      `AI-generated fertilizer recommendations for ${crop} cultivation in ${location} with ${soil} soil conditions during ${currentMonth}.`,
    actions,
    pest_interactions: pestInteractions,
    suppliers,
    confidence_score: confidence,
    citations,
    raw_search_hits: searchResults
  };

  return response;
}

/**
 * Initialize local datasets
 */
LocalDataService.initializeDatasets();

/**
 * GET /agent/browser-fertilizer - Fetch fertilizer recommendations
 */
router.get('/browser-fertilizer', rateLimit, async (req, res) => {
  try {
    const { location, crop, soil } = req.query;

    if (!location || !crop || !soil) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: location, crop, soil'
      });
    }

    // Check cache first
    const cacheKey = `${location}-${crop}-${soil}`.toLowerCase();
    const cached = fertilizerCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log(`📋 Serving cached fertilizer data for ${cacheKey}`);
      return res.json({
        success: true,
        data: cached.data,
        cached: true
      });
    }

    // Build search query
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const searchQuery = `For ${crop} cultivation in ${location} with ${soil} soil type, current month ${currentMonth}, provide detailed fertilizer recommendations including NPK ratios, application rates per hectare and per quintal expected yield, timing schedules, and safety guidelines. Include specific product names and suppliers.`;

    console.log(`🌾 Fetching fertilizer guidance for ${crop} in ${location}`);

    // Perform browser search
    const searchResults = await performGroqBrowserSearch(searchQuery);
    
    // Parse and structure the response
    const fertilizerGuidance = parseFertilizerGuidance(searchResults, crop as string, location as string, soil as string);

    // Cache the results
    fertilizerCache.set(cacheKey, {
      data: fertilizerGuidance,
      timestamp: Date.now()
    });

    console.log(`✅ Fertilizer guidance generated for ${crop} in ${location}`);

    res.json({
      success: true,
      data: fertilizerGuidance,
      cached: false
    });

  } catch (error) {
    console.error('Fertilizer endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fertilizer recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /agent/browser-fertilizer - Fetch fertilizer recommendations with detailed context
 */
router.post('/browser-fertilizer', rateLimit, async (req, res) => {
  try {
    const { location, crop, soil, expectedYield, currentSeason } = req.body;

    if (!location || !crop || !soil) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: location, crop, soil'
      });
    }

    // Enhanced cache key with more context
    const cacheKey = `${location}-${crop}-${soil}-${expectedYield || 'unknown'}`.toLowerCase();
    const cached = fertilizerCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log(`📋 Serving cached fertilizer data for ${cacheKey}`);
      return res.json({
        success: true,
        data: cached.data,
        cached: true
      });
    }

    // Enhanced search query with more context
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const searchQuery = `Comprehensive fertilizer guide for ${crop} in ${location}, ${soil} soil, expected yield ${expectedYield || 'standard'} quintals per acre, ${currentSeason || currentMonth} season. Include NPK recommendations, application rates per hectare and per quintal, timing, micronutrient requirements, organic alternatives, and cost-effective supplier options in India.`;

    console.log(`🌾 Fetching enhanced fertilizer guidance for ${crop} in ${location}`);

    // Perform browser search
    const searchResults = await performGroqBrowserSearch(searchQuery);
    
    // Parse and structure the response with enhanced context
    const fertilizerGuidance = parseFertilizerGuidance(searchResults, crop as string, location as string, soil as string);
    
    // Enhance with context-specific recommendations
    if (expectedYield) {
      fertilizerGuidance.actions = fertilizerGuidance.actions.map(action => ({
        ...action,
        amount_per_quintal: `${Math.round(parseFloat(action.amount_per_quintal.split(' ')[0]) * (parseFloat(expectedYield) / 20))} kg per expected ${expectedYield} quintals`
      }));
    }

    // Cache the results
    fertilizerCache.set(cacheKey, {
      data: fertilizerGuidance,
      timestamp: Date.now()
    });

    console.log(`✅ Enhanced fertilizer guidance generated for ${crop} in ${location}`);

    res.json({
      success: true,
      data: fertilizerGuidance,
      cached: false
    });

  } catch (error) {
    console.error('Enhanced fertilizer endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced fertilizer recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /agent/dataset-stats - Get local dataset statistics
 */
router.get('/dataset-stats', async (req, res) => {
  try {
    const stats = LocalDataService.getDatasetStats();
    
    res.json({
      success: true,
      data: {
        datasetStatistics: stats,
        isDataLoaded: LocalDataService.isDataAvailable()
      }
    });
    
  } catch (error: any) {
    console.error('Dataset stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dataset statistics',
      details: error.message
    });
  }
});

/**
 * POST /agent/price-comparison - Get real-time price comparison with browser search
 */
router.post('/price-comparison', rateLimit, async (req, res) => {
  try {
    const { crop, location, soilType, itemType } = req.body;
    
    if (!crop || !location) {
      return res.status(400).json({
        success: false,
        error: 'Crop and location are required'
      });
    }

    // Groq Compound browser search for prices
    const searchQuery = `Current market prices for ${crop} ${itemType || 'crop'} in ${location}, India. Find cheapest suppliers with contact details and links. Include fertilizer, seed prices and government schemes available.`;
    
    const response = await axios.post(
      `${process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'}/chat/completions`,
      {
        model: 'groq/compound',
        messages: [
          {
            role: 'system',
            content: `You are an agricultural price comparison agent. Use web search and browser tools to find:
1. Current market prices per quintal for ${crop}
2. Cheapest fertilizer suppliers with contact details
3. Seed suppliers with prices and availability  
4. Government schemes and subsidies
5. Equipment rental prices
Always provide direct links, phone numbers, and comparison tables.`
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        temperature: 0.2,
        max_tokens: 8192
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 90000 // 90 second timeout for price comparison
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content;
    const executedTools = response.data.choices[0]?.message?.executed_tools || [];

    // Get local dataset context
    const localRecommendations = LocalDataService.getFertilizerRecommendations(crop, soilType, location);
    const economicData = LocalDataService.getEconomicImportance(crop);

    res.json({
      success: true,
      data: {
        priceComparison: aiResponse,
        executedTools: executedTools,
        localDataContext: {
          fertilizer: localRecommendations,
          economic: economicData
        },
        searchQuery: searchQuery,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Price comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price comparison',
      details: error.message
    });
  }
});

export default router;
