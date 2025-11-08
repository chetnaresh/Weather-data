# Weather Dashboard Application

A dynamic weather dashboard that provides current weather conditions and 5-day forecasts with interactive charts and beautiful weather-themed backgrounds.

## Features

- **Real-time Weather Data**
  - Current temperature
  - Weather conditions
  - Humidity
  - Wind speed
  - Visibility
  - Interactive temperature chart

- **5-Day Forecast**
  - Daily temperature trends
  - Weather conditions
  - Temperature graph visualization
  - Min/Max temperatures
  - Humidity and wind information

- **Dynamic UI**
  - Weather-based background themes
  - Temperature-based color schemes
    - Hot (≥30°C/86°F): Red-pink gradient
    - Warm (≥25°C/77°F): Orange-yellow gradient
    - Mild (≥15°C/59°F): Light blue gradient
    - Cool (≥5°C/41°F): Blue gradient
    - Cold (<5°C/41°F): Grey-blue gradient
  - Animated weather icons
  - Responsive design for all devices

- **Location Support**
  - City search functionality
  - Geolocation support
  - Last searched city memory

## Getting Started

1. **Setup**
   ```bash
   # Clone or download the repository
   # Open first.html in a web browser
   ```

2. **API Key**
   - The app uses OpenWeatherMap API
   - Current API key is included but should be replaced with your own for production use
   - Get your API key at: https://openweathermap.org/api

3. **Files Structure**
   - `first.html` - Main weather dashboard
   - `forecast.html` - 5-day forecast page
   - `app.js` - Main application logic
   - `forecast.js` - Forecast page logic
   - `styles.css` - Styling and animations
   - `weather.js` - Weather data handling

## Usage

1. **Current Weather**
   - Enter a city name in the search box
   - Click "Search" or press Enter
   - Or click "Use my location" for current location weather
   - View the temperature chart showing today's trend

2. **Forecast View**
   - Click "View Forecast" to see 5-day forecast
   - Each day shows detailed weather information
   - Temperature chart displays the trend
   - Click "Back to Current Weather" to return

## Technical Details

- **Libraries Used**
  - Chart.js for temperature visualization
  - OpenWeatherMap API for weather data

- **Features**
  - Local storage for persistent city data
  - Dynamic theme switching
  - Responsive charts
  - Weather animations
  - Error handling with user feedback

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Modern mobile browsers

## Performance

The application is optimized for performance with:
- Efficient API calls
- Local storage caching
- Optimized animations
- Responsive image loading
- Minimal dependencies

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.

## Credits

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Icons and animations inspired by various weather services

## Support

For support, please open an issue in the repository.