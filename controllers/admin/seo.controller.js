const Movie = require('../../models/movie.model');
const Category = require('../../models/category.model');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

/**
 * Update movie SEO
 */
exports.updateMovieSEO = async (req, res) => {
  try {
    const { id } = req.params;
    const { metaTitle, metaDescription, metaKeywords, customSlug } = req.body;

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    if (metaTitle) movie.MetaTitle = metaTitle;
    if (metaDescription) movie.MetaDescription = metaDescription;
    if (metaKeywords) {
      movie.MetaKeywords = Array.isArray(metaKeywords) ? metaKeywords : [metaKeywords];
    }
    if (customSlug) {
      const slugify = require('slugify');
      movie.Slug = slugify(customSlug, { lower: true, strict: true });
    }

    await movie.save();

    res.json({
      success: true,
      message: 'SEO updated successfully',
      data: movie,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update SEO',
      error: error.message,
    });
  }
};

/**
 * Generate sitemap
 */
exports.generateSitemap = async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || 'https://yourdomain.com';

    // Get all active movies
    const movies = await Movie.find({ Status: 'active' }).select('Slug updatedAt');
    const categories = await Category.find({ IsActive: true }).select('Slug updatedAt');

    const urls = [];

    // Add static pages
    urls.push({
      loc: baseUrl,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '1.0',
    });

    // Add categories
    categories.forEach((category) => {
      urls.push({
        loc: `${baseUrl}/category/${category.Slug}`,
        lastmod: category.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: '0.8',
      });
    });

    // Add movies
    movies.forEach((movie) => {
      urls.push({
        loc: `${baseUrl}/movie/${movie.Slug}`,
        lastmod: movie.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: '0.9',
      });
    });

    // Build XML
    const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
    });

    const sitemap = {
      urlset: {
        $: {
          xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
        },
        url: urls.map((url) => ({
          loc: url.loc,
          lastmod: url.lastmod,
          changefreq: url.changefreq,
          priority: url.priority,
        })),
      },
    };

    const xml = builder.buildObject(sitemap);

    // Save to public folder
    const sitemapPath = path.join(__dirname, '../../public/sitemap.xml');
    fs.writeFileSync(sitemapPath, xml);

    res.json({
      success: true,
      message: 'Sitemap generated successfully',
      data: {
        url: `${baseUrl}/sitemap.xml`,
        totalUrls: urls.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate sitemap',
      error: error.message,
    });
  }
};

/**
 * Get SEO analytics
 */
exports.getSEOAnalytics = async (req, res) => {
  try {
    const totalMovies = await Movie.countDocuments({ Status: 'active' });
    const moviesWithSEO = await Movie.countDocuments({
      Status: 'active',
      MetaTitle: { $exists: true, $ne: '' },
      MetaDescription: { $exists: true, $ne: '' },
    });
    const moviesWithoutSEO = totalMovies - moviesWithSEO;

    res.json({
      success: true,
      data: {
        totalMovies,
        moviesWithSEO,
        moviesWithoutSEO,
        seoCoverage: totalMovies > 0 ? ((moviesWithSEO / totalMovies) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SEO analytics',
      error: error.message,
    });
  }
};

