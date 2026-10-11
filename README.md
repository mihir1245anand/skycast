# ⛅ SkyPulse PRO — Live Weather & Air Quality Dashboard

A production-grade, responsive **Live Weather & Environmental Telemetry Dashboard** built exclusively with semantic HTML5, vanilla CSS3 glassmorphism, and modern JavaScript (ES6+). Zero frameworks, zero dependencies, zero build tools.

Featuring full support for **Indian metropolitan hubs** (Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Hyderabad, Jaipur, etc.) and global cities, integrated **Air Quality Index (AQI)** telemetry, a **24-hour hourly forecast timeline**, and adaptive weather themes.

---

## 🌟 Highlights & Overview

SkyPulse PRO replicates the fidelity of modern weather platforms (such as Apple Weather and AccuWeather) directly in the browser using the **OpenWeatherMap API**. The interface automatically adapts its background gradients and ambient glow orbs to match current real-world atmospheric conditions (sunny azure, overcast slate, oceanic rain, electric thunderstorm, frosty snow, or midnight stars).

---

## ✨ Features Breakdown

### 1. 🇮🇳 Dedicated Indian Hubs & Global Weather
- One-click quick access chips for major Indian hubs: **Delhi**, **Mumbai**, **Bengaluru**, **Kolkata**, **Chennai**, **Hyderabad**, **Jaipur**, **Ahmedabad**, and **Pune**.
- Quick chips for global cities: **London**, **Tokyo**, **New York**, **Dubai**, and **Singapore**.
- Defaults to **Delhi, India** on first launch with precise Indian Standard Time (IST) formatting.

### 2. 🌫️ Air Quality Index (AQI) Telemetry
- Real-time **AQI Score & Meter Bar** categorized by standard air quality tiers:
  - 🟢 **Good** (0–50)
  - 🟡 **Moderate** (51–100)
  - 🟠 **Unhealthy for Sensitive Groups** (101–150)
  - 🔴 **Unhealthy** (151–200)
  - 🟣 **Very Unhealthy / Hazardous** (201+)
- Micro-pollutant telemetry: **PM2.5** and **PM10** particle density (µg/m³).
- Health advisory guidelines for outdoor exposure and masks.

### 3. 🕒 24-Hour Hourly Timeline Carousel
- Smooth horizontal swipeable/scrollable track.
- Hour-by-hour temperature curve, weather condition icons, and precipitation probability (💧 % POP).

### 4. 📅 5-Day Extended Forecast
- Groups raw 3-hour data points into 5 calendar days.
- Calculates true daily Min and Max temperatures across all readings for each day.
- Midday (12:00) representative weather icon and description.

### 5. 🔍 Smart Search with Live Auto-Complete Suggestions
- Dropdown suggestions appear in real time as you type Indian states and world cities.
- Client-side input validation rejects numbers and special characters (`City name can only contain letters, spaces and hyphens`).
- Dedicated empty-input notice (`Please enter a city name`).

### 6. 🌡️ Instant Client-Side Unit Toggle (°C / °F)
- Seamlessly converts current temperature, "feels like", 24-hr hourly points, and 5-day forecast between Celsius and Fahrenheit.
- Performs all calculations locally from cached data—**zero duplicate API queries**.

### 7. 📍 Geolocation ("My Location")
- Uses the HTML5 Geolocation API (`navigator.geolocation`) to fetch live atmospheric telemetry via GPS coordinates (`lat` / `lon`).
- Friendly permission handling for denied, unavailable, or timed-out requests.

### 8. 📊 Advanced Environmental Telemetry Cards
- **Wind Speed & Direction**: Real-time speed (km/h or mph) with degree heading and compass direction (e.g. `240° SW`).
- **UV Index Meter**: Sun safety advisory (e.g. `High - Apply SPF 30+`).
- **Humidity & Dew Point**: Precise moisture percentage with calculated dew point temperature.
- **Sun Daylight Arc**: Accurate local Sunrise and Sunset timings calculated from the city's UTC timezone offset.
- **Live Device Clock**: Header clock with a pulsing status LED indicator.
- **Smart Advisory Ribbon**: Real-time actionable insights based on active weather conditions (rain warnings, heat alerts, haze precautions).

### 9. 🎨 Weather-Adaptive Visual Themes
Dynamic background gradients that transition smoothly between states:
- ☀️ **Clear / Sunny Sky** (`theme-clear`)
- ☁️ **Clouds & Overcast** (`theme-clouds`)
- 🌧️ **Rain & Drizzle** (`theme-rain`)
- ⛈️ **Thunderstorm & Lightning** (`theme-thunderstorm`)
- ❄️ **Snow & Frost** (`theme-snow`)
- 🌫️ **Mist / Haze / Fog** (`theme-mist`)
- 🌙 **Night Sky** (`theme-night`)

### 10. 🛡️ Resilient Error Handling & Offline Detection
- Dedicated offline detection (`navigator.onLine` and `window.addEventListener('offline')`).
- HTTP status code mapping:
  - **404**: City not found with friendly retry guidance.
  - **401**: Invalid/unactivated API key notice.
  - **429**: Rate-limit exceeded alert.
- Search buttons disabled during in-flight requests to eliminate duplicate queries.
- Last successfully searched city persisted to `localStorage` for automatic reload.

---

## 📸 Dashboard UI Architecture

```text
+---------------------------------------------------------------------------------------------------------+
|  ⛅ SkyPulse PRO  | Live Weather & AQI Dashboard          [ 🟢 10:45 PM IST ]            [ °C | °F ]   |
+---------------------------------------------------------------------------------------------------------+
|  [ 🔍 Search any Indian or global city (e.g. Delhi, Mumbai, Tokyo)...          ] [ Search ] [ My Location ]|
|                                                                                                         |
|  🇮🇳 India:  [Delhi]  [Mumbai]  [Bengaluru]  [Kolkata]  [Chennai]  [Hyderabad]  [Jaipur]  [Pune]        |
|  🌍 World:  [London]  [Tokyo]  [New York]  [Dubai]  [Singapore]                                         |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|  +---------------------------------------------------------------------------------------------------+  |
|  |  Delhi, IN                                                                    [ Hazy Sunshine ]   |  |
|  |  🕒 Local Time: 10:45 PM IST                                                                      |  |
|  |                                                                                                   |  |
|  |     29°C                ( 🌫️ )                                                                    |  |
|  |     Hazy Sunshine       H: 32°C • L: 26°C                                                         |  |
|  |     Feels like 31°C                                                                               |  |
|  |                                                                                                   |  |
|  |  💡 Advisory: Hazy atmospheric conditions. Sensitive individuals should wear masks outdoors.      |  |
|  +---------------------------------------------------------------------------------------------------+  |
|                                                                                                         |
|  🕒 24-Hour Hourly Timeline                                                                             |
|  +--------+  +--------+  +--------+  +--------+  +--------+  +--------+  +--------+  +--------+         |
|  |  Now   |  | 11 PM  |  | 12 AM  |  |  1 AM  |  |  2 AM  |  |  3 AM  |  |  4 AM  |  |  5 AM  |         |
|  |   🌫️   |  |   🌙   |  |   🌙   |  |   🌙   |  |   ⛅   |  |   ⛅   |  |   ⛅   |  |   🌅   |         |
|  |  29°C  |  |  28°C  |  |  27°C  |  |  26°C  |  |  25°C  |  |  25°C  |  |  24°C  |  |  25°C  |         |
|  | 💧 15% |  | 💧 10% |  | 💧 10% |  | 💧 15% |  | 💧 20% |  | 💧 20% |  | 💧 25% |  | 💧 30% |         |
|  +--------+  +--------+  +--------+  +--------+  +--------+  +--------+  +--------+  +--------+         |
|                                                                                                         |
|  [ 5-Day Forecast ]                                    [ Atmospheric Telemetry & Air Quality ]          |
|  +--------------------------------------------------+  +---------------------------------------------+  |
|  | Mon, Oct 12  ☀️  Clear Sky           32° / 25°  |  | 🌫️ AIR QUALITY INDEX: 168 AQI [Unhealthy]   |  |
|  | Tue, Oct 13  ⛅  Scattered Clouds    31° / 24°  |  |    PM2.5: 86 µg/m³   •   PM10: 164 µg/m³     |  |
|  | Wed, Oct 14  🌧️  Passing Rain        29° / 23°  |  +---------------------------------------------+  |
|  | Thu, Oct 15  ⛅  Partly Cloudy       30° / 24°  |  | 💨 Wind: 12.6 km/h (290° WNW)  • ☀️ UV: 7 High|  |
|  | Fri, Oct 16  ☀️  Sunny               33° / 26°  |  | 💧 Humidity: 58% (Dew pt 20°C) • ⏱️ 1012 hPa   |  |
|  +--------------------------------------------------+  | 🌅 Sunrise: 6:18 AM     • 🌇 Sunset: 5:58 PM|  |
|                                                        +---------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 🔑 How to Get a Free OpenWeatherMap API Key

1. Visit [OpenWeatherMap Sign Up](https://home.openweathermap.org/users/sign_up) and create a free account.
2. Confirm your registration via the verification email.
3. Navigate to the **[API Keys Tab](https://home.openweathermap.org/api_keys)**.
4. Copy your `Default` API key (or generate a new one).
5. Open [`config.js`](file:///c:/Users/HP/Documents/live%20weather/config.js) in the project directory:
   ```javascript
   const API_KEY = "YOUR_ACTUAL_API_KEY_HERE";
   ```
6. Save the file and refresh the browser.

> **Note on Key Activation:** Newly generated OpenWeatherMap keys typically take **10 to 60 minutes** to activate. During this period, SkyPulse PRO automatically runs in **Interactive Demo Mode** with realistic live telemetry for Indian and international cities.

---

## 🚀 How to Run Locally

Because SkyPulse PRO is built entirely with vanilla web standards, no `npm install` or compilation steps are needed.

### Method 1: Python HTTP Server (Built-in)
Run the following in the project root:
```bash
python -m http.server 8080
```
Open [http://localhost:8080/index.html](http://localhost:8080/index.html) in your browser.

### Method 2: VS Code Live Server
1. Open the project folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click on [`index.html`](file:///c:/Users/HP/Documents/live%20weather/index.html) and select **Open with Live Server**.

### Method 3: Direct Browser Launch
Double-click [`index.html`](file:///c:/Users/HP/Documents/live%20weather/index.html) to run it directly from your local filesystem.

---

## 📁 File Structure

```text
weather-dashboard/
├── index.html       # Semantic HTML5 layout (hourly track, telemetry grid, Indian hubs)
├── style.css        # Responsive CSS Grid/Flexbox, glassmorphism, weather themes
├── script.js        # Async/await Fetch API, DOM manipulation, AQI & Indian telemetry
├── config.js        # OpenWeatherMap API key definition
└── README.md        # Comprehensive documentation & architecture guide
```

---

## 🔮 Future Improvements

1. **Interactive Precipitation & Wind Radar Map**:
   - Embed an interactive Leaflet.js / Mapbox radar layer displaying live Doppler cloud cover and rainfall motion across India and worldwide.
2. **Push Notifications & Extreme Weather Alerts**:
   - Integrate the Web Notifications API to trigger warnings for sudden thunderstorms, severe heatwaves, or dangerous AQI spikes.
3. **Multi-City Saved Favorites Carousel**:
   - Allow users to pin and switch between multiple favorite cities (e.g., Delhi, Mumbai, Bengaluru) on a single screen with swipe navigation.
