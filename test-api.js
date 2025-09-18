// Test script to verify API connection
const API_BASE_URL = 'http://localhost:8000';

async function testAPI() {
  try {
    console.log('Testing API connection...');
    
    // Test health endpoint
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test students endpoint
    const studentsResponse = await fetch(`${API_BASE_URL}/api/students/`);
    const studentsData = await studentsResponse.json();
    console.log('✅ Students endpoint:', studentsData);
    
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();
