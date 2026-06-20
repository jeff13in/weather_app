import { useState } from "react";
import axios from 'axios'
 function App(){
    const [city, setCity] = useState('');
    const [weather, setWeather] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        const res = await axios.get(`http://localhost:3001/api/weather?city=${city}`);
        console.log(res.data);
        setWeather(res.data);
    };


    return (
        <div>
            <form onSubmit={handleSearch}>
                <input value={city} onChange={(e) => setCity(e.target.value)} />
                <button type="submit">Search</button>

            </form>
            {weather && <p>{weather.name}: {Math.round(weather.main.temp)}F</p>}
        </div>
    )

 }

 export default App;