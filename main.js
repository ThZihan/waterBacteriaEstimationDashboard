$(function() {
    $("#datepicker-start, #datepicker-end").datepicker();
});

async function fetchData() {
    const response = await fetch('https://api.thingspeak.com/channels/2732596/feeds.json?results=60');
    const data = await response.json();
    return data;
}

function getGradientColor(value, parameter) {
    let idealMin, idealMax, warningMin, warningMax;

    // Define ideal and warning ranges for each parameter
    switch (parameter) {
        case 'temperature':
            idealMin = 26;
            idealMax = 30;
            warningMin = 20;
            warningMax = 32;
            break;
        case 'ph':
            idealMin = 6.50;
            idealMax = 8.50;
            warningMin = 6.0;
            warningMax = 10.0;
            break;
        case 'turbidity':
            idealMin = 3;
            idealMax = 10;
            warningMin = 2;
            warningMax = 30;
            break;
        case 'do':
            idealMin = 5.5;
            idealMax = 7;
            warningMin = 5;
            warningMax = 12;
            break;
        case 'ec':
            idealMin = 50;
            idealMax = 200;
            warningMin = 48;
            warningMax = 250;
            break;
        case 'orp':
            idealMin = 250;
            idealMax = 400;
            warningMin = 248;
            warningMax = 450;
            break;
        case 'tds':
            idealMin = 80;
            idealMax = 250;
            warningMin = 50;
            warningMax = 300;
            break;
    }

    // Improved condition checking
    if (value >= idealMin && value <= idealMax) {
        return 'rgb(40, 167, 69)';  // Green for ideal range
    } else if ((value > idealMax && value <= warningMax) ||
        (value >= warningMin && value < idealMin)) {
        return 'rgb(255, 165, 0)';  // Orange for warning range
    } else {
        return 'rgb(220, 53, 69)';  // Red for out of acceptable range
    }
}

function displayLatestData(latest) {
    const container = document.getElementById('latestData');
    container.innerHTML = `
        <div class="parameter" style="background: ${getGradientColor(latest.field5, 'temperature')}">Temperature: ${latest.field5} °C</div>
        <div class="parameter" style="background: ${getGradientColor(latest.field1, 'ph')}">pH: ${latest.field1}</div>
        <div class="parameter" style="background: ${getGradientColor(latest.field2, 'turbidity')}">Turbidity: ${latest.field2} NTU</div>
        <div class="parameter" style="background: ${getGradientColor(latest.field3, 'do')}">DO: ${latest.field3} mg/L</div>
        <div class="parameter" style="background: ${getGradientColor(latest.field4, 'ec')}">EC: ${latest.field4} µS/cm</div>
        <div class="parameter" style="background: ${getGradientColor(latest.field6, 'orp')}">ORP: ${latest.field6} mV</div>
        <div class="parameter" style="background: ${getGradientColor(latest.field7, 'tds')}">TDS: ${latest.field7} PPM</div>
      `;
}

function plotChart(fieldData, title, chartDiv, yAxisLabel) {
    const timestamps = fieldData.map(feed => feed.created_at);
    const values = fieldData.map(feed => parseFloat(feed.value));

    const layout = {
        title: title,
        xaxis: {
            title: 'Timestamp',
            tickangle: 45,
            fixedrange: window.innerWidth <= 800 // Disable zooming on mobile
        },
        yaxis: {
            title: yAxisLabel,
            fixedrange: window.innerWidth <= 800 // Disable zooming on mobile
        },
        margin: { t: 40, l: 50, r: 20, b: 80 },
        plot_bgcolor: "#f0f8ff",
        paper_bgcolor: "#ffffff",
    };

    const trace = {
        x: timestamps,
        y: values,
        type: 'scatter',
        mode: 'lines+markers',
        marker: { color: 'rgb(55, 128, 191)', size: 8 },
        line: { shape: 'spline', smoothing: 1.3 }
    };

    Plotly.newPlot(chartDiv, [trace], layout, {
        responsive: true,
        staticPlot: window.innerWidth <= 800 // Make completely static on mobile
    });
}

function updateCharts(data) {
    const feeds = data.feeds.slice(-20); // Latest 20 entries

    plotChart(feeds.map(f => ({ created_at: f.created_at, value: f.field5 })),
        "Temperature (°C)", "temperatureChart", "Temperature (°C)");
    plotChart(feeds.map(f => ({ created_at: f.created_at, value: f.field1 })),
        "pH Level", "phChart", "pH Level");
    plotChart(feeds.map(f => ({ created_at: f.created_at, value: f.field2 })),
        "Turbidity (NTU)", "turbidityChart", "Turbidity (NTU)");
    plotChart(feeds.map(f => ({ created_at: f.created_at, value: f.field3 })),
        "Dissolved Oxygen (mg/L)", "DOChart", "Dissolved Oxygen (mg/L)");
    plotChart(feeds.map(f => ({ created_at: f.created_at, value: f.field4 })),
        "Electrical Conductivity (µS/cm)", "ECChart", "Electrical Conductivity (µS/cm)");
    plotChart(feeds.map(f => ({ created_at: f.created_at, value: f.field6 })),
        "ORP (mV)", "ORPChart", "ORP (mV)");
    plotChart(feeds.map(f => ({ created_at: f.created_at, value: f.field7 })),
        "TDS (PPM)", "TDSChart", "TDS (PPM)");
}

function displayAllData(latest) {
    const temperature = parseFloat(latest.field5);
    const pH = parseFloat(latest.field1);
    const turbidity = parseFloat(latest.field2);
    const tds = parseFloat(latest.field7);
    const doLevel = parseFloat(latest.field3);
    const ec = parseFloat(latest.field4);
    const orp = parseFloat(latest.field6);

    let infoText = "<h2>Comparison of Ideal Conditions for RAS Environment</h2>";

    // Temperature
    if (temperature >= 24 && temperature <= 28) {
        infoText += `<p>✅ Temperature (${temperature} °C) is ideal for the RAS environment.</p>`;
    } else if ((temperature > 28 && temperature <= 30) || (temperature >= 20 && temperature < 24)) {
        infoText += `<p>⚠️ Temperature (${temperature} °C) needs attention - outside optimal range but still acceptable.</p>`;
    } else {
        infoText += `<p>❌ Temperature (${temperature} °C) is critically outside safe range for RAS environment.</p>`;
    }

    // pH
    if (pH >= 7.0 && pH <= 8.0) {
        infoText += `<p>✅ pH level (${pH}) is ideal for the RAS environment.</p>`;
    } else if ((pH > 8.0 && pH <= 8.5) || (pH >= 6.5 && pH < 7.0)) {
        infoText += `<p>⚠️ pH level (${pH}) needs attention - outside optimal range but still acceptable.</p>`;
    } else {
        infoText += `<p>❌ pH level (${pH}) is critically outside safe range for RAS environment.</p>`;
    }

    // Turbidity
    if (turbidity >= 0 && turbidity <= 2) {
        infoText += `<p>✅ Turbidity (${turbidity} NTU) is ideal for the RAS environment.</p>`;
    } else if (turbidity > 2 && turbidity <= 5) {
        infoText += `<p>⚠️ Turbidity (${turbidity} NTU) needs attention - higher than optimal but still acceptable.</p>`;
    } else {
        infoText += `<p>❌ Turbidity (${turbidity} NTU) is too high for safe RAS operation.</p>`;
    }

    // TDS
    if (tds >= 400 && tds <= 800) {
        infoText += `<p>✅ TDS (${tds} PPM) is ideal for the RAS environment.</p>`;
    } else if ((tds > 800 && tds <= 1000) || (tds >= 300 && tds < 400)) {
        infoText += `<p>⚠️ TDS (${tds} PPM) needs attention - outside optimal range but still acceptable.</p>`;
    } else {
        infoText += `<p>❌ TDS (${tds} PPM) is critically outside safe range for RAS environment.</p>`;
    }

    // Dissolved Oxygen
    if (doLevel >= 6.5 && doLevel <= 8.5) {
        infoText += `<p>✅ Dissolved Oxygen (${doLevel} mg/L) is ideal for the RAS environment.</p>`;
    } else if ((doLevel > 8.5 && doLevel <= 10) || (doLevel >= 5 && doLevel < 6.5)) {
        infoText += `<p>⚠️ Dissolved Oxygen (${doLevel} mg/L) needs attention - outside optimal range but still acceptable.</p>`;
    } else {
        infoText += `<p>❌ Dissolved Oxygen (${doLevel} mg/L) is critically outside safe range for RAS environment.</p>`;
    }

    // Electrical Conductivity
    if (ec >= 800 && ec <= 1500) {
        infoText += `<p>✅ Electrical Conductivity (${ec} µS/cm) is ideal for the RAS environment.</p>`;
    } else if ((ec > 1500 && ec <= 2000) || (ec >= 500 && ec < 800)) {
        infoText += `<p>⚠️ Electrical Conductivity (${ec} µS/cm) needs attention - outside optimal range but still acceptable.</p>`;
    } else {
        infoText += `<p>❌ Electrical Conductivity (${ec} µS/cm) is critically outside safe range for RAS environment.</p>`;
    }

    // ORP
    if (orp >= 300 && orp <= 350) {
        infoText += `<p>✅ ORP (${orp} mV) is ideal for the RAS environment.</p>`;
    } else if ((orp > 350 && orp <= 400) || (orp >= 250 && orp < 300)) {
        infoText += `<p>⚠️ ORP (${orp} mV) needs attention - outside optimal range but still acceptable.</p>`;
    } else {
        infoText += `<p>❌ ORP (${orp} mV) is critically outside safe range for RAS environment.</p>`;
    }

    const infoBox = document.getElementById('dataInfo');
    infoBox.innerHTML = infoText;
}

function downloadData() {
    const startDate = document.getElementById('datepicker-start').value;
    const endDate = document.getElementById('datepicker-end').value;
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0] + ' 00:00:00';
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0] + ' 23:59:00';
    const timezone = 'Asia/Dhaka';
    const apiKey = '5FQDTVP1SQE5WKRI';
    const downloadLink = `https://api.thingspeak.com/channels/2732596/feeds.csv?start=${formattedStartDate}&end=${formattedEndDate}&timezone=${timezone}&api_key=${apiKey}`;
    window.open(downloadLink, '_blank');
}

async function init() {
    const data = await fetchData();
    const latest = data.feeds[data.feeds.length - 1];
    displayLatestData(latest);
    updateCharts(data);
    displayAllData(latest);
}

// Refresh data every 60 seconds
init();
setInterval(init, 15000);

function updateTime() {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('current-time').textContent = `Current Time: ${formattedTime}`;
}

// Fetch and display environmental data
async function fetchEnvironmentalData() {
    try {
        const apiKey = '23455f714f161e2988ee817bb10cf705'; // Replace with your API key
        const cityId = '1337178'; // Replace with your city ID
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?id=${cityId}&units=metric&appid=${apiKey}`);
        const data = await response.json();

        // Update temperature and humidity
        document.getElementById('current-temp').textContent = `Temperature: ${Math.round(data.main.temp)} °C`;
        document.getElementById('current-humidity').textContent = `Humidity: ${data.main.humidity} %`;
    } catch (error) {
        console.error('Error fetching environmental data:', error);
    }
}

// Initialize updates
updateTime();
fetchEnvironmentalData();

// Refresh time every second
setInterval(updateTime, 1000);

// Refresh environmental data every 5 minutes
setInterval(fetchEnvironmentalData, 300000);
