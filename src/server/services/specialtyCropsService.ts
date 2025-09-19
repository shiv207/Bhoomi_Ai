/**
 * Specialty Crops Service - High-value, uncommon crops with excellent economic potential
 * Identifies niche crops that are climate-suitable but underutilized by farmers
 */

export interface SpecialtyCrop {
  name: string;
  commonName: string;
  localNames: string[];
  economicPotential: string;
  marketPrice: string;
  expectedYield: string;
  returnPerQuintal: string;
  rarity: 'rare' | 'uncommon' | 'niche' | 'exotic';
  climateZones: string[];
  soilRequirements: string[];
  investmentLevel: 'low' | 'medium' | 'high';
  profitMargin: string;
  marketDemand: string;
  exportPotential: string;
  growthPeriod: string;
  specialBenefits: string[];
  challenges: string[];
  successStories: string[];
}

export class SpecialtyCropsService {
  
  /**
   * Get high-value specialty crops for specific location and climate
   */
  static getSpecialtyCropsForLocation(lat: number, lon: number, state: string, climateZone: string): SpecialtyCrop[] {
    const allSpecialtyCrops = this.getSpecialtyCropsDatabase();
    
    // Filter by climate suitability and region
    return allSpecialtyCrops.filter(crop => {
      return this.isClimateSuitable(crop, climateZone, state) &&
             this.hasMarketPotential(crop, state);
    }).sort((a, b) => this.getEconomicScore(b) - this.getEconomicScore(a));
  }

  /**
   * Comprehensive database of high-value specialty crops
   */
  private static getSpecialtyCropsDatabase(): SpecialtyCrop[] {
    return [
      // TROPICAL COASTAL SPECIALTY CROPS (Kerala, Goa, Coastal Karnataka)
      {
        name: 'Dragon Fruit',
        commonName: 'Dragon Fruit (पिताया - Pitaya)', 
        localNames: ['Pitaya', 'Kamalam', 'डragon फ्रूट'],
        economicPotential: '₹8,00,000 - ₹12,00,000 per acre annually',
        marketPrice: '₹20,000-40,000 per quintal (domestic), ₹80,000-120,000 per quintal (export)',
        expectedYield: '20-30 quintals per acre',
        returnPerQuintal: '₹15,000-35,000 profit per quintal',
        rarity: 'rare',
        climateZones: ['tropical_coastal', 'tropical_dry'],
        soilRequirements: ['well_drained', 'sandy_loam', 'pH_6_to_7'],
        investmentLevel: 'medium',
        profitMargin: '300-500%',
        marketDemand: 'Rapidly growing - health food trend, export demand',
        exportPotential: 'Excellent - Middle East, Europe, USA markets',
        growthPeriod: '18 months to first harvest, 20+ year lifespan',
        specialBenefits: [
          'Extremely high market price per quintal',
          'Low water requirement after establishment', 
          'Grows on marginal land',
          'Multiple harvests per year',
          'Premium export crop'
        ],
        challenges: ['Initial setup cost', 'Support structure needed', 'Limited local knowledge'],
        successStories: ['Gujarat farmers earning ₹10L+ per acre', 'Karnataka exports to Dubai']
      },

      {
        name: 'Vanilla',
        commonName: 'Vanilla (वनीला)',
        localNames: ['Vanilla', 'वनीला', 'വാനില'],
        economicPotential: '₹15,00,000 - ₹25,00,000 per acre annually',
        marketPrice: '₹4,00,000-6,00,000 per quintal (cured vanilla beans)',
        expectedYield: '0.4-0.6 quintals per acre',
        returnPerQuintal: '₹2,50,000-4,50,000 profit per quintal',
        rarity: 'rare',
        climateZones: ['tropical_coastal'],
        soilRequirements: ['well_drained', 'rich_organic', 'pH_6_to_7'],
        investmentLevel: 'high',
        profitMargin: '400-600%',
        marketDemand: 'Extremely high - global shortage, premium spice',
        exportPotential: 'Outstanding - Europe, USA, Middle East',
        growthPeriod: '3 years to production, 15+ year lifespan',
        specialBenefits: [
          'World\'s second most expensive spice',
          'Consistent global demand',
          'Can grow under coconut/areca shade',
          'Long-term income source',
          'Premium export rates'
        ],
        challenges: ['Hand pollination required', 'Lengthy curing process', 'High initial investment'],
        successStories: ['Kerala farmers earning ₹20L+ per acre', 'Karnataka vanilla exported globally']
      },

      {
        name: 'Stevia',
        commonName: 'Stevia (स्टीविया - Natural Sugar)',
        localNames: ['Stevia', 'Sweet Leaf', 'मधुपत्री'],
        economicPotential: '₹3,00,000 - ₹5,00,000 per acre annually',
        marketPrice: '₹20,000-30,000 per quintal (fresh leaves), ₹2,00,000+ per quintal (processed)',
        expectedYield: '15-25 quintals per acre',
        returnPerQuintal: '₹8,000-12,000 profit per quintal',
        rarity: 'uncommon',
        climateZones: ['tropical_coastal', 'tropical_dry', 'subtropical_continental'],
        soilRequirements: ['well_drained', 'loamy', 'pH_6_5_to_7_5'],
        investmentLevel: 'low',
        profitMargin: '200-400%',
        marketDemand: 'Growing rapidly - diabetes awareness, health food industry',
        exportPotential: 'Good - pharmaceutical and food industries',
        growthPeriod: '4-5 months, multiple harvests per year',
        specialBenefits: [
          '300x sweeter than sugar',
          'Diabetic-friendly natural sweetener',
          'Multiple harvests per year',
          'Processing adds value',
          'Low water requirement'
        ],
        challenges: ['Processing knowledge needed', 'Market linkage important'],
        successStories: ['Maharashtra farmers supplying to pharmaceutical companies']
      },

      // SPICES & MEDICINAL CROPS
      {
        name: 'Saffron',
        commonName: 'Saffron (केसर - Kesar)',
        localNames: ['Kesar', 'Zafran', 'കുങ്കുമപ്പൂവ്'],
        economicPotential: '₹8,00,000 - ₹15,00,000 per acre annually',
        marketPrice: '₹2,50,00,000 - ₹4,00,00,000 per quintal',
        expectedYield: '0.03-0.05 quintals per acre',
        returnPerQuintal: '₹1,50,00,000-3,00,00,000 profit per quintal',
        rarity: 'exotic',
        climateZones: ['subtropical_continental', 'temperate'],
        soilRequirements: ['well_drained', 'sandy_loam', 'pH_6_to_8'],
        investmentLevel: 'medium',
        profitMargin: '500-800%',
        marketDemand: 'Premium market - culinary, pharmaceutical, cosmetic',
        exportPotential: 'Excellent - Middle East, Europe premium markets',
        growthPeriod: '6 months to flower, perennial bulbs',
        specialBenefits: [
          'World\'s most expensive spice',
          'Grows in cooler hill regions',
          'Medical and culinary uses',
          'Premium export market',
          'Low volume, high value'
        ],
        challenges: ['Specific climate needs', 'Hand harvesting', 'Altitude requirements'],
        successStories: ['Kashmir farmers earning ₹12L+ per acre', 'Himachal Pradesh success']
      },

      {
        name: 'Wasabi',
        commonName: 'Wasabi (वसाबी - Japanese Horseradish)',
        localNames: ['Wasabi', 'Japanese Horseradish'],
        economicPotential: '₹10,00,000 - ₹20,00,000 per acre annually',
        marketPrice: '₹15,00,000-25,00,000 per quintal (fresh rhizome)',
        expectedYield: '0.5-0.8 quintals per acre',
        returnPerQuintal: '₹10,00,000-18,00,000 profit per quintal',
        rarity: 'exotic',
        climateZones: ['tropical_coastal', 'temperate'],
        soilRequirements: ['constant_moisture', 'rich_organic', 'shade_grown'],
        investmentLevel: 'high',
        profitMargin: '600-1000%',
        marketDemand: 'Ultra-premium - Japanese restaurants, gourmet food',
        exportPotential: 'Outstanding - Japan, high-end restaurants globally',
        growthPeriod: '18-24 months, continuous harvest',
        specialBenefits: [
          'Extremely rare and valuable',
          'Grows in shade/protected cultivation',
          'Japanese restaurant demand',
          'Ultra-premium pricing',
          'Year-round harvest potential'
        ],
        challenges: ['Very specific growing conditions', 'Temperature sensitive', 'Limited expertise'],
        successStories: ['World\'s most expensive crop - ₹20L+ per kg potential']
      },

      // EXOTIC FRUITS
      {
        name: 'Rambutan',
        commonName: 'Rambutan (रामबुतान)',
        localNames: ['Rambutan', 'Hairy Lychee'],
        economicPotential: '₹4,00,000 - ₹8,00,000 per acre annually',
        marketPrice: '₹30,000-50,000 per quintal (domestic), ₹80,000+ per quintal (export)',
        expectedYield: '80-120 quintals per acre',
        returnPerQuintal: '₹5,000-15,000 profit per quintal',
        rarity: 'exotic',
        climateZones: ['tropical_coastal'],
        soilRequirements: ['well_drained', 'rich_organic', 'pH_5_5_to_6_5'],
        investmentLevel: 'medium',
        profitMargin: '300-500%',
        marketDemand: 'Novelty fruit market, health-conscious consumers',
        exportPotential: 'Good - Southeast Asian diaspora, gourmet markets',
        growthPeriod: '4-6 years to fruit, long-term production',
        specialBenefits: [
          'Exotic tropical fruit',
          'Rich in Vitamin C',
          'Novel market appeal',
          'Tourist/gourmet demand',
          'Climate perfectly suitable'
        ],
        challenges: ['Limited market awareness', 'Fruit fly management'],
        successStories: ['Kerala coastal farmers testing successfully']
      },

      // HIGH-VALUE VEGETABLES
      {
        name: 'Purple Cauliflower',
        commonName: 'Purple Cauliflower (बैंगनी फूलगोभी)',
        localNames: ['Purple Gobi', 'Colored Cauliflower'],
        economicPotential: '₹2,00,000 - ₹4,00,000 per acre annually',
        marketPrice: '₹8,000-12,000 per quintal (vs ₹2,000-3,000 for regular)',
        expectedYield: '200-250 quintals per acre',
        returnPerQuintal: '₹1,000-2,000 profit per quintal',
        rarity: 'niche',
        climateZones: ['subtropical_continental', 'temperate'],
        soilRequirements: ['well_drained', 'fertile', 'pH_6_to_7'],
        investmentLevel: 'low',
        profitMargin: '200-300%',
        marketDemand: 'Premium vegetable market, health food stores',
        exportPotential: 'Good - organic and specialty vegetable markets',
        growthPeriod: '3-4 months',
        specialBenefits: [
          'Premium pricing over regular cauliflower',
          'Rich in anthocyanins',
          'Instagram/social media appeal',
          'Health-conscious consumer demand',
          'Same growing techniques as regular'
        ],
        challenges: ['Seed availability', 'Market education needed'],
        successStories: ['Punjab farmers getting 4x regular cauliflower prices']
      },

      // MEDICINAL & AROMATIC CROPS
      {
        name: 'Lemongrass',
        commonName: 'Lemongrass (नींबू घास)',
        localNames: ['Lemon Grass', 'Citronella', 'ഭൂസ്ത്രിണി'],
        economicPotential: '₹1,50,000 - ₹3,00,000 per acre annually',
        marketPrice: '₹4,000-6,000 per quintal (fresh), ₹80,000-1,20,000 per quintal (oil)',
        expectedYield: '80-100 quintals per acre (fresh), 0.8-1.2 quintals (oil)',
        returnPerQuintal: '₹2,000-3,000 profit per quintal (fresh), ₹60,000-90,000 (oil)',
        rarity: 'uncommon',
        climateZones: ['tropical_coastal', 'tropical_dry'],
        soilRequirements: ['well_drained', 'any_soil_type'],
        investmentLevel: 'low',
        profitMargin: '300-600%',
        marketDemand: 'Essential oil industry, tea industry, cosmetics',
        exportPotential: 'Excellent - essential oil global demand',
        growthPeriod: '4-6 months, perennial with multiple cuts',
        specialBenefits: [
          'Multiple income streams (fresh, dried, oil)',
          'Very hardy crop',
          'Grows on marginal land',
          'Essential oil premium pricing',
          'Medicinal and culinary uses'
        ],
        challenges: ['Oil extraction setup', 'Market linkage'],
        successStories: ['Odisha farmers earning ₹2L+ per acre from oil extraction']
      },

      {
        name: 'Moringa',
        commonName: 'Moringa (सहजन - Drumstick)',
        localNames: ['Sahjan', 'Drumstick', 'മുരിങ്ങ'],
        economicPotential: '₹2,50,000 - ₹5,00,000 per acre annually',
        marketPrice: '₹15,000-20,000 per quintal (pods), ₹50,000-80,000 per quintal (powder)',
        expectedYield: '120-150 quintals per acre (pods), 8-12 quintals (powder)',
        returnPerQuintal: '₹8,000-12,000 profit per quintal (pods), ₹30,000-50,000 (powder)',
        rarity: 'uncommon',
        climateZones: ['tropical_coastal', 'tropical_dry'],
        soilRequirements: ['well_drained', 'sandy_loam'],
        investmentLevel: 'low',
        profitMargin: '400-600%',
        marketDemand: 'Superfood market, export demand, pharmaceutical',
        exportPotential: 'Outstanding - USA, Europe health food markets',
        growthPeriod: '8 months to production, long-term harvest',
        specialBenefits: [
          'Superfood with global demand',
          'Drought tolerant',
          'Multiple products (leaves, pods, seeds, oil)',
          'Medicinal properties',
          'Export potential to health food industry'
        ],
        challenges: ['Processing for export quality', 'Organic certification beneficial'],
        successStories: ['Tamil Nadu farmers exporting moringa powder to USA']
      }
    ];
  }

  /**
   * Check climate suitability for specialty crop
   */
  private static isClimateSuitable(crop: SpecialtyCrop, climateZone: string, state: string): boolean {
    return crop.climateZones.includes(climateZone) || 
           this.hasSpecialConditions(crop, state);
  }

  /**
   * Check special growing conditions possible in state
   */
  private static hasSpecialConditions(crop: SpecialtyCrop, state: string): boolean {
    // Special conditions for certain crops in specific states
    const specialConditions: { [key: string]: string[] } = {
      'Saffron': ['himachal_pradesh', 'uttarakhand', 'jammu_kashmir'],
      'Wasabi': ['kerala', 'karnataka'], // Shade-grown under coconut
      'Vanilla': ['kerala', 'karnataka', 'tamil_nadu'],
      'Dragon Fruit': ['gujarat', 'maharashtra', 'rajasthan'] // Arid regions too
    };
    
    return specialConditions[crop.name]?.includes(state.toLowerCase()) || false;
  }

  /**
   * Check market potential for the state
   */
  private static hasMarketPotential(crop: SpecialtyCrop, state: string): boolean {
    // All specialty crops have market potential if climate is suitable
    // Focus on crops with export potential or domestic premium markets
    return crop.exportPotential.includes('Excellent') || 
           crop.exportPotential.includes('Outstanding') ||
           crop.marketDemand.includes('high') ||
           crop.marketDemand.includes('premium');
  }

  /**
   * Calculate economic score for ranking
   */
  private static getEconomicScore(crop: SpecialtyCrop): number {
    let score = 0;
    
    // Profit margin scoring
    if (crop.profitMargin.includes('600') || crop.profitMargin.includes('800') || crop.profitMargin.includes('1000')) {
      score += 50;
    } else if (crop.profitMargin.includes('400') || crop.profitMargin.includes('500')) {
      score += 40;
    } else if (crop.profitMargin.includes('300')) {
      score += 30;
    }
    
    // Export potential scoring  
    if (crop.exportPotential.includes('Outstanding')) {
      score += 30;
    } else if (crop.exportPotential.includes('Excellent')) {
      score += 25;
    } else if (crop.exportPotential.includes('Good')) {
      score += 15;
    }
    
    // Investment level (lower investment = higher score)
    if (crop.investmentLevel === 'low') {
      score += 20;
    } else if (crop.investmentLevel === 'medium') {
      score += 15;
    } else {
      score += 10;
    }
    
    // Rarity premium
    if (crop.rarity === 'exotic') {
      score += 25;
    } else if (crop.rarity === 'rare') {
      score += 20;
    } else if (crop.rarity === 'uncommon') {
      score += 15;
    }
    
    return score;
  }

  /**
   * Generate specialty crop recommendation summary
   */
  static generateSpecialtyRecommendation(crops: SpecialtyCrop[]): string {
    if (crops.length === 0) {
      return 'No suitable specialty crops identified for this location.';
    }

    let recommendation = `\n🌟 HIGH-VALUE SPECIALTY CROPS (Uncommon but Highly Profitable):\n\n`;
    
    crops.slice(0, 3).forEach((crop, index) => {
      recommendation += `${index + 1}. **${crop.commonName}**\n`;
      recommendation += `   💰 Economic Potential: ${crop.economicPotential}\n`;
      recommendation += `   📈 Market Price: ${crop.marketPrice}\n`;
      recommendation += `   🌍 Export Potential: ${crop.exportPotential}\n`;
      recommendation += `   ⭐ Why Special: ${crop.specialBenefits.slice(0, 2).join(', ')}\n`;
      recommendation += `   ⚠️ Considerations: ${crop.challenges.slice(0, 1).join('')}\n`;
      if (crop.successStories.length > 0) {
        recommendation += `   ✅ Success Story: ${crop.successStories[0]}\n`;
      }
      recommendation += `\n`;
    });

    recommendation += `💡 **Why These Crops?**\n`;
    recommendation += `- Most farmers don't know about these high-value options\n`;
    recommendation += `- Perfect climate suitability for your location\n`;
    recommendation += `- Premium pricing due to rarity and demand\n`;
    recommendation += `- Export opportunities for additional income\n`;
    recommendation += `- Can be grown alongside traditional crops\n\n`;

    return recommendation;
  }
}
