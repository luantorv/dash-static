// 1. Datos Estáticos Simulados (Basados en tu estructura CSV)
const rawData = [
    { Date: '1/6/2023', Menu: 'Coke', Price: 1.5, Category: 'drink', Kitchen_Staff: 7, Drinks_Staff: 3, Day_Of_Week: 'Thursday', Serve_Time: 2.5 },
    { Date: '2/6/2023', Menu: 'Soda', Price: 1.5, Category: 'drink', Kitchen_Staff: 7, Drinks_Staff: 1, Day_Of_Week: 'Friday', Serve_Time: 3.2 },
    { Date: '3/6/2023', Menu: 'Cheese Burger', Price: 5.0, Category: 'food', Kitchen_Staff: 4, Drinks_Staff: null, Day_Of_Week: 'Saturday', Serve_Time: 12.0 },
    { Date: '4/6/2023', Menu: 'Classic Burger', Price: 4.5, Category: 'food', Kitchen_Staff: 5, Drinks_Staff: null, Day_Of_Week: 'Sunday', Serve_Time: 10.5 },
    { Date: '5/6/2023', Menu: 'Coffee', Price: 2.0, Category: 'drink', Kitchen_Staff: 8, Drinks_Staff: 2, Day_Of_Week: 'Monday', Serve_Time: 4.1 },
    { Date: '6/6/2023', Menu: 'Water', Price: 1.0, Category: 'drink', Kitchen_Staff: 7, Drinks_Staff: 1, Day_Of_Week: 'Tuesday', Serve_Time: 1.0 },
    { Date: '7/6/2023', Menu: 'Veggie Burger', Price: 5.5, Category: 'food', Kitchen_Staff: 6, Drinks_Staff: null, Day_Of_Week: 'Wednesday', Serve_Time: 14.0 },
    { Date: '8/6/2023', Menu: 'Strawberry Milkshake', Price: 3.5, Category: 'drink', Kitchen_Staff: 9, Drinks_Staff: 3, Day_Of_Week: 'Thursday', Serve_Time: 6.0 },
    { Date: '9/6/2023', Menu: 'Supreme Burger', Price: 6.5, Category: 'food', Kitchen_Staff: 10, Drinks_Staff: null, Day_Of_Week: 'Friday', Serve_Time: 15.5 },
    { Date: '10/6/2023', Menu: 'Tea', Price: 1.8, Category: 'drink', Kitchen_Staff: 7, Drinks_Staff: 2, Day_Of_Week: 'Saturday', Serve_Time: 3.5 },
    // Datos para Julio (para probar el filtro de mes)
    { Date: '1/7/2023', Menu: 'Coke', Price: 1.5, Category: 'drink', Kitchen_Staff: 7, Drinks_Staff: 2, Day_Of_Week: 'Saturday', Serve_Time: 2.1 },
    { Date: '2/7/2023', Menu: 'Cheese Burger', Price: 5.0, Category: 'food', Kitchen_Staff: 5, Drinks_Staff: null, Day_Of_Week: 'Sunday', Serve_Time: 11.0 }
];

// Generar más datos aleatorios para que los gráficos se vean llenos
const menuItems = [
    { name: 'Coke', cat: 'drink', price: 1.5 }, { name: 'Soda', cat: 'drink', price: 1.5 },
    { name: 'Coffee', cat: 'drink', price: 2.0 }, { name: 'Water', cat: 'drink', price: 1.0 },
    { name: 'Strawberry Milkshake', cat: 'drink', price: 3.5 }, { name: 'Tea', cat: 'drink', price: 1.8 },
    { name: 'Chocolate Milkshake', cat: 'drink', price: 3.5 },
    { name: 'Cheese Burger', cat: 'food', price: 5.0 }, { name: 'Classic Burger', cat: 'food', price: 4.5 },
    { name: 'Veggie Burger', cat: 'food', price: 5.5 }, { name: 'Supreme Burger', cat: 'food', price: 6.5 }
];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

for (let i = 0; i < 300; i++) {
    let month = Math.random() > 0.5 ? 6 : 7;
    let item = menuItems[Math.floor(Math.random() * menuItems.length)];
    rawData.push({
        Date: `15/${month}/2023`,
        Menu: item.name,
        Price: item.price * (Math.floor(Math.random() * 5) + 1), // Cantidades aleatorias
        Category: item.cat,
        Kitchen_Staff: Math.floor(Math.random() * 7) + 4, // 4 a 10
        Drinks_Staff: item.cat === 'drink' ? Math.floor(Math.random() * 3) + 1 : null, // 1 a 3
        Day_Of_Week: days[Math.floor(Math.random() * days.length)],
        Serve_Time: Math.random() * 15 + 1 // 1 a 16 minutos
    });
}

// 2. Variables Globales para Gráficos
let charts = {};
const colors = ['#82cfff', '#0070e0', '#ffb0b0', '#ff2c35', '#7ff2a4', '#2ab79b', '#ffd460', '#ff8c00', '#7b4bce', '#e3eaf3', '#4bc0c0'];

// Configuración global de Chart.js para tema oscuro
Chart.defaults.color = '#a0aabf';
Chart.defaults.borderColor = '#232733';

// 3. Funciones de Filtrado y Agrupación
function getFilteredData() {
    const month = document.getElementById('monthFilter').value;
    const category = document.getElementById('categoryFilter').value;
    
    return rawData.filter(row => {
        const rowMonth = row.Date.split('/')[1];
        return rowMonth == month;
    });
}

function updateDashboard() {
    const data = getFilteredData();
    const monthName = document.getElementById('monthFilter').options[document.getElementById('monthFilter').selectedIndex].text;
    const category = document.getElementById('categoryFilter').value;
    const categoryData = data.filter(d => d.Category === category);

    // Actualizar KPIs
    const totalMonth = data.reduce((sum, row) => sum + row.Price, 0);
    const totalCat = categoryData.reduce((sum, row) => sum + row.Price, 0);
    
    document.getElementById('totalMonthKpi').innerText = `Total Sale for ${monthName}: $${totalMonth.toFixed(2)}`;
    document.getElementById('totalCategoryKpi').innerText = `Total Sale of ${category}: $${totalCat.toFixed(2)}`;
    
    document.getElementById('chart1Title').innerText = `Monthly Sale for each Food/Drink in Menu (${monthName})`;
    document.getElementById('chart2Title').innerText = `Daily Sales for ${category} by Day of the Week`;

    renderMonthlySaleChart(data);
    renderDailySalesChart(categoryData);
    renderStaffChart(data, 'drink', 'drinksStaffChart', 'Drinks_Staff', [1,2,3]);
    renderStaffChart(data, 'food', 'kitchenStaffChart', 'Kitchen_Staff', [4,5,6,7,8,9,10]);
    renderTopItemsChart(data);
    renderPieChart(data, 'drink', 'drinkDistChart');
    renderPieChart(data, 'food', 'foodDistChart');
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
    const catData = data.filter(d => d.Category === category);
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
        if(!grouped[d.Menu]) grouped[d.Menu] = { price: 0, cat: d.Category };
        grouped[d.Menu].price += d.Price;
    });

    const sorted = Object.entries(grouped)
        .sort((a, b) => b[1].price - a[1].price)
        .slice(0, 8); // Top items

    const labels = sorted.map(item => item[0]);
    const values = sorted.map(item => item[1].price);
    const bgColors = sorted.map(item => item[1].cat === 'food' ? '#82cfff' : '#0070e0');

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
    const catData = data.filter(d => d.Category === category);
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
document.getElementById('monthFilter').addEventListener('change', updateDashboard);
document.getElementById('categoryFilter').addEventListener('change', updateDashboard);

// Iniciar al cargar la página
window.onload = updateDashboard;
