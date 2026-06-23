
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
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API}&units=imperial`;
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

app.get('/api/forecast', async (req, res) => {
    const { city, lat, lon } = req.query;
    try {
        let url = '';
        if (lat && lon) {
            url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API}&units=imperial`;
        } else {
            url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API}&units=imperial`;
        }
        const data = await httpGet(url);
        res.json(data);
    } catch (err) {
        if (err.statusCode === 404) {
            res.status(404).json({ message: 'City not found' });
        } else {
            res.status(500).json({ message: 'something wrong' });
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
    });
});

app.put('/api/searches/:id', async (req, res)=>{
    const id = req.params.id;
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
        if(start > end) {
            res.status(400).json({message: 'start date must be before end date'});
        }
    }

    const url = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + '&appid=' + API + '&units=imperial';

    let weatherData;
    try{
        weatherData = await httpGet(url);

    }catch(err){
        if (err.status === 404) {
            res.status(404).json({ message: 'City not found.' });
        } else {
            res.status(500).json({ message: 'Could not verify city.' });
        }
        return;
    }

    const cityName = weatherData.name;
    const country = weatherData.sys.country;
    const temp        = Math.round(weatherData.main.temp);
    const feelsLike   = Math.round(weatherData.main.feels_like);
    const description = weatherData.weather[0].description;
    const humidity    = weatherData.main.humidity;
    const windSpeed   = weatherData.wind.speed;
    const icon        = weatherData.weather[0].icon;

    db.run(
        'UPDATE searches SET city=?, country=?, start_date=?, end_date=?, temperature=?,feels_like=?, description=?, humidity=?, wind_speed=?, icon=? WHERE id=?',
        [cityName, country, start_date, end_date, temp, feelsLike, description, humidity, windSpeed, icon, id],

        function (err) {
            if (err) {
                console.log('db  error: ' +err.message);
                res.status(500).json({ message: 'error updating' });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ message: 'record not found' });
                return;
            }
            res.json({ message: 'updated' });
        }
    );

    
});


//delete
app.delete('/api/searches/:id', (req,res)=>{
    const id = req.params.id;
    db.run('DELETE FROM searches WHERE id=?', [id], function(err){
        if(err){
            console.log('db error'+err.message);
            res.status(500).json({message:'error deleting'});
            return;

        }

        if(this.changes === 0){
            res.status(404).json({message: 'record not found'});
            return;
        }
        res.json({message: 'deleted'});
    });
});


app.get('/api/export/:format', (req,res) =>{
    const format = req.params.format;

    db.all('SELECT * FROM searches ORDER BY saved_at DESC', [], (err, rows)=>{
        if(err){
            res.status(500).json({message: 'error getting the data'});
            return;
        }
        if(format === 'json'){
            res.setHeader('Content-Disposition','attachement; filename="searches.json');
            res.json(rows);
        } else if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="searches.csv"');

            let csv = 'ID,City,Country,Start Date,End Date,Temp (F),Feels Like,Description,Humidity,Wind Speed,Saved At\n';

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                csv += row.id + ',"' + row.city + '","' + row.country + '","' + (row.start_date || '') + '","' + (row.end_date || '') + '",' + row.temperature + ',' + row.feels_like + ',"' + row.description + '",' + row.humidity + ',' + row.wind_speed + ',"' + row.saved_at + '"\n';
            }

            res.send(csv);

        } else if (format === 'xml') {
            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Content-Disposition', 'attachment; filename="searches.xml"');

            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<searches>\n';

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                xml += '  <search>\n';
                xml += '    <id>'          + row.id          + '</id>\n';
                xml += '    <city>'        + row.city        + '</city>\n';
                xml += '    <country>'     + row.country     + '</country>\n';
                xml += '    <start_date>'  + (row.start_date || '') + '</start_date>\n';
                xml += '    <end_date>'    + (row.end_date   || '') + '</end_date>\n';
                xml += '    <temperature>' + row.temperature + '</temperature>\n';
                xml += '    <description>' + row.description + '</description>\n';
                xml += '    <humidity>'    + row.humidity    + '</humidity>\n';
                xml += '    <wind_speed>'  + row.wind_speed  + '</wind_speed>\n';
                xml += '    <saved_at>'    + row.saved_at    + '</saved_at>\n';
                xml += '  </search>\n';
            }

            xml += '</searches>';
            res.send(xml);

        } else if (format === 'markdown') {
            res.setHeader('Content-Type', 'text/markdown');
            res.setHeader('Content-Disposition', 'attachment; filename="searches.md"');

            let md = '# Saved Weather Searches\n\n';
            md += '| ID | City | Country | Start | End | Temp | Description | Humidity | Wind | Saved At |\n';
            md += '|---|---|---|---|---|---|---|---|---|---|\n';

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                md += '| ' + row.id + ' | ' + row.city + ' | ' + row.country + ' | ' + (row.start_date || '-') + ' | ' + (row.end_date || '-') + ' | ' + row.temperature + '°F | ' + row.description + ' | ' + row.humidity + '% | ' + row.wind_speed + ' mph | ' + row.saved_at + ' |\n';
            }

            res.send(md);

        } else {
            res.status(400).json({ message: 'Unknown format. Use json, csv, xml, or markdown' });
        }

    })
})

app.listen(3001, () => {
    console.log('server running 3001');
});
