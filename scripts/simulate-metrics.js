/**
 * Simulate Metrics Updates
 * 
 * This script simulates real-time metrics updates by sending random metrics
 * to the metrics API endpoint at regular intervals.
 */

const http = require('http');

// Configuration
const API_HOST = 'localhost';
const API_PORT = 3000;
const API_PATH = '/api/metrics';
const UPDATE_INTERVAL = 2000; // 2 seconds

// Metrics to simulate
const metrics = [
  {
    id: 'cpu',
    name: 'CPU Usage',
    min: 10,
    max: 90,
    unit: '%',
  },
  {
    id: 'memory',
    name: 'Memory Usage',
    min: 20,
    max: 95,
    unit: '%',
  },
  {
    id: 'storage',
    name: 'Storage Usage',
    min: 30,
    max: 90,
    unit: '%',
  },
  {
    id: 'documents',
    name: 'Documents',
    min: 100,
    max: 500,
    unit: '',
  },
  {
    id: 'users',
    name: 'Active Users',
    min: 1,
    max: 20,
    unit: '',
  },
  {
    id: 'agents',
    name: 'Agent Executions',
    min: 0,
    max: 50,
    unit: '',
  },
  {
    id: 'workflows',
    name: 'Workflow Runs',
    min: 0,
    max: 30,
    unit: '',
  },
];

// Function to generate a random value within a range
function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to determine the trend based on previous and current values
function getTrend(previous, current) {
  if (current > previous) {
    return 'up';
  } else if (current < previous) {
    return 'down';
  } else {
    return 'stable';
  }
}

// Function to calculate the percentage change
function getChange(previous, current) {
  if (previous === 0) {
    return 0;
  }
  return ((current - previous) / previous) * 100;
}

// Function to send a metrics update
function sendMetricsUpdate(metric) {
  // Generate a random value
  const previousValue = metric.currentValue || 0;
  const currentValue = getRandomValue(metric.min, metric.max);
  
  // Calculate trend and change
  const trend = getTrend(previousValue, currentValue);
  const change = getChange(previousValue, currentValue);
  
  // Create the update payload
  const update = {
    id: metric.id,
    name: metric.name,
    value: currentValue,
    previousValue,
    change,
    trend,
  };
  
  // Store the current value for the next update
  metric.currentValue = currentValue;
  
  // Send the update to the API
  const postData = JSON.stringify(update);
  
  const options = {
    hostname: API_HOST,
    port: API_PORT,
    path: API_PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`Sent metrics update for ${metric.name}: ${currentValue}${metric.unit} (${trend})`);
      } else {
        console.error(`Error sending metrics update for ${metric.name}: ${res.statusCode} ${data}`);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error(`Error sending metrics update for ${metric.name}:`, error.message);
  });
  
  req.write(postData);
  req.end();
}

// Function to simulate metrics updates
function simulateMetricsUpdates() {
  console.log('Starting metrics simulation...');
  
  // Send an update for each metric at regular intervals
  metrics.forEach((metric, index) => {
    // Stagger the updates to avoid sending them all at once
    const delay = index * 500;
    
    setTimeout(() => {
      // Send the initial update
      sendMetricsUpdate(metric);
      
      // Set up interval for regular updates
      setInterval(() => {
        sendMetricsUpdate(metric);
      }, UPDATE_INTERVAL);
    }, delay);
  });
}

// Start the simulation
simulateMetricsUpdates();
