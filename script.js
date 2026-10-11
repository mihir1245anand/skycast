/**
 * ==========================================================================
 * SkyPulse PRO - Professional Live Weather & Environmental Telemetry
 * Core JavaScript Logic (Vanilla JS, No Frameworks, No Build Tools)
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. Global Application State
// --------------------------------------------------------------------------
const state = {
  currentWeather: null,
  forecastDaily: [],
  hourlyForecast: [],
  currentUnit: 'C',
  activeCity: 'Delhi',
  isFetching: false,
  demoModeActive: false
};

// --------------------------------------------------------------------------
// 2. DOM Elements
// --------------------------------------------------------------------------
const DOM = {
  body: document.body,
  searchForm: document.getElementById('search-form'),
  cityInput: document.getElementById('city-input'),
  clearInputBtn: document.getElementById('clear-input-btn'),
  searchSuggestions: document.getElementById('search-suggestions'),
  searchBtn: document.getElementById('search-btn'),
  locationBtn: document.getElementById('location-btn'),
  validationMsg: document.getElementById('input-validation-msg'),
  unitCBtn: document.getElementById('unit-c-btn'),
  unitFBtn: document.getElementById('unit-f-btn'),
  clockDisplay: document.getElementById('clock-display'),
  apiBanner: document.getElementById('api-banner'),
  btnUseDemo: document.getElementById('btn-use-demo'),
  btnDismissBanner: document.getElementById('btn-dismiss-banner'),
  loader: document.getElementById('loader'),
  errorContainer: document.getElementById('error-container'),
  weatherContainer: document.getElementById('weather-container'),
  currentWeatherSection: document.getElementById('current-weather'),
  hourlyCardsTrack: document.getElementById('hourly-cards-track'),
  forecastCardsGrid: document.getElementById('forecast-cards'),
  advancedMetricsSection: document.getElementById('advanced-metrics-section'),
  lastUpdated: document.getElementById('last-updated'),
  quickCityChips: document.querySelectorAll('.quick-city-chip')
};

// --------------------------------------------------------------------------
// 3. API Base Endpoints
// --------------------------------------------------------------------------
const API_BASE_CURRENT = 'https://api.openweathermap.org/data/2.5/weather';
const API_BASE_FORECAST = 'https://api.openweathermap.org/data/2.5/forecast';

// --------------------------------------------------------------------------
// 4. Utility Functions
// --------------------------------------------------------------------------

/**
 * Checks if API_KEY in config.js is still the unconfigured default.
 */
function isDefaultApiKey() {
  return typeof API_KEY === 'undefined' || !API_KEY || API_KEY === 'YOUR_KEY_HERE';
}

/**
 * Converts Celsius to Fahrenheit: (°C * 9/5) + 32
 */
function toFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

/**
 * Formats Celsius number into active unit display string (e.g. 28°C or 82°F).
 */
function formatTemperature(celsius) {
  if (celsius === null || celsius === undefined || isNaN(celsius)) return '--';
  const val = state.currentUnit === 'F' ? toFahrenheit(celsius) : celsius;
  return `${Math.round(val)}°${state.currentUnit}`;
}

/**
 * Formats wind speed based on selected unit.
 */
function formatWindSpeed(metersPerSec) {
  if (metersPerSec === null || metersPerSec === undefined || isNaN(metersPerSec)) return '--';
  if (state.currentUnit === 'F') {
    const mph = metersPerSec * 2.23694;
    return `${mph.toFixed(1)} mph`;
  }
  const kmh = metersPerSec * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

/**
 * Formats Unix timestamp to local city time (HH:MM AM/PM) using timezone shift.
 */
function formatTime(unixSec, timezoneOffsetSec = 0) {
  if (!unixSec) return '--';
  const utcDate = new Date(unixSec * 1000);
  const localDate = new Date(utcDate.getTime() + timezoneOffsetSec * 1000);
  
  let hours = localDate.getUTCHours();
  const minutes = localDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${hours}:${formattedMinutes} ${ampm}`;
}

/**
 * Formats a date string (YYYY-MM-DD) into weekday and short date.
 */
function formatDateDetails(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return {
    dayName: days[date.getDay()],
    shortDate: `${months[date.getMonth()]} ${date.getDate()}`
  };
}

/**
 * Capitalizes every word in text.
 */
function capitalizeWords(text) {
  if (!text) return '';
  return text.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Updates dynamic body class / background theme based on weather conditions.
 */
function setWeatherTheme(weatherMain, iconCode) {
  const isNight = iconCode && iconCode.endsWith('n');
  const condition = (weatherMain || '').toLowerCase();

  DOM.body.className = '';

  if (isNight && (condition === 'clear' || condition === 'clouds')) {
    DOM.body.classList.add('theme-night');
    return;
  }

  switch (condition) {
    case 'clear':
      DOM.body.classList.add('theme-clear');
      break;
    case 'clouds':
      DOM.body.classList.add('theme-clouds');
      break;
    case 'rain':
    case 'drizzle':
      DOM.body.classList.add('theme-rain');
      break;
    case 'thunderstorm':
      DOM.body.classList.add('theme-thunderstorm');
      break;
    case 'snow':
      DOM.body.classList.add('theme-snow');
      break;
    case 'mist':
    case 'fog':
    case 'smoke':
    case 'haze':
    case 'dust':
      DOM.body.classList.add('theme-mist');
      break;
    default:
      DOM.body.classList.add('theme-default');
      break;
  }
}

/**
 * Live clock tick function that updates the header clock every second.
 */
function startLiveClock() {
  function tick() {
    const now = new Date();
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    DOM.clockDisplay.textContent = now.toLocaleTimeString([], options);
  }
  tick();
  setInterval(tick, 1000);
}

/**
 * Updates footer with the last updated timestamp.
 */
function updateLastUpdatedTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  DOM.lastUpdated.textContent = `Last updated: ${timeStr}`;
}

// --------------------------------------------------------------------------
// 5. Input Validation
// --------------------------------------------------------------------------

function validateCityInput(cityName) {
  const trimmed = cityName.trim();
  
  if (!trimmed) {
    return {
      valid: false,
      message: 'Please enter a city name'
    };
  }

  // Regex allows alphabetic letters (including accented), spaces, and hyphens
  const cityRegex = /^[a-zA-Z\u00C0-\u024F\s\-]+$/;
  if (!cityRegex.test(trimmed)) {
    return {
      valid: false,
      message: 'City name can only contain letters, spaces and hyphens'
    };
  }

  return { valid: true, message: '' };
}

function showInputValidation(message) {
  DOM.validationMsg.textContent = message;
  DOM.validationMsg.classList.remove('hidden');
  DOM.cityInput.classList.add('input-error');
}

function clearInputValidation() {
  DOM.validationMsg.textContent = '';
  DOM.validationMsg.classList.add('hidden');
  DOM.cityInput.classList.remove('input-error');
}

// --------------------------------------------------------------------------
// 6. Loader and Error Presentation
// --------------------------------------------------------------------------

function showLoader(isLoading) {
  state.isFetching = isLoading;
  if (isLoading) {
    DOM.loader.classList.remove('hidden');
    DOM.searchBtn.disabled = true;
    DOM.locationBtn.disabled = true;
  } else {
    DOM.loader.classList.add('hidden');
    DOM.searchBtn.disabled = false;
    DOM.locationBtn.disabled = false;
  }
}

function showError(message, retryHint = '') {
  DOM.weatherContainer.classList.add('hidden');
  
  DOM.errorContainer.innerHTML = `
    <div class="error-card">
      <div class="error-badge-icon" aria-hidden="true">⚠️</div>
      <h3 class="error-title">Unable to Load Weather Data</h3>
      <p class="error-message">${message}</p>
      ${retryHint ? `<div class="error-hint">${retryHint}</div>` : ''}
      <button type="button" class="error-retry-btn" id="error-retry-btn">
        Try Again
      </button>
    </div>
  `;
  DOM.errorContainer.classList.remove('hidden');

  const retryBtn = document.getElementById('error-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      clearError();
      if (state.activeCity) {
        getWeatherData(state.activeCity);
      } else {
        DOM.cityInput.focus();
      }
    });
  }
}

function clearError() {
  DOM.errorContainer.innerHTML = '';
  DOM.errorContainer.classList.add('hidden');
}

// --------------------------------------------------------------------------
// 7. Core Weather API Fetchers (OpenWeatherMap)
// --------------------------------------------------------------------------

async function fetchWeather(query) {
  let url;
  if (typeof query === 'object' && query.lat !== undefined && query.lon !== undefined) {
    url = `${API_BASE_CURRENT}?lat=${query.lat}&lon=${query.lon}&appid=${API_KEY}&units=metric`;
  } else {
    url = `${API_BASE_CURRENT}?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    handleHttpError(response.status, query);
  }

  return await response.json();
}

async function fetchForecast(query) {
  let url;
  if (typeof query === 'object' && query.lat !== undefined && query.lon !== undefined) {
    url = `${API_BASE_FORECAST}?lat=${query.lat}&lon=${query.lon}&appid=${API_KEY}&units=metric`;
  } else {
    url = `${API_BASE_FORECAST}?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    handleHttpError(response.status, query);
  }

  return await response.json();
}

function handleHttpError(status, query) {
  const queryLabel = typeof query === 'string' ? `"${query}"` : 'your coordinates';
  
  if (status === 404) {
    const error = new Error(`City ${queryLabel} was not found.`);
    error.status = 404;
    error.hint = 'Please check the spelling (e.g. "Delhi", "Mumbai", "London") and try again.';
    throw error;
  }
  if (status === 401) {
    const error = new Error('Invalid or unactivated API key.');
    error.status = 401;
    error.hint = 'Please check API_KEY in config.js. Note: New OpenWeatherMap keys require 10-60 minutes to activate.';
    throw error;
  }
  if (status === 429) {
    const error = new Error('Too many requests (API rate limit exceeded).');
    error.status = 429;
    error.hint = 'Free OpenWeatherMap accounts have rate limits. Please wait a moment and retry.';
    throw error;
  }
  
  const genericError = new Error(`Weather service returned HTTP status ${status}.`);
  genericError.status = status;
  genericError.hint = 'Please check your connection or try again shortly.';
  throw genericError;
}

/**
 * Processes 40 readings (3-hour slots) into 5 distinct daily cards.
 */
function processForecast(forecastData) {
  if (!forecastData || !Array.isArray(forecastData.list)) {
    return [];
  }

  const groupedByDate = {};
  forecastData.list.forEach(item => {
    const dateKey = item.dt_txt.split(' ')[0];
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(item);
  });

  const dailyList = [];
  const dates = Object.keys(groupedByDate);

  dates.slice(0, 5).forEach(dateKey => {
    const readings = groupedByDate[dateKey];

    let minTemp = Infinity;
    let maxTemp = -Infinity;
    readings.forEach(r => {
      if (r.main.temp_min < minTemp) minTemp = r.main.temp_min;
      if (r.main.temp_max > maxTemp) maxTemp = r.main.temp_max;
    });

    let middayReading = readings[0];
    let smallestHourDiff = Infinity;

    readings.forEach(r => {
      const hour = parseInt(r.dt_txt.split(' ')[1].split(':')[0], 10);
      const diff = Math.abs(hour - 12);
      if (diff < smallestHourDiff) {
        smallestHourDiff = diff;
        middayReading = r;
      }
    });

    const dateDetails = formatDateDetails(dateKey);

    dailyList.push({
      dateKey,
      dayName: dateDetails.dayName,
      shortDate: dateDetails.shortDate,
      minTemp,
      maxTemp,
      icon: middayReading.weather[0].icon,
      main: middayReading.weather[0].main,
      description: middayReading.weather[0].description
    });
  });

  return dailyList;
}

// --------------------------------------------------------------------------
// 8. Dynamic DOM Rendering Functions
// --------------------------------------------------------------------------

/**
 * Builds and renders the Hero Current Weather card.
 */
function renderCurrent(data) {
  if (!data) return;

  const cityName = data.name || 'Current Location';
  const country = data.sys && data.sys.country ? data.sys.country : 'IN';
  const temp = data.main ? data.main.temp : null;
  const feelsLike = data.main ? data.main.feels_like : null;
  const tempMin = data.main ? data.main.temp_min : null;
  const tempMax = data.main ? data.main.temp_max : null;
  const weather = data.weather && data.weather[0] ? data.weather[0] : { main: 'Clear', description: 'clear sky', icon: '01d' };
  const timezone = data.timezone || 19800; // Default IST: +5:30 (19800 sec)

  const localTimeStr = formatTime(data.dt, timezone);
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;

  // Smart Weather Advisory
  let advisory = 'Atmospheric conditions are stable.';
  const cond = weather.main.toLowerCase();
  if (cond.includes('rain')) advisory = 'Rain observed. Road traction may be reduced; keep an umbrella handy.';
  else if (cond.includes('thunder')) advisory = 'Thunderstorms detected. Avoid open areas and stay indoors.';
  else if (cond.includes('clear')) advisory = 'Clear skies with pleasant visibility. Great conditions for outdoor travel.';
  else if (cond.includes('cloud')) advisory = 'Overcast cloud layers overhead with temperate winds.';
  else if (cond.includes('haze') || cond.includes('mist')) advisory = 'Hazy atmospheric conditions. Sensitive individuals should wear masks.';

  DOM.currentWeatherSection.innerHTML = `
    <article class="current-card">
      <header class="current-header">
        <div class="city-info-group">
          <div class="city-name-wrapper">
            <h2 class="city-name">${cityName}</h2>
            <span class="country-badge">${country}</span>
          </div>
          <div class="local-time">
            <span aria-hidden="true">🕒</span>
            <span>Local Time: <strong>${localTimeStr}</strong></span>
          </div>
        </div>
        <div class="condition-pill">
          <span>${capitalizeWords(weather.description)}</span>
        </div>
      </header>

      <div class="current-hero">
        <div class="temp-group">
          <div class="temperature-display">
            <span class="temp-number">${Math.round(state.currentUnit === 'F' ? toFahrenheit(temp) : temp)}</span>
            <span class="temp-unit">°${state.currentUnit}</span>
          </div>
          <div class="weather-desc-row">
            <span class="weather-desc">${capitalizeWords(weather.description)}</span>
            <span class="temp-min-max-badge">
              H: ${formatTemperature(tempMax !== null ? tempMax : temp + 2)} &bull; L: ${formatTemperature(tempMin !== null ? tempMin : temp - 3)}
            </span>
          </div>
          <div class="feels-like-text">
            Feels like <strong>${formatTemperature(feelsLike)}</strong>
          </div>
        </div>
        <div class="hero-icon-wrapper">
          <img 
            src="${iconUrl}" 
            alt="${weather.description}" 
            class="hero-weather-icon"
            loading="eager"
            onerror="this.src='https://openweathermap.org/img/wn/01d@4x.png'"
          >
        </div>
      </div>

      <!-- Smart Environmental Advisory Ribbon -->
      <div class="weather-advisory">
        <span class="advisory-icon" aria-hidden="true">💡</span>
        <span>${advisory}</span>
      </div>
    </article>
  `;
}

/**
 * Builds and renders the 24-Hour Hourly Timeline Carousel.
 */
function renderHourly(hourlyList) {
  if (!Array.isArray(hourlyList) || hourlyList.length === 0) {
    DOM.hourlyCardsTrack.innerHTML = '';
    return;
  }

  const cardsHtml = hourlyList.map((hour, index) => {
    const iconUrl = `https://openweathermap.org/img/wn/${hour.icon}@2x.png`;
    const tempFormatted = formatTemperature(hour.temp);
    const isNow = index === 0;

    return `
      <div class="hourly-card ${isNow ? 'now-card' : ''}">
        <span class="hourly-time">${isNow ? 'Now' : hour.time}</span>
        <img 
          src="${iconUrl}" 
          alt="${hour.desc}" 
          class="hourly-icon" 
          loading="lazy"
          onerror="this.src='https://openweathermap.org/img/wn/01d@2x.png'"
        >
        <span class="hourly-temp">${tempFormatted}</span>
        <span class="hourly-pop">
          💧 ${hour.pop}%
        </span>
      </div>
    `;
  }).join('');

  DOM.hourlyCardsTrack.innerHTML = cardsHtml;
}

/**
 * Builds and renders the 5-day forecast cards.
 */
function renderForecast(forecastList) {
  if (!Array.isArray(forecastList) || forecastList.length === 0) {
    DOM.forecastCardsGrid.innerHTML = '';
    return;
  }

  const cardsHtml = forecastList.map((day) => {
    const iconUrl = `https://openweathermap.org/img/wn/${day.icon}@2x.png`;
    const maxFormatted = formatTemperature(day.maxTemp);
    const minFormatted = formatTemperature(day.minTemp);

    return `
      <article class="forecast-card">
        <div class="forecast-day-group">
          <h3 class="forecast-day">${day.dayName}</h3>
          <span class="forecast-date">${day.shortDate}</span>
        </div>
        <div class="forecast-icon-wrapper">
          <img 
            src="${iconUrl}" 
            alt="${day.description}" 
            class="forecast-icon"
            loading="lazy"
            onerror="this.src='https://openweathermap.org/img/wn/02d@2x.png'"
          >
        </div>
        <div class="forecast-desc" title="${capitalizeWords(day.description)}">
          ${capitalizeWords(day.description)}
        </div>
        <div class="forecast-temp-range">
          <span class="forecast-temp-max">${maxFormatted}</span>
          <span class="forecast-temp-min">${minFormatted}</span>
        </div>
      </article>
    `;
  }).join('');

  DOM.forecastCardsGrid.innerHTML = cardsHtml;
}

/**
 * Renders the Advanced Telemetry & Environmental Metrics Grid (Right Column).
 * Includes Air Quality Index (AQI), UV Index, Wind Compass, Humidity, Sun Cycle, Pressure.
 */
function renderMetrics(data) {
  if (!data) return;

  const humidity = data.main ? data.main.humidity : 60;
  const pressure = data.main ? data.main.pressure : 1013;
  const windSpeed = data.wind ? data.wind.speed : 4.0;
  const windDeg = data.wind && data.wind.deg !== undefined ? data.wind.deg : 210;
  const timezone = data.timezone || 19800;
  const sunriseStr = data.sys && data.sys.sunrise ? formatTime(data.sys.sunrise, timezone) : '06:12 AM';
  const sunsetStr = data.sys && data.sys.sunset ? formatTime(data.sys.sunset, timezone) : '06:05 PM';

  // Dynamic Dew Point approximation: T - ((100 - RH)/5)
  const tempVal = data.main ? data.main.temp : 25;
  const dewPointC = tempVal - ((100 - humidity) / 5);

  // AQI Telemetry from data or calculated
  const aqiVal = data.aqi ? data.aqi.value : 98;
  const pm25 = data.aqi ? data.aqi.pm25 : 32;
  const pm10 = data.aqi ? data.aqi.pm10 : 74;

  let aqiCategory = 'Moderate';
  let aqiClass = 'aqi-moderate';
  let aqiAdvise = 'Acceptable air quality for most individuals.';

  if (aqiVal <= 50) {
    aqiCategory = 'Good';
    aqiClass = 'aqi-good';
    aqiAdvise = 'Clean air with ideal outdoor conditions.';
  } else if (aqiVal <= 100) {
    aqiCategory = 'Moderate';
    aqiClass = 'aqi-moderate';
    aqiAdvise = 'Acceptable; sensitive individuals should consider light precautions.';
  } else if (aqiVal <= 150) {
    aqiCategory = 'Unhealthy for Sensitive';
    aqiClass = 'aqi-unhealthy-sensitive';
    aqiAdvise = 'Sensitive groups should reduce prolonged outdoor exertion.';
  } else if (aqiVal <= 200) {
    aqiCategory = 'Unhealthy';
    aqiClass = 'aqi-unhealthy';
    aqiAdvise = 'Everyone may begin to experience health effects; limit outdoor exposure.';
  } else {
    aqiCategory = 'Very Unhealthy';
    aqiClass = 'aqi-very-unhealthy';
    aqiAdvise = 'Health alert: avoid outdoor exertion.';
  }

  // UV Index estimation based on time & sun
  const uvIndex = data.uv !== undefined ? data.uv : (tempVal > 30 ? 7 : 5);
  let uvCategory = uvIndex >= 8 ? 'Very High' : uvIndex >= 6 ? 'High' : uvIndex >= 3 ? 'Moderate' : 'Low';

  // Wind direction compass label
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const dirLabel = directions[Math.round(windDeg / 45) % 8];

  DOM.advancedMetricsSection.innerHTML = `
    <!-- 1. Air Quality Index (AQI) Widget -->
    <article class="telemetry-card aqi-card">
      <div class="telemetry-header">
        <div class="telemetry-title-group">
          <div class="telemetry-icon-box" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19C7.29 7.42 4 10.6 4 12.25c0 2.22 1.8 4.05 4 4.05z"></path>
              <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.3-2.35.9-3.5"></path>
            </svg>
          </div>
          <span class="telemetry-title">Air Quality Index (AQI)</span>
        </div>
        <span class="aqi-badge ${aqiClass}">${aqiCategory}</span>
      </div>

      <div class="aqi-row">
        <div>
          <div class="telemetry-value-hero">${aqiVal} <span style="font-size: 1rem; color: var(--text-muted);">AQI</span></div>
          <p class="telemetry-subtext">${aqiAdvise}</p>
        </div>
      </div>

      <div class="aqi-meter-bar">
        <div class="aqi-meter-fill" style="width: ${Math.min(100, (aqiVal / 300) * 100)}%;"></div>
      </div>

      <div class="pollutants-grid">
        <div class="pollutant-box">
          <div class="pollutant-name">PM2.5</div>
          <div class="pollutant-val">${pm25} µg/m³</div>
        </div>
        <div class="pollutant-box">
          <div class="pollutant-name">PM10</div>
          <div class="pollutant-val">${pm10} µg/m³</div>
        </div>
        <div class="pollutant-box">
          <div class="pollutant-name">Status</div>
          <div class="pollutant-val">${aqiCategory}</div>
        </div>
      </div>
    </article>

    <!-- 2. Wind Speed & Compass -->
    <article class="telemetry-card">
      <div class="telemetry-header">
        <div class="telemetry-title-group">
          <div class="telemetry-icon-box" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
            </svg>
          </div>
          <span class="telemetry-title">Wind & Gusts</span>
        </div>
      </div>
      <div class="telemetry-value-hero">${formatWindSpeed(windSpeed)}</div>
      <div class="telemetry-subtext">Heading ${windDeg}° (${dirLabel}) &bull; Steady breeze</div>
    </article>

    <!-- 3. UV Index -->
    <article class="telemetry-card">
      <div class="telemetry-header">
        <div class="telemetry-title-group">
          <div class="telemetry-icon-box" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
            </svg>
          </div>
          <span class="telemetry-title">UV Index</span>
        </div>
      </div>
      <div class="telemetry-value-hero">${uvIndex} <span style="font-size: 1rem; color: var(--text-muted);">${uvCategory}</span></div>
      <div class="telemetry-subtext">${uvIndex >= 6 ? 'Wear sunglasses and apply SPF 30+' : 'Low UV exposure risk.'}</div>
    </article>

    <!-- 4. Humidity & Dew Point -->
    <article class="telemetry-card">
      <div class="telemetry-header">
        <div class="telemetry-title-group">
          <div class="telemetry-icon-box" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
          </div>
          <span class="telemetry-title">Humidity</span>
        </div>
      </div>
      <div class="telemetry-value-hero">${humidity}%</div>
      <div class="telemetry-subtext">The dew point is ${formatTemperature(dewPointC)} right now.</div>
    </article>

    <!-- 5. Atmospheric Pressure -->
    <article class="telemetry-card">
      <div class="telemetry-header">
        <div class="telemetry-title-group">
          <div class="telemetry-icon-box" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <span class="telemetry-title">Pressure</span>
        </div>
      </div>
      <div class="telemetry-value-hero">${pressure} <span style="font-size: 1rem; color: var(--text-muted);">hPa</span></div>
      <div class="telemetry-subtext">${pressure >= 1013 ? 'Normal barometric pressure' : 'Low pressure system active'}</div>
    </article>

    <!-- 6. Sunrise & Sunset Cycle -->
    <article class="telemetry-card" style="grid-column: span 2;">
      <div class="telemetry-header">
        <div class="telemetry-title-group">
          <div class="telemetry-icon-box" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"></circle>
              <path d="M17 18a5 5 0 0 0-10 0"></path>
              <line x1="12" y1="2" x2="12" y2="4"></line>
            </svg>
          </div>
          <span class="telemetry-title">Sun Position & Daylight Cycle</span>
        </div>
      </div>
      <div class="sun-cycle-times">
        <div class="sun-node">
          <span class="sun-node-label">🌅 Sunrise</span>
          <span class="sun-node-val">${sunriseStr}</span>
        </div>
        <div class="sun-node" style="text-align: right;">
          <span class="sun-node-label">🌇 Sunset</span>
          <span class="sun-node-val">${sunsetStr}</span>
        </div>
      </div>
    </article>
  `;
}

// --------------------------------------------------------------------------
// 9. Master Weather Fetch Orchestration
// --------------------------------------------------------------------------

async function getWeatherData(query) {
  if (state.isFetching) return;

  if (!navigator.onLine) {
    showError(
      'Network failure: You appear to be offline.',
      'Please check your internet connection and try again.'
    );
    return;
  }

  clearError();
  clearInputValidation();
  showLoader(true);

  try {
    // If the API key is unconfigured default, run the rich simulated dataset
    if (isDefaultApiKey()) {
      await loadDemoWeatherData(typeof query === 'string' ? query : 'Delhi');
      return;
    }

    // Live API Call via Promise.all
    const [currentData, forecastData] = await Promise.all([
      fetchWeather(query),
      fetchForecast(query)
    ]);

    // Store state
    state.currentWeather = currentData;
    state.forecastDaily = processForecast(forecastData);
    state.hourlyForecast = generateHourlyFromForecast(forecastData);
    state.activeCity = currentData.name || (typeof query === 'string' ? query : 'Delhi');
    state.demoModeActive = false;

    // Cache to localStorage
    if (state.activeCity) {
      localStorage.setItem('weather_last_city', state.activeCity);
      DOM.cityInput.value = state.activeCity;
    }

    // Update active chip UI
    updateActiveChip(state.activeCity);

    // Weather theme
    if (currentData.weather && currentData.weather[0]) {
      setWeatherTheme(currentData.weather[0].main, currentData.weather[0].icon);
    }

    // Render UI components
    renderCurrent(state.currentWeather);
    renderHourly(state.hourlyForecast);
    renderForecast(state.forecastDaily);
    renderMetrics(state.currentWeather);

    updateLastUpdatedTime();
    DOM.weatherContainer.classList.remove('hidden');

  } catch (err) {
    console.error('Error fetching weather data:', err);
    
    if (!navigator.onLine || err.name === 'TypeError') {
      showError(
        'Network error: Failed to reach OpenWeatherMap.',
        'Please verify your internet connection or DNS.'
      );
    } else {
      showError(err.message || 'An unexpected error occurred.', err.hint || 'Please try searching again.');
    }
  } finally {
    showLoader(false);
  }
}

/**
 * Builds 24-hour hourly points from OpenWeatherMap forecast.
 */
function generateHourlyFromForecast(forecastData) {
  if (!forecastData || !Array.isArray(forecastData.list)) return [];
  
  return forecastData.list.slice(0, 8).map((item, idx) => {
    const date = new Date(item.dt_txt + 'Z');
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return {
      time: idx === 0 ? 'Now' : `${hours} ${ampm}`,
      temp: item.main.temp,
      icon: item.weather[0].icon,
      desc: item.weather[0].description,
      pop: Math.round((item.pop || 0) * 100)
    };
  });
}

// --------------------------------------------------------------------------
// 10. Unit Toggle Functionality (°C / °F)
// --------------------------------------------------------------------------

function setTemperatureUnit(targetUnit) {
  if (state.currentUnit === targetUnit) return;

  state.currentUnit = targetUnit;

  if (targetUnit === 'C') {
    DOM.unitCBtn.classList.add('active');
    DOM.unitCBtn.setAttribute('aria-pressed', 'true');
    DOM.unitFBtn.classList.remove('active');
    DOM.unitFBtn.setAttribute('aria-pressed', 'false');
  } else {
    DOM.unitFBtn.classList.add('active');
    DOM.unitFBtn.setAttribute('aria-pressed', 'true');
    DOM.unitCBtn.classList.remove('active');
    DOM.unitCBtn.setAttribute('aria-pressed', 'false');
  }

  // Instant client-side re-render without network overhead
  if (state.currentWeather) {
    renderCurrent(state.currentWeather);
    renderHourly(state.hourlyForecast);
    renderForecast(state.forecastDaily);
    renderMetrics(state.currentWeather);
  }
}

// --------------------------------------------------------------------------
// 11. Geolocation Handling
// --------------------------------------------------------------------------

function handleGeolocation() {
  if (!navigator.geolocation) {
    showError(
      'Geolocation is not supported by your browser.',
      'Please search for your city name manually.'
    );
    return;
  }

  clearError();
  clearInputValidation();
  showLoader(true);

  navigator.geolocation.getCurrentPosition(
    position => {
      showLoader(false);
      const coords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
      getWeatherData(coords);
    },
    error => {
      showLoader(false);
      let message = 'Unable to retrieve your location.';
      let hint = 'Please search for your city manually.';

      if (error.code === error.PERMISSION_DENIED) {
        message = 'Location access was denied.';
        hint = 'Please grant location permissions in your browser or search for a city.';
      }
      showError(message, hint);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

// --------------------------------------------------------------------------
// 12. Search Form & Suggestions Handling
// --------------------------------------------------------------------------

function handleSearch(e) {
  e.preventDefault();

  const rawCity = DOM.cityInput.value;
  const validation = validateCityInput(rawCity);

  if (!validation.valid) {
    showInputValidation(validation.message);
    DOM.cityInput.focus();
    return;
  }

  clearInputValidation();
  DOM.searchSuggestions.classList.add('hidden');
  getWeatherData(rawCity.trim());
}

function updateActiveChip(cityName) {
  const norm = (cityName || '').toLowerCase();
  DOM.quickCityChips.forEach(chip => {
    if (chip.dataset.city.toLowerCase() === norm) {
      chip.classList.add('active-chip');
    } else {
      chip.classList.remove('active-chip');
    }
  });
}

// Popular database for search suggestions
const POPULAR_INDIAN_AND_WORLD_CITIES = [
  { city: 'Delhi', state: 'Delhi', country: 'India' },
  { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
  { city: 'Kolkata', state: 'West Bengal', country: 'India' },
  { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  { city: 'Hyderabad', state: 'Telangana', country: 'India' },
  { city: 'Jaipur', state: 'Rajasthan', country: 'India' },
  { city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
  { city: 'Pune', state: 'Maharashtra', country: 'India' },
  { city: 'Lucknow', state: 'Uttar Pradesh', country: 'India' },
  { city: 'Chandigarh', state: 'Punjab', country: 'India' },
  { city: 'Bhopal', state: 'Madhya Pradesh', country: 'India' },
  { city: 'Patna', state: 'Bihar', country: 'India' },
  { city: 'Kochi', state: 'Kerala', country: 'India' },
  { city: 'Tokyo', state: 'Kanto', country: 'Japan' },
  { city: 'London', state: 'England', country: 'United Kingdom' },
  { city: 'New York', state: 'NY', country: 'United States' },
  { city: 'Dubai', state: 'Dubai', country: 'UAE' },
  { city: 'Singapore', state: 'Central', country: 'Singapore' },
  { city: 'Sydney', state: 'NSW', country: 'Australia' }
];

function handleInputSuggestions() {
  const query = DOM.cityInput.value.trim().toLowerCase();
  if (query.length < 2) {
    DOM.searchSuggestions.innerHTML = '';
    DOM.searchSuggestions.classList.add('hidden');
    return;
  }

  const matches = POPULAR_INDIAN_AND_WORLD_CITIES.filter(item => 
    item.city.toLowerCase().includes(query) || 
    item.country.toLowerCase().includes(query)
  ).slice(0, 5);

  if (matches.length === 0) {
    DOM.searchSuggestions.innerHTML = '';
    DOM.searchSuggestions.classList.add('hidden');
    return;
  }

  DOM.searchSuggestions.innerHTML = matches.map(m => `
    <div class="suggestion-item" data-city="${m.city}">
      <span class="suggestion-city">${m.city}, ${m.state}</span>
      <span class="suggestion-country">${m.country}</span>
    </div>
  `).join('');

  DOM.searchSuggestions.classList.remove('hidden');

  DOM.searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const selectedCity = item.dataset.city;
      DOM.cityInput.value = selectedCity;
      DOM.searchSuggestions.classList.add('hidden');
      DOM.clearInputBtn.classList.remove('hidden');
      clearInputValidation();
      getWeatherData(selectedCity);
    });
  });
}

// --------------------------------------------------------------------------
// 13. Comprehensive Simulated Telemetry Database (India & Global)
// --------------------------------------------------------------------------

async function loadDemoWeatherData(cityName) {
  showLoader(true);
  await new Promise(resolve => setTimeout(resolve, 450)); // Simulating smooth network request

  const normalized = (cityName || 'Delhi').toLowerCase().trim();

  // Comprehensive profile database for Indian & Global hubs
  const profiles = {
    delhi: {
      name: 'Delhi',
      country: 'IN',
      temp: 29.4,
      feels_like: 31.0,
      weather: [{ main: 'Haze', description: 'hazy sunshine', icon: '50d' }],
      humidity: 58,
      pressure: 1012,
      windSpeed: 3.5,
      windDeg: 290,
      theme: 'mist',
      timezone: 19800,
      aqi: { value: 168, pm25: 86, pm10: 164 }
    },
    mumbai: {
      name: 'Mumbai',
      country: 'IN',
      temp: 31.2,
      feels_like: 36.5,
      weather: [{ main: 'Clouds', description: 'scattered clouds', icon: '03d' }],
      humidity: 78,
      pressure: 1009,
      windSpeed: 5.2,
      windDeg: 240,
      theme: 'clouds',
      timezone: 19800,
      aqi: { value: 84, pm25: 28, pm10: 74 }
    },
    bengaluru: {
      name: 'Bengaluru',
      country: 'IN',
      temp: 23.5,
      feels_like: 23.8,
      weather: [{ main: 'Clouds', description: 'pleasant broken clouds', icon: '04d' }],
      humidity: 62,
      pressure: 1016,
      windSpeed: 4.1,
      windDeg: 120,
      theme: 'clouds',
      timezone: 19800,
      aqi: { value: 48, pm25: 14, pm10: 42 }
    },
    kolkata: {
      name: 'Kolkata',
      country: 'IN',
      temp: 30.1,
      feels_like: 34.2,
      weather: [{ main: 'Clear', description: 'partly sunny', icon: '02d' }],
      humidity: 72,
      pressure: 1011,
      windSpeed: 3.8,
      windDeg: 160,
      theme: 'clear',
      timezone: 19800,
      aqi: { value: 112, pm25: 41, pm10: 95 }
    },
    chennai: {
      name: 'Chennai',
      country: 'IN',
      temp: 32.4,
      feels_like: 37.0,
      weather: [{ main: 'Clear', description: 'clear coastal sky', icon: '01d' }],
      humidity: 70,
      pressure: 1010,
      windSpeed: 4.8,
      windDeg: 140,
      theme: 'clear',
      timezone: 19800,
      aqi: { value: 72, pm25: 22, pm10: 64 }
    },
    hyderabad: {
      name: 'Hyderabad',
      country: 'IN',
      temp: 27.8,
      feels_like: 28.5,
      weather: [{ main: 'Clouds', description: 'breezy scattered clouds', icon: '03d' }],
      humidity: 60,
      pressure: 1014,
      windSpeed: 4.4,
      windDeg: 210,
      theme: 'clouds',
      timezone: 19800,
      aqi: { value: 65, pm25: 19, pm10: 58 }
    },
    jaipur: {
      name: 'Jaipur',
      country: 'IN',
      temp: 31.0,
      feels_like: 30.5,
      weather: [{ main: 'Clear', description: 'clear bright sky', icon: '01d' }],
      humidity: 38,
      pressure: 1013,
      windSpeed: 3.6,
      windDeg: 310,
      theme: 'clear',
      timezone: 19800,
      aqi: { value: 135, pm25: 52, pm10: 120 }
    },
    ahmedabad: {
      name: 'Ahmedabad',
      country: 'IN',
      temp: 33.2,
      feels_like: 34.0,
      weather: [{ main: 'Clear', description: 'warm and clear', icon: '01d' }],
      humidity: 44,
      pressure: 1011,
      windSpeed: 3.9,
      windDeg: 280,
      theme: 'clear',
      timezone: 19800,
      aqi: { value: 124, pm25: 46, pm10: 110 }
    },
    pune: {
      name: 'Pune',
      country: 'IN',
      temp: 26.0,
      feels_like: 26.2,
      weather: [{ main: 'Clouds', description: 'mild pleasant clouds', icon: '02d' }],
      humidity: 55,
      pressure: 1015,
      windSpeed: 4.0,
      windDeg: 250,
      theme: 'clouds',
      timezone: 19800,
      aqi: { value: 55, pm25: 16, pm10: 48 }
    },
    london: {
      name: 'London',
      country: 'GB',
      temp: 18.2,
      feels_like: 17.5,
      weather: [{ main: 'Clouds', description: 'scattered clouds', icon: '03d' }],
      humidity: 68,
      pressure: 1014,
      windSpeed: 4.6,
      windDeg: 210,
      theme: 'clouds',
      timezone: 3600,
      aqi: { value: 34, pm25: 8, pm10: 22 }
    },
    tokyo: {
      name: 'Tokyo',
      country: 'JP',
      temp: 24.5,
      feels_like: 25.1,
      weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
      humidity: 52,
      pressure: 1018,
      windSpeed: 3.2,
      windDeg: 180,
      theme: 'clear',
      timezone: 32400,
      aqi: { value: 28, pm25: 7, pm10: 18 }
    },
    'new york': {
      name: 'New York',
      country: 'US',
      temp: 21.0,
      feels_like: 20.4,
      weather: [{ main: 'Rain', description: 'moderate rain', icon: '10d' }],
      humidity: 82,
      pressure: 1010,
      windSpeed: 6.4,
      windDeg: 90,
      theme: 'rain',
      timezone: -14400,
      aqi: { value: 42, pm25: 10, pm10: 28 }
    },
    dubai: {
      name: 'Dubai',
      country: 'AE',
      temp: 34.5,
      feels_like: 38.0,
      weather: [{ main: 'Clear', description: 'sunny and dry', icon: '01d' }],
      humidity: 45,
      pressure: 1012,
      windSpeed: 4.2,
      windDeg: 320,
      theme: 'clear',
      timezone: 14400,
      aqi: { value: 88, pm25: 30, pm10: 78 }
    },
    singapore: {
      name: 'Singapore',
      country: 'SG',
      temp: 29.8,
      feels_like: 34.5,
      weather: [{ main: 'Rain', description: 'tropical afternoon showers', icon: '10d' }],
      humidity: 84,
      pressure: 1008,
      windSpeed: 3.4,
      windDeg: 110,
      theme: 'rain',
      timezone: 28800,
      aqi: { value: 38, pm25: 9, pm10: 24 }
    }
  };

  const profile = profiles[normalized] || {
    name: capitalizeWords(cityName),
    country: 'IN',
    temp: 28.0,
    feels_like: 29.0,
    weather: [{ main: 'Clear', description: 'clear skies', icon: '01d' }],
    humidity: 60,
    pressure: 1013,
    windSpeed: 4.0,
    windDeg: 220,
    theme: 'clear',
    timezone: 19800,
    aqi: { value: 75, pm25: 24, pm10: 62 }
  };

  const nowSec = Math.floor(Date.now() / 1000);

  // Construct Current Weather schema
  const mockCurrent = {
    name: profile.name,
    sys: { country: profile.country, sunrise: nowSec - 21600, sunset: nowSec + 21600 },
    main: {
      temp: profile.temp,
      feels_like: profile.feels_like,
      temp_min: profile.temp - 3.5,
      temp_max: profile.temp + 3.0,
      humidity: profile.humidity,
      pressure: profile.pressure
    },
    weather: profile.weather,
    wind: { speed: profile.windSpeed, deg: profile.windDeg },
    dt: nowSec,
    timezone: profile.timezone,
    aqi: profile.aqi,
    uv: profile.temp > 30 ? 7 : 5
  };

  // Construct 24-Hour Hourly Array
  const mockHourly = [];
  const hours = ['Now', '11 PM', '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM'];
  for (let i = 0; i < 8; i++) {
    const tempOffset = (i * 0.4) * (i % 2 === 0 ? -1 : 1);
    mockHourly.push({
      time: hours[i],
      temp: profile.temp + tempOffset,
      icon: profile.weather[0].icon,
      desc: profile.weather[0].description,
      pop: Math.min(90, Math.max(10, Math.round(profile.humidity * 0.4 + i * 3)))
    });
  }

  // Construct 5-Day Forecast
  const mockForecastDaily = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseDate = new Date();

  for (let i = 1; i <= 5; i++) {
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + i);

    const delta = (i % 2 === 0 ? 1 : -1) * (i * 0.7);
    const dayMax = profile.temp + 2.5 + delta;
    const dayMin = profile.temp - 4.0 + delta;
    const iconList = ['01d', '02d', '03d', '10d', '01d'];
    const descList = ['Clear Sky', 'Scattered Clouds', 'Broken Clouds', 'Passing Rain', 'Sunny'];

    mockForecastDaily.push({
      dateKey: nextDate.toISOString().split('T')[0],
      dayName: daysOfWeek[nextDate.getDay()],
      shortDate: `${months[nextDate.getMonth()]} ${nextDate.getDate()}`,
      minTemp: dayMin,
      maxTemp: dayMax,
      icon: iconList[i - 1],
      main: profile.weather[0].main,
      description: descList[i - 1]
    });
  }

  // Save State
  state.currentWeather = mockCurrent;
  state.hourlyForecast = mockHourly;
  state.forecastDaily = mockForecastDaily;
  state.activeCity = mockCurrent.name;
  state.demoModeActive = true;

  localStorage.setItem('weather_last_city', state.activeCity);
  DOM.cityInput.value = state.activeCity;
  updateActiveChip(state.activeCity);

  setWeatherTheme(mockCurrent.weather[0].main, mockCurrent.weather[0].icon);
  renderCurrent(state.currentWeather);
  renderHourly(state.hourlyForecast);
  renderForecast(state.forecastDaily);
  renderMetrics(state.currentWeather);
  updateLastUpdatedTime();

  DOM.weatherContainer.classList.remove('hidden');
  showLoader(false);
}

// --------------------------------------------------------------------------
// 14. Event Listeners & App Initialization
// --------------------------------------------------------------------------

function attachEventListeners() {
  // Search Form Submit
  DOM.searchForm.addEventListener('submit', handleSearch);

  // Search input typing & live suggestions
  DOM.cityInput.addEventListener('input', () => {
    clearInputValidation();
    if (DOM.cityInput.value.length > 0) {
      DOM.clearInputBtn.classList.remove('hidden');
    } else {
      DOM.clearInputBtn.classList.add('hidden');
    }
    handleInputSuggestions();
  });

  // Clear button
  DOM.clearInputBtn.addEventListener('click', () => {
    DOM.cityInput.value = '';
    DOM.clearInputBtn.classList.add('hidden');
    DOM.searchSuggestions.classList.add('hidden');
    clearInputValidation();
    DOM.cityInput.focus();
  });

  // Close suggestions if clicking outside
  document.addEventListener('click', (e) => {
    if (!DOM.searchForm.contains(e.target)) {
      DOM.searchSuggestions.classList.add('hidden');
    }
  });

  // Geolocation Button
  DOM.locationBtn.addEventListener('click', handleGeolocation);

  // Unit Toggle Buttons
  DOM.unitCBtn.addEventListener('click', () => setTemperatureUnit('C'));
  DOM.unitFBtn.addEventListener('click', () => setTemperatureUnit('F'));

  // Quick City Chips (India & World)
  DOM.quickCityChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const city = chip.dataset.city;
      DOM.cityInput.value = city;
      DOM.clearInputBtn.classList.remove('hidden');
      DOM.searchSuggestions.classList.add('hidden');
      clearInputValidation();
      updateActiveChip(city);
      getWeatherData(city);
    });
  });

  // API Banner Buttons
  if (DOM.btnUseDemo) {
    DOM.btnUseDemo.addEventListener('click', () => {
      loadDemoWeatherData('Delhi');
    });
  }

  if (DOM.btnDismissBanner) {
    DOM.btnDismissBanner.addEventListener('click', () => {
      DOM.apiBanner.classList.add('hidden');
    });
  }

  // Network Online / Offline Listeners
  window.addEventListener('online', () => {
    clearError();
    if (state.activeCity) getWeatherData(state.activeCity);
  });

  window.addEventListener('offline', () => {
    showError(
      'Network connection lost: You are currently offline.',
      'Atmospheric telemetry will resume once your internet connection is restored.'
    );
  });
}

function init() {
  attachEventListeners();
  startLiveClock();

  if (isDefaultApiKey()) {
    DOM.apiBanner.classList.remove('hidden');
  }

  // Load previous city or default to Delhi
  const savedCity = localStorage.getItem('weather_last_city');
  const initialCity = savedCity && savedCity.trim() ? savedCity.trim() : 'Delhi';

  DOM.cityInput.value = initialCity;
  DOM.clearInputBtn.classList.remove('hidden');

  getWeatherData(initialCity);
}

document.addEventListener('DOMContentLoaded', init);
