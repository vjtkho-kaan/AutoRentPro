// ==============================================
// BROWSE PAGE INTERACTIVE FEATURES
// ==============================================

// === VIEW TOGGLE (Grid/List) ===
function toggleView(view) {
    const grid = document.getElementById('carsGrid');
    const buttons = document.querySelectorAll('.view-btn');
    
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });
    
    if (view === 'list') {
        grid.classList.add('list-view');
    } else {
        grid.classList.remove('list-view');
    }
    
    // Save preference
    localStorage.setItem('viewPreference', view);
}

// === RESTORE VIEW PREFERENCE ===
window.addEventListener('DOMContentLoaded', () => {
    const savedView = localStorage.getItem('viewPreference');
    if (savedView) {
        toggleView(savedView);
    }
    
    // Set min date for date inputs
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.querySelector('input[name="startDate"]');
    const endDateInput = document.querySelector('input[name="endDate"]');
    
    if (startDateInput) startDateInput.min = today;
    if (endDateInput) endDateInput.min = today;
    
    // Update end date min when start date changes
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', function() {
            endDateInput.min = this.value;
            if (endDateInput.value && endDateInput.value <= this.value) {
                endDateInput.value = '';
            }
        });
    }
});

// === APPLY SORT ===
function applySort(sortValue) {
    const url = new URL(window.location.href);
    const [sortBy, sortOrder] = sortValue.startsWith('-') 
        ? [sortValue.substring(1), 'desc'] 
        : [sortValue, 'asc'];
    
    url.searchParams.set('sortBy', sortBy);
    url.searchParams.set('sortOrder', sortOrder);
    url.searchParams.set('page', '1'); // Reset to page 1
    
    window.location.href = url.toString();
}

// === RESET FILTERS ===
function resetFilters() {
    window.location.href = window.location.pathname;
}

// === FILTER FORM SUBMISSION ===
const filterForm = document.getElementById('filterForm');
if (filterForm) {
    filterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const url = new URL(window.location.pathname, window.location.origin);
        
        // Add all form data to URL params
        for (let [key, value] of formData.entries()) {
            if (value) {
                url.searchParams.append(key, value);
            }
        }
        
        // Reset to page 1
        url.searchParams.set('page', '1');
        
        window.location.href = url.toString();
    });
}

// === QUICK SEARCH FORM ===
const quickSearchForm = document.getElementById('quickSearchForm');
if (quickSearchForm) {
    quickSearchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const url = new URL('/search', window.location.origin);
        
        for (let [key, value] of formData.entries()) {
            if (value) {
                url.searchParams.append(key, value);
            }
        }
        
        window.location.href = url.toString();
    });
}

// === REAL-TIME FILTER UPDATES (Optional - for better UX) ===
const filterInputs = document.querySelectorAll('.filter-option input[type="radio"], .filter-option input[type="checkbox"]');
filterInputs.forEach(input => {
    input.addEventListener('change', function() {
        // Auto-submit on filter change (optional)
        // Uncomment if you want instant filtering
        // filterForm.dispatchEvent(new Event('submit'));
    });
});

// === PRICE FORMATTING ===
window.formatPrice = function(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
};

// === SMOOTH SCROLL TO RESULTS ===
if (window.location.search) {
    setTimeout(() => {
        const resultsArea = document.querySelector('.results-area');
        if (resultsArea) {
            resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// === LOADING STATE ===
function showLoading() {
    const grid = document.getElementById('carsGrid');
    if (grid) {
        grid.innerHTML = '<div class="loading">🔄 Đang tải...</div>';
    }
}

// === AJAX FILTER UPDATE (Advanced - Optional) ===
async function updateFiltersAjax() {
    const formData = new FormData(filterForm);
    const params = new URLSearchParams(formData);
    
    try {
        showLoading();
        const response = await fetch(`/search?${params.toString()}`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderCars(data.cars);
            updatePagination(data.pagination);
        }
    } catch (error) {
        console.error('Filter update error:', error);
    }
}

function renderCars(cars) {
    const grid = document.getElementById('carsGrid');
    
    if (cars.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <h3>😔 Không tìm thấy xe phù hợp</h3>
                <p>Thử điều chỉnh bộ lọc hoặc tìm kiếm khác</p>
                <button onclick="resetFilters()" class="btn-reset-large">Đặt lại bộ lọc</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = cars.map(car => `
        <div class="car-card">
            <div class="car-image">
                ${car.images && car.images[0] 
                    ? `<img src="${car.images[0]}" alt="${car.brand} ${car.model}">`
                    : '<div class="no-image">📷 Chưa có ảnh</div>'
                }
                ${car.averageRating >= 4.5 ? '<span class="badge-premium">⭐ Top rated</span>' : ''}
            </div>
            <div class="car-info">
                <div class="car-header">
                    <h3>${car.brand} ${car.model}</h3>
                    <span class="car-year">${car.year}</span>
                </div>
                <div class="car-specs">
                    <span class="spec">👥 ${car.seats} chỗ</span>
                    <span class="spec">⚙️ ${car.transmission}</span>
                    <span class="spec">⛽ ${car.fuelType}</span>
                </div>
                <div class="car-location">
                    📍 ${car.location.city}${car.location.district ? ', ' + car.location.district : ''}
                </div>
                ${car.averageRating ? `
                    <div class="car-rating">
                        <span class="stars">⭐ ${car.averageRating}</span>
                        <span class="reviews">(${car.totalReviews} đánh giá)</span>
                    </div>
                ` : ''}
                <div class="car-footer">
                    <div class="car-price">
                        <span class="price-amount">${formatPrice(car.pricePerDay)}₫</span>
                        <span class="price-unit">/ngày</span>
                    </div>
                    <a href="/cars/${car._id}" class="btn-view-detail">Xem chi tiết →</a>
                </div>
            </div>
        </div>
    `).join('');
}

function updatePagination(pagination) {
    // Update pagination UI if needed
    const resultsInfo = document.querySelector('.results-info h2');
    if (resultsInfo) {
        resultsInfo.textContent = `${pagination.totalCars} xe khả dụng`;
    }
}
