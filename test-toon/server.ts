import { connector, method, FluxServer, HttpTransport } from '../packages/sdk/src/index.js';

@connector('weather')
class WeatherConnector {
  @method('Get current weather for a city')
  async getWeather(city: string) {
    return { 
      city, 
      temp: 22, 
      condition: 'Sunny',
      humidity: 65,
      wind: '10 km/h'
    };
  }

  @method('Get weather forecast')
  async getForecast(city: string, days: number = 5) {
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      city,
      temp: 20 + Math.floor(Math.random() * 10),
      condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)]
    }));
  }
}

const server = new FluxServer(WeatherConnector);
const transport = new HttpTransport(server, { port: 3000 });
server.setTransport(transport);
server.start();

console.log('\n📡 Test endpoints:');
console.log('   JSON: curl http://localhost:3000/flux/tools');
console.log('   TOON: curl -H "Accept: application/toon" http://localhost:3000/flux/tools');
console.log('\n🔧 Call tool:');
console.log('   JSON: curl -X POST http://localhost:3000/flux/tools/weather.getWeather -d \'{"city":"Tokyo"}\'');
console.log('   TOON: curl -X POST -H "Accept: application/toon" http://localhost:3000/flux/tools/weather.getWeather -d \'{"city":"Tokyo"}\'');
