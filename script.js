const API_BASE_CURRENT = 'https://api.openweathermap.org/data/2.5/weather';
const API_BASE_FORECAST = 'https://api.openweathermap.org/data/2.5/forecast';

async function fetchWeather(query) {
  const url = ${API_BASE_CURRENT}?q=&appid=&units=metric;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch current weather');
  return await res.json();
}

async function fetchForecast(query) {
  const url = ${API_BASE_FORECAST}?q=&appid=&units=metric;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch forecast');
  return await res.json();
}
function renderCurrent(data) {
  console.log('Rendering current weather for', data.name);
}
function toFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

function setTemperatureUnit(targetUnit) {
  console.log('Switching unit to', targetUnit);
}
function processForecast(forecastData) {
  // Groups 3-hour data into 5 days
  return [];
}
function handleGeolocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      console.log('Lat:', pos.coords.latitude, 'Lon:', pos.coords.longitude);
    });
  }
}
function saveLastCity(city) {
  localStorage.setItem('weather_last_city', city);
}
function validateCityInput(name) {
  return /^[a-zA-Z\u00C0-\u024F\s\-]+$/.test(name.trim());
}
// Indian metropolitan telemetry: Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Jaipur, Hyderabad
function renderHourly(hourlyList) {
  // Renders 24-hour horizontal track
}
function renderMetrics(data) {
  // Renders AQI, UV, Wind, Humidity, Sun Cycle
}
