# NASA Daily Space Image Viewer

![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8)
![NASA-APOD](https://img.shields.io/badge/NASA-APOD-orange)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)
![License: MIT](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-success)

A modern, fast, and clean viewer for NASA’s Astronomy Picture of the Day (APOD). <br> Built with React + Vite, TypeScript, Tailwind CSS, and NASA’s APOD API.

**Live Site**:
https://dailyspaceimage.vercel.app/

---

## Features

- Daily APOD image or video  
- HD image modal viewer  
- Historical APOD browsing  
- Recent APOD gallery  
- 24-hour caching  
- Fully responsive UI  
- Tailwind CSS design system  
- Secure API key handling  

---

## Tech Stack

- React 18  
- Vite 5  
- TypeScript  
- Tailwind CSS  
- NASA APOD API  
- Vercel Deployment  

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/lukeponga-dev/dailyspaceimage_nasa.git  
cd dailyspaceimage_nasa
```

### 2. Install dependencies

```bash
npm install
```
### 3. Configure environment variables

```bash
cp .env.example .env
```

Add your NASA API key:

```code
NASA_API_KEY=your_key_here
```

### 4. Run the development server

```bash
npm run dev
```

App will be available at:

`http://localhost:5173`

---

## Project Structure

    src/
      api/
        apod.ts
      App.tsx
      main.tsx
      index.css
      types.ts
      vite-env.d.ts
      assets/
         images/
      components/
      lib/
       fetchApod.ts
      utils/
       dateUtils.ts
      index.html

---

## NASA API Usage

Endpoint:  
https://api.nasa.gov/planetary/apod

Fields used:
- title  
- explanation  
- url  
- hdurl  
- media_type  
- date  

---

## Deployment (Vercel)

1. Push to GitHub  
2. Connect repo to Vercel  
3. Add NASA_API_KEY in Vercel Environment Variables  
4. Deploy  

---

## Contributing

1. Fork the repo  
2. Create a feature branch  
3. Commit changes  
4. Open a pull request  

---

## Support

Open an issue or email:  
developmentdesignsltd@gmail.com

---

## License

MIT License © 2026 Luke Ponga
