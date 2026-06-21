
require('dotenv').config();
const express = require('express')
const cors = require('cors')

const https =require('https')
const sqlite3 = require('sqlite3').verbose();

const API = process.env.FRONTEND_WEATHER_API;



// --- database

const db = new sqlite3.Database('./weather.db',(err) => {
    if(err){
        console.log('error connecting to database:' + err.message);
    }
    else{
        console.log('connnected to database');
    }
});


db.run(
    `CREATE TABLE IF NOT EXISTS searches (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    city        TEXT,
    country     TEXT,
    start_date  TEXT,
    end_date    TEXT,
    temperature INTEGER,
    feels_like  INTEGER,
    description TEXT,
    humidity    INTEGER,
    wind_speed  REAL,
    icon        TEXT,
    saved_at    TEXT DEFAULT (datetime('now'))
)`);

const httpGet = (url) => new Promise((resolve, reject) => {
    https.get(url, (res) => {

        let data = '';
         
        res.on('data', chunk => data += chunk);
        res.on('end', () => {

            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) reject({ statusCode: res.statusCode });
            else resolve(parsed);
        });
    }).on('error', reject);
});

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: 'server running'});
});


app.get('/api/weather', async(req, res)=> {
    const {city , lat, lon} = req.query;
    try{
        let url = '';
        if (lat && lon){
            url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API}&units=imperial`;
        } else {
            url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API}&units=imperial`;
        }

        const data = await httpGet(url);
        res.json(data);

    } catch(err){
        if(err.statusCode === 404){
            res.status(404).json({message: 'City not found'});
        } else {
            res.status(500).json({message: 'something wrong'});
        }
    }
});

app.post('/api/searches', async (req,res) => {
    const city = req.body.city;
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;

    if(!city){
        res.status(400).json({message: 'City is required'});
        return;
    }

    if(start_date && end_date){
        const start = new Date(start_date);
        const end = new Date(end_date);
        if(start > end){
            res.status(400).json({message: 'Start sate must be before end date'});
            return;
        }
    }

    const weather_url = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + '&appid=' + API + '&units=imperial';

    let weatherData;
    try{
        weatherData = await httpGet(weather_url);

    } catch(err){
        if(err.status === 404){
            res.status(404).json({message: 'City not found, cannot save'});
        } else{
            res.status(500).json({message: 'Could not verify city, try again'});
        }
        return;
    }

    const cityName = weatherData.name;
    const country = weatherData.sys.country;
    const temp = Math.round(weatherData.main.temp);
    const feelsLike = Math.round(weatherData.main.feels_like);
    const description = weatherData.weather[0].description;
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind.speed;
    const icon = weatherData.weather[0].icon;

    db.run('INSERT INTO searches(city, country, start_date, end_date, temperature, feels_like, description, humidity, wind_speed, icon) VALUES(?,?,?,?,?,?,?,?,?,?)',[cityName,country,start_date,end_date,temp,feelsLike,description,humidity,windSpeed,icon],
        function(err){
            if(err){
                console.log('db insert error: '+ err.message);
                res.status(500).json({message: 'Error saving to database'});
                return;
            }
            res.json({message: 'Saved', id: this.lastID});
        }
    );


})

//get all the searches
app.get('/api/searches',(req,res)=>{
    db.all('SELECT * FROM searches ORDER BY saved_at DESC', [], (err, rows) =>{
        if(err){
            console.log('db reading error' + err.message);
            res.status(500).json({message: 'error from the database'});
            return;
        }
        res.json(rows);
    })
})


app.listen(3001, () => {
    console.log('server running 3001');
});
