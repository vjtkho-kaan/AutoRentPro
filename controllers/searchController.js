// ==============================================
// SEARCH & FILTER CONTROLLER
// ==============================================
const Car = require('../models/Car');
const Booking = require('../models/Booking');

// === MAIN SEARCH & FILTER ===
exports.searchCars = async (req, res) => {
    try {
        const {
            // Date filters
            startDate,
            endDate,
            
            // Car filters
            category,
            transmission,
            fuelType,
            minSeats,
            maxSeats,
            features,
            
            // Price filters
            minPrice,
            maxPrice,
            
            // Location filters
            city,
            district,
            
            // Sorting
            sortBy = 'pricePerDay', // pricePerDay, averageRating, totalReviews, createdAt
            sortOrder = 'asc', // asc, desc
            
            // Pagination
            page = 1,
            limit = 12
        } = req.query;

        // Build query
        const query = {
            isActive: true,
            status: 'AVAILABLE'
        };

        // === CATEGORY FILTER ===
        if (category) {
            query.category = category.toUpperCase();
        }

        // === TRANSMISSION FILTER ===
        if (transmission) {
            query.transmission = transmission.toUpperCase();
        }

        // === FUEL TYPE FILTER ===
        if (fuelType) {
            query.fuelType = fuelType.toUpperCase();
        }

        // === SEATS FILTER ===
        if (minSeats || maxSeats) {
            query.seats = {};
            if (minSeats) query.seats.$gte = parseInt(minSeats);
            if (maxSeats) query.seats.$lte = parseInt(maxSeats);
        }

        // === PRICE FILTER ===
        if (minPrice || maxPrice) {
            query.pricePerDay = {};
            if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice);
            if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice);
        }

        // === LOCATION FILTER ===
        if (city) {
            query['location.city'] = new RegExp(city, 'i');
        }
        if (district) {
            query['location.district'] = new RegExp(district, 'i');
        }

        // === FEATURES FILTER ===
        if (features) {
            const featureArray = Array.isArray(features) ? features : [features];
            query.features = { $all: featureArray };
        }

        // === EXECUTE QUERY ===
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        let carsQuery = Car.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('ownerId', 'name email');

        let cars = await carsQuery;

        // === DATE-BASED AVAILABILITY FILTER ===
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Filter cars by availability
            const availableCars = [];
            for (const car of cars) {
                const isAvailable = await Booking.isCarAvailable(car._id, start, end);
                if (isAvailable) {
                    availableCars.push(car);
                }
            }
            cars = availableCars;
        }

        // === GET TOTAL COUNT ===
        const totalCars = await Car.countDocuments(query);
        const totalPages = Math.ceil(totalCars / parseInt(limit));

        // === RESPONSE ===
        if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            // AJAX request
            return res.json({
                success: true,
                cars,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCars,
                    limit: parseInt(limit),
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            });
        } else {
            // Regular page request
            return res.render('cars/search', {
                title: 'Tìm kiếm xe',
                cars,
                filters: {
                    startDate, endDate, category, transmission, fuelType,
                    minSeats, maxSeats, features, minPrice, maxPrice,
                    city, district, sortBy, sortOrder
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCars,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            });
        }

    } catch (error) {
        console.error('Search error:', error);
        if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tìm kiếm'
            });
        } else {
            return res.render('error', {
                title: 'Lỗi',
                message: 'Lỗi khi tìm kiếm xe'
            });
        }
    }
};

// === FILTER OPTIONS (For dropdowns) ===
exports.getFilterOptions = async (req, res) => {
    try {
        // Get unique categories
        const categories = await Car.distinct('category', { isActive: true });
        
        // Get price range
        const priceStats = await Car.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$pricePerDay' },
                    maxPrice: { $max: '$pricePerDay' }
                }
            }
        ]);

        // Get unique cities
        const cities = await Car.distinct('location.city', { isActive: true });

        // Get all possible features
        const allFeatures = await Car.aggregate([
            { $match: { isActive: true } },
            { $unwind: '$features' },
            { $group: { _id: '$features' } },
            { $sort: { _id: 1 } }
        ]);

        return res.json({
            success: true,
            options: {
                categories: categories.sort(),
                transmissions: ['AUTOMATIC', 'MANUAL'],
                fuelTypes: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'],
                priceRange: priceStats[0] || { minPrice: 0, maxPrice: 5000000 },
                cities: cities.sort(),
                features: allFeatures.map(f => f._id).sort()
            }
        });

    } catch (error) {
        console.error('Get filter options error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy tùy chọn lọc'
        });
    }
};

// === POPULAR CARS (Homepage) ===
exports.getPopularCars = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;

        // Get cars sorted by rating and review count
        const cars = await Car.find({
            isActive: true,
            status: 'AVAILABLE',
            totalReviews: { $gte: 1 } // Only cars with reviews
        })
            .sort({ averageRating: -1, totalReviews: -1 })
            .limit(limit)
            .populate('ownerId', 'name');

        return res.json({
            success: true,
            cars
        });

    } catch (error) {
        console.error('Get popular cars error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy xe phổ biến'
        });
    }
};

// === FEATURED CARS (Premium/New) ===
exports.getFeaturedCars = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;

        // Get newest premium cars
        const cars = await Car.find({
            isActive: true,
            status: 'AVAILABLE',
            category: { $in: ['PREMIUM', 'LUXURY', 'SUV'] }
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('ownerId', 'name');

        return res.json({
            success: true,
            cars
        });

    } catch (error) {
        console.error('Get featured cars error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy xe nổi bật'
        });
    }
};

// === SIMILAR CARS (Recommendations) ===
exports.getSimilarCars = async (req, res) => {
    try {
        const { carId } = req.params;
        const limit = parseInt(req.query.limit) || 4;

        // Get the reference car
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Xe không tồn tại'
            });
        }

        // Find similar cars (same category, similar price range)
        const priceMin = car.pricePerDay * 0.7;
        const priceMax = car.pricePerDay * 1.3;

        const similarCars = await Car.find({
            _id: { $ne: carId },
            isActive: true,
            status: 'AVAILABLE',
            category: car.category,
            pricePerDay: { $gte: priceMin, $lte: priceMax }
        })
            .sort({ averageRating: -1 })
            .limit(limit)
            .populate('ownerId', 'name');

        return res.json({
            success: true,
            cars: similarCars
        });

    } catch (error) {
        console.error('Get similar cars error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy xe tương tự'
        });
    }
};

// === AUTOCOMPLETE SEARCH ===
exports.autocomplete = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({ success: true, results: [] });
        }

        const regex = new RegExp(q, 'i');

        const results = await Car.find({
            isActive: true,
            $or: [
                { brand: regex },
                { model: regex },
                { 'location.city': regex }
            ]
        })
            .select('brand model year pricePerDay location.city images')
            .limit(5);

        return res.json({
            success: true,
            results: results.map(car => ({
                id: car._id,
                text: `${car.brand} ${car.model} (${car.year})`,
                city: car.location.city,
                price: car.pricePerDay,
                image: car.images[0] || null
            }))
        });

    } catch (error) {
        console.error('Autocomplete error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm'
        });
    }
};
