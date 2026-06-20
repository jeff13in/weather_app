
require('dotenv').config();
const express = require('express')
const cors = require('cors')

const axios =require('axios')
const API = process.env.FRONTEND_WEATHER_API;


const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: 'server running'});
});


app.get('/api/weather', async(req, res)=> {
    const {city} = req.query;
    try{
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API}&units=imperial`
        );
        res.json(response.data);
    } catch(err){
        if(err.response && err.response.status == 404){
            res.status(404).json({message: 'City not found'});
        } else {
            res.status(500).json({message: 'something wrong'});
        
        }
    }
});

app.listen(3001, () => {
    console.log('server running 3001');
});
