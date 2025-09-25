# Harvestly - Smart Farming Assistant 🌾

An AI-driven agricultural advisory platform for smart farming that provides personalized crop recommendations, weather-based farming advice, and natural pest control solutions using real-time data and local agricultural knowledge.

## 🌟 Features

### 🤖 Multi-Agent Intelligence System
- **Weather Agent**: 4-month forecast analysis, seasonal patterns, and climate risk assessment
- **Soil Agent**: GPS-based soil profiling, crop suitability analysis, and nutrient management
- **Biome Agent**: Ecological conditions, biodiversity considerations, and environmental sustainability
- **Economic Agent**: Market analysis, ROI calculations, investment planning, and price trends
- **Pest Control Agent**: Integrated pest management, organic controls, and monitoring strategies

### 🚀 Core Capabilities
- **AI-Powered Advisory**: Multi-agent coordination providing research-backed recommendations
- **Real-time Weather Integration**: Advanced weather analysis with agricultural insights
- **GPS-Based Soil Intelligence**: Precision soil analysis from location coordinates
- **Local Dataset Integration**: Comprehensive data for 5 Indian states with district-level granularity
- **Live Internet Search**: Real-time agricultural data and market information
- **Natural Pest Control**: Organic and sustainable farming solutions
- **Economic Optimization**: ROI-focused crop recommendations with market timing

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- API keys for Groq and OpenWeather

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Bhoomi_AI
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp env.example .env
   cp src/client/env.example src/client/.env
   
   # Edit .env with your API keys
   GROQ_API_KEY=your_groq_api_key_here
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:3001`
   - Frontend React app on `http://localhost:3000`

## 🏗️ Project Structure

```
Bhoomi_AI/
├── src/
│   ├── server/                 # Express.js backend
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── types/             # TypeScript types
│   └── client/                # React frontend
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── services/      # API services
│       │   └── types/         # TypeScript types
├── kerala_dataset/            # Kerala agricultural data
├── Karnataka_dataset/         # Karnataka agricultural data
├── Jharkhand_dataset/         # Jharkhand agricultural data
├── utterpradesh_dataset/      # UP agricultural data
├── Soil moisture/             # Soil moisture data
└── PH data/                   # pH and crop recommendation data
```

## 🔧 API Endpoints

### Weather API
- `GET /api/weather/current?city=cityName&state=stateName`
- `GET /api/weather/coords?lat=latitude&lon=longitude`
- `GET /api/weather/forecast?lat=latitude&lon=longitude`

### AI Advisory API
- `POST /api/ai/ask` - Main AI advisory endpoint
- `POST /api/ai/quick-advice` - Quick advice for common queries

### Data API
- `GET /api/data/:state` - Get complete dataset for a state
- `GET /api/data/:state/crops` - Get crops data
- `GET /api/data/:state/recommendations` - Get crop recommendations
- `GET /api/data/states` - Get supported states

## 🌐 Supported States

- **Kerala**: Coconut, rubber, paddy, spices - with district-wise soil pH and pest data
- **Karnataka**: Coffee, sugarcane, cotton, ragi - with red soil fertilizer recommendations
- **Jharkhand**: Rice, wheat, maize, pulses - with comprehensive economic importance data
- **Uttar Pradesh**: Wheat, rice, sugarcane, potato - with crop output and pest management
- **Goa**: Comprehensive soil pH analysis and agricultural insights

## 📊 Datasets

### Kerala Dataset
- **kerala_crops_economic_importance.csv**: Crop economic importance and regional data

### Karnataka Dataset
- **Karnataka_pests___natural_pesticides__common_names_.csv**: Pest control information

### Jharkhand Dataset
- **jharkhand_crops_economic_importance.csv**: Crop economic data
- **jharkhand_pests_natural_pesticides.csv**: Natural pest control methods

### Uttar Pradesh Dataset
- **uttar_pradesh_crops_economic_output.csv**: Economic output data
- **uttar_pradesh_crops_pests_natural_pesticides.csv**: Pest management data

### Additional Data
- **PH data/Crop_recommendation.csv**: pH-based crop recommendations
- **Soil moisture/**: State-wise soil moisture data (2020)

## 🔑 API Keys Setup

### Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up/login and create an API key
3. Add to your `.env` file

### OpenWeather API Key
1. Visit [OpenWeather](https://openweathermap.org/api)
2. Sign up for a free account
3. Generate an API key
4. Add to your `.env` file

## 🛠️ Development

### Backend Development
```bash
npm run dev:server
```

### Frontend Development
```bash
npm run dev:client
```

### Build for Production
```bash
npm run build
```

## 🧪 Example Usage

### Query Examples
- "What crops should I plant in Kerala during monsoon season?"
- "How can I control pests in my rice field naturally?"
- "What's the best time to plant wheat in UP based on current weather?"
- "How can I improve soil health in Karnataka?"

### Quick Actions
- **Crop Recommendations**: Get region-specific crop suggestions
- **Pest Control**: Natural pest management methods
- **Weather Advice**: Weather-based farming tips
- **Soil Health**: Soil management guidance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Agricultural data compiled from various state government sources
- Weather data provided by OpenWeather API
- AI capabilities powered by Groq
- Built with React, TypeScript, and Express.js

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Made with ❤️ for Indian farmers**
