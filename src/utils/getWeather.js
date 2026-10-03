import "dotenv/config";
const apiKey = process.env.WEATHER_API_KEY;
console.log("API Key:", apiKey);
const getWeather = async (lon, lat) => {
  const url = `https://api.openweathermap.org/data/4.0/onecall/current?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.log("Error fetching weather data:", response);
    throw new Error("Error fetch weather data");
  }
  const data = await response.json();

  const result = {};
  result.temp = data?.data[0].temp;
  result.humidity = data?.data[0].humidity;
};

console.log(await getWeather(77.209, 28.6139));

export default getWeather;
