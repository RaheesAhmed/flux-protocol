import { FluxClient } from 'fluxprotocol-client';

async function testToon() {
  console.log('🧪 Testing FLUX with TOON format\n');
  
  const client = new FluxClient('http://localhost:3000');
  
  // Test 1: List tools with JSON
  console.log('1️⃣ List tools (JSON):');
  const jsonTools = await client.listTools();
  console.log('   Response:', JSON.stringify(jsonTools, null, 2).slice(0, 100) + '...');
  
  // Test 2: List tools with TOON
  console.log('\n2️⃣ List tools (TOON):');
  const toonTools = await client.useToon().listTools();
  console.log('   Response:', JSON.stringify(toonTools, null, 2).slice(0, 100) + '...');
  
  // Test 3: Call tool with JSON
  console.log('\n3️⃣ Call weather.getWeather (JSON):');
  const jsonWeather = await client.useJson().call('weather.getWeather', { city: 'Tokyo' });
  console.log('   Response:', JSON.stringify(jsonWeather));
  
  // Test 4: Call tool with TOON
  console.log('\n4️⃣ Call weather.getWeather (TOON):');
  const toonWeather = await client.useToon().call('weather.getWeather', { city: 'Paris' });
  console.log('   Response:', JSON.stringify(toonWeather));
  
  // Test 5: Forecast with TOON
  console.log('\n5️⃣ Call weather.getForecast (TOON):');
  const forecast = await client.useToon().call('weather.getForecast', { city: 'London', days: 3 });
  console.log('   Response:', JSON.stringify(forecast));
  
  console.log('\n✅ All tests passed!');
}

testToon().catch(console.error);
