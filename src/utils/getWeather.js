import "dotenv/config";
const weather = {
  "new york": "Sunny, 25°C",
  "los angeles": "Cloudy, 22°C",
  chicago: "Rainy, 18°C",
  houston: "Sunny, 30°C",
  phoenix: "Hot, 35°C",
  philadelphia: "Windy, 20°C",
  delhi: "Hot, 40°C",
  mumbai: "Humid, 32°C",
  bangalore: "Pleasant, 28°C",
  kolkata: "Humid, 30°C",
  london: "Cloudy, 15°C",
  paris: "Rainy, 17°C",
};
const getWeather = async (city = "") => {
  const result = weather[city.toLowerCase()] || null;
  return result ? result : "Weather data not available for this city";
};

export default getWeather;
