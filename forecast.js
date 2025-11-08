// Lightweight forecast page script: populates forecast grid and temperature chart for last searched city
const WEATHER_EMOJIS = {
    'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Drizzle': '🌦️',
    'Thunderstorm': '⛈️', 'Snow': '🌨️', 'Mist': '🌫️', 'Fog': '🌫️', 'default': '🌤️'
};

const API_KEY = '1635890035cbba097fd5c26c8ea672a1';

let tempChart; // Chart.js instance

document.addEventListener('DOMContentLoaded', () => {
    setupChart();
    loadForecast();
});

function setupChart() {
    const canvas = document.getElementById('tempChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    tempChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [
            { 
                label: 'Temperature', 
                data: [], 
                borderColor: '#fff',
                borderWidth: 2,
                backgroundColor: 'rgba(255,255,255,0.1)',
                tension: 0.3,
                fill: true
            }
        ] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: 'white' } } },
            scales: { x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.06)' } }, y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.06)' } } }
        }
    });
}

async function loadForecast(){
    const statusEl = document.getElementById('status');
    const lastCity = localStorage.getItem('lastSearchedCity');
    if(!statusEl) console.warn('status element not found');

    if(!lastCity){
        if(statusEl) statusEl.textContent = 'Please search for a city on the main page first';
        return;
    }

    try{
        if(statusEl) statusEl.textContent = 'Loading forecast for ' + lastCity + '...';

        // geocode
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(lastCity)}&limit=1&appid=${API_KEY}`);
        if(!geoRes.ok) throw new Error('Geocoding failed');
        const geo = await geoRes.json();
        if(!geo || !geo.length) throw new Error('City not found');
        const { lat, lon, name, country } = geo[0];
        const locationName = country ? `${name}, ${country}` : name;
        const titleEl = document.getElementById('locationName');
        if(titleEl) titleEl.textContent = `5-Day Forecast for ${locationName}`;

        // fetch 5-day forecast (3-hour bins)
        const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        if(!fRes.ok) throw new Error('Forecast fetch failed');
        const fData = await fRes.json();

        renderForecast(fData);
        if(statusEl) statusEl.textContent = '';
    }catch(err){
        console.error(err);
        if(statusEl) statusEl.textContent = 'Error: ' + (err.message || err);
    }
}

function renderForecast(forecast){
    const grid = document.getElementById('forecastGrid');
    if(!grid) return;
    grid.innerHTML = '';

    // Prefer forecasts close to 12:00 local time for each day. Fallback: take every 8th item.
    const byDay = {};
    forecast.list.forEach(item => {
        const d = new Date(item.dt * 1000);
        const dayKey = d.toISOString().slice(0,10);
        if(!byDay[dayKey]) byDay[dayKey] = [];
        byDay[dayKey].push(item);
    });

    const days = Object.keys(byDay).slice(0,6); // may include today; we'll take next 5 meaningful entries
    const picks = [];
    for(let k=0;k<days.length && picks.length<5;k++){
        const arr = byDay[days[k]];
        // try to find entry at 12:00
        let pick = arr.find(it => new Date(it.dt*1000).getHours() === 12) || arr[Math.floor(arr.length/2)];
        if(pick) picks.push(pick);
    }

    // Prepare chart arrays
    const labels = [];
    const temps = [];

    picks.forEach((day, idx) => {
        const d = new Date(day.dt * 1000);
        labels.push(d.toLocaleDateString(undefined,{ weekday: 'short' }));
        temps.push(Math.round(day.main.temp));

        const emoji = WEATHER_EMOJIS[day.weather[0].main] || WEATHER_EMOJIS.default;
        const card = document.createElement('div');
        card.className = 'day-card';
        card.style.animation = `fadeInUp 0.45s ease forwards ${idx * 0.08}s`;
        card.innerHTML = `
            <div class="date">${d.toLocaleDateString(undefined,{ weekday: 'long', month: 'short', day: 'numeric' })}</div>
            <div class="weather-emoji">${emoji}</div>
            <div class="temperature"><div class="temp-max">${Math.round(day.main.temp_max)}°C</div><div class="temp-min">${Math.round(day.main.temp_min)}°C</div></div>
            <div class="weather-desc">${day.weather[0].description}</div>
            <div class="humidity">Humidity: ${day.main.humidity}%</div>
            <div class="wind">Wind: ${Math.round((day.wind && day.wind.speed || 0) * 3.6)} km/h</div>
        `;
        grid.appendChild(card);
    });

    // update chart
    if(tempChart){
        tempChart.data.labels = labels;
        tempChart.data.datasets[0].data = temps;
        tempChart.update();
    }

    // set background based on first pick's temperature and weather
    if(picks.length) {
        const currentTemp = picks[0].main.temp;
        updateBackground(picks[0].weather[0].main, currentTemp);
    }
}

function updateBackground(weather, temp) {
    const backgrounds = {
        // Temperature-based backgrounds
        'hot': 'linear-gradient(120deg, #ff512f 0%, #dd2476 100%)',
        'warm': 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
        'mild': 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)',
        'cool': 'linear-gradient(120deg, #4facfe 0%, #00f2fe 100%)',
        'cold': 'linear-gradient(120deg, #e6dada 0%, #274046 100%)',
        // Weather-based backgrounds
        'Clear': 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
        'Clouds': 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)',
        'Rain': 'linear-gradient(120deg, #4facfe 0%, #00f2fe 100%)',
        'Thunderstorm': 'linear-gradient(120deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        'Snow': 'linear-gradient(120deg, #E6E9F0 0%, #EEF1F5 100%)',
        'Night': 'linear-gradient(180deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        'default': 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)'
    };

    // First determine temperature-based background
    let bgKey;
    const units = localStorage.getItem('units') || 'metric';
    
    if (units === 'metric') {
        if (temp >= 30) bgKey = 'hot';
        else if (temp >= 25) bgKey = 'warm';
        else if (temp >= 15) bgKey = 'mild';
        else if (temp >= 5) bgKey = 'cool';
        else bgKey = 'cold';
    } else {
        // Fahrenheit
        if (temp >= 86) bgKey = 'hot';
        else if (temp >= 77) bgKey = 'warm';
        else if (temp >= 59) bgKey = 'mild';
        else if (temp >= 41) bgKey = 'cool';
        else bgKey = 'cold';
    }

    // Only override with weather conditions if not hot
    if ((units === 'metric' && temp < 30) || (units === 'imperial' && temp < 86)) {
        if (weather === 'Thunderstorm' || weather === 'Rain' || weather === 'Snow') {
            bgKey = weather;
        }
    }

    // Check if it's night time
    const hour = new Date().getHours();
    if ((hour >= 20 || hour <= 5) && weather === 'Clear') {
        bgKey = 'Night';
    }

    const gradient = backgrounds[bgKey] || backgrounds.default;
    document.body.style.background = gradient;
    // Also set the CSS variable for consistency
    document.documentElement.style.setProperty('--bg', gradient);
}
