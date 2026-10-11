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
