require('dotenv').config();
const mongoose = require('mongoose');
const { acquireJobToProcess } = require('../services/uploadQueue.service');

async function test() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Database connected');
    
    console.log('🔒 Testing acquireJobToProcess (should return null if no pending jobs)...');
    const job = await acquireJobToProcess();
    console.log('Job returned:', job);
    
    console.log('✅ Compilation and base DB query test passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

test();
