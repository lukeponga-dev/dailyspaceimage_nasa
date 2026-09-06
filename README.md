# NASA Daily Space Image Viewer

A modern, image‑focused web app for browsing NASA’s Astronomy Picture of the Day (APOD). Built with Next.js, React, Tailwind CSS, and optimized for Vercel deployments.

---

## 🚀 Features

- Daily NASA APOD fetch (HD + standard image support)
- Date selector to browse historical APOD entries
- Random image generator
- HD modal viewer with blur‑up loading
- Responsive gallery grid
- Skeleton loaders for smooth perceived performance
- Error boundaries for API failures, invalid dates, and rate limits
- Download button for HD images
- Production‑safe caching using Next.js fetch options

---

## 🛰 NASA APOD API

**This app uses the official NASA APOD API:**

Endpoint: `https://api.nasa.gov/planetary/apod`

**Required params:**

`api_key — your NASA API key`  
`date — ISO date string (YYYY-MM-DD)`

**Response fields used:**

`title`  
`explanation`  
`url (standard image)`  
`hdurl (high‑resolution image)`  
`media_type`  
`date`

**Common error cases:**

`Invalid date format`  
`Dates before APOD launch (1995‑06‑16)`  
`Rate limits (429)`  
`Missing API key`

---

## 📁 Project Structure

```nano
├── app/
│   ├── page.tsx              // Main APOD viewer
│   ├── components/
│   │   ├── ApodHero.tsx      // Daily hero image + metadata
│   │   ├── ApodModal.tsx     // HD modal viewer
│   │   ├── Gallery.tsx       // Recent images grid
│   │   ├── DatePicker.tsx    // Calendar selector
│   │   └── Skeleton.tsx      // Loading placeholders
│   └── api/
│       └── apod.ts           // Server-side APOD fetcher
│
├── lib/
│   └── fetchApod.ts          // Shared APOD fetch logic
│
├── public/
│   └── icons/                // UI icons
│
├── styles/
│   └── globals.css
│
└── README.md
```

---

## ⚙️ Installation

```bash
git clone https://github.com/<your-org>/dailyspaceimage_nasa.git
cd dailyspaceimage_nasa
npm install
```

Create a `.env.local` file:

```code
NASA_API_KEY=YOUR_KEY_HERE
```

## 🧪 Development

```bash
npm run dev
```
<p>Runs the local Next.js dev server at <code>http://localhost:3000</code>.</p>

## 🏗 Production Build

```bash
npm run build
npm start
```

## 📦 Vercel Deployment Notes

- Ensure npm run lint and npm run typecheck exist — Vercel uses them for CI checks.
- GitHub integration will show deployment status per commit.
- Use Next.js fetch caching for APOD requests:
`fetch(url, { next: { revalidate: 86400 } }) // 24h cache`
- Avoid client-side API calls for the daily APOD — server-side fetch is more stable and avoids exposing your API key.
- Use Vercel’s built-in image optimization for APOD images when possible.

## 🖼 UI/UX Patterns Used

- Blur-up loading for HD modal images
- Responsive grid using Tailwind’s grid-cols-* utilities
- Skeleton loaders for hero + gallery
- Safe fallback when APOD is a video (YouTube embed)
- Accessible modal with keyboard controls

## 🔧 Core Components

`ApodHero.tsx`

Displays the daily APOD with title, explanation, and HD modal trigger.

`ApodModal.tsx`

Full-screen HD viewer with progressive loading + download button.

`Gallery.tsx`

Shows recent APOD entries using a responsive grid.

`DatePicker.tsx`

ISO date selector with validation + fetch trigger.

## 🛡 Error Handling

`Invalid date → user-friendly message`

`API offline → retry button`

`Rate limit → fallback to cached APOD`

`Missing HD image → fallback to standard url`

## 📜 License

MIT — free to use, modify, and deploy.
