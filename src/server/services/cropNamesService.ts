/**
 * Farmer-friendly crop names mapping service
 * Provides common, vernacular names that farmers actually use
 */

export interface FarmerFriendlyName {
  common: string;
  hindi?: string;
  regional?: { [language: string]: string };
  marketName?: string;
  localNames?: string[];
}

export class CropNamesService {
  
  /**
   * Get farmer-friendly name for any crop
   */
  static getFarmerFriendlyName(cropName: string, region?: string): FarmerFriendlyName {
    const name = cropName.toLowerCase().trim();
    
    // Main crop mappings with farmer-friendly names
    const cropMappings: { [key: string]: FarmerFriendlyName } = {
      // Cereals - अनाज
      'rice': {
        common: 'Rice',
        hindi: 'चावल (Chawal) / धान (Dhan)',
        regional: {
          malayalam: 'നെല്ല് (Nellu)',
          tamil: 'அரிசி (Arisi)',
          kannada: 'ಅಕ್ಕಿ (Akki)',
          telugu: 'వరి (Vari)'
        },
        marketName: 'Paddy',
        localNames: ['Dhan', 'Nellu', 'Akki']
      },
      
      'paddy': {
        common: 'Rice',
        hindi: 'धान (Dhan)',
        regional: {
          malayalam: 'നെല്ല് (Nellu)',
          tamil: 'நெல் (Nel)',
          kannada: 'ಬತ್ತ (Bhatta)'
        },
        marketName: 'Paddy',
        localNames: ['Dhan', 'Chawal ka paudha']
      },

      'wheat': {
        common: 'Wheat',
        hindi: 'गेहूं (Gehun)',
        regional: {
          punjabi: 'ਕਣਕ (Kanak)',
          marathi: 'गहू (Gahu)',
          gujarati: 'ઘઉં (Ghaun)'
        },
        marketName: 'Wheat',
        localNames: ['Gehun', 'Kanak']
      },

      'maize': {
        common: 'Corn',
        hindi: 'मक्का (Makka)',
        regional: {
          malayalam: 'ചോളം (Cholam)',
          tamil: 'சோளம் (Solam)',
          kannada: 'ಜೋಳ (Jola)'
        },
        marketName: 'Maize',
        localNames: ['Makka', 'Bhutta', 'Cholam']
      },

      // Pulses - दालें
      'black gram': {
        common: 'Black Gram',
        hindi: 'उड़द (Urad)',
        regional: {
          malayalam: 'ഉഴുന്ന് (Uzunnu)',
          tamil: 'உளுந்து (Ulundhu)',
          kannada: 'ಉದ್ದು (Uddu)'
        },
        marketName: 'Urad Dal',
        localNames: ['Urad', 'Kala Chana', 'Uzunnu']
      },

      'pigeon pea': {
        common: 'Pigeon Pea',
        hindi: 'अरहर (Arhar) / तूर (Tur)',
        regional: {
          malayalam: 'തുവര (Thuvara)',
          tamil: 'துவரை (Thuvarai)',
          kannada: 'ತೊಗರಿ (Togari)'
        },
        marketName: 'Tur Dal',
        localNames: ['Arhar', 'Tur Dal', 'Thuvara']
      },

      // Vegetables - सब्जियां
      'tomato': {
        common: 'Tomato',
        hindi: 'टमाटर (Tamatar)',
        regional: {
          malayalam: 'തക്കാളി (Thakkali)',
          tamil: 'தக்காளி (Thakkali)',
          kannada: 'ಟೊಮ್ಯಾಟೊ (Tomato)'
        },
        marketName: 'Tamatar',
        localNames: ['Tamatar', 'Thakkali']
      },

      'potato': {
        common: 'Potato',
        hindi: 'आलू (Aloo)',
        regional: {
          malayalam: 'ഉരുളക്കിഴങ്ങ് (Urulakizhangu)',
          tamil: 'உருளைக்கிழங்கு (Urulaikizhangu)',
          kannada: 'ಆಲೂಗೆಡ್ಡೆ (Alugadde)'
        },
        marketName: 'Aloo',
        localNames: ['Aloo', 'Urulakizhangu', 'Batata']
      },

      'onion': {
        common: 'Onion',
        hindi: 'प्याज़ (Pyaz)',
        regional: {
          malayalam: 'സവാള (Savala)',
          tamil: 'வெங்காயம் (Vengayam)',
          kannada: 'ಈರುಳ್ಳಿ (Eerulli)'
        },
        marketName: 'Pyaz',
        localNames: ['Pyaz', 'Savala', 'Kanda']
      },

      // Spices - मसाले
      'black pepper': {
        common: 'Black Pepper',
        hindi: 'काली मिर्च (Kali Mirch)',
        regional: {
          malayalam: 'കുരുമുളക് (Kurumulaku)',
          tamil: 'மிளகு (Milagu)',
          kannada: 'ಮೆಣಸು (Menasu)'
        },
        marketName: 'Pepper',
        localNames: ['Mirch', 'Kurumulaku', 'Golmirch']
      },

      'cardamom': {
        common: 'Cardamom',
        hindi: 'इलायची (Elaichi)',
        regional: {
          malayalam: 'ഏലത്തരി (Elathri)',
          tamil: 'ஏலக்காய் (Elakkai)',
          kannada: 'ಯಾಲಕ್ಕಿ (Yalakki)'
        },
        marketName: 'Elaichi',
        localNames: ['Elaichi', 'Elathri', 'Chhoti Elaichi']
      },

      // Plantation Crops
      'coconut': {
        common: 'Coconut',
        hindi: 'नारियल (Nariyal)',
        regional: {
          malayalam: 'തേങ്ങ (Thenga)',
          tamil: 'தென்னை (Thennai)',
          kannada: 'ತೆಂಗು (Tengu)'
        },
        marketName: 'Coconut',
        localNames: ['Nariyal', 'Thenga', 'Khopra']
      },

      'coffee': {
        common: 'Coffee',
        hindi: 'कॉफी (Coffee)',
        regional: {
          malayalam: 'കാപ്പി (Kappi)',
          tamil: 'காபி (Kapi)',
          kannada: 'ಕಾಫಿ (Kafi)'
        },
        marketName: 'Coffee',
        localNames: ['Coffee', 'Kappi', 'Kafi Beans']
      },

      'tea': {
        common: 'Tea',
        hindi: 'चाय (Chai)',
        regional: {
          malayalam: 'ചായ (Cha)',
          tamil: 'தேநீர் (Theneer)',
          kannada: 'ಚಹಾ (Chaha)'
        },
        marketName: 'Tea',
        localNames: ['Chai', 'Tea Leaves', 'Cha']
      },

      // Fruits
      'banana': {
        common: 'Banana',
        hindi: 'केला (Kela)',
        regional: {
          malayalam: 'വാഴപ്പഴം (Vazhapazham)',
          tamil: 'வாழைப்பழம் (Vazhaipazham)',
          kannada: 'ಬಾಳೆಹಣ್ಣು (Balehannu)'
        },
        marketName: 'Kela',
        localNames: ['Kela', 'Vazhapazham', 'Bale']
      },

      'mango': {
        common: 'Mango',
        hindi: 'आम (Aam)',
        regional: {
          malayalam: 'മാങ്ങ (Manga)',
          tamil: 'மாம்பழம் (Mampazham)',
          kannada: 'ಮಾವು (Mavu)'
        },
        marketName: 'Aam',
        localNames: ['Aam', 'Manga', 'Mampazham']
      },

      // Cash Crops
      'cotton': {
        common: 'Cotton',
        hindi: 'कपास (Kapas)',
        regional: {
          malayalam: 'പഞ്ഞി (Panji)',
          tamil: 'பருத்தி (Paruthi)',
          kannada: 'ಹತ್ತಿ (Hatti)'
        },
        marketName: 'Cotton',
        localNames: ['Kapas', 'Panji', 'Ruyi']
      },

      'sugarcane': {
        common: 'Sugarcane',
        hindi: 'गन्ना (Ganna)',
        regional: {
          malayalam: 'കരിമ്പ് (Karimp)',
          tamil: 'கரும்பு (Karumbu)',
          kannada: 'ಕಬ್ಬು (Kabbu)'
        },
        marketName: 'Ganna',
        localNames: ['Ganna', 'Karimp', 'Sherdi']
      }
    };

    // Return mapped name or create a basic one
    return cropMappings[name] || {
      common: this.titleCase(cropName),
      hindi: cropName,
      marketName: cropName,
      localNames: [cropName]
    };
  }

  /**
   * Format crop recommendation with farmer-friendly names
   */
  static formatCropRecommendation(cropName: string, region?: string): string {
    const friendlyName = this.getFarmerFriendlyName(cropName, region);
    
    let formatted = `**${friendlyName.common}**`;
    
    if (friendlyName.hindi) {
      formatted += ` (${friendlyName.hindi})`;
    }
    
    if (friendlyName.regional && region) {
      const regional = friendlyName.regional[region.toLowerCase()];
      if (regional) {
        formatted += ` - ${regional}`;
      }
    }
    
    if (friendlyName.localNames && friendlyName.localNames.length > 0) {
      formatted += `\n   Local names: ${friendlyName.localNames.join(', ')}`;
    }
    
    return formatted;
  }

  /**
   * Get region-specific crop names
   */
  static getRegionalNames(cropName: string, region: string): string[] {
    const friendlyName = this.getFarmerFriendlyName(cropName, region);
    const names = [friendlyName.common];
    
    if (friendlyName.hindi) names.push(friendlyName.hindi);
    if (friendlyName.marketName) names.push(friendlyName.marketName);
    if (friendlyName.localNames) names.push(...friendlyName.localNames);
    
    if (friendlyName.regional && friendlyName.regional[region.toLowerCase()]) {
      names.push(friendlyName.regional[region.toLowerCase()]);
    }
    
    return [...new Set(names)]; // Remove duplicates
  }

  /**
   * Helper to convert to title case
   */
  private static titleCase(str: string): string {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
