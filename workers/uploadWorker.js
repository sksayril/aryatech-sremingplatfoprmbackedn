/**
 * Upload Worker
 * Processes upload jobs from the queue in the background
 */

require('dotenv').config();
require('../utilities/database'); // Ensure database connection

const { processUploadJob, getPendingJobs } = require('../services/uploadQueue.service');

let isProcessing = false;
let processingInterval = null;

/**
 * Process a single job
 */
const processJob = async () => {
  if (isProcessing) {
    return; // Already processing
  }

  try {
    isProcessing = true;
    const pendingJobs = await getPendingJobs(1); // Get one job at a time

    if (pendingJobs.length === 0) {
      isProcessing = false;
      return;
    }

    const job = pendingJobs[0];
    console.log(`[${new Date().toISOString()}] Processing upload job ${job._id} (${job.FileType}: ${job.FileName})`);

    await processUploadJob(job._id);
    console.log(`[${new Date().toISOString()}] ✅ Completed upload job ${job._id}`);

    isProcessing = false;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error processing upload job:`, error.message);
    console.error(error.stack);
    isProcessing = false;
  }
};

/**
 * Start the upload worker
 */
const startWorker = (intervalMs = 5000) => {
  if (processingInterval) {
    console.log('Upload worker already running');
    return;
  }

  console.log(`🚀 Starting upload worker (checking every ${intervalMs}ms)`);
  console.log(`📊 Worker will process upload jobs from the queue`);
  
  processingInterval = setInterval(() => {
    processJob();
  }, intervalMs);

  // Process immediately on start
  console.log('🔄 Processing initial jobs...');
  processJob();
};

/**
 * Stop the upload worker
 */
const stopWorker = () => {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
    console.log('Upload worker stopped');
  }
};

/**
 * Process jobs immediately (for manual triggering)
 */
const processJobsNow = async (count = 10) => {
  const pendingJobs = await getPendingJobs(count);
  const results = [];

  for (const job of pendingJobs) {
    try {
      const result = await processUploadJob(job._id);
      results.push({ success: true, jobId: job._id, result });
    } catch (error) {
      results.push({ success: false, jobId: job._id, error: error.message });
    }
  }

  return results;
};

// Auto-start worker if this file is run directly
if (require.main === module) {
  startWorker(5000); // Check every 5 seconds

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nStopping upload worker...');
    stopWorker();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nStopping upload worker...');
    stopWorker();
    process.exit(0);
  });
}

module.exports = {
  startWorker,
  stopWorker,
  processJob,
  processJobsNow,
};

