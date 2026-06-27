import { useState } from "react";

import SavedSearches from "./components/SavedSearches";

import './App.css'

 function App(){
    const [city, setCity] = useState('');
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast]       = useState([]);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');

    const [startDate, setStartDate]     = useState('');
    const [endDate, setEndDate]         = useState('');
    const [saveMsg, setSaveMsg]         = useState('');
    const [showSaveForm, setShowSaveForm] = useState(false);

    const [tab, setTab]                 = useState('search');

    const [savedList, setSavedList]     = useState([]);
    const [showInfo, setShowInfo]       = useState(false);




    async function loadSavedSearches() {
        try{
            const response =await fetch('http://localhost:3001/api/searches');
            const data = await response.json();
            setSavedList(data);
        } catch(err){
            console.log('could not load saved')
        }
        
    }

    async function handleSearch(e) {
        e.preventDefault();

        if(city.trim() === ''){
            return;
        }

        setLoading(true);
        setError('');
        setWeather(null);
        setForecast([]);
        setShowSaveForm(false);
        setSaveMsg('');

        try{
            const weatherUrl ='http://localhost:3001/api/weather?city=' + city;
            const weatherResponse= await fetch(weatherUrl);
            const weatherData =await weatherResponse.json();

            // if the response is not ok, show the error message
            if (!weatherResponse.ok) {
                setError(weatherData.message);
                setLoading(false);
                return;
            }

            console.log('weather data:', weatherData);
            setWeather(weatherData);


        }catch (err) {
            setError('Could not connect to the server');
            setLoading(false);
            return;
        }

        try {
            const forecastUrl= 'http://localhost:3001/api/forecast?city=' + city;
            const forecastResponse= await fetch(forecastUrl);
            const forecastData =await forecastResponse.json();

            // the api gives us data every 3 hours so we need to filter it down to one per day
            const dailyMap= {};

            for (let i = 0; i < forecastData.list.length; i++) {
                const item = forecastData.list[i];
                const date = item.dt_txt.split(' ')[0];
                const time = item.dt_txt.split(' ')[1];

                // add the first entry for each date
                if (!dailyMap[date]) {
                    dailyMap[date] = item;
                }

                // if there is a 12pm reading, use that 
                if (time === '12:00:00') {
                    dailyMap[date] = item;
                }
            }

            // get the dates in order, take the next 5
            const allDates = Object.keys(dailyMap).sort();
            const next5Days = [];

            for (let i = 1; i <= 5; i++) {
                if (allDates[i]) {
                    next5Days.push(dailyMap[allDates[i]]);
                }
            }

            setForecast(next5Days);

        } catch (err) {
            console.log('forecast error' + err.message);
  
        }

        setLoading(false);
        
    }

    function handleGetLocation() {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }

        setLoading(true);
        setError('');
        setWeather(null);
        setForecast([]);

        navigator.geolocation.getCurrentPosition(
            async function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                console.log('got coordinates: ' + lat + ', ' + lon);

                try {
                    // get weather using coordinates
                    const weatherUrl = 'http://localhost:3001/api/weather?lat=' + lat + '&lon=' + lon;
                    const weatherResponse = await fetch(weatherUrl);
                    const weatherData = await weatherResponse.json();

                    if (!weatherResponse.ok) {
                        setError(weatherData.message || 'Could not get weather for your location.');
                        setLoading(false);
                        return;
                    }

                    setWeather(weatherData);
                    setCity(weatherData.name);

                    // get forecast using coordinates
                    const forecastUrl = 'http://localhost:3001/api/forecast?lat=' + lat + '&lon=' + lon;
                    const forecastResponse = await fetch(forecastUrl);
                    const forecastData = await forecastResponse.json();

                    const dailyMap = {};
                    for (let i = 0; i < forecastData.list.length; i++) {
                        const item = forecastData.list[i];
                        const date = item.dt_txt.split(' ')[0];
                        const time = item.dt_txt.split(' ')[1];
                        if (!dailyMap[date]) dailyMap[date] = item;
                        if (time === '12:00:00') dailyMap[date] = item;
                    }

                    const allDates = Object.keys(dailyMap).sort();
                    const next5Days = [];
                    for (let i = 1; i <= 5; i++) {
                        if (allDates[i]) next5Days.push(dailyMap[allDates[i]]);
                    }

                    setForecast(next5Days);

                } catch (err) {
                    setError('Could not get weather for your location. Try again.');
                    console.log('location weather error: ' + err.message);
                }

                setLoading(false);
            },
            function(err) {
                // user denied location access
                setError('Location access was denied. Please allow it in your browser and try again.');
                setLoading(false);
            }
        );
    }
    
    async function handleSave() {
        if (!weather) return;

        // validate the dates
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end   = new Date(endDate);
            if (start > end) {
                setSaveMsg('Error: start date cannot be after end date');
                return;
            }
        }

        try {
            const response = await fetch('http://localhost:3001/api/searches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    city:       weather.name,
                    start_date: startDate || null,
                    end_date:   endDate   || null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setSaveMsg('Error: ' + data.message);
                return;
            }

            setSaveMsg('Saved successfully!');
            setShowSaveForm(false);
            setStartDate('');
            setEndDate('');
            loadSavedSearches();

            setTimeout(function() {
                setSaveMsg('');
            }, 3000);

        } catch (err) {
            setSaveMsg('Error: could not save. Try again.');
            console.log('save error: ' + err.message);
        }
    }

    function handleExport(format) {
        window.open('http://localhost:3001/api/export/' + format, '_blank');
    }
    function formatForecastDay(dtTxt) {
        const date = new Date(dtTxt);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    return (
        <div className="app">

            
            {showInfo && (
                <div className="info-overlay" onClick={() => setShowInfo(false)}>
                    <div className="info-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="info-close" onClick={() => setShowInfo(false)}>✕</button>
                        <h2>About PM Accelerator</h2>
                        <p>
                            <strong>Product Manager Accelerator</strong> is a leading PM career accelerator
                            that helps aspiring and experienced product managers break into top tech companies
                            and grow their careers. Through mentorship, real-world projects, and a strong
                            community, PMA equips candidates with the skills, portfolio, and network to land
                            their dream PM roles at companies like Google, Meta, Amazon, and more.
                        </p>
                        <a
                            href="https://www.linkedin.com/school/30760630/"
                            target="_blank"
                            rel="noreferrer"
                            className="info-link"
                        >
                            View PM Accelerator on LinkedIn
                        </a>
                    </div>
                </div>
            )}

            <div className="header">
                <div className="header-top-row">
                    <div>
                        <h1>WeatherNow</h1>
                        <p>Real time weather for any location</p>
                        <p className="header-author">by Jeffin Sam</p>
                    </div>
                    <button className="info-btn" onClick={() => setShowInfo(true)} title="About PM Accelerator">
                        &#9432;
                    </button>
                </div>

                <div className="tabs">
                    <button
                        className={tab === 'search' ? 'tab active' : 'tab'}
                        onClick={() => setTab('search')}
                    >
                        Search Weather
                    </button>
                    <button
                        className={tab === 'saved' ? 'tab active' : 'tab'}
                        onClick={() => { setTab('saved'); loadSavedSearches(); }}
                    >
                        Saved Searches ({savedList.length})
                    </button>
                </div>
            </div>

            <div className="content">

                {tab === 'search' && (
                    <div>

                        <div className="search-box">
                            <form onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="Enter city, zip code, or city and country (e.g. Toronto, Niagara Falls )"
                                    className="search-input"
                                />
                                <button type="submit" className="btn-blue">Search</button>
                            </form>

                            <button onClick={handleGetLocation} className="btn-green" style={{ marginTop: '10px' }}>
                                Use My Current Location
                            </button>

                            <p className="hint">Try: London, Toronto, or Tokyo, JP</p>
                        </div>

                       
                        {loading && (
                            <p className="loading">Loading weather data...</p>
                        )}

                        {error && (
                            <div className="error">{error}</div>
                        )}

                        
                        {weather && (
                            <div className="weather-card">
                                <div className="weather-top">
                                    <div>
                                        <h2>{weather.name}, {weather.sys.country}</h2>
                                        <p className="description">{weather.weather[0].description}</p>
                                        <p className="temp">{Math.round(weather.main.temp)}°F</p>
                                        <p className="feels-like">Feels like {Math.round(weather.main.feels_like)}°F</p>
                                        <p className="high-low">
                                            H: {Math.round(weather.main.temp_max)}°F &nbsp;|&nbsp; L: {Math.round(weather.main.temp_min)}°F
                                        </p>
                                    </div>
                                    <img
                                        src={'https://openweathermap.org/img/wn/' + weather.weather[0].icon + '@2x.png'}
                                        alt={weather.weather[0].description}
                                        className="weather-icon"
                                    />
                                </div>

                                {/* extra weather info */}
                                <div className="details-grid">
                                    <div className="detail">
                                        <span className="label">Humidity</span>
                                        <span className="value">{weather.main.humidity}%</span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Wind Speed</span>
                                        <span className="value">{Math.round(weather.wind.speed)} mph</span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Pressure</span>
                                        <span className="value">{weather.main.pressure} hPa</span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Visibility</span>
                                        <span className="value">
                                            {weather.visibility ? (weather.visibility / 1000).toFixed(1) + ' km' : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Cloud Cover</span>
                                        <span className="value">{weather.clouds.all}%</span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Wind Dir.</span>
                                        <span className="value">{weather.wind.deg}°</span>
                                    </div>
                                </div>

                                {/* save this search to the database */}
                                <div className="save-section">
                                    <button
                                        className="btn-orange"
                                        onClick={() => setShowSaveForm(!showSaveForm)}
                                    >
                                        {showSaveForm ? 'Cancel' : 'Save This Search'}
                                    </button>

                                    {showSaveForm && (
                                        <div style={{ marginTop: '14px' }}>
                                            <p style={{ marginBottom: '10px', color: '#555' }}>
                                                Optionally add a date range for this search:
                                            </p>
                                            <div className="date-row">
                                                <label>
                                                    Start date:
                                                    <input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                    />
                                                </label>
                                                <label>
                                                    End date:
                                                    <input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                    />
                                                </label>
                                                <button onClick={handleSave} className="btn-blue">
                                                    Save to Database
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {saveMsg && (
                                        <p className={saveMsg.startsWith('Error') ? 'save-error' : 'save-ok'}>
                                            {saveMsg}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 5 DAY FORECAST */}
                        {forecast.length > 0 && (
                            <div className="forecast-box">
                                <h3>5-Day Forecast</h3>
                                <div className="forecast-row">
                                    {forecast.map((day, i) => (
                                        <div key={i} className="forecast-card">
                                            <p className="forecast-day">{formatForecastDay(day.dt_txt)}</p>
                                            <img
                                                src={'https://openweathermap.org/img/wn/' + day.weather[0].icon + '@2x.png'}
                                                alt={day.weather[0].description}
                                            />
                                            <p className="forecast-desc">{day.weather[0].description}</p>
                                            <p className="forecast-temp">H: {Math.round(day.main.temp_max)}°F</p>
                                            <p className="forecast-temp low">L: {Math.round(day.main.temp_min)}°F</p>
                                            <p className="forecast-extra">Humidity: {day.main.humidity}%</p>
                                            <p className="forecast-extra">Wind: {Math.round(day.wind.speed)} mph</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}

               
                {tab === 'saved' && (
                    <div>

                        {/* export buttons */}
                        <div className="export-box">
                            <p>Download all saved searches  </p>
                            <button className="export-btn" style={{ background: '#e67e22' }} onClick={() => handleExport('json')}>JSON</button>
                            <button className="export-btn" style={{ background: '#27ae60' }} onClick={() => handleExport('csv')}>CSV</button>
                            <button className="export-btn" style={{ background: '#8e44ad' }} onClick={() => handleExport('xml')}>XML</button>
                            <button className="export-btn" style={{ background: '#2980b9' }} onClick={() => handleExport('markdown')}>Markdown</button>
                        </div>

                        <SavedSearches
                            searches={savedList}
                            onRefresh={loadSavedSearches}
                        />
                    </div>
                )}

            </div>

                


        </div>
    );





 }

 export default App;