document.addEventListener('DOMContentLoaded', () => {
    // State
    let bibliometricData = {};
    let currentTopic = 'Blockchain';
    let currentYearFilter = 'all';
    let currentSearchQuery = '';

    // Charts instances
    let trendsChartInstance = null;
    let volumeChartInstance = null;

    // DOM Elements
    const metricsContainer = document.getElementById('key-metrics');
    const trendsCtx = document.getElementById('trendsChart').getContext('2d');
    const volumeCtx = document.getElementById('volumeChart').getContext('2d');
    const articlesContainer = document.getElementById('articles-container');
    const topicButtons = document.querySelectorAll('.filter-btn');
    const volumeYearFilter = document.getElementById('volumeYearFilter');
    const articleSearch = document.getElementById('articleSearch');
    const yearButtons = document.querySelectorAll('.year-btn');
    const topKeywordsList = document.getElementById('top-keywords-list');

    // Fetch Data
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            bibliometricData = data;
            initDashboard();
        })
        .catch(error => console.error('Error loading data:', error));

    function initDashboard() {
        renderMetrics();
        renderTrendsChart();
        renderVolumeChart();
        renderQualitativeAnalysis();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Topic Filter
        topicButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                topicButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentTopic = btn.dataset.topic;
                renderQualitativeAnalysis();
            });
        });

        // Volume Chart Year Filter
        volumeYearFilter.addEventListener('change', (e) => {
            renderVolumeChart(e.target.value);
        });

        // Article Search
        articleSearch.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase();
            renderQualitativeAnalysis();
        });

        // Year Filter for Articles
        yearButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                yearButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentYearFilter = btn.dataset.year;
                renderQualitativeAnalysis();
            });
        });
    }

    function renderMetrics() {
        metricsContainer.innerHTML = '';
        Object.keys(bibliometricData).forEach(topic => {
            const topicData = bibliometricData[topic];
            // FIX: Calculate total from yearly_stats array
            const total = topicData.yearly_stats.reduce((sum, stat) => sum + stat.count, 0);

            // FIX: Find specific years in yearly_stats
            const stat2020 = topicData.yearly_stats.find(s => s.year === 2020);
            const stat2025 = topicData.yearly_stats.find(s => s.year === 2025);

            const count2020 = stat2020 ? stat2020.count : 0;
            const count2025 = stat2025 ? stat2025.count : 0;

            let growth = 0;
            if (count2020 > 0) {
                growth = ((count2025 - count2020) / count2020) * 100;
            }
            const growthSign = growth >= 0 ? '+' : '';

            const card = document.createElement('div');
            card.className = 'metric-card';
            // Add tooltip data attribute
            card.setAttribute('data-tooltip', `Total publications found in OpenAlex (2020-2025) for ${topic}`);

            card.innerHTML = `
                <div class="metric-title">${topic}</div>
                <div class="metric-value">${total.toLocaleString()}</div>
                <div class="metric-trend" style="color: ${growth >= 0 ? '#4ade80' : '#f87171'}">
                    ${growthSign}${growth.toFixed(0)}% (2020-2025)
                </div>
            `;
            metricsContainer.appendChild(card);
        });
    }

    function renderTrendsChart() {
        const years = [2020, 2021, 2022, 2023, 2024, 2025];
        const datasets = Object.keys(bibliometricData).map((topic, index) => {
            const colors = ['#38bdf8', '#818cf8', '#c084fc']; // Cyan, Indigo, Purple

            // FIX: Map data from yearly_stats
            const data = years.map(year => {
                const stat = bibliometricData[topic].yearly_stats.find(s => s.year === year);
                return stat ? stat.count : 0;
            });

            return {
                label: topic,
                data: data,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20', // Low opacity
                tension: 0.4,
                fill: true
            };
        });

        if (trendsChartInstance) trendsChartInstance.destroy();

        trendsChartInstance = new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: years,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#94a3b8' }
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    function renderVolumeChart(yearFilter = 'all') {
        const topics = Object.keys(bibliometricData);
        let data = [];

        if (yearFilter === 'all') {
            data = topics.map(topic => {
                // FIX: Sum counts from yearly_stats
                return bibliometricData[topic].yearly_stats.reduce((sum, stat) => sum + stat.count, 0);
            });
        } else {
            const yearInt = parseInt(yearFilter);
            data = topics.map(topic => {
                // FIX: Find specific year in yearly_stats
                const stat = bibliometricData[topic].yearly_stats.find(s => s.year === yearInt);
                return stat ? stat.count : 0;
            });
        }

        if (volumeChartInstance) volumeChartInstance.destroy();

        volumeChartInstance = new Chart(volumeCtx, {
            type: 'bar',
            data: {
                labels: topics,
                datasets: [{
                    label: yearFilter === 'all' ? 'Total Publications (2020-2025)' : `Publications in ${yearFilter}`,
                    data: data,
                    backgroundColor: ['#38bdf8', '#818cf8', '#c084fc'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    function renderQualitativeAnalysis() {
        articlesContainer.innerHTML = '';
        topKeywordsList.innerHTML = '';

        const topicData = bibliometricData[currentTopic];
        if (!topicData) return;

        let allArticles = [];
        const years = [2020, 2021, 2022, 2023, 2024, 2025];

        // Collect articles based on year filter
        if (currentYearFilter === 'all') {
            years.forEach(year => {
                // FIX: Find year stats in yearly_stats
                const stat = topicData.yearly_stats.find(s => s.year === year);
                if (stat && stat.top_articles) {
                    // Add year property to article object for display
                    const articlesWithYear = stat.top_articles.map(a => ({ ...a, year }));
                    allArticles = allArticles.concat(articlesWithYear);
                }
            });
        } else {
            const yearInt = parseInt(currentYearFilter);
            // FIX: Find year stats in yearly_stats
            const stat = topicData.yearly_stats.find(s => s.year === yearInt);
            if (stat && stat.top_articles) {
                const articlesWithYear = stat.top_articles.map(a => ({ ...a, year: currentYearFilter }));
                allArticles = allArticles.concat(articlesWithYear);
            }
        }

        // Filter by search query
        if (currentSearchQuery) {
            allArticles = allArticles.filter(article =>
                article.title.toLowerCase().includes(currentSearchQuery) ||
                (article.keywords && article.keywords.some(k => k.toLowerCase().includes(currentSearchQuery)))
            );
        }

        // Extract and Rank Keywords
        const keywordCounts = {};
        allArticles.forEach(article => {
            if (article.keywords) {
                article.keywords.forEach(keyword => {
                    const k = keyword.toLowerCase(); // Normalize
                    keywordCounts[k] = (keywordCounts[k] || 0) + 1;
                });
            }
        });

        // Sort keywords by frequency
        const sortedKeywords = Object.entries(keywordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15) // Top 15
            .map(entry => entry[0]);

        // Render Top Keywords
        if (sortedKeywords.length > 0) {
            sortedKeywords.forEach(keyword => {
                const tag = document.createElement('span');
                tag.className = 'cloud-tag';
                tag.textContent = keyword; // Display as is (lowercase) or capitalize if needed
                topKeywordsList.appendChild(tag);
            });
        } else {
            topKeywordsList.innerHTML = '<span style="color: var(--text-secondary);">No keywords found for current selection.</span>';
        }

        // Render Articles
        if (allArticles.length === 0) {
            articlesContainer.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">No articles found matching your criteria.</p>';
            return;
        }

        allArticles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'article-card';

            // Keywords HTML
            let keywordsHtml = '';
            if (article.keywords && article.keywords.length > 0) {
                keywordsHtml = `<div class="article-keywords">
                    ${article.keywords.slice(0, 3).map(k => `<span class="keyword-tag">${k}</span>`).join('')}
                </div>`;
            }

            card.innerHTML = `
                <div class="article-year">${article.year}</div>
                <div class="article-title">${article.title}</div>
                ${keywordsHtml}
                <div class="article-abstract">${article.abstract || 'No abstract available.'}</div>
                <a href="${article.url}" target="_blank" class="article-link">
                    Read Article <span>→</span>
                </a>
            `;
            articlesContainer.appendChild(card);
        });
    }
});
