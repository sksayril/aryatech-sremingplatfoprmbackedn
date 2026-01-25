require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('../models/movie.model');

/**
 * Script to update all videos' views to random values between 80M and 100M
 * Run with: node scripts/update-video-views.js
 */
const updateVideoViews = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Connected to database\n');

    // Get total count of movies
    const totalMovies = await Movie.countDocuments();
    console.log(`📊 Found ${totalMovies} videos in database\n`);

    if (totalMovies === 0) {
      console.log('⚠️  No videos found in database. Exiting...');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Confirm before proceeding
    console.log('⚠️  WARNING: This will update ALL videos in the database!');
    console.log('   Views will be set to random values between 80,000,000 and 100,000,000\n');
    
    // Get all movies (only IDs for efficiency)
    const movies = await Movie.find({}).select('_id');
    console.log(`🔄 Starting to update ${movies.length} videos...\n`);

    let updatedCount = 0;
    let errorCount = 0;
    const minViews = 80000000; // 80 million
    const maxViews = 100000000; // 100 million

    // Process in batches for better performance
    const batchSize = 100;
    const totalBatches = Math.ceil(movies.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, movies.length);
      const batch = movies.slice(startIndex, endIndex);

      // Prepare bulk operations
      const bulkOps = batch.map(movie => {
        // Generate random views between 80M and 100M
        const randomViews = Math.floor(Math.random() * (maxViews - minViews + 1)) + minViews;
        
        return {
          updateOne: {
            filter: { _id: movie._id },
            update: { $set: { Views: randomViews } }
          }
        };
      });

      try {
        // Execute bulk update
        const result = await Movie.bulkWrite(bulkOps);
        updatedCount += result.modifiedCount;
        
        // Show progress
        const progress = ((endIndex / movies.length) * 100).toFixed(1);
        console.log(`📈 Progress: ${endIndex}/${movies.length} (${progress}%) - Updated: ${updatedCount}`);
      } catch (error) {
        errorCount += batch.length;
        console.error(`❌ Error updating batch ${batchIndex + 1}: ${error.message}`);
      }
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Update completed!');
    console.log(`   Total videos: ${totalMovies}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Views range: ${minViews.toLocaleString()} - ${maxViews.toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Disconnect from database
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating video views:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
updateVideoViews();
