"use strict";

// ===== CONFIG =====
const API_KEY = '1635890035cbba097fd5c26c8ea672a1'; // OpenWeather API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';
const CACHE_TTL_MS = 10 * 60 * 1000;
let UNITS = localStorage.getItem('units') || 'metric';

// Cache management
function saveCache(data) {
    localStorage.setItem('weatherCache', JSON.stringify({
        timestamp: Date.now(),
        data: data
    }));
}

function loadCache() {
    const cached = localStorage.getItem('weatherCache');
    if (!cached) return null;
    
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
        localStorage.removeItem('weatherCache');
        return null;
    }
    return data;
}

// Status management
function setStatus(message) {
    if (statusEl) statusEl.textContent = message;
}

// Weather fetching functions
async function fetchWeatherByCity(city) {
    setStatus('Finding city...');
    try {
        // First get coordinates from city name
        const geoUrl = `${GEO_URL}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
        console.log('Fetching from:', geoUrl); // Debug log
        
        const geoRes = await fetch(geoUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!geoRes.ok) {
            console.error('Geo API Error:', geoRes.status, geoRes.statusText);
            throw new Error(`Failed to fetch city data (${geoRes.status}). Please try again.`);
        }
        
        const geoData = await geoRes.json();
        console.log('Geo data received:', geoData); // Debug log
        
        if (!geoData || geoData.length === 0) {
            throw new Error('City not found. Please check the spelling and try again.');
        }
        
        const { lat, lon, name, country } = geoData[0];
        const locationName = country ? `${name}, ${country}` : name;
        localStorage.setItem('lastSearchedCity', locationName);
        
        setStatus('Fetching weather data...');
        const weatherData = await fetchWeatherByCoords(lat, lon);
        
        // Update the location name in the UI
        if (locEl) {
            locEl.textContent = locationName;
        }
        
        return weatherData;
    } catch (error) {
        console.error('Search error:', error);
        setStatus(`Error: ${error.message}`);
        throw error;
    }
}

async function fetchWeatherByCoords(lat, lon) {
    setStatus('Fetching weather data...');
    try {
        // Fetch current weather
        const currentUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${UNITS}`;
        console.log('Fetching current weather from:', currentUrl); // Debug log
        
        const weatherRes = await fetch(currentUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!weatherRes.ok) {
            console.error('Weather API Error:', weatherRes.status, weatherRes.statusText);
            throw new Error(`Weather API error (${weatherRes.status}): ${weatherRes.statusText}`);
        }
        
        // Fetch forecast
        const forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${UNITS}`;
        console.log('Fetching forecast from:', forecastUrl); // Debug log
        
        const forecastRes = await fetch(forecastUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!forecastRes.ok) {
            console.error('Forecast API Error:', forecastRes.status, forecastRes.statusText);
            throw new Error(`Forecast API error (${forecastRes.status}): ${forecastRes.statusText}`);
        }
        
        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();
        
        console.log('Weather data received:', weatherData); // Debug log
        console.log('Forecast data received:', forecastData); // Debug log
        
        // Save to cache
        saveCache(weatherData);
        
        setStatus('');
        return {
            current: weatherData,
            forecast: forecastData
        };
    } catch (error) {
        console.error('Fetch weather error:', error);
        setStatus(`Error: ${error.message}`);
        throw error;
    }
}

// Weather data application
function applyWeatherPayload(data) {
    if (!data || !data.weather || !data.weather[0] || !data.main) {
        console.error('Invalid weather data received:', data);
        setStatus('Error: Invalid weather data received');
        return;
    }
    
    try {
        // Update location (should already be set from geocoding)
        if (locEl && !locEl.textContent.includes(',')) {
            locEl.textContent = data.name;
        }
        
        // Update weather description with capitalized text
        if (descEl) {
            const description = data.weather[0].description;
            descEl.textContent = description.charAt(0).toUpperCase() + description.slice(1);
        }
        
        // Update temperature and conditions
        if (tempEl) {
            tempEl.textContent = `${Math.round(data.main.temp)}°${UNITS === 'metric' ? 'C' : 'F'}`;
        }
        if (condEl) {
            condEl.textContent = data.weather[0].main;
        }
        if (humidityEl) {
            humidityEl.textContent = `Humidity: ${data.main.humidity}%`;
        }
        
        // Update wind with unit conversion
        if (windEl && data.wind) {
            const windSpeed = UNITS === 'metric' ? 
                `${Math.round(data.wind.speed * 3.6)} km/h` : 
                `${Math.round(data.wind.speed)} mph`;
            windEl.textContent = `Wind: ${windSpeed}`;
        }
        
        // Update visibility
        if (visibilityEl && data.visibility) {
            const visibilityKm = (data.visibility / 1000).toFixed(1);
            visibilityEl.textContent = `Visibility: ${visibilityKm} km`;
        }
        
        // Update weather icon
        if (weatherIconEl) {
            weatherIconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
            weatherIconEl.style.display = 'block';
            weatherIconEl.alt = data.weather[0].description;
        }
        
        // Update background based on temperature and weather condition
        const temp = data.main.temp;
        const weatherId = data.weather[0].id;
        const weatherMain = data.weather[0].main.toLowerCase();
        
        // First determine temperature-based background
        let bgKey;
        if (UNITS === 'metric') {
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
        
        // Override with weather condition ONLY for severe weather and night conditions
        if ((UNITS === 'metric' && temp < 30) || (UNITS === 'imperial' && temp < 86)) {
            // Only override if not hot
            if (weatherId >= 200 && weatherId < 300) bgKey = 'thunderstorm';
            else if (weatherId >= 500 && weatherId < 600) bgKey = 'rain';
            else if (weatherId >= 600 && weatherId < 700) bgKey = 'snow';
            else if (weatherId >= 700 && weatherId < 800) bgKey = 'fog';
        }
        // Always show night mode for clear nights regardless of temperature
        if (weatherId === 800 && data.weather[0].icon.includes('n')) bgKey = 'clear-night';
        
        applyBackground(bgKey);
        
        // Show elements with staggered animation
        [tempEl, condEl, humidityEl, windEl, visibilityEl].forEach((el, index) => {
            if (el) {
                setTimeout(() => {
                    el.classList.add('show');
                }, index * 100);
            }
        });
        
        // Clear any error status
        setStatus('');
        
    } catch (error) {
        console.error('Error applying weather data:', error);
        setStatus('Error updating weather display');
    }
}

const BG = {
  'clear-day': 'linear-gradient(120deg,#89f7fe 0%, #66a6ff 100%)',
  'clear-night': 'linear-gradient(180deg,#0f2027 0%, #203a43 50%, #2c5364 100%)',
  'clouds': 'linear-gradient(120deg,#d7d2cc 0%, #304352 100%)',
  'smoke': 'linear-gradient(120deg,#6b6b6b 0%, #2b2b2b 100%)',
  'rain': 'linear-gradient(120deg,#2b5876 0%, #4e4376 100%)',
  'snow': 'linear-gradient(120deg,#e6dada 0%, #274046 100%)',
  'fog': 'linear-gradient(120deg,#bdc3c7 0%, #2c3e50 100%)',
  'thunderstorm': 'linear-gradient(120deg,#000428 0%, #004e92 100%)',
  'hot': 'linear-gradient(120deg, #ff512f 0%, #dd2476 100%)',
  'warm': 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
  'mild': 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)',
  'cool': 'linear-gradient(120deg, #4facfe 0%, #00f2fe 100%)',
  'cold': 'linear-gradient(120deg, #e6dada 0%, #274046 100%)'
};

// DOM refs
let statusEl, locEl, descEl, tempEl, condEl, timeEl;
let humidityEl, windEl, visibilityEl, weatherIconEl;
let cityInputEl, searchBtnEl, geoBtnEl, unitToggleEl;
let fullPageBtnEl, forecastContainerEl, tempChartEl;
let currentDateEl, currentTimeEl;

// Container for animated elements
let weatherOverlay;

function initDom() {
  statusEl = document.getElementById('status');
  locEl = document.getElementById('loc');
  descEl = document.getElementById('desc');
  tempEl = document.getElementById('temp');
  condEl = document.getElementById('cond');
  timeEl = document.getElementById('time');
  humidityEl = document.getElementById('humidity');
  windEl = document.getElementById('wind');
  visibilityEl = document.getElementById('visibility');
  weatherIconEl = document.getElementById('weatherIcon');
  forecastContainerEl = document.querySelector('.forecast-cards');
  tempChartEl = document.getElementById('tempChart');
  fullPageBtnEl = document.getElementById('fullPageBtn');
  unitToggleEl = document.getElementById('unitToggle');
  currentDateEl = document.getElementById('currentDate');
  currentTimeEl = document.getElementById('currentTime');

  cityInputEl = document.getElementById('cityInput');
  searchBtnEl = document.getElementById('searchBtn');
  geoBtnEl = document.getElementById('geoBtn');

  // create overlay container
  weatherOverlay = document.createElement('div');
  weatherOverlay.style.position = 'fixed';
  weatherOverlay.style.top = 0;
  weatherOverlay.style.left = 0;
  weatherOverlay.style.width = '100%';
  weatherOverlay.style.height = '100%';
  weatherOverlay.style.pointerEvents = 'none';
  weatherOverlay.style.zIndex = 0;
  document.body.appendChild(weatherOverlay);

  // Units toggle
  if (unitToggleEl) {
    unitToggleEl.value = UNITS;
    unitToggleEl.addEventListener('change', () => {
      UNITS = unitToggleEl.value;
      localStorage.setItem('units', UNITS);
      const cached = loadCache();
      if (cached && cached.coord) fetchWeatherByCoords(cached.coord.lat, cached.coord.lon).then(applyWeatherPayload).catch(() => {});
    });
  }

  cityInputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchBtnEl.click(); });

  searchBtnEl.addEventListener('click', async () => {
    const raw = cityInputEl.value.trim();
    if (!raw) { 
        setStatus('Please enter a city name'); 
        return; 
    }
    
    // Disable search button and input while searching
    searchBtnEl.disabled = true;
    cityInputEl.disabled = true;
    setStatus('Searching...');
    
    try {
        // Try to search by city name
        const data = await fetchWeatherByCity(raw);
        
        if (data && data.current) {
            applyWeatherPayload(data.current);
        }
        if (data && data.forecast) {
            updateForecast(data.forecast);
            updateTemperatureChart(data.forecast);
        }
        setStatus('');
    } catch (e) { 
        console.error('Search error:', e);
        setStatus(e.message || 'Failed to get weather data. Please try again.'); 
    } finally {
        // Re-enable search button and input
        searchBtnEl.disabled = false;
        cityInputEl.disabled = false;
    }
  });

  geoBtnEl.addEventListener('click', () => {
    if (!navigator.geolocation) { setStatus('Geolocation not available'); return; }
    setStatus('Requesting location...');
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const payload = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        applyWeatherPayload(payload);
      } catch (e) { console.error(e); }
    }, err => {
      setStatus('Geolocation denied or failed: ' + err.message);
    }, { timeout: 10000 });
  });
}

// ===== ANIMATIONS =====
function clearWeatherOverlay() {
  weatherOverlay.innerHTML = '';
}

function addClouds(count = 5) {
  for (let i = 0; i < count; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    cloud.style.position = 'absolute';
    cloud.style.top = `${Math.random() * 40}%`;
    cloud.style.left = `${Math.random() * 100}%`;
    cloud.style.width = `${100 + Math.random() * 200}px`;
    cloud.style.height = '60px';
    cloud.style.background = 'rgba(255,255,255,0.15)';
    cloud.style.borderRadius = '50%';
    cloud.style.filter = 'blur(12px)';
    cloud.style.animation = `cloudMove ${60 + Math.random() * 60}s linear infinite`;
    weatherOverlay.appendChild(cloud);
  }
}

function addRain(count = 50) {
  for (let i = 0; i < count; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.position = 'absolute';
    drop.style.width = '2px';
    drop.style.height = '12px';
    drop.style.background = 'rgba(255,255,255,0.6)';
    drop.style.top = `${Math.random() * -100}%`;
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animation = `fall ${1 + Math.random() * 1.5}s linear infinite`;
    weatherOverlay.appendChild(drop);
  }
}

function addSnow(count = 30) {
  for (let i = 0; i < count; i++) {
    const snow = document.createElement('div');
    snow.className = 'snowflake';
    snow.style.position = 'absolute';
    snow.style.width = `${4 + Math.random() * 4}px`;
    snow.style.height = `${4 + Math.random() * 4}px`;
    snow.style.borderRadius = '50%';
    snow.style.background = 'white';
    snow.style.opacity = 0.7;
    snow.style.top = `${Math.random() * -100}%`;
    snow.style.left = `${Math.random() * 100}%`;
    snow.style.animation = `snowFall ${5 + Math.random() * 5}s linear infinite`;
    weatherOverlay.appendChild(snow);
  }
}

// Apply animations based on weather type
function applyWeatherAnimations(key) {
  clearWeatherOverlay();
  if (key === 'clouds') addClouds();
  if (key === 'rain') addRain();
  if (key === 'snow') addSnow();
  if (key === 'thunderstorm') { addClouds(3); addRain(80); }
}

// ===== OVERRIDE applyBackground =====
function applyBackground(key) {
  const gradient = BG[key] || BG['clouds'];
  document.documentElement.style.setProperty('--bg', gradient);
  document.body.style.background = gradient;
  document.body.classList.toggle('clouds', key === 'clouds');
  applyWeatherAnimations(key);
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    currentDateEl.textContent = now.toLocaleDateString(undefined, dateOptions);
    currentTimeEl.textContent = now.toLocaleTimeString(undefined, timeOptions);
}

// Initialize temperature chart
let temperatureChart;
function initChart() {
    const ctx = tempChartEl.getContext('2d');
    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: 'rgba(255, 255, 255, 0.8)',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.8)' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.8)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: 'rgba(255, 255, 255, 0.8)' }
                }
            }
        }
    });
}

// Update forecast cards
function updateForecast(forecastData) {
    if (!forecastContainerEl) return;
    
    forecastContainerEl.innerHTML = '';
    const dailyData = forecastData.list.filter((item, index) => index % 8 === 0).slice(0, 5);
    
    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000);
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-date">${date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}">
            <div class="forecast-temp">
                <span class="max">${Math.round(day.main.temp_max)}°${UNITS === 'metric' ? 'C' : 'F'}</span>
                <span class="min">${Math.round(day.main.temp_min)}°${UNITS === 'metric' ? 'C' : 'F'}</span>
            </div>
            <div class="forecast-rain">${Math.round(day.pop * 100)}% rain</div>
        `;
        forecastContainerEl.appendChild(card);
    });
}

// Update temperature chart
function updateTemperatureChart(hourlyData) {
    if (!temperatureChart) return;
    
    const labels = hourlyData.list.slice(0, 8).map(item => {
        const date = new Date(item.dt * 1000);
        return date.toLocaleTimeString(undefined, { hour: '2-digit' });
    });
    
    const temperatures = hourlyData.list.slice(0, 8).map(item => Math.round(item.main.temp));
    
    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = temperatures;
    temperatureChart.update();
}

// Set initial status message
function setInitialStatus() {
    if (statusEl) {
        statusEl.textContent = 'Enter a city name to get weather information';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    initDom();
    
    // Initialize date and time
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
    
    // Initialize chart if needed
    if (document.getElementById('tempChart')) {
        initChart();
    }
    
    // Set initial status
    setInitialStatus();
    
    // Load last searched city if available
    const lastCity = localStorage.getItem('lastSearchedCity');
    if (lastCity) {
        cityInputEl.value = lastCity;
        fetchWeatherByCity(lastCity)
            .then(data => {
                if (data && data.current) {
                    applyWeatherPayload(data.current);
                }
                if (data && data.forecast) {
                    updateForecast(data.forecast);
                    updateTemperatureChart(data.forecast);
                }
            })
            .catch(error => {
                console.error('Error loading weather:', error);
                setStatus('Enter a city name to get weather information');
            });
    }
});
