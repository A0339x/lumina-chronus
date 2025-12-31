import { WeatherData } from "../types";

// Determine firework color based on temperature
// Returns RGB array [0-1, 0-1, 0-1] for Cobe
export const getTempColor = (tempCelsius: number): [number, number, number] => {
  if (tempCelsius <= 0) {
    // Cold: Blue/Cyan
    return [0.02, 0.71, 0.83]; // #06b6d4
  } else if (tempCelsius <= 15) {
    // Mild: Emerald Green
    return [0.06, 0.73, 0.51]; // #10b981
  } else if (tempCelsius <= 25) {
    // Warm: Amber
    return [0.96, 0.62, 0.04]; // #f59e0b
  } else {
    // Hot: Red/Rose
    return [0.94, 0.27, 0.27]; // #ef4444
  }
};

export const fetchWeather = async (lat: number, lng: number): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
    );
    const data = await response.json();
    return {
      temperature: data.current_weather.temperature,
      condition: "Unknown", // OpenMeteo weather codes are numeric, ignoring for this specific UI
    };
  } catch (error) {
    console.error("Failed to fetch weather", error);
    // Fallback based on latitude (Rough estimation)
    const isNorthernHemisphere = lat > 0;
    // Assume January (Winter North, Summer South)
    const estimatedTemp = isNorthernHemisphere ? -2 : 28;
    return { temperature: estimatedTemp, condition: "Estimated" };
  }
};