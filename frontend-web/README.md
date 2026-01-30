# NBA Integrity Guard - Web Dashboard

Modern web interface for monitoring NBA game integrity in real-time.

## 🎨 Design

UI/UX inspired by [neutral.trade](https://neutral.trade) - featuring a dark theme with clean, modern components.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## 🏗️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS 3.3
- **Charts**: Chart.js + React Chart.js 2
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-time**: WebSocket

## 📁 Project Structure

```
frontend-web/
├── src/
│   ├── components/
│   │   └── Dashboard/        # Dashboard components
│   ├── hooks/                # Custom React hooks
│   ├── store/                # Zustand stores
│   ├── services/             # API services
│   ├── types/                # TypeScript definitions
│   ├── utils/                # Utility functions
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── public/                   # Static assets
├── index.html                # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎯 Features

### Dashboard
- Real-time signal monitoring
- Live rigging index and anomaly score
- Interactive charts with Chart.js
- WebSocket connection with auto-reconnect
- Responsive design

### Components
- **Header**: Navigation and connection status
- **StatsCard**: Metric display with trends
- **SignalPanel**: Active signal alerts
- **RealTimeChart**: Historical data visualization

### State Management
- **signalStore**: Manages signal data
- **tradeStore**: Manages trade history
- **statsStore**: Manages system statistics

### Real-time Updates
- WebSocket connection to Strategy Engine
- Automatic reconnection on disconnect
- Live data streaming

## 🔌 API Integration

The frontend connects to the Strategy Engine backend:

```typescript
// WebSocket (port 3000)
ws://localhost:3000

// REST API endpoints
GET  /health            // Health check
GET  /stats             // System statistics
GET  /trades?limit=50   // Trade history
POST /signal            // Create new signal
POST /distribution      // Execute distribution
```

## 🎨 Color Palette

Based on neutral.trade design:

```css
Primary (Green): #10b981
Danger (Red): #ef4444
Warning (Yellow): #eab308
Background: #0f172a
Surface: #1e293b
Border: #334155
```

## 📊 Chart Configuration

Charts use Chart.js with custom styling:
- Dark theme
- Smooth animations
- Interactive tooltips
- Responsive design
- Auto-scaling axes

## 🔧 Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## 🧪 Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Type checking
npm run build

# Lint code
npm run lint
```

## 📦 Build

```bash
# Production build
npm run build

# Output directory: dist/
```

## 🚀 Deployment

The built static files can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 🔒 Security

- No sensitive data in frontend code
- API requests through proxy in development
- Environment variables for configuration
- Input validation on all forms

## 📝 License

MIT

---

**Status**: Phase 2 - In Development
**Last Updated**: 2025-01-30
