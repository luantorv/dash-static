// 1. Carga de Datos desde APIs
const FAKESTORE_URL = 'https://fakestoreapi.com/products';
const MEALDB_URL    = 'https://www.themealdb.com/api/json/v1/1/search.php?s=';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Devuelve un número pseudo-aleatorio estable dado un string semilla.
// Se usa para asignar campos sintéticos (fecha, día, staff, serve time)
// de forma determinista por item, evitando que cambien en cada render.
function seededRandom(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
    }
    // Xorshift simple sobre el hash
    h ^= h >>> 16;
    h = Math.imul(h, 0x45d9f3b);
    h ^= h >>> 16;
    return (h >>> 0) / 0xffffffff; // [0, 1)
}

function normalizeProduct(product) {
    const seed = product.id.toString();
    const month = seededRandom(seed + 'm') > 0.5 ? 6 : 7;
    const day   = days[Math.floor(seededRandom(seed + 'd') * days.length)];
    return {
        Date:         `1/${month}/2023`,
        Menu:         product.title,
        Price:        product.price,
        Source:        'product',
        Kitchen_Staff: Math.floor(seededRandom(seed + 'k') * 7) + 4,
        Drinks_Staff:  null,
        Day_Of_Week:  day,
        Serve_Time:   seededRandom(seed + 's') * 15 + 1,
    };
}

function normalizeMeal(meal) {
    const seed  = meal.idMeal;
    const month = seededRandom(seed + 'm') > 0.5 ? 6 : 7;
    const day   = days[Math.floor(seededRandom(seed + 'd') * days.length)];
    // Precio derivado de la cantidad de ingredientes presentes
    const ingredientCount = Array.from({ length: 20 }, (_, i) => meal[`strIngredient${i + 1}`])
        .filter(v => v && v.trim() !== '').length;
    const price = parseFloat((ingredientCount * 1.5 + seededRandom(seed + 'p') * 5).toFixed(2));
    return {
        Date:         `1/${month}/2023`,
        Menu:         meal.strMeal,
        Price:        price,
        Source:        'meal',
        Kitchen_Staff: Math.floor(seededRandom(seed + 'k') * 7) + 4,
        Drinks_Staff:  null,
        Day_Of_Week:  day,
        Serve_Time:   seededRandom(seed + 's') * 15 + 1,
    };
}

const PRICE_RANGES = {
    low:    { min: 0,   max: 20  },
    medium: { min: 20,  max: 100 },
    high:   { min: 100, max: Infinity },
};

let rawData = [];

function setLoadingState(isLoading) {
    const kpi1 = document.getElementById('totalMonthKpi');
    const kpi2 = document.getElementById('totalCategoryKpi');
    if (isLoading) {
        kpi1.innerText = 'Loading data...';
        kpi2.innerText = '';
    }
}

function setErrorState(message) {
    const kpi1 = document.getElementById('totalMonthKpi');
    const kpi2 = document.getElementById('totalCategoryKpi');
    kpi1.innerText = `Error: ${message}`;
    kpi2.innerText = 'Could not load data from APIs.';
}

async function loadData() {
    setLoadingState(true);
    try {
        const [productsRes, mealsRes] = await Promise.all([
            fetch(FAKESTORE_URL),
            fetch(MEALDB_URL),
        ]);

        if (!productsRes.ok) throw new Error(`FakeStore API responded with ${productsRes.status}`);
        if (!mealsRes.ok)   throw new Error(`MealDB API responded with ${mealsRes.status}`);

        const products = await productsRes.json();
        const mealsBody = await mealsRes.json();
        const meals = Array.isArray(mealsBody.meals) ? mealsBody.meals : [];

        rawData = [
            ...products.map(normalizeProduct),
            ...meals.map(normalizeMeal),
        ];

        updateDashboard();
    } catch (err) {
        console.error(err);
        setErrorState(err.message);
    }
}

// 2. Variables Globales para Gráficos
let charts = {};
const colors = ['#82cfff', '#0070e0', '#ffb0b0', '#ff2c35', '#7ff2a4', '#2ab79b', '#ffd460', '#ff8c00', '#7b4bce', '#e3eaf3', '#4bc0c0'];

// Configuración global de Chart.js para tema oscuro
Chart.defaults.color = '#a0aabf';
Chart.defaults.borderColor = '#232733';

// 3. Funciones de Filtrado y Agrupación
function getPriceFilteredData() {
    const priceRange = document.getElementById('priceFilter').value;
    const { min, max } = PRICE_RANGES[priceRange];
    return rawData.filter(row => row.Price >= min && row.Price < max);
}

function getFilteredData() {
    const source = document.getElementById('categoryFilter').value;
    return getPriceFilteredData().filter(row => row.Source === source);
}

function updateDashboard() {
    const filteredByPrice = getPriceFilteredData();
    const data = getFilteredData();
    const priceLabel = document.getElementById('priceFilter').options[document.getElementById('priceFilter').selectedIndex].text;
    const source = document.getElementById('categoryFilter').value;

    // Actualizar KPIs
    const totalPrice = filteredByPrice.reduce((sum, row) => sum + row.Price, 0);
    const totalSource = data.reduce((sum, row) => sum + row.Price, 0);

    document.getElementById('totalMonthKpi').innerText = `Total Sale (${priceLabel}): $${totalPrice.toFixed(2)}`;
    document.getElementById('totalCategoryKpi').innerText = `Total Sale of ${source} (${priceLabel}): $${totalSource.toFixed(2)}`;

    document.getElementById('chart1Title').innerText = `Sale by Item — ${source} (${priceLabel})`;
    document.getElementById('chart2Title').innerText = `Daily Sales — ${source} (${priceLabel})`;

    renderMonthlySaleChart(data);
    renderDailySalesChart(data);
    renderStaffChart(filteredByPrice, 'product', 'drinksStaffChart', 'Kitchen_Staff', [4,5,6,7,8,9,10]);
    renderStaffChart(filteredByPrice, 'meal', 'kitchenStaffChart', 'Kitchen_Staff', [4,5,6,7,8,9,10]);
    renderTopItemsChart(data);
    renderPieChart(filteredByPrice, 'product', 'drinkDistChart');
    renderPieChart(filteredByPrice, 'meal', 'foodDistChart');
}

// 4. Funciones de Renderizado de Gráficos

function renderMonthlySaleChart(data) {
    const grouped = {};
    data.forEach(d => {
        grouped[d.Menu] = (grouped[d.Menu] || 0) + d.Price;
    });

    const labels = Object.keys(grouped);
    const values = Object.values(grouped);

    destroyChart('monthlySaleChart');
    charts['monthlySaleChart'] = new Chart(document.getElementById('monthlySaleChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price',
                data: values,
                backgroundColor: colors.slice(0, labels.length)
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

function renderDailySalesChart(data) {
    const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
    const grouped = { 'Monday':0, 'Tuesday':0, 'Wednesday':0, 'Thursday':0, 'Friday':0, 'Saturday':0, 'Sunday':0 };
    
    data.forEach(d => { if(grouped[d.Day_Of_Week] !== undefined) grouped[d.Day_Of_Week] += d.Price; });

    const labels = Object.keys(grouped);
    const values = Object.values(grouped);

    destroyChart('dailySalesChart');
    charts['dailySalesChart'] = new Chart(document.getElementById('dailySalesChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Sales (Baht)',
                data: values,
                backgroundColor: colors.slice(0, labels.length)
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

function renderStaffChart(data, category, canvasId, staffField, staffLevels) {
    const catData = data.filter(d => d.Source === category);
    const menus = [...new Set(catData.map(d => d.Menu))];
    
    const datasets = staffLevels.map((level, index) => {
        const levelData = menus.map(menu => {
            const items = catData.filter(d => d.Menu === menu && d[staffField] === level);
            if (items.length === 0) return 0;
            return Math.min(...items.map(i => i.Serve_Time)); // Minimum Serve Time
        });
        return {
            label: level.toString(),
            data: levelData,
            backgroundColor: colors[index % colors.length]
        };
    });

    destroyChart(canvasId);
    charts[canvasId] = new Chart(document.getElementById(canvasId), {
        type: 'bar',
        data: { labels: menus, datasets: datasets },
        options: { scales: { x: { stacked: false }, y: { stacked: false } } }
    });
}

function renderTopItemsChart(data) {
    const grouped = {};
    data.forEach(d => {
        if(!grouped[d.Menu]) grouped[d.Menu] = { price: 0, cat: d.Source };
        grouped[d.Menu].price += d.Price;
    });

    const sorted = Object.entries(grouped)
        .sort((a, b) => b[1].price - a[1].price)
        .slice(0, 8); // Top items

    const labels = sorted.map(item => item[0]);
    const values = sorted.map(item => item[1].price);
    const bgColors = sorted.map(item => item[1].cat === 'meal' ? '#82cfff' : '#0070e0');

    destroyChart('topItemsChart');
    charts['topItemsChart'] = new Chart(document.getElementById('topItemsChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price',
                data: values,
                backgroundColor: bgColors
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

function renderPieChart(data, category, canvasId) {
    const catData = data.filter(d => d.Source === category);
    const grouped = {};
    catData.forEach(d => {
        grouped[d.Menu] = (grouped[d.Menu] || 0) + 1; // Distribución por cantidad
    });

    const labels = Object.keys(grouped);
    const values = Object.values(grouped);

    destroyChart(canvasId);
    charts[canvasId] = new Chart(document.getElementById(canvasId), {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: { position: 'right', labels: { color: '#ffffff', boxWidth: 12 } }
            }
        }
    });
}

function destroyChart(id) {
    if (charts[id]) {
        charts[id].destroy();
    }
}

// 5. Event Listeners y Arranque Inicial
document.getElementById('priceFilter').addEventListener('change', updateDashboard);
document.getElementById('categoryFilter').addEventListener('change', updateDashboard);

// Iniciar al cargar la página
window.onload = loadData;
