# Weather App

A full-stack weather app built with React and Node.js. Search current weather and a 5-day forecast for any city, or use your current location. Save, edit, and delete searches stored in a SQLite database, and export them in JSON, CSV, XML, or Markdown.

## Features

- Search weather by city name
- Use current location (GPS)
- 5-day forecast
- Save searches to a database with optional date range
- Edit and delete saved searches
- Export saved searches as JSON, CSV, XML, or Markdown

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js, Express
- **Database:** SQLite (via sqlite3)
- **Weather API:** OpenWeatherMap

## Getting Started

### Prerequisites

- Node.js v18+
- An OpenWeatherMap API key sign up free at [openweathermap.org](https://openweathermap.org)

### 1. Clone the repo

```bash
git clone https://github.com/jeff13in/weather_app.git
cd weather_app
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```
FRONTEND_WEATHER_API=your_api_key_here
PORT=3001
```

Start the backend:

```bash
npm run dev
```

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Go to [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
weather_app/
├── backend/
│   ├── server.js       # Express API
│   ├── weather.db      # SQLite database
│   └── .env            # API key
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   └── components/
    │       └── SavedSearches.jsx
    ├── index.html
    └── vite.config.js
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather?city=London` | Current weather by city |
| GET | `/api/weather?lat=&lon=` | Current weather by coordinates |
| GET | `/api/forecast?city=London` | 5-day forecast by city |
| GET | `/api/forecast?lat=&lon=` | 5-day forecast by coordinates |
| GET | `/api/searches` | Get all saved searches |
| POST | `/api/searches` | Save a search |
| PUT | `/api/searches/:id` | Update a saved search |
| DELETE | `/api/searches/:id` | Delete a saved search |
| GET | `/api/export/:format` | Export as json, csv, xml, or markdown |
