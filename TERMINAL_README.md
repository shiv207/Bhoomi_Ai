# 🖥️ Bhoomi AI Terminal - Minimal Chat Interface

A clean, terminal-style chat interface for the Bhoomi AI farming assistant that automatically detects your location and provides contextual agricultural advice.

## 🚀 Quick Start

### Run Terminal Version
```bash
npm run dev:terminal
```

This will start:
- Backend server on `http://localhost:3001`
- Terminal UI on `http://localhost:3000` (with terminal styling)

### Run Regular Version
```bash
npm run dev
```

## ✨ Terminal Features

### 🎯 **Minimal Interface**
- Clean terminal-style chat with green-on-black color scheme
- No buttons, dropdowns, or complex UI elements
- Pure text-based interaction

### 📍 **Automatic Location Detection**
- Automatically detects your GPS coordinates
- Maps location to appropriate Indian state (Kerala, Karnataka, Jharkhand, UP)
- No manual state selection required

### 🌤️ **Contextual Weather Integration**
- Fetches real-time weather for your location
- Displays temperature and conditions in terminal header
- Weather context automatically included in AI responses

### 🤖 **Smart AI Responses**
- Powered by Groq's Llama 3.1 model
- Combines location + weather + local crop data
- Provides farming advice specific to your region and conditions

## 🖥️ Terminal Interface

```
BHOOMI AI TERMINAL                    LAT: 9.9399 LON: 76.2602 | 27°C | KERALA

[21:45:32] [SYSTEM] 🌾 BHOOMI AI TERMINAL v1.0
[21:45:32] [SYSTEM] Initializing agricultural advisory system...
[21:45:33] [SYSTEM] Detecting your location...
[21:45:34] [SYSTEM] Location detected: 9.9399, 76.2602
[21:45:35] [SYSTEM] Weather: 27°C, overcast clouds
[21:45:35] [SYSTEM] Detected region: KERALA
[21:45:35] [SYSTEM] System ready. Type your farming questions below.
[21:45:35] [SYSTEM] Examples: "What crops to plant now?", "How to control pests?", "Soil management tips?"

[21:46:15] [USER] What crops should I plant now?
[21:46:18] [BHOOMI-AI] Based on your location in Kerala and current weather conditions (27°C, overcast clouds), here are my recommendations:

**Immediate Planting Options:**
1. **Paddy (Rice)** - Ideal for current monsoon conditions
2. **Vegetables** - Tomato, brinjal, okra in well-draining areas
3. **Spices** - Black pepper, cardamom in highland areas

**Weather Considerations:**
- High humidity (83%) is perfect for rice cultivation
- Overcast conditions reduce heat stress on young plants
- Ensure proper drainage due to recent rainfall

**Local Best Practices:**
- Use short-duration rice varieties like IR-64
- Apply organic fertilizers before planting
- Implement integrated pest management

$ Enter your farming question...
```

## 🎨 Terminal Styling

- **Background**: Pure black (#0a0a0a)
- **Text**: Bright green (#00ff00)
- **Font**: Monospace (Courier New, Monaco, Menlo)
- **Message Types**:
  - `[SYSTEM]` - Yellow text for system messages
  - `[USER]` - Cyan text for user input
  - `[BHOOMI-AI]` - Green text for AI responses
  - `[ERROR]` - Red text for errors

## 🔧 Core Loop

1. **Auto-detect location** using browser geolocation
2. **Fetch weather data** for detected coordinates
3. **Map coordinates to state** (Kerala, Karnataka, Jharkhand, UP)
4. **Load local datasets** for the detected state
5. **Process user query** with full context (location + weather + crops)
6. **Generate AI response** using Groq LLM
7. **Display response** in terminal format

## 📱 Usage Examples

### Crop Recommendations
```
$ What crops to plant now?
```

### Pest Control
```
$ How to control pests in rice naturally?
```

### Weather-based Advice
```
$ Should I plant today given the weather?
```

### Soil Management
```
$ How to improve soil health?
```

## 🌍 Location Mapping

The system automatically maps GPS coordinates to states:

- **Kerala**: 8-12°N, 74-78°E
- **Karnataka**: 11-18°N, 74-78°E  
- **Jharkhand**: 21-25°N, 83-88°E
- **Uttar Pradesh**: 23-31°N, 77-85°E
- **Default**: Kerala (if location outside ranges)

## 🔄 Fallback Behavior

If location access is denied:
- Uses Kerala as default state
- Shows warning message
- Continues with general advice
- Still provides weather-independent recommendations

## 🎯 Key Differences from Regular UI

| Feature | Regular UI | Terminal UI |
|---------|------------|-------------|
| Interface | Modern web UI with cards, buttons | Pure terminal text |
| State Selection | Manual dropdown | Auto-detected from GPS |
| Weather Display | Detailed weather card | Header status line |
| Quick Actions | Clickable buttons | Text examples only |
| Styling | Glass-morphism, gradients | Green-on-black terminal |
| Interaction | Mouse + keyboard | Keyboard only |

## 🚀 Performance

- **Minimal Bundle**: No UI framework overhead
- **Fast Loading**: Text-only interface
- **Low Memory**: Simple DOM structure
- **Responsive**: Works on any screen size

## 📦 Build Commands

```bash
# Development
npm run dev:terminal

# Production build
npm run build:terminal

# Regular version
npm run dev
```

---

**🌾 Experience farming advice the way developers like it - in the terminal!**
