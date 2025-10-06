/**
 * Comparison Result Storage
 * In-memory storage with TTL for comparison results
 */

const crypto = require('crypto');

// In-memory store with TTL
const compareStore = new Map();
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a unique comparison ID
 */
function generateCompareId() {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = crypto.randomBytes(4).toString('hex');
  return `cmp_${timestamp}_${random}`;
}

/**
 * Store a comparison result with TTL
 * @param {Object} compareResult - The comparison result to store
 * @param {number} ttl - Time to live in milliseconds (default: 24 hours)
 * @returns {string} The generated compareId
 */
function storeComparison(compareResult, ttl = DEFAULT_TTL) {
  const compareId = generateCompareId();
  const expiresAt = Date.now() + ttl;

  compareStore.set(compareId, {
    result: compareResult,
    expiresAt,
    createdAt: Date.now(),
  });

  // Clean up expired entries
  cleanupExpired();

  return compareId;
}

/**
 * Retrieve a comparison result by ID
 * @param {string} compareId - The comparison ID
 * @returns {Object|null} The comparison result or null if not found/expired
 */
function getComparison(compareId) {
  const entry = compareStore.get(compareId);

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    compareStore.delete(compareId);
    return null;
  }

  return entry.result;
}

/**
 * Delete a comparison result
 * @param {string} compareId - The comparison ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
function deleteComparison(compareId) {
  return compareStore.delete(compareId);
}

/**
 * Clean up expired entries
 */
function cleanupExpired() {
  const now = Date.now();
  for (const [id, entry] of compareStore.entries()) {
    if (now > entry.expiresAt) {
      compareStore.delete(id);
    }
  }
}

/**
 * Get statistics about stored comparisons
 */
function getStats() {
  cleanupExpired();
  return {
    totalStored: compareStore.size,
    entries: Array.from(compareStore.entries()).map(([id, entry]) => ({
      compareId: id,
      createdAt: new Date(entry.createdAt).toISOString(),
      expiresAt: new Date(entry.expiresAt).toISOString(),
      timeRemaining: entry.expiresAt - Date.now(),
    })),
  };
}

// Clean up expired entries every hour
setInterval(cleanupExpired, 60 * 60 * 1000);

module.exports = {
  generateCompareId,
  storeComparison,
  getComparison,
  deleteComparison,
  getStats,
};
