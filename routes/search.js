// ==============================================
// SEARCH ROUTES
// ==============================================
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// === MAIN SEARCH ===
router.get('/', searchController.searchCars);

// === FILTER OPTIONS (AJAX) ===
router.get('/filter-options', searchController.getFilterOptions);

// === POPULAR CARS (AJAX) ===
router.get('/popular', searchController.getPopularCars);

// === FEATURED CARS (AJAX) ===
router.get('/featured', searchController.getFeaturedCars);

// === SIMILAR CARS (AJAX) ===
router.get('/similar/:carId', searchController.getSimilarCars);

// === AUTOCOMPLETE (AJAX) ===
router.get('/autocomplete', searchController.autocomplete);

module.exports = router;
