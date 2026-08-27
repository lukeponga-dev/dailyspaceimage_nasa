# Daily Space Image 🌌

Daily Space Image is a sleek, visually immersive client-side React application powered by NASA's Astronomy Picture of the Day (APOD) API. It offers a beautiful, minimalist gateway to explore the cosmos through high-definition planetary photographs, telescope captures, and descriptive astronomical logs.

## 🚀 Features

- **Dynamic Daily APOD Viewer:** Discover today's cosmos photograph accompanied by detailed explanations from professional astronomers. Includes a fluid calendar interface to jump to any date in history.
- **Intelligent Timezone Resiliency:** Automatically parses NASA's date-limit exception responses. If NASA has not yet published today's picture or if you are in an ahead-of-time zone, the application gracefully corrects the dates to display the most recent available astronomical data.
- **Discover Feed & Randomizer:** 
  - **Recent:** Browse a chronological gallery feed of the last 30 days of planetary discovery.
  - **Shuffle:** Generate 24 completely random archives from NASA's decades-long history.
- **Favorites Ledger:** Save your favorite cosmic events directly to local persistent storage to quickly revisit your discoveries anytime.
- **Sleek Space-Dark Design:** Styled with a sophisticated, high-contrast, dark luxury palette using Tailwind CSS and interactive animations.

## 🛠️ Tech Stack

- **Framework:** React 18 (TypeScript)
- **Bundler:** Vite
- **Styling:** Tailwind CSS
- **Animations:** Motion (Framer Motion)
- **Icons:** Lucide React

## 📥 Getting Started

### Prerequisites

You will need a NASA API Key to query their endpoints. You can acquire a free token instantly at [NASA APIs](https://api.nasa.gov/).

### Installation

1. Clone the project and install the dependencies:
   ```bash
   npm install
   ```

2. Run the development server locally:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

3. Compile the application for production:
   ```bash
   npm run build
   ```
