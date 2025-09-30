
const apiKey = "46400a18875d793e4340abacb70c5cce";

// Update UI with current weather
function updateCurrentWeather(data) {
  document.getElementById("city").textContent = data.name;
  document.getElementById("time").textContent = new Date().toLocaleTimeString();
  document.getElementById("temp").textContent = `${Math.round(data.main.temp)} °C`;
  document.getElementById("desc").textContent = data.weather[0].description;
  document.getElementById("temp-max").textContent = Math.round(data.main.temp_max);
  document.getElementById("temp-min").textContent = Math.round(data.main.temp_min);
  document.getElementById("humidity").textContent = data.main.humidity;
  document.getElementById("wind").textContent = (data.wind.speed * 3.6).toFixed(1); // km/h
  document.getElementById("pressure").textContent = data.main.pressure;
  document.getElementById("visibility").textContent = (data.visibility / 1000).toFixed(1);

  const iconCode = data.weather[0].icon;
  document.getElementById("icon").src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// Update forecast (next 5 days) + Rain Chance
function updateForecast(data) {
  const forecastEl = document.getElementById("forecast");
  forecastEl.innerHTML = "";

  let rainChance = 0; // today's max rain chance

  const daily = {};
  data.list.forEach(item => {
    // Pick 12:00 forecast for daily summary
    if (item.dt_txt.includes("12:00:00")) {
      const date = new Date(item.dt_txt);
      daily[date.toDateString()] = item;
    }

    // Track today's rain chance
    if (new Date(item.dt * 1000).getDate() === new Date().getDate()) {
      rainChance = Math.max(rainChance, Math.round(item.pop * 100));
    }
  });


  document.getElementById("rain").textContent = rainChance;

  
  Object.values(daily).slice(0, 4).forEach(day => {
    const date = new Date(day.dt_txt);

    // ---  Fix for Night Icons ---
    const sunrise = new Date(data.city.sunrise * 1000);
    const sunset = new Date(data.city.sunset * 1000);

    let iconCode = day.weather[0].icon;
    if (date < sunrise || date > sunset) {
      iconCode = iconCode.replace("d", "n"); // switch to night icon 🌙
    }
    // --- End Fix ---

    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <p style="color:black">${date.toLocaleDateString("en-US", { weekday: "short" })}</p>
      <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="">
      <p style="color:black">${Math.round(day.main.temp_max)}° / ${Math.round(day.main.temp_min)}°</p>
      <small style="color:black">Rain: ${Math.round(day.pop * 100)}%</small>
    `;
    forecastEl.appendChild(card);
  });
}


// Fetch weather + forecast + AQI
async function getWeather(city) {
  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
    ]);

    if (!currentRes.ok || !forecastRes.ok) throw new Error(" Sorry the City not found");

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    // Fetch AQI
    const { lat, lon } = currentData.coord;
    const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const aqiData = await aqiRes.json();

    updateCurrentWeather(currentData);
    updateForecast(forecastData);

    // Update AQI
    const aqi = aqiData.list[0].main.aqi;
    const aqiLevels = ["--", "Good", "Fair", "Moderate", "Poor", "Very Poor"];
    document.getElementById("aqi").textContent = `${aqi} (${aqiLevels[aqi]})`;

   
    
  } catch (err) {
    alert(err.message);
  }
}

// Search button
document.getElementById("search-btn").addEventListener("click", () => {
  const city = document.getElementById("city-input").value.trim();
  if (city) getWeather(city);
  else alert("Please enter a city name");
});

// Default city on load
window.addEventListener("load", () => {
  getWeather("Delhi");
});
