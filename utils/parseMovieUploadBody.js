const mongoose = require('mongoose');
const SubCategory = require('../models/subcategory.model');

const ALIAS_KEYS = new Set([
  'mainCategory',
  'categoryId',
  'subCategory',
  'subcategoryId',
  'channelId',
  'actors',
  'Actors',
]);

function stripEmptyRef(v) {
  if (v === '' || v === null || v === undefined) return undefined;
  return v;
}

function parseObjectIdField(v) {
  const s = stripEmptyRef(v);
  if (s === undefined) return undefined;
  const str = String(s).trim();
  if (!mongoose.Types.ObjectId.isValid(str)) {
    return undefined;
  }
  return str;
}

function parseCastField(raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  let arr = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      arr = raw.split(',').map((id) => id.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(arr)) {
    arr = [arr];
  }
  return arr
    .map((id) => String(id).trim())
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
}

/**
 * Normalize multipart/form fields for movie create + upload flows.
 * Maps aliases (main category, subcategory, channel, actors) to schema fields.
 */
function normalizeMovieUploadBody(body) {
  const out = { ...body };

  if (!out.Category && out.mainCategory) out.Category = out.mainCategory;
  if (!out.Category && out.categoryId) out.Category = out.categoryId;
  if (!out.SubCategory && out.subCategory) out.SubCategory = out.subCategory;
  if (!out.SubCategory && out.subcategoryId) out.SubCategory = out.subcategoryId;
  if (!out.Channel && out.channelId) out.Channel = out.channelId;
  if (out.Cast == null && (out.actors != null || out.Actors != null)) {
    out.Cast = out.actors != null ? out.actors : out.Actors;
  }

  out.Category = parseObjectIdField(out.Category);
  out.SubCategory = parseObjectIdField(out.SubCategory);
  out.SubSubCategory = parseObjectIdField(out.SubSubCategory);
  out.Channel = parseObjectIdField(out.Channel);

  if (out.Cast != null) {
    const cast = parseCastField(out.Cast);
    out.Cast = cast && cast.length > 0 ? cast : undefined;
  }

  for (const key of ['MetaKeywords', 'Tags', 'Genre']) {
    if (typeof out[key] === 'string') {
      try {
        out[key] = JSON.parse(out[key]);
      } catch {
        // leave as-is; controller may still validate
      }
    }
  }

  for (const k of ALIAS_KEYS) {
    delete out[k];
  }

  return out;
}

/**
 * Ensures SubCategory belongs to Category when both are set.
 */
async function assertSubCategoryMatchesCategory(categoryId, subCategoryId) {
  if (!categoryId || !subCategoryId) return;
  const sub = await SubCategory.findById(subCategoryId).select('Category');
  if (!sub) {
    const err = new Error('Subcategory not found');
    err.statusCode = 400;
    throw err;
  }
  if (String(sub.Category) !== String(categoryId)) {
    const err = new Error('Subcategory does not belong to the selected main category');
    err.statusCode = 400;
    throw err;
  }
}

module.exports = {
  normalizeMovieUploadBody,
  assertSubCategoryMatchesCategory,
};
