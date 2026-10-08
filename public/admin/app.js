document.addEventListener('DOMContentLoaded', () => {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

    function getValidAuthToken() {
        const token = localStorage.getItem('admin_auth_token') || '';
        const savedTime = parseInt(localStorage.getItem('admin_auth_token_time') || '0', 10);
        if (token && savedTime && (Date.now() - savedTime < TWENTY_FOUR_HOURS)) {
            return token;
        }
        localStorage.removeItem('admin_auth_token');
        localStorage.removeItem('admin_auth_token_time');
        return '';
    }

    let authToken = getValidAuthToken();

    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const loginForm = document.getElementById('login-form');
    const tokenInput = document.getElementById('token-input');
    const logoutBtn = document.getElementById('logout-btn');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitleHeading = document.getElementById('page-title-heading');

    const modalBackdrop = document.getElementById('custom-modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalBodyContent = document.getElementById('modal-body-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    let modalOnConfirmCallback = null;

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(30px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function formatParisDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const pad = n => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function openModal(title, htmlContent, onConfirm) {
        modalTitle.innerText = title;
        modalBodyContent.innerHTML = htmlContent;
        modalOnConfirmCallback = onConfirm;
        modalBackdrop.classList.add('active');
    }

    function closeModal() {
        modalBackdrop.classList.remove('active');
        modalOnConfirmCallback = null;
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    window.redirectToUser = (userId) => {
        window.switchTab('users');
        const searchInput = document.getElementById('user-search-input');
        if (searchInput) {
            searchInput.value = userId;
            searchInput.dispatchEvent(new Event('input'));
        }
    };

    window.filterTransactionsByUser = (userId) => {
        window.switchTab('transactions');
        const searchInput = document.getElementById('tx-search-input');
        if (searchInput) {
            searchInput.value = String(userId);
            searchInput.dispatchEvent(new Event('input'));
        }
        showToast(`Transactions filtrées sur l'utilisateur ${userId}`, 'info');
    };

    window.filterPaymentsByUser = (userId) => {
        window.switchTab('payments');
        const searchInput = document.getElementById('payments-search-input');
        if (searchInput) {
            searchInput.value = String(userId);
            searchInput.dispatchEvent(new Event('input'));
        }
        showToast(`Rechargements filtrés sur l'utilisateur ${userId}`, 'info');
    };

    modalCloseBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);
    modalConfirmBtn.addEventListener('click', async () => {
        if (modalOnConfirmCallback) {
            await modalOnConfirmCallback();
        }
        closeModal();
    });

    async function apiRequest(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        };
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        try {
            const response = await fetch(`/api/admin${endpoint}`, options);
            if (response.status === 401) {
                logout();
                showToast('Session expirée ou clé invalide.', 'danger');
                return null;
            }
            return await response.json();
        } catch (err) {
            showToast('Erreur de connexion au serveur API', 'danger');
            return null;
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = tokenInput.value.trim();
        if (!pwd) return;

        const res = await apiRequest('/login', 'POST', { password: pwd });
        if (res && res.success && res.token) {
            authToken = res.token;
            localStorage.setItem('admin_auth_token', res.token);
            localStorage.setItem('admin_auth_token_time', Date.now().toString());
            showToast('Connexion réussie (Session 24h) !', 'success');
            initApp();
        } else {
            authToken = '';
            showToast('Mot de passe ou token incorrect.', 'danger');
        }
    });

    function logout() {
        authToken = '';
        localStorage.removeItem('admin_auth_token');
        localStorage.removeItem('admin_auth_token_time');
        appView.style.display = 'none';
        loginView.style.display = 'flex';
    }

    logoutBtn.addEventListener('click', logout);

    function initApp() {
        loginView.style.display = 'none';
        appView.style.display = 'flex';

        const hash = (window.location.hash || '').replace('#', '').trim();
        const savedTab = localStorage.getItem('admin_active_tab') || 'dashboard';
        const validTabs = ['dashboard', 'infrastructure', 'metrics', 'users', 'stock', 'payments', 'transactions', 'amendes', 'settings', 'database'];
        const activeTab = validTabs.includes(hash) ? hash : (validTabs.includes(savedTab) ? savedTab : 'dashboard');

        window.switchTab(activeTab);
    }


    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');

            localStorage.setItem('admin_active_tab', tab);
            window.location.hash = tab;
            
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            tabContents.forEach(content => content.style.display = 'none');
            const target = document.getElementById(`tab-${tab}`);
            if (target) target.style.display = 'block';

            const titleMap = {
                'dashboard': 'Vue d\'Ensemble',
                'infrastructure': '🖥️ Infrastructure Cloud (Render & Aiven)',
                'metrics': '⚡ Métriques & Trafic Système',
                'users': 'Gestion des Utilisateurs',
                'stock': 'Gestion du Stock Carrefour',
                'payments': 'Rechargements (CB & Crypto)',
                'transactions': 'Historique des Achats',
                'amendes': 'Gestion des Amendes 24h',
                'settings': 'Configuration du Bot',
                'database': '🗄️ Studio Base de Données Aiven'
            };
            pageTitleHeading.innerText = titleMap[tab] || 'Administration';

            if (tab === 'dashboard') loadDashboardData();
            else if (tab === 'infrastructure') startInfrastructureLivePolling();
            else if (tab === 'metrics') startMetricsLivePolling();
            else if (tab === 'users') loadUsersData();
            else if (tab === 'stock') loadStockData();
            else if (tab === 'payments') loadPaymentsData();
            else if (tab === 'transactions') loadTransactionsData();
            else if (tab === 'amendes') loadAmendesData();
            else if (tab === 'settings') loadSettingsData();
            else if (tab === 'database') loadDatabaseStudio();
        });
    });

    window.switchTab = function(tabName) {
        const targetNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
        if (targetNav) {
            targetNav.click();
        }
    };

    // Mobile Menu Toggle Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    function toggleMobileMenu() {
        if (!sidebar) return;
        const isActive = sidebar.classList.toggle('active');
        if (sidebarOverlay) {
            if (isActive) sidebarOverlay.classList.add('active');
            else sidebarOverlay.classList.remove('active');
        }
    }

    function closeMobileMenu() {
        if (!sidebar || window.innerWidth > 768) return;
        sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileMenu);
    }

    navItems.forEach(item => {
        item.addEventListener('click', closeMobileMenu);
    });
    let currentMaintenanceState = false;
    const maintenanceBadge = document.getElementById('maintenance-badge');
    const toggleMaintenanceBtn = document.getElementById('toggle-maintenance-btn');

    function updateMaintenanceUI(isMtn) {
        currentMaintenanceState = isMtn;
        if (!maintenanceBadge) return;
        if (isMtn) {
            maintenanceBadge.className = 'badge badge-danger';
            maintenanceBadge.innerText = '🛠️ Maintenance Active';
        } else {
            maintenanceBadge.className = 'badge badge-success';
            maintenanceBadge.innerText = '🟢 Mode Normal';
        }
    }

    if (toggleMaintenanceBtn) {
        toggleMaintenanceBtn.addEventListener('click', () => {
            const nextState = !currentMaintenanceState;
            openModal('Mode Maintenance', `<p>Voulez-vous <strong>${nextState ? 'ACTIVER' : 'DÉSACTIVER'}</strong> le mode maintenance ?<br><br><small style="color: var(--text-secondary);">Toutes les actions Telegram non-admin seront immédiatement bloquées.</small></p>`, async () => {
                const res = await apiRequest('/maintenance', 'POST', { maintenance: nextState });
                if (res && res.success) {
                    updateMaintenanceUI(res.maintenance);
                    showToast(`Mode maintenance ${res.maintenance ? 'activé 🔴' : 'désactivé 🟢'} !`, res.maintenance ? 'danger' : 'success');
                }
            });
        });
    }

    let rawRecentSales = [];
    let currentRecentSalesPage = 1;
    let recentSalesPerPage = '10';
    let currentRecentSalesSortField = 'id';
    let currentRecentSalesSortDir = 'desc';

    function renderRecentSalesTable() {
        const tbody = document.getElementById('recent-sales-table');
        if (!tbody) return;

        const searchInput = document.getElementById('recent-sales-search-input');
        const clearBtn = document.getElementById('recent-sales-search-clear');
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

        let filtered = rawRecentSales.filter(tx => {
            if (!query) return true;
            return String(tx.id || '').toLowerCase().includes(query) ||
                   String(tx.userId || '').toLowerCase().includes(query) ||
                   String(tx.brand || '').toLowerCase().includes(query) ||
                   String(tx.price || '').toLowerCase().includes(query) ||
                   String(tx.createdAt || '').toLowerCase().includes(query);
        });

        filtered.sort((a, b) => {
            let valA = a[currentRecentSalesSortField];
            let valB = b[currentRecentSalesSortField];
            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            const numA = Number(valA);
            const numB = Number(valB);
            if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                return currentRecentSalesSortDir === 'asc' ? numA - numB : numB - numA;
            }
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            if (strA < strB) return currentRecentSalesSortDir === 'asc' ? -1 : 1;
            if (strA > strB) return currentRecentSalesSortDir === 'asc' ? 1 : -1;
            return 0;
        });

        ['id', 'userId', 'brand', 'price', 'createdAt'].forEach(field => {
            const arrowEl = document.getElementById(`sort-arrow-sales-${field}`);
            if (arrowEl) {
                if (field === currentRecentSalesSortField) {
                    arrowEl.innerText = currentRecentSalesSortDir === 'asc' ? '▲' : '▼';
                    arrowEl.style.color = 'var(--accent-primary)';
                } else {
                    arrowEl.innerText = '↕';
                    arrowEl.style.color = 'var(--text-secondary)';
                }
            }
        });

        const totalItems = filtered.length;
        let perPage = recentSalesPerPage === 'all' ? totalItems : parseInt(recentSalesPerPage, 10);
        if (isNaN(perPage) || perPage <= 0) perPage = totalItems || 1;

        const totalPages = Math.ceil(totalItems / perPage) || 1;
        if (currentRecentSalesPage > totalPages) currentRecentSalesPage = totalPages;
        if (currentRecentSalesPage < 1) currentRecentSalesPage = 1;

        const startIdx = (currentRecentSalesPage - 1) * perPage;
        const endIdx = recentSalesPerPage === 'all' ? totalItems : Math.min(startIdx + perPage, totalItems);
        const pageItems = filtered.slice(startIdx, endIdx);

        tbody.innerHTML = '';
        if (pageItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">Aucune vente trouvée</td></tr>`;
        } else {
            pageItems.forEach(tx => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${tx.id}</td>
                    <td style="cursor: pointer; color: var(--accent-primary);" onclick="window.redirectToUser('${tx.userId}')"><code>${tx.userId}</code></td>
                    <td>${escapeHtml(tx.brand)}</td>
                    <td><strong>${tx.price} €</strong></td>
                    <td>${formatParisDate(tx.createdAt)}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        const infoEl = document.getElementById('recent-sales-pagination-info');
        if (infoEl) {
            infoEl.innerText = totalItems === 0 
                ? 'Affichage 0 sur 0 vente(s)' 
                : `Affichage ${startIdx + 1}-${endIdx} sur ${totalItems} vente(s)`;
        }

        const indicatorEl = document.getElementById('recent-sales-page-indicator');
        if (indicatorEl) indicatorEl.innerText = `Page ${currentRecentSalesPage} / ${totalPages}`;

        const prevBtn = document.getElementById('btn-recent-sales-prev');
        const nextBtn = document.getElementById('btn-recent-sales-next');
        if (prevBtn) prevBtn.disabled = currentRecentSalesPage <= 1;
        if (nextBtn) nextBtn.disabled = currentRecentSalesPage >= totalPages;
    }

    function initRecentSalesListeners() {
        const searchInput = document.getElementById('recent-sales-search-input');
        const clearBtn = document.getElementById('recent-sales-search-clear');
        const perPageSelect = document.getElementById('recent-sales-per-page-select');
        const prevBtn = document.getElementById('btn-recent-sales-prev');
        const nextBtn = document.getElementById('btn-recent-sales-next');

        if (searchInput && !searchInput.dataset.initialized) {
            searchInput.dataset.initialized = 'true';
            searchInput.addEventListener('input', () => {
                currentRecentSalesPage = 1;
                renderRecentSalesTable();
            });
        }

        if (clearBtn && !clearBtn.dataset.initialized) {
            clearBtn.dataset.initialized = 'true';
            clearBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                currentRecentSalesPage = 1;
                renderRecentSalesTable();
            });
        }

        if (perPageSelect && !perPageSelect.dataset.initialized) {
            perPageSelect.dataset.initialized = 'true';
            perPageSelect.addEventListener('change', (e) => {
                recentSalesPerPage = e.target.value;
                currentRecentSalesPage = 1;
                renderRecentSalesTable();
            });
        }

        if (prevBtn && !prevBtn.dataset.initialized) {
            prevBtn.dataset.initialized = 'true';
            prevBtn.addEventListener('click', () => {
                if (currentRecentSalesPage > 1) {
                    currentRecentSalesPage--;
                    renderRecentSalesTable();
                }
            });
        }

        if (nextBtn && !nextBtn.dataset.initialized) {
            nextBtn.dataset.initialized = 'true';
            nextBtn.addEventListener('click', () => {
                currentRecentSalesPage++;
                renderRecentSalesTable();
            });
        }

        document.querySelectorAll('.sortable-th[data-table="recent-sales"]').forEach(th => {
            if (!th.dataset.initialized) {
                th.dataset.initialized = 'true';
                th.addEventListener('click', () => {
                    const sortField = th.dataset.sort;
                    if (currentRecentSalesSortField === sortField) {
                        currentRecentSalesSortDir = currentRecentSalesSortDir === 'asc' ? 'desc' : 'asc';
                    } else {
                        currentRecentSalesSortField = sortField;
                        currentRecentSalesSortDir = 'asc';
                    }
                    renderRecentSalesTable();
                });
            }
        });
    }

    function formatRelativeTime(isoString) {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return '';
            const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
            if (diffSec < 60) return "à l'instant";
            const diffMin = Math.floor(diffSec / 60);
            if (diffMin < 60) return `il y a ${diffMin}m`;
            const diffHours = Math.floor(diffMin / 60);
            if (diffHours < 24) return `il y a ${diffHours}h`;
            const diffDays = Math.floor(diffHours / 24);
            return `il y a ${diffDays}j`;
        } catch {
            return '';
        }
    }

    function formatExactDate(isoString) {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return '';
        }
    }

    function isRecentTimestamp(isoString) {
        if (!isoString) return false;
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return false;
            return (Date.now() - date.getTime()) < 3600000;
        } catch {
            return false;
        }
    }

    // =====================================================================

    async function loadDashboardData() {
        const renderPill = document.getElementById('status-pill-render');
        const dbPill = document.getElementById('status-pill-db');
        const vercelPill = document.getElementById('status-pill-vercel');
        const renderVal = document.getElementById('status-val-render');
        const dbVal = document.getElementById('status-val-db');
        const vercelVal = document.getElementById('status-val-vercel');

        const startTime = performance.now();
        const stats = await apiRequest('/stats');
        const latency = Math.round(performance.now() - startTime);

        if (stats) {
            if (renderPill) renderPill.className = 'status-pill';
            if (renderVal) renderVal.innerText = `En ligne (${latency}ms)`;
            if (dbPill) dbPill.className = 'status-pill';
            if (dbVal) dbVal.innerText = 'Connectée';
            if (vercelPill) vercelPill.className = 'status-pill';
            if (vercelVal) vercelVal.innerText = 'Opérationnel';

            updateMaintenanceUI(stats.maintenance);

            document.getElementById('stat-total-ca').innerText = `${stats.totalCa.toFixed(2)} €`;
            document.getElementById('stat-total-sales').innerText = stats.totalSales;
            document.getElementById('stat-total-users').innerText = stats.totalUsers;
            document.getElementById('stat-total-stock').innerText = stats.totalStock;

            rawRecentSales = stats.recentSales || [];
            initRecentSalesListeners();
            renderRecentSalesTable();

            try {
                const versionData = await apiRequest('/version');
                if (versionData) {
                    const rMeta = document.getElementById('status-meta-render');
                    const vMeta = document.getElementById('status-meta-vercel');

                    if (rMeta && versionData.render && versionData.render.commit && versionData.render.commit !== 'unknown') {
                        const rCommit = versionData.render.commit;
                        const rDate = versionData.render.commit_date || versionData.render.commitDate || versionData.render.boot_time || versionData.render.bootTime;
                        const rRel = formatRelativeTime(rDate);
                        const rExact = formatExactDate(rDate);
                        rMeta.style.display = 'inline-flex';
                        rMeta.innerText = rRel ? `${rCommit} (${rRel})` : rCommit;
                        rMeta.title = `Commit : ${rCommit}\nDate : ${rExact || 'Inconnue'}`;
                        if (isRecentTimestamp(rDate)) {
                            rMeta.classList.add('is-fresh');
                        } else {
                            rMeta.classList.remove('is-fresh');
                        }
                    }

                    if (vMeta && versionData.vercel && versionData.vercel.commit && versionData.vercel.commit !== 'unknown') {
                        const vCommit = versionData.vercel.commit;
                        const vDate = versionData.vercel.commitDate || versionData.vercel.buildTime;
                        const vRel = formatRelativeTime(vDate);
                        const vExact = formatExactDate(vDate);
                        vMeta.style.display = 'inline-flex';
                        vMeta.innerText = vRel ? `${vCommit} (${vRel})` : vCommit;
                        vMeta.title = `Commit : ${vCommit}\nDate : ${vExact || 'Inconnue'}`;
                        if (isRecentTimestamp(vDate)) {
                            vMeta.classList.add('is-fresh');
                        } else {
                            vMeta.classList.remove('is-fresh');
                        }
                    }
                }
            } catch (_) {}
        } else {
            if (renderPill) renderPill.className = 'status-pill error';
            if (renderVal) renderVal.innerText = 'Inaccessible';
            if (dbPill) dbPill.className = 'status-pill error';
            if (dbVal) dbVal.innerText = 'Erreur';
            if (vercelPill) vercelPill.className = 'status-pill error';
            if (vercelVal) vercelVal.innerText = 'Erreur';
        }
    }

    /* ===================================================================== */

    let infraLiveInterval = null;

    function startInfrastructureLivePolling() {
        if (infraLiveInterval) clearInterval(infraLiveInterval);
        loadInfrastructureData();
        infraLiveInterval = setInterval(() => {
            const activeTab = localStorage.getItem('admin_active_tab');
            if (activeTab === 'infrastructure') {
                loadInfrastructureData();
            } else {
                clearInterval(infraLiveInterval);
                infraLiveInterval = null;
            }
        }, 5000);
    }

    async function loadInfrastructureData() {
        const lastUpdatedEl = document.getElementById('infra-last-updated');
        const data = await apiRequest('/infrastructure/metrics');
        if (!data || !data.render || !data.aiven) {
            if (lastUpdatedEl) lastUpdatedEl.innerText = 'Erreur de synchronisation';
            return;
        }

        if (lastUpdatedEl) {
            const now = new Date();
            const pad = n => n.toString().padStart(2, '0');
            lastUpdatedEl.innerText = `Mis à jour à ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        }

        const render = data.render || {};
        const rCpu = render.cpu || {};
        const rMem = render.memory || {};
        const rDisk = render.disk || {};
        const rNet = render.network || {};
        const rApp = render.app || {};

        const setTxt = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.innerText = txt;
        };

        const setProgress = (barId, pct, inverse = false) => {
            const bar = document.getElementById(barId);
            if (!bar) return;
            const cleanPct = Math.min(100, Math.max(0, pct || 0));
            bar.style.width = `${cleanPct}%`;
            bar.className = 'infra-progress-fill';
            if (inverse) {
                if (cleanPct >= 98) bar.classList.add('green');
                else if (cleanPct >= 90) bar.classList.add('orange');
                else bar.classList.add('red');
            } else {
                if (cleanPct < 65) bar.classList.add('green');
                else if (cleanPct < 85) bar.classList.add('orange');
                else bar.classList.add('red');
            }
        };

        setTxt('render-meta-service', rApp.service_name || 'backend-app');
        setTxt('render-meta-instance', rApp.instance_id || 'inst-1');
        setTxt('render-meta-uptime', rApp.uptime_formatted || '0m 0s');
        setTxt('render-meta-commit', (rApp.commit || 'head').slice(0, 10));

        const cpuPct = parseFloat(rCpu.percent || 0);
        setTxt('render-cpu-pct', `${cpuPct.toFixed(1)}%`);
        setTxt('render-cpu-sub', `${rCpu.cores || 1} vCPU alloué (Conteneur)`);
        setTxt('render-cpu-cores', `${rCpu.cores || 1} vCPU`);
        const loadTxt = rCpu.load_avg ? rCpu.load_avg.join(', ') : 'N/A';
        setTxt('render-cpu-host', `${rCpu.host_cores || 8} vCPU (Load : ${loadTxt})`);
        setProgress('render-cpu-bar', cpuPct);
        const cpuStatusEl = document.getElementById('render-cpu-status');
        if (cpuStatusEl) {
            if (cpuPct < 50) {
                cpuStatusEl.innerText = 'Nominal (Faible charge)';
                cpuStatusEl.style.color = '#10b981';
            } else if (cpuPct < 80) {
                cpuStatusEl.innerText = 'Actif (Charge modérée)';
                cpuStatusEl.style.color = '#f59e0b';
            } else {
                cpuStatusEl.innerText = 'Élevé (Attention)';
                cpuStatusEl.style.color = '#ef4444';
            }
        }

        const ramPct = parseFloat(rMem.percent || 0);
        setTxt('render-ram-pct', `${ramPct.toFixed(1)}%`);
        setTxt('render-ram-sub', `${rMem.used_mb || 0} MB / ${rMem.total_mb || 512} MB`);
        setTxt('render-ram-used', `${rMem.used_mb || 0} MB`);
        setTxt('render-ram-free', `${rMem.free_mb || 0} MB`);
        setTxt('render-ram-cgroup', `${rMem.cgroup_used_mb || rMem.used_mb || 0} MB`);
        setProgress('render-ram-bar', ramPct);

        const diskPct = parseFloat(rDisk.percent || 0);
        setTxt('render-disk-pct', `${diskPct.toFixed(1)}%`);
        setTxt('render-disk-sub', `Système hôte conteneur`);
        setTxt('render-disk-used', `${rDisk.used_gb || 0} GB`);
        setTxt('render-disk-free', `${rDisk.free_gb || 0} GB`);
        setTxt('render-disk-total', `${rDisk.total_gb || 0} GB`);
        setProgress('render-disk-bar', diskPct);

        setTxt('render-net-egress', `${rNet.egress_mb || 0} MB`);
        setTxt('render-net-sub', `Ingress : ${rNet.ingress_mb || 0} MB`);
        setTxt('render-net-egress-rate', `${rNet.egress_rate_kbps || 0} KB/s`);
        setTxt('render-net-ingress-rate', `${rNet.ingress_rate_kbps || 0} KB/s`);
        setTxt('render-net-packets', `${rNet.packets_sent || 0} TX / ${rNet.packets_recv || 0} RX`);

        setTxt('render-http-total', String(rApp.total_requests || 0));
        setTxt('render-http-rps', `${rApp.rps || 0} req/s`);
        setTxt('render-http-latency', `${rApp.avg_latency_ms || 0} ms`);
        setTxt('render-http-2xx', String(rApp.status_2xx || 0));
        setTxt('render-http-4xx', String(rApp.status_4xx || 0));
        setTxt('render-http-5xx', String(rApp.status_5xx || 0));

        const aiven = data.aiven || {};
        const aCpu = aiven.cpu_and_activity || {};
        const aMem = aiven.memory_cache || {};
        const aVol = aiven.storage_volume || {};
        const aNet = aiven.networking_io || {};

        setTxt('aiven-meta-version', `PostgreSQL ${aNet.server_version || '18'}`);
        setTxt('aiven-meta-maxconn', `${aCpu.max_connections || 20} max`);
        setTxt('aiven-meta-cache', `${aMem.cache_hit_ratio_percent || 100}%`);

        const connSat = parseFloat(aCpu.connection_saturation_percent || 0);
        setTxt('aiven-conn-saturation', `${connSat.toFixed(1)}%`);
        setTxt('aiven-conn-sub', `${aCpu.current_connections || 0} / ${aCpu.max_connections || 20} connexions`);
        setTxt('aiven-conn-active', String(aCpu.active_queries || 0));
        setTxt('aiven-conn-idle', `${aCpu.idle_connections || 0} (tx: ${aCpu.idle_in_transaction || 0})`);
        setTxt('aiven-commit-ratio', `${aCpu.commit_ratio_percent || 100}%`);
        setProgress('aiven-conn-bar', connSat);

        const cacheRatio = parseFloat(aMem.cache_hit_ratio_percent || 100);
        setTxt('aiven-cache-ratio', `${cacheRatio.toFixed(2)}%`);
        setTxt('aiven-blks-hit', (aMem.blks_hit || 0).toLocaleString('fr-FR'));
        setTxt('aiven-blks-read', (aMem.blks_read || 0).toLocaleString('fr-FR'));
        setTxt('aiven-shared-buf', `${aMem.shared_buffers || '-'} pages`);
        setProgress('aiven-cache-bar', cacheRatio, true);

        setTxt('aiven-db-size', aVol.total_size_pretty || '0 kB');
        setTxt('aiven-temp-files', String(aVol.temp_files || 0));
        setTxt('aiven-temp-bytes', `${((aVol.temp_bytes || 0) / 1024).toFixed(1)} kB`);
        setTxt('aiven-xact-commits', (aCpu.xact_commit || 0).toLocaleString('fr-FR'));

        setTxt('aiven-tup-returned', (aNet.tup_returned || 0).toLocaleString('fr-FR'));
        setTxt('aiven-tup-fetched', (aNet.tup_fetched || 0).toLocaleString('fr-FR'));
        const writesTotal = (aNet.tup_inserted || 0) + (aNet.tup_updated || 0) + (aNet.tup_deleted || 0);
        setTxt('aiven-tup-writes', writesTotal.toLocaleString('fr-FR'));
        setTxt('aiven-deadlocks', `${aNet.deadlocks || 0} (conflits: ${aNet.conflicts || 0})`);

        const tablesBody = document.getElementById('aiven-top-tables-body');
        if (tablesBody && aVol.top_tables && aVol.top_tables.length > 0) {
            const dbTotalBytes = aVol.total_size_bytes || 1;
            tablesBody.innerHTML = aVol.top_tables.map(t => {
                const part = Math.min(100, Math.max(0, ((t.bytes / dbTotalBytes) * 100))).toFixed(1);
                return `
                    <tr>
                        <td style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                            <span style="color: #6366f1;">📄</span> ${escapeHtml(t.name)}
                        </td>
                        <td style="font-weight: 700; color: #10b981;">${escapeHtml(t.pretty_size)}</td>
                        <td style="font-family: ui-monospace, monospace; color: var(--text-secondary); font-size: 13px;">${(t.bytes || 0).toLocaleString('fr-FR')} o</td>
                        <td style="color: var(--text-primary); font-weight: 600;">${(t.rows || 0).toLocaleString('fr-FR')} lignes</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; min-width: 60px;">
                                    <div style="width: ${part}%; height: 100%; background: #6366f1; border-radius: 999px;"></div>
                                </div>
                                <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary); width: 42px;">${part}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    const btnRefreshInfra = document.getElementById('btn-refresh-infra');
    if (btnRefreshInfra) {
        btnRefreshInfra.addEventListener('click', async () => {
            btnRefreshInfra.innerText = '🔄 Actualisation...';
            await loadInfrastructureData();
            btnRefreshInfra.innerText = '🔄 Actualiser';
            showToast('Métriques d\'infrastructure actualisées', 'info');
        });
    }

    /* ===================================================================== */

    let metricsLiveInterval = null;

    function startMetricsLivePolling() {
        if (metricsLiveInterval) clearInterval(metricsLiveInterval);
        loadMetricsData();
        metricsLiveInterval = setInterval(() => {
            const activeTab = localStorage.getItem('admin_active_tab');
            if (activeTab === 'metrics') {
                loadMetricsData();
            } else {
                clearInterval(metricsLiveInterval);
                metricsLiveInterval = null;
            }
        }, 2000);
    }

    function updateCounter(elementId, value) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const newVal = String(value || 0);
        if (el.innerText !== newVal) {
            el.innerText = newVal;
            el.classList.add('counter-pulse');
            setTimeout(() => el.classList.remove('counter-pulse'), 400);
        }
    }

    // [ ADVANCED METRICS CHARTS SYSTEM ] =====================================
    let chartGlobalVolume = null;
    const individualCharts = {};

    const metricsHistory = {
        labels: [],
        totalTraffic: [],
        tgRec: [],
        tgSent: [],
        cmdExec: [],
        sumupRec: [],
        sumupSent: [],
        oxapayRec: [],
        oxapaySent: [],
        adminLogins: [],
        errorsCount: []
    };
    const MAX_HISTORY_POINTS = 15;

    function initMetricsViewMode() {
        const btnCards = document.getElementById('btn-mode-cards');
        const btnCharts = document.getElementById('btn-mode-charts');
        const cardsView = document.getElementById('metrics-cards-view');
        const chartsView = document.getElementById('metrics-charts-view');

        if (!btnCards || !btnCharts || !cardsView || !chartsView) return;

        function setViewMode(mode) {
            localStorage.setItem('metrics_view_mode', mode);
            if (mode === 'cards') {
                cardsView.style.display = 'block';
                chartsView.style.display = 'none';
                btnCards.style.background = 'var(--accent-primary)';
                btnCards.style.color = '#ffffff';
                btnCharts.style.background = 'transparent';
                btnCharts.style.color = 'var(--text-secondary)';
            } else {
                cardsView.style.display = 'none';
                chartsView.style.display = 'grid';
                btnCharts.style.background = 'var(--accent-primary)';
                btnCharts.style.color = '#ffffff';
                btnCards.style.background = 'transparent';
                btnCards.style.color = 'var(--text-secondary)';
            }
        }

        btnCards.addEventListener('click', () => setViewMode('cards'));
        btnCharts.addEventListener('click', () => setViewMode('charts'));

        const savedMode = localStorage.getItem('metrics_view_mode') || 'charts';
        setViewMode(savedMode);
    }

    let selectedTimeframe = 'live';

    function createSparklineChart(canvasId, mainColor, fillHex) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, fillHex);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.02)');

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: metricsHistory.labels,
                datasets: [{
                    label: 'Volume',
                    data: [],
                    borderColor: mainColor,
                    borderWidth: 2.5,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    pointBackgroundColor: mainColor,
                    pointHoverBackgroundColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { 
                        mode: 'index', 
                        intersect: false,
                        padding: 10,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: mainColor,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { color: 'rgba(255, 255, 255, 0.04)' },
                        ticks: { 
                            font: { size: 9 }, 
                            color: '#94a3b8', 
                            maxRotation: 0,
                            maxTicksLimit: 5,
                            autoSkip: true 
                        }
                    },
                    y: {
                        display: true,
                        grid: { color: 'rgba(255, 255, 255, 0.04)' },
                        beginAtZero: true,
                        suggestedMax: 5,
                        ticks: { font: { size: 9 }, color: '#94a3b8', precision: 0 }
                    }
                }
            }
        });
    }

    function initMetricsCharts() {
        if (typeof Chart === 'undefined') return;

        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

        const ctxGlobal = document.getElementById('chart-global-volume')?.getContext('2d');
        if (ctxGlobal && !chartGlobalVolume) {
            const gradGlobal = ctxGlobal.createLinearGradient(0, 0, 0, 240);
            gradGlobal.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
            gradGlobal.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

            chartGlobalVolume = new Chart(ctxGlobal, {
                type: 'line',
                data: {
                    labels: metricsHistory.labels,
                    datasets: [
                        { 
                            label: 'Volume Réseau Global', 
                            data: metricsHistory.totalTraffic, 
                            borderColor: '#6366f1', 
                            backgroundColor: gradGlobal, 
                            fill: true, 
                            tension: 0.1, 
                            borderWidth: 3,
                            pointBackgroundColor: '#818cf8',
                            pointRadius: 3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12, padding: 16 } },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
                    }
                }
            });
        }

        if (!individualCharts.tgRec) individualCharts.tgRec = createSparklineChart('chart-tg-rec', '#06b6d4', 'rgba(6, 182, 212, 0.35)');
        if (!individualCharts.tgSent) individualCharts.tgSent = createSparklineChart('chart-tg-sent', '#a855f7', 'rgba(168, 85, 247, 0.35)');
        if (!individualCharts.cmdExec) individualCharts.cmdExec = createSparklineChart('chart-commands-exec', '#10b981', 'rgba(16, 185, 129, 0.35)');
        if (!individualCharts.sumupRec) individualCharts.sumupRec = createSparklineChart('chart-sumup-rec', '#3b82f6', 'rgba(59, 130, 246, 0.35)');
        if (!individualCharts.sumupSent) individualCharts.sumupSent = createSparklineChart('chart-sumup-sent', '#38bdf8', 'rgba(56, 189, 248, 0.35)');
        if (!individualCharts.oxapayRec) individualCharts.oxapayRec = createSparklineChart('chart-oxapay-rec', '#f59e0b', 'rgba(245, 158, 11, 0.35)');
        if (!individualCharts.oxapaySent) individualCharts.oxapaySent = createSparklineChart('chart-oxapay-sent', '#f97316', 'rgba(249, 115, 22, 0.35)');
        if (!individualCharts.adminLogins) individualCharts.adminLogins = createSparklineChart('chart-admin-logins', '#8b5cf6', 'rgba(139, 92, 246, 0.35)');
        if (!individualCharts.errorsCount) individualCharts.errorsCount = createSparklineChart('chart-errors-count', '#ef4444', 'rgba(239, 68, 68, 0.35)');

        const segmentedBar = document.getElementById('timeframe-segmented-bar');
        const customContainer = document.getElementById('custom-date-picker-container');
        const startDateInput = document.getElementById('chart-start-date');
        const endDateInput = document.getElementById('chart-end-date');
        const applyCustomBtn = document.getElementById('btn-apply-custom-date');

        if (segmentedBar && !segmentedBar.dataset.initialized) {
            segmentedBar.dataset.initialized = 'true';
            
            const todayStr = new Date().toISOString().split('T')[0];
            const past7Str = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
            if (startDateInput) startDateInput.value = past7Str;
            if (endDateInput) endDateInput.value = todayStr;

            const buttons = segmentedBar.querySelectorAll('.timeframe-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', async () => {
                    buttons.forEach(b => {
                        b.style.background = 'transparent';
                        b.style.color = 'var(--text-secondary)';
                        b.classList.remove('active');
                    });
                    btn.style.background = 'var(--accent-primary)';
                    btn.style.color = '#ffffff';
                    btn.classList.add('active');

                    selectedTimeframe = btn.dataset.value;
                    if (customContainer) {
                        customContainer.style.display = selectedTimeframe === 'custom' ? 'flex' : 'none';
                    }
                    if (selectedTimeframe === 'custom') {
                        await fetchAndRenderCustomStats();
                    } else if (lastStatsResponse) {
                        renderMainVolumeChart(lastStatsResponse);
                    }
                });
            });

            if (applyCustomBtn) {
                applyCustomBtn.addEventListener('click', async () => {
                    await fetchAndRenderCustomStats();
                });
            }
        }
    }

    async function fetchAndRenderCustomStats() {
        const sDate = document.getElementById('chart-start-date')?.value || '';
        const eDate = document.getElementById('chart-end-date')?.value || '';
        if (!sDate || !eDate) return;
        const res = await apiRequest(`/stats?startDate=${sDate}&endDate=${eDate}`);
        if (res && res.history) {
            lastStatsResponse = res;
            renderMainVolumeChart(res);
        }
    }

    let lastStatsResponse = null;

    function renderMainVolumeChart() {
        if (!chartGlobalVolume) return;
        const subTitle = document.getElementById('main-chart-subtitle');

        chartGlobalVolume.data.labels = [...metricsHistory.labels];
        chartGlobalVolume.data.datasets[0].data = [...metricsHistory.totalTraffic];
        chartGlobalVolume.data.datasets[0].label = 'Volume Réseau Global (En Direct)';
        if (subTitle) subTitle.textContent = "Évolution globale du trafic et des requêtes réseau en temps réel";

        chartGlobalVolume.update('none');
    }

    function updateChartsWithMetrics(m, totalTraffic, stats) {
        initMetricsCharts();
        initMetricsViewMode();
        lastStatsResponse = stats;

        const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        if (metricsHistory.labels.length === 0) {
            const now = new Date();
            for (let i = 9; i >= 0; i--) {
                const pastTime = new Date(now.getTime() - i * 2000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                metricsHistory.labels.push(pastTime);
                metricsHistory.totalTraffic.push(totalTraffic || 0);
                metricsHistory.tgRec.push(m.telegramReceived || 0);
                metricsHistory.tgSent.push(m.telegramSent || 0);
                metricsHistory.cmdExec.push(m.commandsExecuted || 0);
                metricsHistory.sumupRec.push(m.sumupReceived || 0);
                metricsHistory.sumupSent.push(m.sumupSent || 0);
                metricsHistory.oxapayRec.push(m.oxapayReceived || 0);
                metricsHistory.oxapaySent.push(m.oxapaySent || 0);
                metricsHistory.adminLogins.push(m.adminLogins || 0);
                metricsHistory.errorsCount.push(m.errorsCount || 0);
            }
        } else {
            if (metricsHistory.labels.length >= 10) {
                metricsHistory.labels.shift();
                metricsHistory.totalTraffic.shift();
                metricsHistory.tgRec.shift();
                metricsHistory.tgSent.shift();
                metricsHistory.cmdExec.shift();
                metricsHistory.sumupRec.shift();
                metricsHistory.sumupSent.shift();
                metricsHistory.oxapayRec.shift();
                metricsHistory.oxapaySent.shift();
                metricsHistory.adminLogins.shift();
                metricsHistory.errorsCount.shift();
            }
            metricsHistory.labels.push(nowTime);
            metricsHistory.totalTraffic.push(totalTraffic || 0);
            metricsHistory.tgRec.push(m.telegramReceived || 0);
            metricsHistory.tgSent.push(m.telegramSent || 0);
            metricsHistory.cmdExec.push(m.commandsExecuted || 0);
            metricsHistory.sumupRec.push(m.sumupReceived || 0);
            metricsHistory.sumupSent.push(m.sumupSent || 0);
            metricsHistory.oxapayRec.push(m.oxapayReceived || 0);
            metricsHistory.oxapaySent.push(m.oxapaySent || 0);
            metricsHistory.adminLogins.push(m.adminLogins || 0);
            metricsHistory.errorsCount.push(m.errorsCount || 0);
        }

        renderMainVolumeChart(stats);

        updateCounter('chart-val-tg-rec', m.telegramReceived);
        updateCounter('chart-val-tg-sent', m.telegramSent);
        updateCounter('chart-val-commands-exec', m.commandsExecuted);
        updateCounter('chart-val-sumup-rec', m.sumupReceived);
        updateCounter('chart-val-sumup-sent', m.sumupSent);
        updateCounter('chart-val-oxapay-rec', m.oxapayReceived);
        updateCounter('chart-val-oxapay-sent', m.oxapaySent);
        updateCounter('chart-val-admin-logins', m.adminLogins);
        updateCounter('chart-val-errors-count', m.errorsCount);

        const updateSpark = (chartObj, dataArr) => {
            if (chartObj) {
                chartObj.data.labels = metricsHistory.labels;
                chartObj.data.datasets[0].data = dataArr;
                chartObj.update('none');
            }
        };

        updateSpark(individualCharts.tgRec, metricsHistory.tgRec);
        updateSpark(individualCharts.tgSent, metricsHistory.tgSent);
        updateSpark(individualCharts.cmdExec, metricsHistory.cmdExec);
        updateSpark(individualCharts.sumupRec, metricsHistory.sumupRec);
        updateSpark(individualCharts.sumupSent, metricsHistory.sumupSent);
        updateSpark(individualCharts.oxapayRec, metricsHistory.oxapayRec);
        updateSpark(individualCharts.oxapaySent, metricsHistory.oxapaySent);
        updateSpark(individualCharts.adminLogins, metricsHistory.adminLogins);
        updateSpark(individualCharts.errorsCount, metricsHistory.errorsCount);
    }

    async function loadMetricsData() {
        const stats = await apiRequest('/stats');
        if (!stats || !stats.metrics) return;

        const m = stats.metrics;
        updateCounter('metric-tg-rec', m.telegramReceived);
        updateCounter('metric-tg-sent', m.telegramSent);
        updateCounter('metric-sumup-rec', m.sumupReceived);
        updateCounter('metric-sumup-sent', m.sumupSent);
        updateCounter('metric-oxapay-rec', m.oxapayReceived);
        updateCounter('metric-oxapay-sent', m.oxapaySent);
        updateCounter('metric-commands-exec', m.commandsExecuted);
        updateCounter('metric-errors-count', m.errorsCount);
        updateCounter('metric-admin-logins', m.adminLogins);

        const totalTraffic = (m.telegramReceived || 0) + (m.telegramSent || 0) + (m.sumupReceived || 0) + (m.sumupSent || 0) + (m.oxapayReceived || 0) + (m.oxapaySent || 0);
        updateCounter('metric-total-traffic', totalTraffic);

        updateChartsWithMetrics(m, totalTraffic, stats);
    }

    const resetMetricsBtn = document.getElementById('reset-metrics-btn');
    if (resetMetricsBtn) {
        resetMetricsBtn.addEventListener('click', () => {
            openModal(
                '🧹 Réinitialiser les compteurs',
                '<p>Êtes-vous sûr de vouloir réinitialiser l\'intégralité des compteurs de métriques et de statistiques à 0 ?</p><p style="color: var(--text-secondary); font-size: 13px; margin-top: 8px;">Cette action effacera l\'historique enregistré en BDD et remettra les valeurs à zéro.</p>',
                async () => {
                    closeModal();
                    const res = await apiRequest('/metrics/reset', 'POST');
                    if (res && res.success) {
                        showToast('Compteurs réinitialisés à 0', 'success');
                        metricsHistory.labels.length = 0;
                        metricsHistory.tgRec.length = 0;
                        metricsHistory.tgSent.length = 0;
                        metricsHistory.cmdExec.length = 0;
                        metricsHistory.sumupRec.length = 0;
                        metricsHistory.oxapaySent.length = 0;
                        metricsHistory.errorsCount.length = 0;
                        await loadMetricsData();
                    } else {
                        showToast('Erreur lors de la réinitialisation', 'error');
                    }
                }
            );
        });
    }

    let audiencePollTimer = null;
    let isAudienceScanning = false;

    async function loadAudienceData() {
        const data = await apiRequest('/audience');
        if (!data) return;

        const elTotal = document.getElementById('aud-stat-total');
        const elReachable = document.getElementById('aud-stat-reachable');
        const elPct = document.getElementById('aud-stat-pct');
        const elUnreachable = document.getElementById('aud-stat-unreachable');
        const elPending = document.getElementById('aud-stat-pending');
        const elStatusText = document.getElementById('aud-scan-status-text');
        const elProgressText = document.getElementById('aud-scan-progress-text');
        const elBar = document.getElementById('aud-progress-bar-fill');
        const elBadge = document.getElementById('audience-bot-badge');
        const btnBatch = document.getElementById('btn-scan-audience-batch');
        const btnAll = document.getElementById('btn-scan-audience-all');

        if (elBadge && data.bot_username) {
            elBadge.innerText = `@${data.bot_username}`;
        }
        if (elTotal) elTotal.innerText = String(data.total_users || 0);
        if (elReachable) elReachable.innerText = String(data.reachable_count || 0);
        if (elPct) elPct.innerText = `${data.reachable_percent || 0}% de l'audience`;
        if (elUnreachable) elUnreachable.innerText = String((data.unreachable_count || 0) + (data.blocked_count || 0));
        if (elPending) elPending.innerText = String(data.pending_count || 0);

        const wasScanning = isAudienceScanning;
        isAudienceScanning = !!data.is_scanning;

        if (isAudienceScanning) {
            if (btnBatch) btnBatch.disabled = true;
            if (btnAll) btnAll.disabled = true;

            const prog = data.scan_progress || {};
            const scanned = prog.scanned || 0;
            const total = prog.total || 1;
            const pct = Math.min(100, Math.round((scanned / total) * 100));

            if (elStatusText) {
                elStatusText.innerText = `Audit en cours... ${scanned}/${total} audités (${prog.found_reachable || 0} joignables, ${prog.found_unreachable || 0} non migrés)`;
            }
            if (elProgressText) elProgressText.innerText = `${pct}%`;
            if (elBar) elBar.style.width = `${pct}%`;

            clearTimeout(audiencePollTimer);
            audiencePollTimer = setTimeout(loadAudienceData, 1500);
        } else {
            if (btnBatch) btnBatch.disabled = false;
            if (btnAll) btnAll.disabled = false;

            const total = data.total_users || 1;
            const pending = data.pending_count || 0;
            const audited = total - pending;
            const coveragePct = Math.min(100, Math.round((audited / total) * 100));

            if (elStatusText) {
                elStatusText.innerText = pending > 0 
                    ? `Audit partiel : ${audited}/${total} audités (${pending} en attente)` 
                    : `Audit complet : tous les utilisateurs ont été vérifiés`;
            }
            if (elProgressText) elProgressText.innerText = `${coveragePct}%`;
            if (elBar) elBar.style.width = `${coveragePct}%`;

            if (wasScanning) {
                showToast('Audit d\'audience terminé avec succès', 'success');
                const usersData = await apiRequest('/users');
                if (usersData && usersData.users) {
                    allUsers = usersData.users;
                    applyUsersFilterAndSort();
                }
            }
        }
    }

    async function triggerAudienceScan(batchSize = 50) {
        if (isAudienceScanning) return;
        const btnBatch = document.getElementById('btn-scan-audience-batch');
        const btnAll = document.getElementById('btn-scan-audience-all');
        if (btnBatch) btnBatch.disabled = true;
        if (btnAll) btnAll.disabled = true;

        showToast(batchSize === 0 ? 'Démarrage du scan global...' : `Scan silencieux de ${batchSize} utilisateurs lancé...`, 'info');
        const res = await apiRequest(`/audience/scan?batch_size=${batchSize}`, 'POST');
        if (res && res.success) {
            isAudienceScanning = true;
            loadAudienceData();
        } else {
            if (btnBatch) btnBatch.disabled = false;
            if (btnAll) btnAll.disabled = false;
            showToast('Impossible de démarrer le scan', 'danger');
        }
    }

    function initAudienceControls() {
        const btnBatch = document.getElementById('btn-scan-audience-batch');
        if (btnBatch && !btnBatch.dataset.bound) {
            btnBatch.dataset.bound = 'true';
            btnBatch.addEventListener('click', () => triggerAudienceScan(50));
        }

        const btnAll = document.getElementById('btn-scan-audience-all');
        if (btnAll && !btnAll.dataset.bound) {
            btnAll.dataset.bound = 'true';
            btnAll.addEventListener('click', () => {
                openModal('Confirmer le scan complet', `
                    <p style="margin-bottom: 12px; color: var(--text-secondary);">
                        Vous êtes sur le point de scanner l'ensemble des utilisateurs non encore audités.<br><br>
                        • Totalement silencieux (0 message envoyé).<br>
                        • Vitesse régulée : 4 requêtes / seconde.<br>
                        • Le scan continuera en tâche de fond sur le serveur.
                    </p>
                `, () => triggerAudienceScan(0));
            });
        }

        const btnReset = document.getElementById('btn-reset-audience');
        if (btnReset && !btnReset.dataset.bound) {
            btnReset.dataset.bound = 'true';
            btnReset.addEventListener('click', () => {
                openModal('Réinitialiser l\'audit d\'audience', `
                    <p style="margin-bottom: 12px; color: var(--text-secondary);">
                        Voulez-vous réinitialiser tous les statuts d'audience en <strong>En attente</strong> ?
                    </p>
                `, async () => {
                    const res = await apiRequest('/audience/reset', 'POST');
                    if (res && res.success) {
                        showToast('Audit réinitialisé', 'success');
                        loadAudienceData();
                        loadUsersData();
                    }
                });
            });
        }
    }

    let allUsers = [];
    let userSortField = 'userNumber';
    let userSortDir = 'asc';
    let usersCurrentPage = 1;
    let usersPerPage = 10;

    async function loadUsersData() {
        initAudienceControls();
        loadAudienceData();
        const data = await apiRequest('/users');
        if (!data) return;

        allUsers = data.users || [];
        applyUsersFilterAndSort();
    }

    function applyUsersFilterAndSort() {
        const searchInput = document.getElementById('user-search-input');
        const clearBtn = document.getElementById('user-search-clear');
        const q = searchInput ? searchInput.value.trim().toLowerCase() : '';

        if (clearBtn) {
            clearBtn.style.display = q ? 'block' : 'none';
        }

        let filtered = allUsers.filter(u => {
            if (!q) return true;
            return String(u.id).includes(q) ||
                   String(u.userNumber).includes(q) ||
                   (u.username && u.username.toLowerCase().includes(q)) ||
                   (u.reachableStatus && u.reachableStatus.toLowerCase().includes(q)) ||
                   String(u.solde).includes(q) ||
                   (u.banReason && u.banReason.toLowerCase().includes(q));
        });

        filtered.sort((a, b) => {
            let valA = a[userSortField];
            let valB = b[userSortField];

            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            const numA = Number(valA);
            const numB = Number(valB);
            if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                return userSortDir === 'asc' ? numA - numB : numB - numA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            if (strA < strB) return userSortDir === 'asc' ? -1 : 1;
            if (strA > strB) return userSortDir === 'asc' ? 1 : -1;
            return 0;
        });

        document.querySelectorAll('.sortable-th').forEach(th => {
            const field = th.getAttribute('data-sort');
            const arrowSpan = th.querySelector('.sort-arrow');
            if (arrowSpan) {
                if (field === userSortField) {
                    arrowSpan.innerText = userSortDir === 'asc' ? '▲' : '▼';
                    th.style.color = 'var(--accent-primary)';
                } else {
                    arrowSpan.innerText = '↕';
                    th.style.color = '';
                }
            }
        });

        const totalItems = filtered.length;
        let perPage = usersPerPage === 'all' ? totalItems : parseInt(usersPerPage) || 10;
        if (perPage <= 0) perPage = 10;

        const totalPages = Math.ceil(totalItems / perPage) || 1;
        if (usersCurrentPage > totalPages) usersCurrentPage = totalPages;
        if (usersCurrentPage < 1) usersCurrentPage = 1;

        const startIdx = (usersCurrentPage - 1) * perPage;
        const endIdx = usersPerPage === 'all' ? totalItems : Math.min(startIdx + perPage, totalItems);
        const pageItems = filtered.slice(startIdx, endIdx);

        const infoElem = document.getElementById('users-pagination-info');
        if (infoElem) {
            infoElem.innerText = totalItems > 0 
                ? `Affichage ${startIdx + 1}-${endIdx} sur ${totalItems} utilisateur(s)`
                : `Aucun utilisateur trouvé`;
        }

        const pageIndicator = document.getElementById('users-page-indicator');
        if (pageIndicator) {
            pageIndicator.innerText = `Page ${usersCurrentPage} / ${totalPages}`;
        }

        const btnPrev = document.getElementById('btn-users-prev');
        const btnNext = document.getElementById('btn-users-next');
        if (btnPrev) btnPrev.disabled = usersCurrentPage <= 1;
        if (btnNext) btnNext.disabled = usersCurrentPage >= totalPages;

        renderUsersTable(pageItems);
    }

    function renderUsersTable(users) {
        const tbody = document.getElementById('users-table');
        tbody.innerHTML = '';
        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 24px;">Aucun utilisateur trouvé.</td></tr>`;
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'context-menu';
            const statusBadge = user.isBanned 
                ? `<span class="badge badge-danger">Banni</span>` 
                : `<span class="badge badge-success">Actif</span>`;
            
            const unameBadge = user.username 
                ? `<span style="color: #6366f1; font-weight: 600;">${escapeHtml(user.username)}</span>` 
                : `<span style="color: var(--text-secondary); font-style: italic; opacity: 0.6;">-</span>`;

            let audienceBadge = '<span class="badge" style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3);">⏳ En attente</span>';
            if (user.reachableStatus === 'REACHABLE') {
                audienceBadge = '<span class="badge badge-success" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">🟢 Joignable</span>';
            } else if (user.reachableStatus === 'UNREACHABLE') {
                audienceBadge = '<span class="badge badge-danger" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">🔴 Non Migré</span>';
            } else if (user.reachableStatus === 'BLOCKED') {
                audienceBadge = '<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">🚫 Bloqué</span>';
            }

            const idHtml = user.isAdmin 
                ? `<code style="color: #ef4444; font-weight: 700; background: rgba(239, 68, 68, 0.18); border: 1px solid rgba(239, 68, 68, 0.4); padding: 2px 8px; border-radius: 4px;">${user.id} 👑 ADMIN</code>` 
                : `<code>${user.id}</code>`;

            tr.innerHTML = `
                <td><span class="badge badge-info" style="font-weight: 700; background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);">#${user.userNumber || '?'}</span></td>
                <td>${idHtml}</td>
                <td>${unameBadge}</td>
                <td>${audienceBadge}</td>
                <td><strong>${user.solde.toFixed(2)} €</strong></td>
                <td>${user.achats}</td>
                <td>${statusBadge}</td>
                <td>${user.banReason ? escapeHtml(user.banReason) : '-'}</td>
                <td>
                    <button class="action-btn" onclick="btnEditSolde('${user.id}', ${user.solde})">💳 Solde</button>
                    ${user.isBanned 
                        ? `<button class="action-btn action-btn-danger" onclick="btnDebanUser('${user.id}')">Débannir</button>` 
                        : `<button class="action-btn action-btn-danger" onclick="btnBanUser('${user.id}')">Bannir</button>`}
                    <button class="action-btn action-btn-danger" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);" onclick="btnDeleteUser('${user.id}')">🗑️ Supprimer</button>
                </td>
            `;

            tr.addEventListener('contextmenu', (e) => {
                showDynamicContextMenu(e, [
                    { label: '💳 Modifier le Solde', action: () => btnEditSolde(user.id, user.solde) },
                    { label: user.isBanned ? '🔓 Débannir l\'Utilisateur' : '🚫 Bannir l\'Utilisateur', action: () => user.isBanned ? btnDebanUser(user.id) : btnBanUser(user.id) },
                    { divider: true },
                    { label: '📋 Copier l\'ID Telegram', action: () => { navigator.clipboard.writeText(String(user.id)); showToast(`ID ${user.id} copié !`, 'info'); } },
                    { label: '💬 Copier le Username', action: () => { if (user.username) { navigator.clipboard.writeText(user.username); showToast(`@${user.username} copié !`, 'info'); } else showToast('Aucun username à copier', 'warning'); } },
                    { divider: true },
                    { label: '🛒 Historique des Achats', action: () => window.filterTransactionsByUser(user.id) },
                    { label: '💰 Historique des Rechargements', action: () => window.filterPaymentsByUser(user.id) },
                    { divider: true },
                    { label: '🗑️ Supprimer l\'Utilisateur', danger: true, action: () => btnDeleteUser(user.id) }
                ]);
            });
            tbody.appendChild(tr);
        });
    }

    // [ DYNAMIC CONTEXT MENU SYSTEM ] ========================================
    const ctxMenu = document.getElementById('custom-context-menu');

    function showDynamicContextMenu(e, items) {
        e.preventDefault();
        e.stopPropagation();
        if (!ctxMenu) return;

        ctxMenu.innerHTML = '';
        items.forEach(item => {
            if (item.divider) {
                const div = document.createElement('div');
                div.className = 'context-menu-divider';
                ctxMenu.appendChild(div);
            } else {
                const div = document.createElement('div');
                div.className = `context-menu-item ${item.danger ? 'danger' : ''}`;
                div.innerHTML = item.label;
                div.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    hideContextMenu();
                    if (item.action) item.action();
                });
                ctxMenu.appendChild(div);
            }
        });

        ctxMenu.style.display = 'block';

        let x = e.pageX;
        let y = e.pageY;
        const menuWidth = 240;
        const menuHeight = ctxMenu.offsetHeight || 260;

        if (x + menuWidth > window.innerWidth + window.scrollX) {
            x = window.innerWidth + window.scrollX - menuWidth - 10;
        }
        if (y + menuHeight > window.innerHeight + window.scrollY) {
            y = window.innerHeight + window.scrollY - menuHeight - 10;
        }

        ctxMenu.style.left = `${Math.max(10, x)}px`;
        ctxMenu.style.top = `${Math.max(10, y)}px`;
    }

    function hideContextMenu() {
        if (ctxMenu) ctxMenu.style.display = 'none';
    }

    document.addEventListener('click', hideContextMenu);
    document.addEventListener('scroll', hideContextMenu);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideContextMenu();
    });

    // Attach Event Listeners for Search, Clear, Sorting & Pagination
    const searchInputElem = document.getElementById('user-search-input');
    if (searchInputElem) {
        searchInputElem.addEventListener('input', () => {
            usersCurrentPage = 1;
            applyUsersFilterAndSort();
        });
    }

    const clearBtnElem = document.getElementById('user-search-clear');
    if (clearBtnElem) {
        clearBtnElem.addEventListener('click', () => {
            if (searchInputElem) searchInputElem.value = '';
            usersCurrentPage = 1;
            applyUsersFilterAndSort();
        });
    }

    document.querySelectorAll('.sortable-th').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.getAttribute('data-sort');
            if (userSortField === field) {
                userSortDir = userSortDir === 'asc' ? 'desc' : 'asc';
            } else {
                userSortField = field;
                userSortDir = 'asc';
            }
            applyUsersFilterAndSort();
        });
    });

    const perPageSelect = document.getElementById('users-per-page-select');
    if (perPageSelect) {
        perPageSelect.addEventListener('change', (e) => {
            usersPerPage = e.target.value;
            usersCurrentPage = 1;
            applyUsersFilterAndSort();
        });
    }

    const btnPrevElem = document.getElementById('btn-users-prev');
    if (btnPrevElem) {
        btnPrevElem.addEventListener('click', () => {
            if (usersCurrentPage > 1) {
                usersCurrentPage--;
                applyUsersFilterAndSort();
            }
        });
    }

    const btnNextElem = document.getElementById('btn-users-next');
    if (btnNextElem) {
        btnNextElem.addEventListener('click', () => {
            usersCurrentPage++;
            applyUsersFilterAndSort();
        });
    }

    const btnSyncElem = document.getElementById('btn-sync-usernames');
    if (btnSyncElem) {
        btnSyncElem.addEventListener('click', async () => {
            const listToSync = (allUsers || []).filter(u => !u.username || u.username.trim() === '' || u.username === 'N/A');
            const targetList = listToSync.length > 0 ? listToSync : (allUsers || []);

            if (targetList.length === 0) {
                showToast('Aucun utilisateur à synchroniser', 'info');
                return;
            }

            const modalHtml = `
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 13px; font-weight: 600;">
                        <span>Progression de la synchronisation</span>
                        <span id="sync-progress-text">0 / ${targetList.length} (0%)</span>
                    </div>
                    <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden;">
                        <div id="sync-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); transition: width 0.2s ease;"></div>
                    </div>
                </div>
                <div id="sync-log-box" style="background: #090d16; border: 1px solid rgba(255,255,255,0.1); font-family: monospace; font-size: 12px; color: #10b981; padding: 12px; height: 220px; overflow-y: auto; border-radius: 8px; line-height: 1.5; white-space: pre-wrap;">
                </div>
            `;

            openModal('Synchronisation des Pseudos Telegram', modalHtml, null);

            const modalCancelBtn = document.getElementById('modal-cancel-btn');
            if (modalCancelBtn) modalCancelBtn.style.display = 'none';

            const logBox = document.getElementById('sync-log-box');
            const progressBar = document.getElementById('sync-progress-bar');
            const progressText = document.getElementById('sync-progress-text');

            const addLog = (msg, color = '#10b981') => {
                if (!logBox) return;
                const time = new Date().toLocaleTimeString();
                const div = document.createElement('div');
                div.style.color = color;
                div.textContent = `[${time}] ${msg}`;
                logBox.appendChild(div);
                logBox.scrollTop = logBox.scrollHeight;
            };

            addLog(`Démarrage de la synchronisation pour ${targetList.length} utilisateur(s)...`, '#3b82f6');

            let processed = 0;
            let successCount = 0;

            for (const user of targetList) {
                try {
                    const res = await apiRequest('/users/sync-user', 'POST', { userId: user.id });
                    processed++;
                    const pct = Math.round((processed / targetList.length) * 100);
                    if (progressBar) progressBar.style.width = `${pct}%`;
                    if (progressText) progressText.textContent = `${processed} / ${targetList.length} (${pct}%)`;

                    if (res && res.success) {
                        if (res.username && res.username !== 'N/A') {
                            successCount++;
                            addLog(`User ${user.id} -> ${res.username} (${res.message})`, '#10b981');
                        } else {
                            addLog(`User ${user.id} -> ${res.message}`, '#f59e0b');
                        }
                    } else {
                        addLog(`User ${user.id} -> Échec (${res ? res.message : 'Erreur réseau'})`, '#ef4444');
                    }
                } catch (err) {
                    processed++;
                    addLog(`User ${user.id} -> Erreur: ${err.message}`, '#ef4444');
                }
            }

            addLog(`Synchronisation terminée ! ${successCount} pseudo(s) récupéré(s).`, '#3b82f6');
            showToast('Synchronisation terminée', 'success');
            loadUsersData();

            if (modalCancelBtn) {
                modalCancelBtn.style.display = 'inline-block';
                modalCancelBtn.textContent = 'Fermer';
            }
        });
    }

    window.btnDeleteUser = (userId) => {
        openModal(`Supprimer ${userId}`, `<p style="color: var(--text-secondary);">Êtes-vous sûr de vouloir <strong>supprimer définitivement</strong> l'utilisateur <code>${userId}</code> ?<br><br><span style="color:#ef4444; font-size:13px; font-weight:600;">⚠️ Cette action effacera toutes ses données comme s'il n'avait jamais rejoint le bot.</span></p>`, async () => {
            const res = await apiRequest('/users/delete', 'POST', { userId: parseInt(userId) });
            if (res && res.success) {
                showToast('Utilisateur supprimé définitivement', 'success');
                loadUsersData();
            } else {
                showToast('Erreur lors de la suppression', 'danger');
            }
        });
    };

    window.btnEditSolde = (userId, currentSolde) => {
        const html = `
            <p style="margin-bottom: 12px; color: var(--text-secondary);">Modifier le solde de l'utilisateur <code>${userId}</code> (Solde actuel: ${currentSolde}€) :</p>
            <div class="form-group">
                <label class="form-label">Action</label>
                <select id="modal-solde-action" class="form-input">
                    <option value="add">Ajouter (+)</option>
                    <option value="remove">Retirer (-)</option>
                    <option value="set">Définir un solde fixe (=)</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Montant (€)</label>
                <input type="number" step="0.1" id="modal-solde-amount" class="form-input" placeholder="Ex: 10" required>
            </div>
            <div style="margin-top: 10px;">
                <button type="button" style="width: 100%; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 8px 12px; font-size: 13px; font-weight: 600; cursor: pointer;" onclick="document.getElementById('modal-solde-action').value='set'; document.getElementById('modal-solde-amount').value='0';">🗑️ Remettre le solde à 0€</button>
            </div>
        `;
        openModal(`Gestion Solde ${userId}`, html, async () => {
            const act = document.getElementById('modal-solde-action').value;
            const amt = parseFloat(document.getElementById('modal-solde-amount').value);
            if (isNaN(amt) || amt < 0) {
                showToast('Montant invalide (doit être supérieur ou égal à 0)', 'danger');
                return;
            }
            const res = await apiRequest('/users/solde', 'POST', { userId, action: act, amount: amt });
            if (res && res.success) {
                showToast('Solde mis à jour avec succès', 'success');
                loadUsersData();
            }
        });
    };

    window.btnBanUser = (userId) => {
        const html = `
            <p style="margin-bottom: 12px; color: var(--text-secondary);">Bannir l'utilisateur <code>${userId}</code> :</p>
            <div class="form-group">
                <label class="form-label">Raison du bannissement (Optionnel)</label>
                <input type="text" id="modal-ban-reason" class="form-input" placeholder="Ex: Spam / Arnaque">
            </div>
        `;
        openModal(`Bannir ${userId}`, html, async () => {
            const reason = document.getElementById('modal-ban-reason').value.trim();
            const res = await apiRequest('/users/ban', 'POST', { userId, ban: true, reason });
            if (res && res.success) {
                showToast('Utilisateur banni', 'success');
                loadUsersData();
            }
        });
    };

    window.btnDebanUser = (userId) => {
        openModal(`Débannir ${userId}`, `<p>Confirmer le débannissement de l'utilisateur <code>${userId}</code> ?</p>`, async () => {
            const res = await apiRequest('/users/ban', 'POST', { userId, ban: false });
            if (res && res.success) {
                showToast('Utilisateur débanni', 'success');
                loadUsersData();
            }
        });
    };

    // [ STOCK PAGINATION LOGIC ] =============================================
    let rawStockData = [];
    let stockCurrentPage = 1;
    let stockPerPage = '10';
    let currentStockSortField = 'id';
    let currentStockSortDir = 'desc';

    async function loadStockData() {
        const data = await apiRequest('/stock');
        if (!data) return;
        rawStockData = data.stock || [];
        stockCurrentPage = 1;
        initStockListeners();
        applyStockPagination();
    }

    function initStockListeners() {
        const searchInput = document.getElementById('stock-search-input');
        const clearBtn = document.getElementById('stock-search-clear');

        if (searchInput && !searchInput.dataset.initialized) {
            searchInput.dataset.initialized = 'true';
            searchInput.addEventListener('input', () => {
                stockCurrentPage = 1;
                applyStockPagination();
            });
        }

        if (clearBtn && !clearBtn.dataset.initialized) {
            clearBtn.dataset.initialized = 'true';
            clearBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                stockCurrentPage = 1;
                applyStockPagination();
            });
        }

        const btnClear = document.getElementById('btn-clear-stock');
        if (btnClear && !btnClear.dataset.initialized) {
            btnClear.dataset.initialized = 'true';
            btnClear.addEventListener('click', () => {
                openModal('Vider le Stock Carrefour', '<p>Êtes-vous sûr de vouloir <strong>SUPPRIMER TOUTES LES CARTES</strong> du stock Carrefour ?<br><br><span style="color: var(--text-secondary);">Cette action est définitive et irréversible.</span></p>', async () => {
                    const res = await apiRequest('/stock/clear', 'POST', { brand: 'carr' });
                    if (res && res.success) {
                        showToast(`🗑️ Stock Carrefour entièrement vidé (${res.count || 0} carte(s) supprimée(s)) !`, 'success');
                        loadStockData();
                    }
                });
            });
        }

        document.querySelectorAll('.sortable-th[data-table="stock"]').forEach(th => {
            if (!th.dataset.initialized) {
                th.dataset.initialized = 'true';
                th.addEventListener('click', () => {
                    const sortField = th.dataset.sort;
                    if (currentStockSortField === sortField) {
                        currentStockSortDir = currentStockSortDir === 'asc' ? 'desc' : 'asc';
                    } else {
                        currentStockSortField = sortField;
                        currentStockSortDir = 'asc';
                    }
                    applyStockPagination();
                });
            }
        });
    }

    function applyStockPagination() {
        const searchInput = document.getElementById('stock-search-input');
        const clearBtn = document.getElementById('stock-search-clear');
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

        let filtered = rawStockData.filter(item => {
            if (!query) return true;
            return String(item.id || '').toLowerCase().includes(query) ||
                   String(item.code || '').toLowerCase().includes(query) ||
                   String(item.pin || '').toLowerCase().includes(query) ||
                   String(item.value || '').toLowerCase().includes(query) ||
                   String(item.price || '').toLowerCase().includes(query);
        });

        filtered.sort((a, b) => {
            let valA = a[currentStockSortField === 'valeur' ? 'value' : currentStockSortField];
            let valB = b[currentStockSortField === 'valeur' ? 'value' : currentStockSortField];
            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            const numA = Number(valA);
            const numB = Number(valB);
            if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                return currentStockSortDir === 'asc' ? numA - numB : numB - numA;
            }
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            if (strA < strB) return currentStockSortDir === 'asc' ? -1 : 1;
            if (strA > strB) return currentStockSortDir === 'asc' ? 1 : -1;
            return 0;
        });

        ['id', 'code', 'pin', 'valeur', 'price'].forEach(field => {
            const arrowEl = document.getElementById(`sort-arrow-stock-${field}`);
            if (arrowEl) {
                if (field === currentStockSortField) {
                    arrowEl.innerText = currentStockSortDir === 'asc' ? '▲' : '▼';
                    arrowEl.style.color = 'var(--accent-primary)';
                } else {
                    arrowEl.innerText = '↕';
                    arrowEl.style.color = 'var(--text-secondary)';
                }
            }
        });

        const totalItems = filtered.length;
        let perPage = stockPerPage === 'all' ? totalItems : parseInt(stockPerPage) || 10;
        if (perPage <= 0) perPage = 10;

        const totalPages = Math.ceil(totalItems / perPage) || 1;
        if (stockCurrentPage > totalPages) stockCurrentPage = totalPages;
        if (stockCurrentPage < 1) stockCurrentPage = 1;

        const startIdx = (stockCurrentPage - 1) * perPage;
        const endIdx = stockPerPage === 'all' ? totalItems : Math.min(startIdx + perPage, totalItems);
        const pageItems = filtered.slice(startIdx, endIdx);

        const infoElem = document.getElementById('stock-pagination-info');
        if (infoElem) {
            infoElem.innerText = totalItems > 0 
                ? `Affichage ${startIdx + 1}-${endIdx} sur ${totalItems} carte(s)`
                : `Aucune carte disponible`;
        }

        const pageIndicator = document.getElementById('stock-page-indicator');
        if (pageIndicator) {
            pageIndicator.innerText = `Page ${stockCurrentPage} / ${totalPages}`;
        }

        const btnPrev = document.getElementById('btn-stock-prev');
        const btnNext = document.getElementById('btn-stock-next');
        if (btnPrev) btnPrev.disabled = stockCurrentPage <= 1;
        if (btnNext) btnNext.disabled = stockCurrentPage >= totalPages;

        renderStockTable(pageItems);
    }

    function renderStockTable(items) {
        const tbody = document.getElementById('stock-table');
        tbody.innerHTML = '';
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 24px;">Aucun stock disponible.</td></tr>`;
            return;
        }

        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'context-menu';
            const valDisplay = (item.value != null && item.value > 0) ? `${item.value} €` : '-';
            const pinDisplay = item.pin ? `<code>${escapeHtml(item.pin)}</code>` : `<span style="color: var(--text-secondary); font-style: italic; opacity: 0.5;">-</span>`;
            tr.innerHTML = `
                <td>#${item.id}</td>
                <td><code>${item.code}</code></td>
                <td>${pinDisplay}</td>
                <td><strong>${valDisplay}</strong></td>
                <td><strong>${item.price} €</strong></td>
                <td>
                    <button class="action-btn action-btn-danger" onclick="btnDeleteStock(${item.id})">Supprimer</button>
                </td>
            `;
            tr.addEventListener('contextmenu', (e) => {
                showDynamicContextMenu(e, [
                    { label: '📋 Copier le Code Carte', action: () => { navigator.clipboard.writeText(item.code); showToast(`Code ${item.code} copié !`, 'info'); } },
                    { label: '🔑 Copier le PIN', action: () => { if (item.pin) { navigator.clipboard.writeText(item.pin); showToast(`PIN ${item.pin} copié !`, 'info'); } else showToast('Aucun PIN sur cette carte', 'warning'); } },
                    { label: '📌 Copier Ligne Complète (Code|PIN|Solde|Prix)', action: () => {
                        const line = item.pin ? `${item.code}|${item.pin}|${item.value || 0}|${item.price || 0}` : `${item.code}|${item.value || 0}|${item.price || 0}`;
                        navigator.clipboard.writeText(line);
                        showToast('Ligne complète copiée !', 'info');
                    } },
                    { divider: true },
                    { label: `💶 Solde Carte: ${valDisplay}`, action: () => {} },
                    { label: `💰 Prix Vente: ${item.price} €`, action: () => {} },
                    { divider: true },
                    { label: '🗑️ Supprimer cette Carte', danger: true, action: () => btnDeleteStock(item.id) }
                ]);
            });
            tbody.appendChild(tr);
        });
    }

    const stockPerPageSelect = document.getElementById('stock-per-page-select');
    if (stockPerPageSelect) {
        stockPerPageSelect.addEventListener('change', (e) => {
            stockPerPage = e.target.value;
            stockCurrentPage = 1;
            applyStockPagination();
        });
    }
    const btnStockPrev = document.getElementById('btn-stock-prev');
    if (btnStockPrev) {
        btnStockPrev.addEventListener('click', () => {
            if (stockCurrentPage > 1) {
                stockCurrentPage--;
                applyStockPagination();
            }
        });
    }
    const btnStockNext = document.getElementById('btn-stock-next');
    if (btnStockNext) {
        btnStockNext.addEventListener('click', () => {
            stockCurrentPage++;
            applyStockPagination();
        });
    }

    document.getElementById('add-stock-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('stock-bulk-textarea').value.trim();

        if (!text) {
            showToast('Veuillez saisir au moins un code carte.', 'danger');
            return;
        }

        const lines = text.split('\n');
        const items = [];

        lines.forEach(line => {
            const l = line.trim();
            if (!l) return;

            const parts = l.split('|');
            if (parts.length >= 4) {
                items.push({
                    brand: 'carr',
                    code: parts[0].trim(),
                    pin: parts[1].trim(),
                    value: parseInt(parts[2].trim()) || 0,
                    price: parseFloat(parts[3].trim()) || 0.0
                });
            } else if (parts.length === 3) {
                items.push({
                    brand: 'carr',
                    code: parts[0].trim(),
                    pin: '',
                    value: parseInt(parts[1].trim()) || 0,
                    price: parseFloat(parts[2].trim()) || 0.0
                });
            } else if (parts.length === 2) {
                items.push({
                    brand: 'carr',
                    code: parts[0].trim(),
                    pin: '',
                    value: parseInt(parts[1].trim()) || 0,
                    price: 0.0
                });
            } else {
                items.push({
                    brand: 'carr',
                    code: l,
                    pin: '',
                    value: 0,
                    price: 0.0
                });
            }
        });

        if (items.length === 0) {
            showToast('Aucun code valide trouvé.', 'danger');
            return;
        }

        const res = await apiRequest('/stock/add', 'POST', { items });
        if (res && res.success) {
            showToast(`✅ ${res.count || items.length} carte(s) Carrefour ajoutée(s) au stock !`, 'success');
            document.getElementById('stock-bulk-textarea').value = '';
            loadStockData();
        }
    });

    window.btnDeleteStock = (id) => {
        openModal('Supprimer Carte', `<p>Supprimer la carte #${id} du stock ?</p>`, async () => {
            const res = await apiRequest('/stock/delete', 'POST', { id });
            if (res && res.success) {
                showToast('Carte supprimée', 'success');
                loadStockData();
            }
        });
    };

    // [ TRANSACTIONS PAGINATION LOGIC ] =======================================
    let rawTransactionsData = [];
    let transactionsCurrentPage = 1;
    let transactionsPerPage = '10';
    let currentTransactionsSortField = 'id';
    let currentTransactionsSortDir = 'desc';

    async function loadTransactionsData() {
        const data = await apiRequest('/transactions');
        if (!data) return;
        rawTransactionsData = data.transactions || [];
        transactionsCurrentPage = 1;
        initTransactionsListeners();
        applyTransactionsPagination();
    }

    function initTransactionsListeners() {
        document.querySelectorAll('.sortable-th[data-table="transactions"]').forEach(th => {
            if (!th.dataset.initialized) {
                th.dataset.initialized = 'true';
                th.addEventListener('click', () => {
                    const sortField = th.dataset.sort;
                    if (currentTransactionsSortField === sortField) {
                        currentTransactionsSortDir = currentTransactionsSortDir === 'asc' ? 'desc' : 'asc';
                    } else {
                        currentTransactionsSortField = sortField;
                        currentTransactionsSortDir = 'asc';
                    }
                    applyTransactionsPagination();
                });
            }
        });
    }

    function applyTransactionsPagination() {
        const query = (document.getElementById('tx-search-input')?.value || '').trim().toLowerCase();
        const clearBtn = document.getElementById('tx-search-clear');
        if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

        let filtered = rawTransactionsData;
        if (query) {
            filtered = rawTransactionsData.filter(t => 
                String(t.userId || '').toLowerCase().includes(query) ||
                String(t.brand || '').toLowerCase().includes(query) ||
                String(t.code || '').toLowerCase().includes(query) ||
                String(t.valeur || t.value || '').toLowerCase().includes(query) ||
                String(t.price || '').toLowerCase().includes(query) ||
                String(t.id || '').toLowerCase().includes(query)
            );
        }

        filtered.sort((a, b) => {
            let valA = a[currentTransactionsSortField === 'valeur' ? 'value' : currentTransactionsSortField];
            let valB = b[currentTransactionsSortField === 'valeur' ? 'value' : currentTransactionsSortField];
            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            const numA = Number(valA);
            const numB = Number(valB);
            if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                return currentTransactionsSortDir === 'asc' ? numA - numB : numB - numA;
            }
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            if (strA < strB) return currentTransactionsSortDir === 'asc' ? -1 : 1;
            if (strA > strB) return currentTransactionsSortDir === 'asc' ? 1 : -1;
            return 0;
        });

        ['id', 'userId', 'brand', 'code', 'valeur', 'price', 'createdAt'].forEach(field => {
            const arrowEl = document.getElementById(`sort-arrow-transactions-${field}`);
            if (arrowEl) {
                if (field === currentTransactionsSortField) {
                    arrowEl.innerText = currentTransactionsSortDir === 'asc' ? '▲' : '▼';
                    arrowEl.style.color = 'var(--accent-primary)';
                } else {
                    arrowEl.innerText = '↕';
                    arrowEl.style.color = 'var(--text-secondary)';
                }
            }
        });

        const totalItems = filtered.length;
        let perPage = transactionsPerPage === 'all' ? totalItems : parseInt(transactionsPerPage) || 10;
        if (perPage <= 0) perPage = 10;

        const totalPages = Math.ceil(totalItems / perPage) || 1;
        if (transactionsCurrentPage > totalPages) transactionsCurrentPage = totalPages;
        if (transactionsCurrentPage < 1) transactionsCurrentPage = 1;

        const startIdx = (transactionsCurrentPage - 1) * perPage;
        const endIdx = transactionsPerPage === 'all' ? totalItems : Math.min(startIdx + perPage, totalItems);
        const pageItems = filtered.slice(startIdx, endIdx);

        const infoElem = document.getElementById('transactions-pagination-info');
        if (infoElem) {
            infoElem.innerText = totalItems > 0 
                ? `Affichage ${startIdx + 1}-${endIdx} sur ${totalItems} achat(s)`
                : `Aucun achat trouvé`;
        }

        const pageIndicator = document.getElementById('transactions-page-indicator');
        if (pageIndicator) {
            pageIndicator.innerText = `Page ${transactionsCurrentPage} / ${totalPages}`;
        }

        const btnPrev = document.getElementById('btn-transactions-prev');
        const btnNext = document.getElementById('btn-transactions-next');
        if (btnPrev) btnPrev.disabled = transactionsCurrentPage <= 1;
        if (btnNext) btnNext.disabled = transactionsCurrentPage >= totalPages;

        renderTransactionsTable(pageItems);
    }

    function renderTransactionsTable(transactions) {
        const tbody = document.getElementById('all-transactions-table');
        tbody.innerHTML = '';
        if (transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 24px;">Aucune transaction enregistrée.</td></tr>`;
            return;
        }

        transactions.forEach(tx => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'context-menu';
            const isIptv = (tx.brand || '').toLowerCase() === 'iptv';
            let valueFormatted = '-';
            if (isIptv) {
                valueFormatted = (tx.value != null && tx.value > 0) ? `${tx.value} Mois` : '24h Démo';
            } else if (tx.value != null && tx.value > 0) {
                valueFormatted = `${tx.value} €`;
            }
            const brandFormatted = isIptv ? 'IPTV' : (tx.brand === 'carr' ? 'Carrefour' : (tx.brand || '-'));
            tr.innerHTML = `
                <td>#${tx.id}</td>
                <td style="cursor: pointer; color: var(--accent-primary);" onclick="window.redirectToUser('${tx.userId}')"><code>${tx.userId}</code></td>
                <td><span class="badge ${isIptv ? 'badge-info' : 'badge-warning'}" style="text-transform: uppercase;">${escapeHtml(brandFormatted)}</span></td>
                <td><code>${escapeHtml(tx.code)}</code></td>
                <td>${valueFormatted}</td>
                <td><strong>${tx.price} €</strong></td>
                <td>${formatParisDate(tx.createdAt)}</td>
            `;
            tr.addEventListener('contextmenu', (e) => {
                showDynamicContextMenu(e, [
                    { label: '👤 Inspecter cet Utilisateur', action: () => window.redirectToUser(tx.userId) },
                    { label: '💰 Voir ses Rechargements', action: () => window.filterPaymentsByUser(tx.userId) },
                    { divider: true },
                    { label: '📦 Copier Code / Info', action: () => { navigator.clipboard.writeText(tx.code); showToast(`Code ${tx.code} copié !`, 'info'); } },
                    { label: '🏷️ Copier la Marque', action: () => { navigator.clipboard.writeText(tx.brand); showToast(`Marque ${tx.brand} copiée !`, 'info'); } },
                    { label: '📋 Copier ID Telegram', action: () => { navigator.clipboard.writeText(String(tx.userId)); showToast(`ID ${tx.userId} copié !`, 'info'); } }
                ]);
            });
            tbody.appendChild(tr);
        });
    }

    const txSearchInput = document.getElementById('tx-search-input');
    if (txSearchInput) {
        txSearchInput.addEventListener('input', () => {
            transactionsCurrentPage = 1;
            applyTransactionsPagination();
        });
    }
    const txSearchClear = document.getElementById('tx-search-clear');
    if (txSearchClear) {
        txSearchClear.addEventListener('click', () => {
            if (txSearchInput) txSearchInput.value = '';
            transactionsCurrentPage = 1;
            applyTransactionsPagination();
        });
    }

    const txPerPageSelect = document.getElementById('transactions-per-page-select');
    if (txPerPageSelect) {
        txPerPageSelect.addEventListener('change', (e) => {
            transactionsPerPage = e.target.value;
            transactionsCurrentPage = 1;
            applyTransactionsPagination();
        });
    }
    const btnTxPrev = document.getElementById('btn-transactions-prev');
    if (btnTxPrev) {
        btnTxPrev.addEventListener('click', () => {
            if (transactionsCurrentPage > 1) {
                transactionsCurrentPage--;
                applyTransactionsPagination();
            }
        });
    }
    const btnTxNext = document.getElementById('btn-transactions-next');
    if (btnTxNext) {
        btnTxNext.addEventListener('click', () => {
            transactionsCurrentPage++;
            applyTransactionsPagination();
        });
    }

    // =====================================================================

    let rawAmendesData = [];
    let currentAmendesFilter = 'ALL';
    let amendesListenersInitialized = false;

    function initAmendesListeners() {
        if (amendesListenersInitialized) return;
        amendesListenersInitialized = true;

        const refreshBtn = document.getElementById('btn-refresh-amendes');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                loadAmendesData();
            });
        }

        const filterBtns = document.querySelectorAll('.amende-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentAmendesFilter = btn.getAttribute('data-filter') || 'ALL';
                renderAmendesTable();
            });
        });

        const searchInput = document.getElementById('amendes-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                renderAmendesTable();
            });
        }
    }

    async function loadAmendesData() {
        initAmendesListeners();
        const tbody = document.getElementById('amendes-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 30px;">Chargement des dossiers d\'amendes...</td></tr>';
        }

        const data = await apiRequest('/amendes');
        if (!data || !Array.isArray(data.amendes)) {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 30px;">Erreur de chargement des dossiers d\'amendes.</td></tr>';
            }
            return;
        }

        rawAmendesData = data.amendes;

        const totalEl = document.getElementById('amendes-stat-total');
        const pendingEl = document.getElementById('amendes-stat-pending');
        const acceptedEl = document.getElementById('amendes-stat-accepted');
        const paidEl = document.getElementById('amendes-stat-paid');

        if (totalEl) totalEl.innerText = rawAmendesData.length;
        if (pendingEl) pendingEl.innerText = rawAmendesData.filter(a => a.status === 'PENDING').length;
        if (acceptedEl) acceptedEl.innerText = rawAmendesData.filter(a => a.status === 'ACCEPTED').length;
        if (paidEl) paidEl.innerText = rawAmendesData.filter(a => a.status === 'PAID' || a.status === 'FINISHED').length;

        renderAmendesTable();
    }

    function renderAmendesTable() {
        const tbody = document.getElementById('amendes-table-body');
        if (!tbody) return;

        const searchInput = document.getElementById('amendes-search-input');
        const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

        let filtered = rawAmendesData;
        if (currentAmendesFilter !== 'ALL') {
            filtered = filtered.filter(a => a.status === currentAmendesFilter);
        }

        if (query) {
            filtered = filtered.filter(a => {
                const idMatch = a.id && a.id.toLowerCase().includes(query);
                const userMatch = (a.username && a.username.toLowerCase().includes(query)) || String(a.user_id).includes(query);
                const noteMatch = a.note && a.note.toLowerCase().includes(query);
                return idMatch || userMatch || noteMatch;
            });
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 30px;">Aucun dossier d\'amende correspondant aux critères.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(a => {
            const shortId = a.id ? a.id.substring(0, 8) : 'N/A';
            const dateStr = formatParisDate(a.created_at);

            let clientLabel = '';
            if (a.username) {
                clientLabel = `<a href="javascript:void(0)" onclick="window.redirectToUser('${a.user_id}')" style="color: var(--accent-primary); font-weight: 600; text-decoration: none;">@${escapeHtml(a.username)}</a>`;
            } else {
                clientLabel = `<a href="javascript:void(0)" onclick="window.redirectToUser('${a.user_id}')" style="color: var(--accent-primary); font-weight: 600; text-decoration: none;">User #${a.user_id}</a>`;
            }
            clientLabel += `<div style="font-size: 11px; color: var(--text-secondary);">Solde: ${Number(a.user_balance || 0).toFixed(2)} €</div>`;

            let filesHtml = '';
            if (Array.isArray(a.file_urls) && a.file_urls.length > 0) {
                filesHtml = a.file_urls.map((url, idx) => {
                    const normUrl = url.startsWith('/api/amendes/') ? url.replace('/api/amendes/', '/api/proxy/amendes/') : url;
                    const fullHref = `${normUrl}?auth=${encodeURIComponent(authToken)}`;
                    return `<a href="${fullHref}" target="_blank" rel="noreferrer" class="action-btn" style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; font-size: 11px; margin-bottom: 4px; text-decoration: none;">📎 Pièce ${idx + 1} ↗</a>`;
                }).join(' ');
            } else {
                filesHtml = '<span style="color: var(--text-secondary); font-size: 11px;">Aucun fichier</span>';
            }

            let badgeHtml = '';
            switch (a.status) {
                case 'PENDING':
                    badgeHtml = '<span class="badge badge-warning">⏳ En attente</span>';
                    break;
                case 'ACCEPTED':
                    badgeHtml = '<span class="badge badge-success">✅ Accepté</span>';
                    break;
                case 'PAID':
                    badgeHtml = '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">💳 Réglé</span>';
                    break;
                case 'REJECTED':
                    badgeHtml = '<span class="badge badge-danger">❌ Refusé</span>';
                    break;
                case 'FINISHED':
                    badgeHtml = '<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">🏁 Clôturé</span>';
                    break;
                default:
                    badgeHtml = `<span class="badge">${escapeHtml(a.status)}</span>`;
            }

            const priceHtml = a.price !== null && a.price !== undefined
                ? `<strong style="color: var(--accent-primary);">${Number(a.price).toFixed(2)} €</strong>`
                : '<span style="color: var(--text-secondary);">-</span>';

            const noteHtml = a.note
                ? `<div style="max-width: 200px; font-size: 12px; color: var(--text-secondary); word-break: break-word; font-style: italic;">"${escapeHtml(a.note)}"</div>`
                : '<span style="color: var(--text-secondary); font-size: 11px;">-</span>';

            let actionsHtml = '';
            if (a.status === 'PENDING') {
                actionsHtml = `
                    <button class="action-btn" onclick="window.adminAcceptAmende('${a.id}')" style="background: var(--success-bg); color: var(--success); border-color: var(--success);">Accepter</button>
                    <button class="action-btn action-btn-danger" onclick="window.adminRejectAmende('${a.id}')" style="background: var(--danger-bg); color: var(--danger); border-color: var(--danger);">Refuser</button>
                `;
            } else if (a.status === 'ACCEPTED') {
                actionsHtml = `
                    <button class="action-btn" onclick="window.adminAcceptAmende('${a.id}', ${a.price || 0})" style="font-size: 11px;">Modifier Prix</button>
                    <button class="action-btn action-btn-danger" onclick="window.adminRejectAmende('${a.id}')" style="font-size: 11px;">Refuser</button>
                `;
            } else if (a.status === 'PAID') {
                actionsHtml = `
                    <button class="action-btn" onclick="window.adminFinishAmende('${a.id}')" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border-color: #10b981;">Clôturer Dossier</button>
                `;
            } else {
                actionsHtml = '<span style="color: var(--text-secondary); font-size: 11px;">Aucune action</span>';
            }

            return `
                <tr>
                    <td>
                        <div style="font-weight: 700; color: var(--text-primary); font-family: monospace;">#${shortId}</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">${dateStr}</div>
                    </td>
                    <td>${clientLabel}</td>
                    <td>${filesHtml}</td>
                    <td>${noteHtml}</td>
                    <td>${badgeHtml}</td>
                    <td>${priceHtml}</td>
                    <td style="text-align: right; white-space: nowrap;">${actionsHtml}</td>
                </tr>
            `;
        }).join('');
    }

    window.adminAcceptAmende = function(amendeId, currentPrice = '') {
        const modalHtml = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                    Fixez le tarif en euros pour ce dossier. Une fois validé, le client recevra une notification et pourra régler le montant depuis son solde.
                </p>
                <div>
                    <label class="form-label">Tarif (€) :</label>
                    <input type="number" step="0.5" min="1" id="amende-modal-price" class="form-input" placeholder="Ex: 40" value="${currentPrice || ''}" style="width: 100%; height: 40px; font-size: 15px; font-weight: 700;">
                </div>
                <div>
                    <label class="form-label">Note admin interne (optionnel) :</label>
                    <input type="text" id="amende-modal-notes" class="form-input" placeholder="Notes de gestion..." style="width: 100%;">
                </div>
            </div>
        `;

        openModal('✅ Accepter le Dossier d\'Amende', modalHtml, async () => {
            const priceInput = document.getElementById('amende-modal-price');
            const notesInput = document.getElementById('amende-modal-notes');
            const priceVal = parseFloat(priceInput ? priceInput.value : '0');

            if (isNaN(priceVal) || priceVal <= 0) {
                showToast('Veuillez saisir un tarif valide supérieur à 0 €.', 'danger');
                return;
            }

            const res = await apiRequest(`/amendes/${amendeId}/decision`, 'POST', {
                action: 'accept',
                price: priceVal,
                adminNotes: notesInput ? notesInput.value.trim() : ''
            });

            if (res && res.success) {
                showToast(`Dossier accepté avec un tarif de ${priceVal.toFixed(2)} € !`, 'success');
                loadAmendesData();
            } else {
                showToast(res && res.detail ? res.detail : 'Échec de la validation.', 'danger');
            }
        });
    };

    window.adminRejectAmende = function(amendeId) {
        const modalHtml = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                    Êtes-vous certain de vouloir refuser la prise en charge de ce dossier ? Le client sera notifié.
                </p>
                <div>
                    <label class="form-label">Motif du refus (optionnel) :</label>
                    <input type="text" id="amende-reject-notes" class="form-input" placeholder="Ex: Pièce illisible, délai de contestation dépassé..." style="width: 100%;">
                </div>
            </div>
        `;

        openModal('❌ Refuser le Dossier d\'Amende', modalHtml, async () => {
            const notesInput = document.getElementById('amende-reject-notes');
            const res = await apiRequest(`/amendes/${amendeId}/decision`, 'POST', {
                action: 'reject',
                adminNotes: notesInput ? notesInput.value.trim() : ''
            });

            if (res && res.success) {
                showToast('Dossier refusé.', 'warning');
                loadAmendesData();
            } else {
                showToast(res && res.detail ? res.detail : 'Échec du refus.', 'danger');
            }
        });
    };

    window.adminFinishAmende = function(amendeId) {
        const modalHtml = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">
                    Confirmez-vous que la démarche d'annulation a été menée à terme et que ce dossier peut être clôturé ?
                </p>
                <div>
                    <label class="form-label">Note finale (optionnel) :</label>
                    <input type="text" id="amende-finish-notes" class="form-input" placeholder="Ex: Avis d'annulation reçu du tribunal..." style="width: 100%;">
                </div>
            </div>
        `;

        openModal('🏁 Clôturer le Dossier d\'Amende', modalHtml, async () => {
            const notesInput = document.getElementById('amende-finish-notes');
            const res = await apiRequest(`/amendes/${amendeId}/decision`, 'POST', {
                action: 'finish',
                adminNotes: notesInput ? notesInput.value.trim() : ''
            });

            if (res && res.success) {
                showToast('Dossier clôturé avec succès.', 'success');
                loadAmendesData();
            } else {
                showToast(res && res.detail ? res.detail : 'Échec de la clôture.', 'danger');
            }
        });
    };

    /* ===================================================================== */

    const GD_META = {
        subcategories: {
            rib: { title: "RIB Bancaires", icon: "🏦", defaultRoles: ["user", "admin"] },
            emploi: { title: "Fiches de Paie / Emploi", icon: "💼", defaultRoles: ["user", "admin"] },
            releve: { title: "Relevés de Compte", icon: "📊", defaultRoles: ["user", "admin"] },
            facture: { title: "Factures d'Achat", icon: "🧾", defaultRoles: ["user", "admin"] },
            assurance: { title: "Assurances", icon: "🛡️", defaultRoles: ["user", "admin"] },
            justificatif: { title: "Justificatifs & Attestations", icon: "📑", defaultRoles: ["user", "admin"] }
        },
        docLabels: {
            bp: "Banque Populaire",
            ca: "Crédit Agricole",
            ce: "Caisse d'Épargne",
            cm: "Crédit Mutuel",
            sg: "Société Générale",
            bfb: "BoursoBank Pro / BFB",
            bnp: "BNP Paribas",
            cic: "CIC",
            lbp: "La Banque Postale",
            lcl: "LCL",
            mypos: "myPOS",
            qonto: "Qonto",
            sumup: "SumUp",
            helios: "Helios",
            noelse: "Noelse",
            revolut: "Revolut",
            boursobank: "BoursoBank",
            fiche_de_paie: "Fiche de Paie",
            adidas: "Adidas",
            amazon: "Amazon",
            ami: "AMI Paris",
            boulanger: "Boulanger",
            burberry: "Burberry",
            cdiscount: "Cdiscount",
            chanel: "Chanel",
            dafy: "Dafy Moto",
            darty: "Darty",
            dior: "Dior",
            fnac: "Fnac",
            fred: "Fred Joaillerie",
            gaz: "Engie Gaz",
            jacquemus: "Jacquemus",
            loro_piana: "Loro Piana",
            nike: "Nike",
            nocibe: "Nocibé",
            pack_moto: "Pack Moto",
            sfr: "SFR",
            axa: "Assurance AXA",
            maxance: "Assurance Maxance",
            attestation_edf: "Attestation EDF",
            conduite_heures: "Heures de Conduite",
            attestation_direct_energie: "Attestation Direct Énergie"
        }
    };

    /* ===================================================================== */

    const GD_PRICE_GROUPS = [
        {
            title: "RIB Bancaires",
            icon: "🏦",
            items: [
                { key: "lbp", label: "La Banque Postale", default: 5 },
                { key: "ca", label: "Crédit Agricole", default: 5 },
                { key: "sg", label: "Société Générale", default: 5 },
                { key: "cm", label: "Crédit Mutuel", default: 5 },
                { key: "cic", label: "CIC", default: 5 },
                { key: "bnp", label: "BNP Paribas", default: 5 },
                { key: "ce", label: "Caisse d'Épargne", default: 5 },
                { key: "bp", label: "Banque Populaire", default: 5 },
                { key: "lcl", label: "LCL", default: 5 },
                { key: "helios", label: "Helios", default: 5 },
                { key: "noelse", label: "Noelse", default: 5 },
                { key: "revolut", label: "Revolut", default: 5 },
                { key: "qonto", label: "Qonto", default: 5 },
                { key: "bfb", label: "BoursoBank Pro / BFB", default: 5 },
                { key: "boursobank", label: "BoursoBank", default: 5 },
                { key: "sumup", label: "SumUp", default: 5 },
                { key: "mypos", label: "myPOS", default: 5 }
            ]
        },
        {
            title: "Fiches de Paie / Emploi",
            icon: "💼",
            items: [
                { key: "fiche_de_paie_1m", label: "Fiche de Paie — 1 mois", default: 8 },
                { key: "fiche_de_paie_3m", label: "Fiche de Paie — 3 mois", default: 20 },
                { key: "fiche_de_paie_6m", label: "Fiche de Paie — 6 mois", default: 40 },
                { key: "fiche_de_paie_12m", label: "Fiche de Paie — 12 mois", default: 60 }
            ]
        },
        {
            title: "Relevés de Compte",
            icon: "📊",
            items: [
                { key: "releve_lbp_1m", label: "Relevé LBP — 1 mois", default: 8 },
                { key: "releve_lbp_3m", label: "Relevé LBP — 3 mois", default: 20 },
                { key: "releve_lbp_6m", label: "Relevé LBP — 6 mois", default: 40 },
                { key: "releve_lbp_12m", label: "Relevé LBP — 12 mois", default: 60 }
            ]
        },
        {
            title: "Assurances",
            icon: "🛡️",
            items: [
                { key: "maxance", label: "Assurance Maxance", default: 5 },
                { key: "axa", label: "Assurance AXA", default: 5 }
            ]
        },
        {
            title: "Factures d'Achat",
            icon: "🧾",
            items: [
                { key: "adidas", label: "Facture Adidas", default: 5 },
                { key: "amazon", label: "Facture Amazon", default: 5 },
                { key: "ami", label: "Facture AMI Paris", default: 5 },
                { key: "boulanger", label: "Facture Boulanger", default: 5 },
                { key: "burberry", label: "Facture Burberry", default: 5 },
                { key: "cdiscount", label: "Facture Cdiscount", default: 5 },
                { key: "chanel", label: "Facture Chanel", default: 5 },
                { key: "dafy", label: "Facture Dafy Moto", default: 5 },
                { key: "darty", label: "Facture Darty", default: 5 },
                { key: "dior", label: "Facture Dior", default: 5 },
                { key: "fnac", label: "Facture Fnac", default: 5 },
                { key: "fred", label: "Facture Fred", default: 5 },
                { key: "gaz", label: "Facture Gaz (Engie)", default: 5 },
                { key: "jacquemus", label: "Facture Jacquemus", default: 5 },
                { key: "loro_piana", label: "Facture Loro Piana", default: 5 },
                { key: "nike", label: "Facture Nike", default: 5 },
                { key: "nocibe", label: "Facture Nocibé", default: 5 },
                { key: "pack_moto", label: "Facture Pack Moto", default: 5 },
                { key: "sfr", label: "Facture SFR", default: 5 }
            ]
        },
        {
            title: "Justificatifs & Attestations",
            icon: "📑",
            items: [
                { key: "attestation_edf", label: "Attestation EDF", default: 5 },
                { key: "attestation_direct_energie", label: "Attestation Direct Énergie", default: 5 },
                { key: "conduite_heures", label: "Heures de Conduite", default: 5 }
            ]
        }
    ];

    /* ===================================================================== */

    let currentGenerateDocsData = null;

    function renderServicesStatusList(services) {
        const container = document.getElementById('services-status-list');
        if (!container) return;
        container.innerHTML = '';
        if (!services || typeof services !== 'object' || Object.keys(services).length === 0) {
            container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Aucun service configuré.</div>';
            return;
        }

        const icons = {
            'carrefour': '🛒',
            'amendes': '📑',
            'iptv': '📺',
            'generate-docs': '📄'
        };

        Object.keys(services).forEach(slug => {
            const svc = services[slug];
            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;';

            const isActive = svc.isActive === true;
            const icon = icons[slug] || '⚡';

            card.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 14px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                            <span>${icon}</span> ${escapeHtml(svc.name || slug)}
                        </span>
                        <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}" id="service-badge-${slug}">
                            ${isActive ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted); word-break: break-word;">
                        ${escapeHtml(svc.description || slug)}
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 10px;">
                    <button type="button" class="action-btn" data-service-toggle="${slug}" style="font-size: 12px; padding: 6px 14px;">
                        ${isActive ? 'Désactiver' : 'Activer'}
                    </button>
                </div>
            `;

            const btn = card.querySelector(`[data-service-toggle="${slug}"]`);
            if (btn) {
                btn.addEventListener('click', async () => {
                    const nextState = !isActive;
                    btn.disabled = true;
                    btn.innerText = 'Modification...';
                    const res = await apiRequest('/settings/services/toggle', 'POST', { slug, isActive: nextState });
                    if (res && res.success) {
                        showToast(`Service "${svc.name || slug}" ${nextState ? 'activé' : 'désactivé'}.`, 'success');
                        svc.isActive = nextState;
                        renderServicesStatusList(services);
                    } else {
                        showToast(res && res.error ? res.error : 'Erreur lors de la modification', 'danger');
                        btn.disabled = false;
                        btn.innerText = isActive ? 'Désactiver' : 'Activer';
                    }
                });
            }

            container.appendChild(card);
        });
    }

    function renderGenerateDocsSettings(gd) {
        currentGenerateDocsData = gd || {};
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = String(v); };
        setVal('setting-gd-is-active', gd.isActive !== false ? 'true' : 'false');
        setVal('setting-gd-flatten-pdf', gd.flattenPdf !== false ? 'true' : 'false');
        setVal('setting-gd-preview-off', gd.previewOff === true ? 'true' : 'false');
        setVal('setting-gd-cooldown-enabled', gd.previewCooldownEnabled !== false ? 'true' : 'false');
        setVal('setting-gd-cooldown-seconds', gd.previewCooldownSeconds != null ? gd.previewCooldownSeconds : 30);

        const container = document.getElementById('gd-subcategories-container');
        if (!container) return;
        container.innerHTML = '';

        const subcats = gd.subcategories || {};
        const keys = Object.keys(subcats);
        if (keys.length === 0) {
            container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Aucune sous-catégorie configurée.</div>';
            return;
        }

        keys.forEach(catKey => {
            const catData = subcats[catKey] || {};
            const meta = GD_META.subcategories[catKey] || { title: catKey.toUpperCase(), icon: '📁' };
            const catEnabled = catData.enabled !== false;

            const docs = catData.documents || {};
            const docKeys = Object.keys(docs);

            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; display: flex; flex-direction: column; gap: 14px;';

            let docsHtml = '';
            if (docKeys.length > 0) {
                docsHtml = `
                    <div style="border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 12px; margin-top: 4px;">
                        <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px;">Modèles de documents individuels :</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px;">
                            ${docKeys.map(docKey => {
                                const docObj = docs[docKey] || {};
                                const docOn = typeof docObj === 'boolean' ? docObj : (docObj.enabled !== false);
                                const label = GD_META.docLabels[docKey] || docKey;
                                return `
                                    <label style="display: flex; align-items: center; justify-content: space-between; gap: 8px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; cursor: pointer; user-select: none;">
                                        <span style="font-size: 12px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
                                        <input type="checkbox" class="gd-doc-toggle" data-cat="${escapeHtml(catKey)}" data-doc="${escapeHtml(docKey)}" ${docOn ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">${meta.icon}</span>
                        <div>
                            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">${escapeHtml(meta.title)} <span style="font-size: 12px; color: var(--text-muted); font-weight: 400;">(${escapeHtml(catKey)})</span></div>
                            <div style="font-size: 11px; color: var(--text-muted);">${docKeys.length} document(s) configuré(s)</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 600;">
                            <input type="checkbox" class="gd-cat-enable-toggle" data-cat="${escapeHtml(catKey)}" ${catEnabled ? 'checked' : ''} style="width: 17px; height: 17px; cursor: pointer;">
                            <span class="gd-cat-status-text" style="color: ${catEnabled ? '#10b981' : '#ef4444'};">${catEnabled ? 'Activée' : 'Désactivée'}</span>
                        </label>
                    </div>
                </div>

                ${docsHtml}
            `;

            const catToggle = card.querySelector('.gd-cat-enable-toggle');
            const catStatusText = card.querySelector('.gd-cat-status-text');
            if (catToggle && catStatusText) {
                catToggle.addEventListener('change', () => {
                    catStatusText.innerText = catToggle.checked ? 'Activée' : 'Désactivée';
                    catStatusText.style.color = catToggle.checked ? '#10b981' : '#ef4444';
                });
            }

            container.appendChild(card);
        });

        const pricesContainer = document.getElementById('gd-prices-container');
        if (pricesContainer) {
            pricesContainer.innerHTML = '';
            const prices = gd.prices || {};

            GD_PRICE_GROUPS.forEach(group => {
                const groupCard = document.createElement('div');
                groupCard.style.cssText = 'background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; display: flex; flex-direction: column; gap: 14px;';

                groupCard.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 18px;">${group.icon}</span>
                        <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">${escapeHtml(group.title)}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px;">
                        ${group.items.map(item => {
                            const val = (prices[item.key] != null && !isNaN(prices[item.key])) ? prices[item.key] : item.default;
                            return `
                                <div style="display: flex; flex-direction: column; gap: 6px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; border-radius: var(--radius-sm);">
                                    <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span>
                                    <div style="position: relative; display: flex; align-items: center;">
                                        <input type="number" step="0.5" min="0" class="form-input gd-price-input" data-key="${escapeHtml(item.key)}" value="${val}" style="padding-right: 30px; font-weight: 700; font-size: 13px; color: #fff;">
                                        <span style="position: absolute; right: 10px; font-size: 12px; color: var(--text-muted); font-weight: 700; pointer-events: none;">€</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                pricesContainer.appendChild(groupCard);
            });
        }
    }

    /* ===================================================================== */

    async function loadSettingsData() {
        const data = await apiRequest('/settings');
        if (!data) return;

        const iptv = data.iptv || {};
        if (document.getElementById('setting-iptv-host')) document.getElementById('setting-iptv-host').value = iptv.host || '';
        if (document.getElementById('setting-iptv-type')) document.getElementById('setting-iptv-type').value = iptv.type || '';
        if (document.getElementById('setting-iptv-footer')) document.getElementById('setting-iptv-footer').value = iptv.message_footer || '';
        document.getElementById('setting-iptv-1m').value = iptv.price_1m || '';
        document.getElementById('setting-iptv-3m').value = iptv.price_3m || '';
        document.getElementById('setting-iptv-6m').value = iptv.price_6m || '';
        document.getElementById('setting-iptv-12m').value = iptv.price_12m || '';
        if (document.getElementById('setting-iptv-demo')) document.getElementById('setting-iptv-demo').value = iptv.price_demo || '';
        if (document.getElementById('setting-iptv-demo-enabled')) document.getElementById('setting-iptv-demo-enabled').value = iptv.demo_enabled !== false ? 'true' : 'false';
        renderIptvAccounts(iptv.accounts || []);
        renderIptvPanelAccounts(iptv.panel_accounts || []);

        const sumup = data.sumup || {};
        const banks = sumup.banks || {};
        const b1 = banks.sumup || {};
        const b2 = banks.sumup_bank2 || {};
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = (v !== null && v !== undefined) ? v : ''; };
        setVal('setting-general-frontend-url', data.frontendUrl);
        setVal('setting-general-backend-url', data.backendUrl);
        setVal('setting-general-bot-token', data.telegramBotToken);
        setVal('setting-general-bot-name', data.botName);
        setVal('setting-general-support-tg', data.supportTelegram);
        setVal('setting-general-support-tg-2', data.supportTelegram2);
        setVal('setting-general-channel-tg', data.channelTelegram);
        setVal('setting-general-marquee-text', data.marqueeText);
        setVal('setting-general-marquee-style', data.marqueeStyle || 'standard');

        setVal('setting-security-api-key', data.apiSecretKey);
        setVal('setting-security-admin-slug', data.adminSlug);
        setVal('setting-security-jwt-exp', data.jwtExpirationMinutes || 1440);

        setVal('setting-limits-enabled', data.paymentEnabled !== false ? 'true' : 'false');
        setVal('setting-limits-min', data.minPaymentAmount != null ? data.minPaymentAmount : '1.0');
        setVal('setting-limits-max', data.maxPaymentAmount != null ? data.maxPaymentAmount : '500.0');
        setVal('setting-limits-max-pending', data.maxPendingPaymentsPerClient != null ? data.maxPendingPaymentsPerClient : '2');

        setVal('sumup-expiration', sumup.expiration_minutes);
        setVal('sumup1-name', b1.name);
        setVal('sumup1-email', b1.pay_to_email);
        setVal('sumup1-api-key', b1.api_key);
        setVal('sumup1-client-id', b1.client_id);
        setVal('sumup1-client-secret', b1.client_secret);
        setVal('sumup2-name', b2.name);
        setVal('sumup2-email', b2.pay_to_email);
        setVal('sumup2-api-key', b2.api_key);
        setVal('sumup2-client-id', b2.client_id);
        setVal('sumup2-client-secret', b2.client_secret);
        const active = (sumup.active === 'sumup_bank2' || sumup.active === 'bank2') ? 'sumup-active-2' : 'sumup-active-1';
        const activeEl = document.getElementById(active);
        if (activeEl) activeEl.checked = true;
        const oxaKey = document.getElementById('setting-oxapay-key');
        if (oxaKey) oxaKey.value = data.oxapayApiKey || '';

        renderServicesStatusList(data.services || {});
        renderGenerateDocsSettings(data.generateDocs || {});
    }

    // [ PAYMENTS PAGINATION LOGIC ] ==========================================
    let rawPaymentsData = [];
    let paymentsCurrentPage = 1;
    let paymentsPerPage = '10';

    let currentPaymentsSortField = 'id';
    let currentPaymentsSortDir = 'desc';

    async function loadPaymentsData() {
        const data = await apiRequest('/payments');
        if (!data) return;
        rawPaymentsData = data.payments || [];
        paymentsCurrentPage = 1;
        initPaymentsListeners();
        applyPaymentsPagination();
    }

    function initPaymentsListeners() {
        document.querySelectorAll('.sortable-th[data-table="payments"]').forEach(th => {
            if (!th.dataset.initialized) {
                th.dataset.initialized = 'true';
                th.addEventListener('click', () => {
                    const sortField = th.dataset.sort;
                    if (currentPaymentsSortField === sortField) {
                        currentPaymentsSortDir = currentPaymentsSortDir === 'asc' ? 'desc' : 'asc';
                    } else {
                        currentPaymentsSortField = sortField;
                        currentPaymentsSortDir = 'asc';
                    }
                    applyPaymentsPagination();
                });
            }
        });
    }

    window.filterPayments = function() {
        paymentsCurrentPage = 1;
        applyPaymentsPagination();
    };

    function applyPaymentsPagination() {
        const query = (document.getElementById('payments-search-input')?.value || '').trim().toLowerCase();
        const filterValue = (document.getElementById('filter-payments-method')?.value || '').toUpperCase();
        
        const clearBtn = document.getElementById('payments-search-clear');
        if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

        let filtered = rawPaymentsData;
        if (filterValue) {
            filtered = filtered.filter(p => (p.method || '').toUpperCase() === filterValue);
        }
        if (query) {
            filtered = filtered.filter(p => 
                String(p.chatId || '').toLowerCase().includes(query) ||
                String(p.trackId || '').toLowerCase().includes(query) ||
                String(p.method || '').toLowerCase().includes(query) ||
                String(p.status || '').toLowerCase().includes(query) ||
                String(p.amount || '').toLowerCase().includes(query) ||
                String(p.id || '').toLowerCase().includes(query)
            );
        }

        filtered.sort((a, b) => {
            let valA = a[currentPaymentsSortField];
            let valB = b[currentPaymentsSortField];
            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            const numA = Number(valA);
            const numB = Number(valB);
            if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                return currentPaymentsSortDir === 'asc' ? numA - numB : numB - numA;
            }
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            if (strA < strB) return currentPaymentsSortDir === 'asc' ? -1 : 1;
            if (strA > strB) return currentPaymentsSortDir === 'asc' ? 1 : -1;
            return 0;
        });

        ['id', 'chatId', 'method', 'amount', 'status', 'trackId', 'createdAt'].forEach(field => {
            const arrowEl = document.getElementById(`sort-arrow-payments-${field}`);
            if (arrowEl) {
                if (field === currentPaymentsSortField) {
                    arrowEl.innerText = currentPaymentsSortDir === 'asc' ? '▲' : '▼';
                    arrowEl.style.color = 'var(--accent-primary)';
                } else {
                    arrowEl.innerText = '↕';
                    arrowEl.style.color = 'var(--text-secondary)';
                }
            }
        });

        const totalItems = filtered.length;
        let perPage = paymentsPerPage === 'all' ? totalItems : parseInt(paymentsPerPage) || 10;
        if (perPage <= 0) perPage = 10;

        const totalPages = Math.ceil(totalItems / perPage) || 1;
        if (paymentsCurrentPage > totalPages) paymentsCurrentPage = totalPages;
        if (paymentsCurrentPage < 1) paymentsCurrentPage = 1;

        const startIdx = (paymentsCurrentPage - 1) * perPage;
        const endIdx = paymentsPerPage === 'all' ? totalItems : Math.min(startIdx + perPage, totalItems);
        const pageItems = filtered.slice(startIdx, endIdx);

        const infoElem = document.getElementById('payments-pagination-info');
        if (infoElem) {
            infoElem.innerText = totalItems > 0 
                ? `Affichage ${startIdx + 1}-${endIdx} sur ${totalItems} rechargement(s)`
                : `Aucun rechargement trouvé`;
        }

        const pageIndicator = document.getElementById('payments-page-indicator');
        if (pageIndicator) {
            pageIndicator.innerText = `Page ${paymentsCurrentPage} / ${totalPages}`;
        }

        const btnPrev = document.getElementById('btn-payments-prev');
        const btnNext = document.getElementById('btn-payments-next');
        if (btnPrev) btnPrev.disabled = paymentsCurrentPage <= 1;
        if (btnNext) btnNext.disabled = paymentsCurrentPage >= totalPages;

        renderPaymentsTable(pageItems);
    }

    const pmSearchInput = document.getElementById('payments-search-input');
    if (pmSearchInput) {
        pmSearchInput.addEventListener('input', () => {
            paymentsCurrentPage = 1;
            applyPaymentsPagination();
        });
    }
    const pmSearchClear = document.getElementById('payments-search-clear');
    if (pmSearchClear) {
        pmSearchClear.addEventListener('click', () => {
            if (pmSearchInput) pmSearchInput.value = '';
            paymentsCurrentPage = 1;
            applyPaymentsPagination();
        });
    }

    const pmFilterSelect = document.getElementById('filter-payments-method');
    if (pmFilterSelect) {
        pmFilterSelect.addEventListener('change', () => {
            paymentsCurrentPage = 1;
            applyPaymentsPagination();
        });
    }

    function renderPaymentsTable(payments) {
        const tbody = document.getElementById('all-payments-table');
        tbody.innerHTML = '';
        if (payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 24px;">Aucun rechargement trouvé.</td></tr>`;
            return;
        }

        payments.forEach(p => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'context-menu';
            const statusStr = p.status ? p.status.toUpperCase() : 'INCONNU';
            let statusBadge = `<span class="badge badge-warning">${p.status || 'INCONNU'}</span>`;
            if (statusStr === 'PAID') statusBadge = `<span class="badge badge-success">PAYÉ</span>`;
            else if (statusStr === 'FAILED' || statusStr === 'CANCELED') statusBadge = `<span class="badge badge-danger">ÉCHOUÉ</span>`;
            else if (statusStr === 'EXPIRED') statusBadge = `<span class="badge badge-muted">EXPIRÉ</span>`;

            const amountSafe = Number(p.amount || 0).toFixed(2);
            
            tr.innerHTML = `
                <td>#${p.id}</td>
                <td style="cursor: pointer; color: var(--accent-primary);" onclick="window.redirectToUser('${p.chatId}')"><code>${p.chatId || 'N/A'}</code></td>
                <td><strong>${p.method || 'N/A'}</strong></td>
                <td><strong>${amountSafe} €</strong></td>
                <td>${statusBadge}</td>
                <td><code>${p.trackId || 'N/A'}</code></td>
                <td>${p.createdAt ? formatParisDate(p.createdAt) : 'N/A'}</td>
            `;
            tr.addEventListener('contextmenu', (e) => {
                showDynamicContextMenu(e, [
                    { label: '👤 Inspecter cet Utilisateur', action: () => window.redirectToUser(p.chatId) },
                    { label: '🛒 Voir ses Achats', action: () => window.filterTransactionsByUser(p.chatId) },
                    { divider: true },
                    { label: '📋 Copier ID Telegram', action: () => { if (p.chatId) { navigator.clipboard.writeText(String(p.chatId)); showToast(`ID ${p.chatId} copié !`, 'info'); } } },
                    { label: '💳 Copier le Track ID', action: () => { if (p.trackId) { navigator.clipboard.writeText(p.trackId); showToast(`Track ID ${p.trackId} copié !`, 'info'); } } },
                    { label: '💰 Copier le Montant', action: () => { navigator.clipboard.writeText(`${amountSafe} €`); showToast(`Montant ${amountSafe} € copié !`, 'info'); } }
                ]);
            });
            tbody.appendChild(tr);
        });
    }

    const pmPerPageSelect = document.getElementById('payments-per-page-select');
    if (pmPerPageSelect) {
        pmPerPageSelect.addEventListener('change', (e) => {
            paymentsPerPage = e.target.value;
            paymentsCurrentPage = 1;
            applyPaymentsPagination();
        });
    }
    const btnPmPrev = document.getElementById('btn-payments-prev');
    if (btnPmPrev) {
        btnPmPrev.addEventListener('click', () => {
            if (paymentsCurrentPage > 1) {
                paymentsCurrentPage--;
                applyPaymentsPagination();
            }
        });
    }
    const btnPmNext = document.getElementById('btn-payments-next');
    if (btnPmNext) {
        btnPmNext.addEventListener('click', () => {
            paymentsCurrentPage++;
            applyPaymentsPagination();
        });
    }

    const generalForm = document.getElementById('settings-general-form');
    if (generalForm) {
        generalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const val = (id) => (document.getElementById(id)?.value || '').trim();
            const payload = {
                frontendUrl: val('setting-general-frontend-url'),
                backendUrl: val('setting-general-backend-url'),
                telegramBotToken: val('setting-general-bot-token'),
                botName: val('setting-general-bot-name'),
                supportTelegram: val('setting-general-support-tg'),
                supportTelegram2: val('setting-general-support-tg-2'),
                channelTelegram: val('setting-general-channel-tg'),
                marqueeText: val('setting-general-marquee-text'),
                marqueeStyle: document.getElementById('setting-general-marquee-style')?.value || 'standard'
            };
            if (!payload.frontendUrl || !payload.telegramBotToken) {
                showToast("L'URL Frontend et le Token Telegram sont obligatoires.", 'danger');
                return;
            }
            const res = await apiRequest('/settings/general', 'POST', payload);
            if (res && res.success) {
                showToast('Configuration générale mise à jour avec succès.', 'success');
            } else {
                showToast(res && res.detail ? res.detail : 'Erreur lors de la mise à jour générale', 'danger');
            }
        });
    }

    const securityForm = document.getElementById('settings-security-form');
    if (securityForm) {
        securityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const val = (id) => (document.getElementById(id)?.value || '').trim();
            const payload = {
                apiSecretKey: val('setting-security-api-key'),
                adminSlug: val('setting-security-admin-slug'),
                jwtExpirationMinutes: parseInt(val('setting-security-jwt-exp') || '1440', 10)
            };
            if (!payload.apiSecretKey) {
                showToast('La clé secrète API ne peut pas être vide.', 'danger');
                return;
            }
            const res = await apiRequest('/settings/security', 'POST', payload);
            if (res && res.success) {
                showToast('Sécurité système et clés API mises à jour.', 'success');
            } else {
                showToast(res && res.detail ? res.detail : 'Erreur lors de la mise à jour de la sécurité', 'danger');
            }
        });
    }

    /* ===================================================================== */

    const gdForm = document.getElementById('settings-generate-docs-form');
    if (gdForm) {
        gdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isActive = document.getElementById('setting-gd-is-active')?.value === 'true';
            const flattenPdf = document.getElementById('setting-gd-flatten-pdf')?.value === 'true';
            const previewOff = document.getElementById('setting-gd-preview-off')?.value === 'true';
            const previewCooldownEnabled = document.getElementById('setting-gd-cooldown-enabled')?.value === 'true';
            const previewCooldownSeconds = parseInt(document.getElementById('setting-gd-cooldown-seconds')?.value || '30', 10);

            const nextSubcategories = {};
            if (currentGenerateDocsData && currentGenerateDocsData.subcategories) {
                Object.keys(currentGenerateDocsData.subcategories).forEach(catKey => {
                    const originalCat = currentGenerateDocsData.subcategories[catKey] || {};
                    const catToggle = document.querySelector(`.gd-cat-enable-toggle[data-cat="${catKey}"]`);
                    const isEnabled = catToggle ? catToggle.checked : (originalCat.enabled !== false);

                    const nextDocs = {};
                    if (originalCat.documents) {
                        Object.keys(originalCat.documents).forEach(docKey => {
                            const docBox = document.querySelector(`.gd-doc-toggle[data-cat="${catKey}"][data-doc="${docKey}"]`);
                            const origVal = originalCat.documents[docKey];
                            const fallbackVal = typeof origVal === 'boolean' ? origVal : (origVal?.enabled !== false);
                            const docEnabled = docBox ? docBox.checked : fallbackVal;
                            nextDocs[docKey] = { enabled: docEnabled };
                        });
                    }

                    nextSubcategories[catKey] = {
                        enabled: isEnabled,
                        documents: nextDocs
                    };
                });
            }

            const nextPrices = {};
            document.querySelectorAll('.gd-price-input').forEach(input => {
                const key = input.getAttribute('data-key');
                const val = parseFloat(input.value);
                if (key && !isNaN(val)) {
                    nextPrices[key] = val;
                }
            });

            const payload = {
                isActive,
                flattenPdf,
                previewOff,
                previewCooldownEnabled,
                previewCooldownSeconds,
                subcategories: nextSubcategories,
                prices: nextPrices
            };

            const res = await apiRequest('/settings/generate-docs', 'POST', payload);
            if (res && res.success) {
                showToast('Configuration et accès Generate Docs enregistrés.', 'success');
            } else {
                showToast(res && res.detail ? res.detail : 'Erreur lors de la sauvegarde Generate Docs', 'danger');
            }
        });
    }

    const limitsForm = document.getElementById('settings-limits-form');
    if (limitsForm) {
        limitsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const val = (id) => (document.getElementById(id)?.value || '').trim();
            const payload = {
                paymentEnabled: document.getElementById('setting-limits-enabled')?.value === 'true',
                minPaymentAmount: parseFloat(val('setting-limits-min') || '1'),
                maxPaymentAmount: parseFloat(val('setting-limits-max') || '500'),
                maxPendingPaymentsPerClient: parseInt(val('setting-limits-max-pending') || '2', 10)
            };
            const res = await apiRequest('/settings/payments-limits', 'POST', payload);
            if (res && res.success) {
                showToast('Règles et limites de paiement mises à jour.', 'success');
            } else {
                showToast(res && res.detail ? res.detail : 'Erreur lors de la mise à jour des limites', 'danger');
            }
        });
    }

    const sumupForm = document.getElementById('settings-sumup-form');
    if (sumupForm) {
        sumupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const val = (id) => (document.getElementById(id)?.value || '').trim();
            const active = document.querySelector('input[name="sumup-active"]:checked')?.value || '';
            const payload = {
                active,
                expiration_minutes: val('sumup-expiration'),
                banks: {
                    sumup: {
                        name: val('sumup1-name'),
                        pay_to_email: val('sumup1-email'),
                        api_key: val('sumup1-api-key'),
                        client_id: val('sumup1-client-id'),
                        client_secret: val('sumup1-client-secret')
                    },
                    sumup_bank2: {
                        name: val('sumup2-name'),
                        pay_to_email: val('sumup2-email'),
                        api_key: val('sumup2-api-key'),
                        client_id: val('sumup2-client-id'),
                        client_secret: val('sumup2-client-secret')
                    }
                }
            };
            const champs = [
                payload.active,
                payload.expiration_minutes,
                payload.banks.sumup.name, payload.banks.sumup.pay_to_email, payload.banks.sumup.api_key, payload.banks.sumup.client_id, payload.banks.sumup.client_secret,
                payload.banks.sumup_bank2.name, payload.banks.sumup_bank2.pay_to_email, payload.banks.sumup_bank2.api_key, payload.banks.sumup_bank2.client_id, payload.banks.sumup_bank2.client_secret
            ];
            if (champs.some(x => !x) || (payload.active !== 'sumup' && payload.active !== 'sumup_bank2') || !(Number(payload.expiration_minutes) > 0)) {
                showToast('Tous les champs SumUp des deux banques sont obligatoires.', 'danger');
                return;
            }
            const res = await apiRequest('/settings/sumup', 'POST', payload);
            if (res && res.success) {
                showToast('Comptes SumUp enregistrés.', 'success');
            }
        });
    }

    const oxapayForm = document.getElementById('settings-oxapay-form');
    if (oxapayForm) {
        oxapayForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const api_key = (document.getElementById('setting-oxapay-key')?.value || '').trim();
            if (!api_key) {
                showToast('La clé OxaPay ne peut pas être vide.', 'danger');
                return;
            }
            const res = await apiRequest('/settings/oxapay', 'POST', { api_key });
            if (res && res.success) {
                showToast('Clé OxaPay enregistrée.', 'success');
            }
        });
    }

    function iptvAccountComplet(acc) {
        return !!(acc && String(acc.api_key || '').trim() && String(acc.api_url || '').trim() && String(acc.pack || '').trim());
    }

    function renderIptvAccounts(accounts) {
        const list = document.getElementById('iptv-accounts-list');
        if (!list) return;
        list.innerHTML = '';
        const complets = Array.isArray(accounts) ? accounts.filter(iptvAccountComplet) : [];
        const rows = complets.length ? complets : [{ name: '', api_key: '', api_url: '', pack: '', active: true }];
        rows.forEach((acc) => list.appendChild(createIptvAccountRow(acc)));
        if (!list.querySelector('.iptv-acc-active:checked')) {
            const first = list.querySelector('.iptv-acc-active');
            if (first) first.checked = true;
        }
    }

    function createIptvAccountRow(acc) {
        const wrap = document.createElement('div');
        wrap.className = 'iptv-account-row';
        wrap.style.cssText = 'border: 1px solid var(--border, #2a2a3a); border-radius: 10px; padding: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;';
        wrap.innerHTML = `
            <div class="form-group" style="grid-column: 1 / -1; display: flex; align-items: center; gap: 10px;">
                <label class="form-label" style="margin: 0; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="radio" name="iptv-acc-active" class="iptv-acc-active">
                    Compte actif (utilisé pour les achats)
                </label>
            </div>
            <div class="form-group">
                <label class="form-label">Nom</label>
                <input type="text" class="form-input iptv-acc-name" placeholder="Compte 1" value="">
            </div>
            <div class="form-group">
                <label class="form-label">Pack</label>
                <input type="text" class="form-input iptv-acc-pack" placeholder="43551" value="">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">API Key</label>
                <input type="text" class="form-input iptv-acc-key" placeholder="api_key" value="">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">API URL</label>
                <input type="text" class="form-input iptv-acc-url" placeholder="https://4k.cms-only.ru/api/api.php" value="">
            </div>
            <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end;">
                <button type="button" class="btn iptv-acc-remove" style="background: transparent; color: #f87171; border: 1px solid rgba(248,113,113,0.4);">Supprimer</button>
            </div>
        `;
        wrap.querySelector('.iptv-acc-name').value = acc.name || '';
        wrap.querySelector('.iptv-acc-pack').value = acc.pack || '';
        wrap.querySelector('.iptv-acc-key').value = acc.api_key || '';
        wrap.querySelector('.iptv-acc-url').value = acc.api_url || '';
        wrap.querySelector('.iptv-acc-active').checked = !!acc.active;
        wrap.querySelector('.iptv-acc-remove').addEventListener('click', () => {
            const list = document.getElementById('iptv-accounts-list');
            if (list && list.children.length > 1) wrap.remove();
            else showToast('Garde au moins un compte, ou vide les champs.', 'warning');
        });
        return wrap;
    }

    function collectIptvAccounts() {
        return Array.from(document.querySelectorAll('.iptv-account-row')).map((row) => ({
            name: row.querySelector('.iptv-acc-name')?.value.trim() || '',
            api_key: row.querySelector('.iptv-acc-key')?.value.trim() || '',
            api_url: row.querySelector('.iptv-acc-url')?.value.trim() || '',
            pack: row.querySelector('.iptv-acc-pack')?.value.trim() || '',
            active: !!row.querySelector('.iptv-acc-active')?.checked
        })).filter(iptvAccountComplet);
    }

    const btnAddIptvAccount = document.getElementById('btn-add-iptv-account');
    if (btnAddIptvAccount) {
        btnAddIptvAccount.addEventListener('click', () => {
            const list = document.getElementById('iptv-accounts-list');
            if (list) list.appendChild(createIptvAccountRow({ name: '', api_key: '', api_url: '', pack: '' }));
        });
    }

    const btnTestIptvApi = document.getElementById('btn-test-iptv-api');
    if (btnTestIptvApi) {
        btnTestIptvApi.addEventListener('click', async () => {
            const resultEl = document.getElementById('iptv-api-test-result');
            if (resultEl) resultEl.textContent = 'Connexion en cours…';
            const res = await apiRequest('/iptv/api-test', 'POST', {});
            if (res && res.success) {
                const name = res.stats?.name || '?';
                const pack = res.stats?.pack || '?';
                const type = res.stats?.type || '?';
                const credits = res.stats?.credits;
                let msg = `Connecté. Compte : ${name} — Pack : ${pack} — Type : ${type}`;
                if (credits) msg += ` — Crédits : ${credits}`;
                if (resultEl) resultEl.textContent = msg;
                showToast('Connexion API OK', 'success');
            } else if (resultEl) {
                resultEl.textContent = res?.message || 'Échec de la connexion API';
            }
        });
    }

    function renderIptvPanelAccounts(accounts) {
        const list = document.getElementById('iptv-panel-accounts-list');
        if (!list) return;
        list.innerHTML = '';
        const rows = Array.isArray(accounts) && accounts.length ? accounts : [{ name: '', username: '', password: '', active: true }];
        rows.forEach((acc) => list.appendChild(createIptvPanelAccountRow(acc)));
        if (!list.querySelector('.iptv-panel-acc-active:checked')) {
            const first = list.querySelector('.iptv-panel-acc-active');
            if (first) first.checked = true;
        }
    }

    function createIptvPanelAccountRow(acc) {
        const wrap = document.createElement('div');
        wrap.className = 'iptv-panel-account-row';
        wrap.style.cssText = 'border: 1px solid var(--border, #2a2a3a); border-radius: 10px; padding: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;';
        wrap.innerHTML = `
            <div class="form-group" style="grid-column: 1 / -1; display: flex; align-items: center; gap: 10px;">
                <label class="form-label" style="margin: 0; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="radio" name="iptv-panel-acc-active" class="iptv-panel-acc-active">
                    Compte actif (connexion panel)
                </label>
            </div>
            <div class="form-group">
                <label class="form-label">Nom</label>
                <input type="text" class="form-input iptv-panel-acc-name" placeholder="ChezRheyy" value="">
            </div>
            <div class="form-group">
                <label class="form-label">Utilisateur</label>
                <input type="text" class="form-input iptv-panel-acc-user" placeholder="username" value="">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">Mot de passe</label>
                <input type="text" class="form-input iptv-panel-acc-pass" placeholder="mot de passe" autocomplete="off" value="">
            </div>
            <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end;">
                <button type="button" class="btn iptv-panel-acc-remove" style="background: transparent; color: #f87171; border: 1px solid rgba(248,113,113,0.4);">Supprimer</button>
            </div>
        `;
        wrap.querySelector('.iptv-panel-acc-name').value = acc.name || '';
        wrap.querySelector('.iptv-panel-acc-user').value = acc.username || '';
        wrap.querySelector('.iptv-panel-acc-pass').value = acc.password || '';
        wrap.querySelector('.iptv-panel-acc-active').checked = !!acc.active;
        wrap.querySelector('.iptv-panel-acc-remove').addEventListener('click', () => {
            const list = document.getElementById('iptv-panel-accounts-list');
            if (list && list.children.length > 1) wrap.remove();
            else showToast('Garde au moins un compte panel, ou vide les champs.', 'warning');
        });
        return wrap;
    }

    function collectIptvPanelAccounts() {
        return Array.from(document.querySelectorAll('.iptv-panel-account-row')).map((row) => ({
            name: row.querySelector('.iptv-panel-acc-name')?.value.trim() || '',
            username: row.querySelector('.iptv-panel-acc-user')?.value.trim() || '',
            password: row.querySelector('.iptv-panel-acc-pass')?.value.trim() || '',
            active: !!row.querySelector('.iptv-panel-acc-active')?.checked
        }));
    }

    const btnAddIptvPanelAccount = document.getElementById('btn-add-iptv-panel-account');
    if (btnAddIptvPanelAccount) {
        btnAddIptvPanelAccount.addEventListener('click', () => {
            const list = document.getElementById('iptv-panel-accounts-list');
            if (list) list.appendChild(createIptvPanelAccountRow({ name: '', username: '', password: '' }));
        });
    }

    const btnTestIptvPanel = document.getElementById('btn-test-iptv-panel');
    if (btnTestIptvPanel) {
        btnTestIptvPanel.addEventListener('click', async () => {
            const resultEl = document.getElementById('iptv-panel-test-result');
            if (resultEl) resultEl.textContent = 'Connexion en cours…';
            const res = await apiRequest('/iptv/panel-test', 'POST', {});
            if (res && res.success) {
                const credits = res.stats?.credits ?? '?';
                const demos = res.stats?.remaining_demos ?? '?';
                if (resultEl) resultEl.textContent = `Connecté. Crédits : ${credits} — Démos restantes : ${demos}`;
                showToast('Connexion panel OK', 'success');
            } else if (resultEl) {
                resultEl.textContent = res?.message || 'Échec de la connexion panel';
            }
        });
    }

    document.getElementById('settings-iptv-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const host = document.getElementById('setting-iptv-host') ? document.getElementById('setting-iptv-host').value.trim() : '';
        const type = document.getElementById('setting-iptv-type') ? document.getElementById('setting-iptv-type').value.trim() : '';
        const footer = document.getElementById('setting-iptv-footer') ? document.getElementById('setting-iptv-footer').value : '';
        const p1 = document.getElementById('setting-iptv-1m').value.trim();
        const p3 = document.getElementById('setting-iptv-3m').value.trim();
        const p6 = document.getElementById('setting-iptv-6m').value.trim();
        const p12 = document.getElementById('setting-iptv-12m').value.trim();
        const pDemo = document.getElementById('setting-iptv-demo') ? document.getElementById('setting-iptv-demo').value.trim() : '';
        const isDemoEnabled = document.getElementById('setting-iptv-demo-enabled') ? (document.getElementById('setting-iptv-demo-enabled').value === 'true') : false;
        const accounts = collectIptvAccounts();
        const panel_accounts = collectIptvPanelAccounts();

        const res = await apiRequest('/settings/iptv', 'POST', {
            host,
            type,
            message_footer: footer,
            price_1m: p1,
            price_3m: p3,
            price_6m: p6,
            price_12m: p12,
            price_demo: pDemo,
            demo_enabled: isDemoEnabled,
            accounts,
            panel_accounts
        });
        if (res && res.success) {
            showToast('Configuration et tarifs IPTV enregistrés !', 'success');
        }
    });

    const pwdForm = document.getElementById('settings-password-form');
    if (pwdForm) {
        pwdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pass = document.getElementById('setting-admin-password').value;
            const confirmPass = document.getElementById('setting-admin-password-confirm').value;

            if (pass !== confirmPass) {
                showToast('Les mots de passe ne correspondent pas', 'danger');
                return;
            }

            const res = await apiRequest('/settings/password', 'POST', { password: pass });
            if (res && res.success) {
                if (res.token) {
                    authToken = res.token;
                    localStorage.setItem('admin_auth_token', res.token);
                    localStorage.setItem('admin_auth_token_time', Date.now().toString());
                }
                showToast('Mot de passe administrateur mis à jour avec succès !', 'success');
                document.getElementById('setting-admin-password').value = '';
                document.getElementById('setting-admin-password-confirm').value = '';
            } else {
                showToast(res ? res.message : 'Erreur lors du changement de mot de passe', 'danger');
            }
        });
    }

    /* ===================================================================== */

    let dbTablesList = [];
    let currentDbTable = '';
    let currentDbPage = 1;
    let currentDbLimit = 25;
    let currentDbSearch = '';
    let currentDbSortCol = null;
    let currentDbSortDir = 'asc';
    let currentDbRows = [];
    let currentDbColumns = [];
    let dbSearchTimeout = null;
    let dbStudioInitialized = false;

    function getDbTypeClass(typeStr) {
        if (!typeStr) return 'db-type-text';
        const t = String(typeStr).toLowerCase();
        if (t.includes('int') || t.includes('serial') || t.includes('numeric') || t.includes('double') || t.includes('real')) return 'db-type-int';
        if (t.includes('uuid')) return 'db-type-uuid';
        if (t.includes('json')) return 'db-type-json';
        if (t.includes('bool')) return 'db-type-bool';
        if (t.includes('time') || t.includes('date')) return 'db-type-time';
        return 'db-type-text';
    }

    async function loadDatabaseStudio() {
        initDbStudioListeners();
        const res = await apiRequest('/database/tables', 'GET');
        if (!res || !res.tables || !Array.isArray(res.tables)) {
            showToast('Impossible de charger les tables de la base de données', 'danger');
            return;
        }

        dbTablesList = res.tables;
        if (dbTablesList.length === 0) {
            document.getElementById('db-tables-pills').innerHTML = '<span style="color: var(--text-muted); font-size: 13px;">Aucune table trouvée</span>';
            return;
        }

        if (!currentDbTable || !dbTablesList.find(t => t.name === currentDbTable)) {
            const defaultTable = dbTablesList.find(t => t.name === 'users') || dbTablesList[0];
            currentDbTable = defaultTable.name;
        }

        renderDbTablesPills();
        fetchDbTableData();
    }

    function renderDbTablesPills() {
        const container = document.getElementById('db-tables-pills');
        if (!container) return;

        container.innerHTML = dbTablesList.map(t => {
            const isActive = t.name === currentDbTable;
            return `
                <button type="button" class="db-pill ${isActive ? 'active' : ''}" data-table="${escapeHtml(t.name)}">
                    <span>${escapeHtml(t.name)}</span>
                    <span class="db-pill-count">${t.count || 0}</span>
                </button>
            `;
        }).join('');

        container.querySelectorAll('.db-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const tbl = btn.getAttribute('data-table');
                if (tbl === currentDbTable) return;
                currentDbTable = tbl;
                currentDbPage = 1;
                currentDbSearch = '';
                currentDbSortCol = null;
                currentDbSortDir = 'asc';
                const searchInp = document.getElementById('db-search-input');
                if (searchInp) searchInp.value = '';
                renderDbTablesPills();
                fetchDbTableData();
            });
        });
    }

    function initDbStudioListeners() {
        if (dbStudioInitialized) return;
        dbStudioInitialized = true;

        const refreshBtn = document.getElementById('db-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                showToast('Actualisation de la table...', 'info');
                loadDatabaseStudio();
            });
        }

        const limitSelect = document.getElementById('db-limit-select');
        if (limitSelect) {
            limitSelect.addEventListener('change', (e) => {
                currentDbLimit = parseInt(e.target.value, 10) || 25;
                currentDbPage = 1;
                fetchDbTableData();
            });
        }

        const prevBtn = document.getElementById('db-prev-page-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentDbPage > 1) {
                    currentDbPage--;
                    fetchDbTableData();
                }
            });
        }

        const nextBtn = document.getElementById('db-next-page-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentDbPage++;
                fetchDbTableData();
            });
        }

        const searchInput = document.getElementById('db-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(dbSearchTimeout);
                dbSearchTimeout = setTimeout(() => {
                    currentDbSearch = e.target.value.trim();
                    currentDbPage = 1;
                    fetchDbTableData();
                }, 300);
            });
        }
    }

    async function fetchDbTableData() {
        if (!currentDbTable) return;

        const thead = document.getElementById('db-table-head');
        const tbody = document.getElementById('db-table-body');
        if (!thead || !tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="100" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <div style="font-size: 24px; margin-bottom: 8px;">🔄</div>
                    Chargement des enregistrements...
                </td>
            </tr>
        `;

        let url = `/database/query?table=${encodeURIComponent(currentDbTable)}&page=${currentDbPage}&limit=${currentDbLimit}`;
        if (currentDbSearch) {
            url += `&search=${encodeURIComponent(currentDbSearch)}`;
        }
        if (currentDbSortCol) {
            url += `&sort_col=${encodeURIComponent(currentDbSortCol)}&sort_dir=${currentDbSortDir}`;
        }

        const data = await apiRequest(url, 'GET');
        if (!data || !data.columns) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="100" style="text-align: center; padding: 40px; color: var(--danger);">
                        Erreur lors du chargement des données de la table
                    </td>
                </tr>
            `;
            return;
        }

        currentDbColumns = data.columns || [];
        currentDbRows = data.rows || [];
        const total = data.total || 0;
        const totalPages = Math.max(1, Math.ceil(total / currentDbLimit));

        const totalBadge = document.getElementById('db-total-records-badge');
        if (totalBadge) {
            totalBadge.innerText = `${total} enregistrement${total > 1 ? 's' : ''}`;
        }

        const pageIndicator = document.getElementById('db-page-indicator');
        if (pageIndicator) {
            pageIndicator.innerText = `Page ${currentDbPage} / ${totalPages}`;
        }

        const prevBtn = document.getElementById('db-prev-page-btn');
        const nextBtn = document.getElementById('db-next-page-btn');
        if (prevBtn) prevBtn.disabled = currentDbPage <= 1;
        if (nextBtn) nextBtn.disabled = currentDbPage >= totalPages;

        function formatDbTypeLabel(typeStr) {
            if (!typeStr) return 'text';
            const t = String(typeStr).toLowerCase();
            if (t.includes('timestamp') || t.includes('date')) return 'timestamp';
            if (t.includes('character varying') || t.includes('varchar')) return 'varchar';
            if (t === 'text') return 'text';
            if (t === 'bigint') return 'bigint';
            if (t.includes('int') || t.includes('serial')) return 'int';
            if (t.includes('numeric') || t.includes('decimal')) return 'numeric';
            if (t.includes('bool')) return 'bool';
            if (t.includes('json')) return 'json';
            if (t.includes('uuid')) return 'uuid';
            return t.length > 12 ? t.substring(0, 10) + '..' : t;
        }

        thead.innerHTML = `
            <tr>
                ${currentDbColumns.map(col => {
                    const cleanType = formatDbTypeLabel(col.type);
                    const typeClass = getDbTypeClass(col.type);
                    const isSorted = currentDbSortCol === col.name;
                    const arrow = isSorted ? (currentDbSortDir === 'asc' ? ' ↑' : ' ↓') : '';
                    const isKey = col.name === 'id';
                    return `
                        <th class="db-th" data-col="${escapeHtml(col.name)}" style="cursor: pointer; user-select: none; padding: 10px 14px; text-align: left; white-space: nowrap; background: #0c0f16; border-bottom: 1px solid var(--border-color);">
                            <span style="font-weight: 600; color: ${isSorted ? '#fff' : 'var(--text-primary)'}; font-size: 12px;">${isKey ? '🔑 ' : ''}${escapeHtml(col.name)}</span>
                            <span class="db-col-type ${typeClass}">${cleanType}</span>
                            <span style="color: var(--accent-primary); font-size: 11px; font-weight: bold;">${arrow}</span>
                        </th>
                    `;
                }).join('')}
                <th style="padding: 10px 14px; text-align: right; width: 90px; white-space: nowrap; background: #0c0f16; border-bottom: 1px solid var(--border-color); font-size: 12px; color: var(--text-muted);">Actions</th>
            </tr>
        `;

        thead.querySelectorAll('.db-th').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.getAttribute('data-col');
                if (currentDbSortCol === col) {
                    currentDbSortDir = currentDbSortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    currentDbSortCol = col;
                    currentDbSortDir = 'asc';
                }
                fetchDbTableData();
            });
        });

        try {
            if (currentDbRows.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="${currentDbColumns.length + 1}" style="text-align: center; padding: 50px; color: var(--text-muted);">
                            <div style="font-size: 28px; margin-bottom: 8px;">📭</div>
                            Aucun enregistrement trouvé dans cette table
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = currentDbRows.map((row, rIdx) => {
                return `
                    <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                        ${currentDbColumns.map(col => {
                            const val = row[col.name];
                            return `<td style="padding: 10px 14px; font-size: 12px; vertical-align: middle; white-space: nowrap; max-width: 280px; overflow: hidden; text-overflow: ellipsis;">
                                ${renderDbCellValue(val, col, rIdx)}
                            </td>`;
                        }).join('')}
                        <td style="padding: 10px 14px; text-align: right; white-space: nowrap; vertical-align: middle;">
                            <button type="button" class="db-inspect-btn" onclick="openDbRowDetailModal(${rIdx})">
                                🔍 Détails
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (renderErr) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="100" style="text-align: center; padding: 40px; color: var(--danger);">
                        Erreur de rendu : ${escapeHtml(renderErr.message)}
                    </td>
                </tr>
            `;
        }
    }

    function renderDbCellValue(val, col, rIdx) {
        try {
            if (val === null || val === undefined) {
                return '<span class="db-cell-null">null</span>';
            }
            if (typeof val === 'boolean') {
                return `<span class="${val ? 'db-cell-bool-true' : 'db-cell-bool-false'}">${val ? 'true' : 'false'}</span>`;
            }
            if (typeof val === 'object') {
                return `<button type="button" class="db-json-btn" onclick="openDbJsonModal(${rIdx}, '${escapeHtml(col.name)}')">{ } JSON</button>`;
            }
            const strVal = String(val);
            const colType = (col.type || '').toLowerCase();
            if (colType.includes('time') || colType.includes('date')) {
                const formatted = typeof formatParisDate === 'function' ? formatParisDate(strVal) : strVal;
                return `<span style="font-family: monospace; font-size: 11px; color: #a5b4fc;">${escapeHtml(formatted)}</span>`;
            }
            if (colType.includes('uuid')) {
                return `<span style="font-family: monospace; font-size: 11px; color: #c084fc;">${escapeHtml(strVal)}</span>`;
            }
            if (strVal.length > 50) {
                return `<span title="${escapeHtml(strVal)}">${escapeHtml(strVal.substring(0, 48))}...</span>`;
            }
            return escapeHtml(strVal);
        } catch {
            return escapeHtml(String(val));
        }
    }

    window.openDbJsonModal = (rowIndex, colName) => {
        const row = currentDbRows[rowIndex];
        if (!row) return;
        const val = row[colName];
        let jsonStr = '';
        try {
            jsonStr = typeof val === 'string' ? JSON.stringify(JSON.parse(val), null, 2) : JSON.stringify(val, null, 2);
        } catch {
            jsonStr = String(val);
        }

        const html = `
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; color: var(--text-muted); font-family: monospace;">Colonne : <strong>${escapeHtml(colName)}</strong></span>
                <button type="button" class="action-btn" id="db-copy-json-btn" style="padding: 4px 10px; font-size: 11px;">📋 Copier</button>
            </div>
            <pre class="db-json-pre" id="db-json-content">${escapeHtml(jsonStr)}</pre>
        `;

        openModal(`Inspecteur JSON — ${escapeHtml(colName)}`, html, null);

        setTimeout(() => {
            const copyBtn = document.getElementById('db-copy-json-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(jsonStr);
                    showToast('JSON copié dans le presse-papier !', 'success');
                });
            }
        }, 50);
    };

    window.openDbRowDetailModal = (rowIndex) => {
        const row = currentDbRows[rowIndex];
        if (!row) return;

        const rowsHtml = currentDbColumns.map(col => {
            const val = row[col.name];
            let displayVal = '';
            if (val === null || val === undefined) {
                displayVal = '<span class="db-cell-null">null</span>';
            } else if (typeof val === 'boolean') {
                displayVal = `<span class="${val ? 'db-cell-bool-true' : 'db-cell-bool-false'}">${val ? 'true' : 'false'}</span>`;
            } else if (typeof val === 'object') {
                const pretty = JSON.stringify(val, null, 2);
                displayVal = `<pre class="db-json-pre" style="max-height: 180px; margin: 4px 0 0 0; padding: 8px;">${escapeHtml(pretty)}</pre>`;
            } else {
                displayVal = `<span style="font-family: monospace;">${escapeHtml(String(val))}</span>`;
            }

            const typeClass = getDbTypeClass(col.type);
            return `
                <tr>
                    <th style="padding: 8px 12px; border-bottom: 1px solid var(--border-color); text-align: left; vertical-align: top; width: 35%;">
                        <div style="font-weight: 600; color: #fff;">${escapeHtml(col.name)}</div>
                        <span class="db-col-type ${typeClass}">${escapeHtml(col.type)}</span>
                    </th>
                    <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color); vertical-align: middle;">
                        ${displayVal}
                    </td>
                </tr>
            `;
        }).join('');

        const html = `
            <div style="max-height: 60vh; overflow-y: auto; padding-right: 4px;">
                <table class="db-detail-table" style="width: 100%; border-collapse: collapse;">
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;

        openModal(`Détails Enregistrement #${rowIndex + 1} (${escapeHtml(currentDbTable)})`, html, null);
    };

    /* ===================================================================== */

    if (authToken) {
        initApp();
    }
});
