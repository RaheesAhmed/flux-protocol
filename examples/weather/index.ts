import { connector, method, FluxServer, StdioTransport } from '../../packages/sdk/src/index.js';

interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  humidity: number;
}

@connector('weather', { description: 'Get weather information for any city' })
class WeatherConnector {
  @method({ description: 'Get current weather for a city' })
  async getWeather(city: string): Promise<WeatherData> {
    // Simulated weather data - replace with real API call
    return {
      city,
      temperature: Math.round(15 + Math.random() * 15),
      description: ['Sunny', 'Cloudy', 'Rainy', 'Partly cloudy'][Math.floor(Math.random() * 4)],
      humidity: Math.round(40 + Math.random() * 40),
    };
  }

  @method({ description: 'Get 5-day weather forecast' })
  async getForecast(city: string, days: number = 5): Promise<WeatherData[]> {
    const forecast: WeatherData[] = [];
    for (let i = 0; i < days; i++) {
      forecast.push(await this.getWeather(city));
    }
    return forecast;
  }
}

// 4 lines to start the server:
const server = new FluxServer(WeatherConnector);
const transport = new StdioTransport(server);
server.setTransport(transport);
server.start();
