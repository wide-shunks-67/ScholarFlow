/**
 * ScholarFlow — 100% Client-Side Academic Outreach Engine (v2.0)
 * Modern Vertical Layout, 7,055+ Verified Mentors from Excel,
 * Offline-Ready Pipeline Tracker, Native Web Speech Synthesizer.
 */

// Application State
const state = {
  currentRoute: 'landing', // 'landing' (/) or 'app' (/app)
  activeTab: 'directory',
  professors: [],
  filteredProfessors: [],
  institutions: [],
  departments: [],
  currentPage: 1,
  pageSize: 24,
  selectedProfessor: null,
  studioMode: 'template', // 'template' or 'ai'
  activeTemplateType: 'A',
  roadmapStages: [],
  roadmapProgress: JSON.parse(localStorage.getItem('scholarflow_roadmap_progress') || '{}'),
  applications: JSON.parse(localStorage.getItem('scholarflow_pipeline') || '[]'),
  smartDraft: null,
  isSpeaking: false
};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  initRouter();
  initIcons();
  setupEventListeners();
  loadSavedStudentProfile();
  updateUserDisplay();

  // Load Data client-side
  loadFacultyData();
  loadRoadmapData();
  updateTrackerMetrics();
  renderApplicationsTable();
});

// --- CLIENT-SIDE ROUTER (Landing: / vs Workspace: /app) ---
function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash || '#/';
  
  if (hash.startsWith('#/app') || hash.startsWith('#app')) {
    showAppView();
    // Parse query params (e.g. ?tab=studio)
    const urlParams = new URLSearchParams(hash.split('?')[1] || '');
    const tabParam = urlParams.get('tab');
    if (tabParam && ['directory', 'studio', 'roadmap', 'tracker'].includes(tabParam)) {
      switchTab(tabParam, false);
    } else {
      switchTab(state.activeTab || 'directory', false);
    }
  } else {
    // Check if the hash is an in-page anchor on the landing page (e.g. #start-here, #privacy)
    const isAnchor = hash.startsWith('#') && !hash.startsWith('#/') && hash.length > 1;
    showLandingView(isAnchor);

    if (isAnchor) {
      const targetId = hash.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    }
  }
}

function navigateTo(route) {
  if (window.location.hash === route) {
    handleRoute();
  } else {
    window.location.hash = route;
  }
}

function showLandingView(isAnchor = false) {
  state.currentRoute = 'landing';
  const landingEl = document.getElementById('view-landing');
  const appEl = document.getElementById('view-app');
  
  if (landingEl) {
    landingEl.classList.remove('hidden');
    landingEl.style.display = 'flex';
  }
  if (appEl) {
    appEl.classList.add('hidden');
    appEl.style.display = 'none';
  }

  // Restore document scrolling for landing page
  document.body.classList.remove('overflow-hidden');
  document.documentElement.classList.remove('overflow-hidden');

  if (!isAnchor) {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  initIcons();
}

function showAppView() {
  state.currentRoute = 'app';
  const landingEl = document.getElementById('view-landing');
  const appEl = document.getElementById('view-app');
  
  if (landingEl) {
    landingEl.classList.add('hidden');
    landingEl.style.display = 'none';
  }
  if (appEl) {
    appEl.classList.remove('hidden');
    appEl.style.display = 'flex';
  }

  // Lock outer page scrolling in workspace mode
  document.body.classList.add('overflow-hidden');
  document.documentElement.classList.add('overflow-hidden');

  window.scrollTo({ top: 0, behavior: 'instant' });
  document.getElementById('app-main-scroll')?.scrollTo({ top: 0, behavior: 'instant' });
  initIcons();
}

function toggleMobileLandingMenu() {
  const menu = document.getElementById('landing-mobile-menu');
  const icon = document.getElementById('landing-mobile-menu-icon');
  if (!menu) return;

  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (icon) icon.setAttribute('data-lucide', 'x');
  } else {
    menu.classList.add('hidden');
    if (icon) icon.setAttribute('data-lucide', 'menu');
  }
  initIcons();
}

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function updateUserDisplay() {
  const name = document.getElementById('student-name-input')?.value.trim() || 'Aarav Sharma';
  const college = document.getElementById('student-inst-input')?.value.trim() || 'NIT Trichy';
  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarCollege = document.getElementById('sidebar-user-college');
  const initialsEl = document.getElementById('user-avatar-initials');

  if (sidebarName) sidebarName.textContent = name;
  if (sidebarCollege) sidebarCollege.textContent = college;
  if (initialsEl) {
    const parts = name.split(' ').filter(Boolean);
    initialsEl.textContent = parts.length > 1 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
      : name.substring(0, 2).toUpperCase();
  }
}

// --- VERTICAL TAB NAVIGATION ---
function switchTab(tabName, updateHash = true) {
  state.activeTab = tabName;
  
  if (updateHash && state.currentRoute === 'app') {
    history.replaceState(null, '', `#/app?tab=${tabName}`);
  }

  // On mobile screens, auto-close sidebar when a tab is selected
  if (window.innerWidth < 1024) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.classList.contains('hidden')) {
      sidebar.classList.add('hidden');
    }
  }

  // Hide all sections
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  
  // Show selected tab
  const activeSection = document.getElementById(`tab-${tabName}`);
  if (activeSection) activeSection.classList.remove('hidden');

  // Update vertical navigation button active styles
  document.querySelectorAll('aside nav button').forEach(btn => {
    btn.classList.remove('active-nav-item', 'text-accent-600');
    btn.classList.add('text-slate-500');
    btn.removeAttribute('aria-current');
  });

  const activeBtn = document.getElementById(`nav-btn-${tabName}`);
  if (activeBtn) {
    activeBtn.classList.add('active-nav-item');
    activeBtn.classList.remove('text-slate-500');
    activeBtn.setAttribute('aria-current', 'page');
  }

  // Update breadcrumb
  const breadcrumb = document.getElementById('header-breadcrumb');
  if (breadcrumb) {
    const titles = {
      'directory': 'Faculty Directory',
      'studio': 'Academic Email Studio',
      'roadmap': '6-Week Preparation Roadmap',
      'tracker': 'Outreach Pipeline Tracker'
    };
    breadcrumb.textContent = titles[tabName] || 'Workspace';
  }

  // Scroll workspace content area to top when switching tabs
  document.getElementById('app-main-scroll')?.scrollTo({ top: 0, behavior: 'instant' });

  // Refresh tab-specific views
  if (tabName === 'directory') renderFacultyDirectory();
  if (tabName === 'studio') refreshEmailStudioPreview();
  if (tabName === 'roadmap') renderRoadmap();
  if (tabName === 'tracker') renderApplicationsTable();

  initIcons();
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('hidden');
  }
}

// --- 100% CLIENT-SIDE DATA LOADING ---
function loadFacultyData() {
  if (window.SCHOLARFLOW_PROFESSORS && Array.isArray(window.SCHOLARFLOW_PROFESSORS)) {
    state.professors = window.SCHOLARFLOW_PROFESSORS;
  } else {
    // Fallback to fetch if opened via http
    fetch('professors.json')
      .then(res => res.json())
      .then(data => {
        state.professors = data;
        processFacultyData();
      })
      .catch(err => console.error('Faculty load error:', err));
    return;
  }
  processFacultyData();
}

function processFacultyData() {
  state.professors.forEach((p, idx) => {
    if (!p.id) p.id = `prof-${idx + 1}`;
  });

  const instSet = new Set();
  const deptSet = new Set();
  state.professors.forEach(p => {
    if (p.institution) instSet.add(p.institution.trim());
    if (p.department) deptSet.add(p.department.trim());
  });
  state.institutions = Array.from(instSet).sort();
  state.departments = Array.from(deptSet).sort();

  populateFilterDropdowns();
  filterFaculty();

  const totalCount = state.professors.length.toLocaleString();
  const navBadge = document.getElementById('nav-badge-professors');
  const sideCounter = document.getElementById('sidebar-total-counter');
  const dirBadge = document.getElementById('dir-total-badge');
  if (navBadge) navBadge.textContent = totalCount;
  if (sideCounter) sideCounter.textContent = totalCount;
  if (dirBadge) dirBadge.textContent = `${totalCount} Verified Mentors`;

  if (state.professors.length > 0 && !state.selectedProfessor) {
    state.selectedProfessor = state.professors[0];
    updateSelectedProfessorUI();
  }
}

function loadRoadmapData() {
  if (window.SCHOLARFLOW_ROADMAP && Array.isArray(window.SCHOLARFLOW_ROADMAP)) {
    state.roadmapStages = window.SCHOLARFLOW_ROADMAP;
    renderRoadmap();
  } else {
    fetch('roadmap.json')
      .then(res => res.json())
      .then(data => {
        state.roadmapStages = data;
        renderRoadmap();
      })
      .catch(err => console.error('Roadmap load error:', err));
  }
}

// --- FACULTY DIRECTORY LOGIC ---
function populateFilterDropdowns() {
  const instSelect = document.getElementById('faculty-institution-filter');
  const deptSelect = document.getElementById('faculty-department-filter');

  if (instSelect) {
    instSelect.innerHTML = `<option value="">All Institutes (${state.institutions.length})</option>`;
    state.institutions.forEach(inst => {
      const opt = document.createElement('option');
      opt.value = inst;
      opt.textContent = inst;
      instSelect.appendChild(opt);
    });
  }

  if (deptSelect) {
    deptSelect.innerHTML = `<option value="">All Departments (${state.departments.length})</option>`;
    state.departments.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept;
      opt.textContent = dept;
      deptSelect.appendChild(opt);
    });
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById('faculty-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.currentPage = 1;
        filterFaculty();
      }, 150);
    });
  }

  const instSelect = document.getElementById('faculty-institution-filter');
  if (instSelect) {
    instSelect.addEventListener('change', () => {
      state.currentPage = 1;
      filterFaculty();
    });
  }

  const deptSelect = document.getElementById('faculty-department-filter');
  if (deptSelect) {
    deptSelect.addEventListener('change', () => {
      state.currentPage = 1;
      filterFaculty();
    });
  }
}

function setSearchTerm(term) {
  const input = document.getElementById('faculty-search-input');
  if (input) {
    input.value = term;
    state.currentPage = 1;
    filterFaculty();
  }
}

function resetFilters() {
  const searchInput = document.getElementById('faculty-search-input');
  const instSelect = document.getElementById('faculty-institution-filter');
  const deptSelect = document.getElementById('faculty-department-filter');
  if (searchInput) searchInput.value = '';
  if (instSelect) instSelect.value = '';
  if (deptSelect) deptSelect.value = '';
  state.currentPage = 1;
  filterFaculty();
}

function filterFaculty() {
  const query = (document.getElementById('faculty-search-input')?.value || '').toLowerCase().trim();
  const selectedInst = document.getElementById('faculty-institution-filter')?.value || '';
  const selectedDept = document.getElementById('faculty-department-filter')?.value || '';

  const terms = query.split(/\s+/).filter(Boolean);

  state.filteredProfessors = state.professors.filter(p => {
    if (terms.length > 0) {
      const pText = `${p.name} ${p.institution} ${p.department} ${p.researchInterests || ''} ${p.email || ''}`.toLowerCase();
      const matchesAll = terms.every(t => pText.includes(t));
      if (!matchesAll) return false;
    }

    if (selectedInst && p.institution !== selectedInst) {
      return false;
    }

    if (selectedDept && p.department !== selectedDept) {
      return false;
    }

    return true;
  });

  const sortBy = document.getElementById('faculty-sort-by')?.value || 'name';
  state.filteredProfessors.sort((a, b) => (a[sortBy] || '').localeCompare(b[sortBy] || ''));

  renderFacultyDirectory();
}

function renderFacultyDirectory() {
  const container = document.getElementById('faculty-grid');
  const countEl = document.getElementById('directory-results-count');
  if (!container) return;

  const total = state.filteredProfessors.length;
  const start = (state.currentPage - 1) * state.pageSize;
  const end = Math.min(start + state.pageSize, total);
  const pageItems = state.filteredProfessors.slice(start, end);

  if (countEl) {
    countEl.textContent = total > 0
      ? `Showing ${start + 1}–${end} of ${total.toLocaleString()} professors`
      : 'No professors matched your filters';
  }

  if (pageItems.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
        <i data-lucide="search-x" class="w-10 h-10 mx-auto text-slate-400 mb-3" aria-hidden="true"></i>
        <p class="font-bold text-sm text-slate-700">No matching faculty found</p>
        <p class="text-xs text-slate-500 mt-1">Try broadening your search term or clearing filters.</p>
        <button onclick="resetFilters()" class="mt-4 px-4 py-2 text-xs font-semibold text-accent-600 bg-accent-50 hover:bg-accent-100 border border-accent-200 rounded-lg transition-colors">
          Reset All Filters
        </button>
      </div>
    `;
    initIcons();
    renderPagination(0);
    return;
  }

  container.innerHTML = pageItems.map(p => {
    const isSelected = state.selectedProfessor && state.selectedProfessor.id === p.id;
    const isApplied = state.applications.some(a => a.professor_email === p.email);

    return `
      <div class="bg-white rounded-xl p-4 border ${isSelected ? 'border-accent-400 ring-2 ring-accent-100' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div class="space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 max-w-[190px] truncate" title="${escapeHtml(p.institution)}">
              ${escapeHtml(p.institution || 'Premier Institute')}
            </span>
            ${isApplied ? '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">Tracked</span>' : ''}
          </div>

          <div>
            <h3 class="text-sm font-bold text-slate-900 hover:text-accent-600 transition-colors cursor-pointer leading-snug" onclick="selectProfessorForStudio('${p.id}')">
              ${escapeHtml(p.name)}
            </h3>
            <p class="text-[11px] text-slate-500 mt-0.5 line-clamp-1" title="${escapeHtml(p.department)}">
              ${escapeHtml(p.department || 'Department')}
            </p>
          </div>

          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Research Focus</span>
            <p class="text-xs text-slate-700 mt-0.5 line-clamp-2 leading-relaxed" title="${escapeHtml(p.researchInterests || '')}">
              ${escapeHtml(p.researchInterests || 'Engineering & Computational Sciences')}
            </p>
          </div>

          <div class="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
            <i data-lucide="mail" class="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true"></i>
            <span class="truncate flex-1" title="${escapeHtml(p.email)}">${escapeHtml(p.email)}</span>
            <button onclick="copyToClipboard('${escapeHtml(p.email)}')" class="text-slate-400 hover:text-accent-600 p-0.5 transition-colors" title="Copy email" aria-label="Copy email address">
              <i data-lucide="copy" class="w-3.5 h-3.5" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <div class="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button onclick="selectProfessorForStudio('${p.id}')" class="flex-1 py-1.5 px-3 rounded-lg bg-accent-50 hover:bg-accent-100 border border-accent-200 text-accent-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors">
            <i data-lucide="send" class="w-3.5 h-3.5" aria-hidden="true"></i>
            <span>Draft Email</span>
          </button>
          <button onclick="quickAddProfessorToTracker('${p.id}')" class="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-accent-600 transition-colors" title="Add to Pipeline" aria-label="Add ${escapeHtml(p.name)} to outreach pipeline">
            <i data-lucide="plus" class="w-4 h-4" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  initIcons();
  renderPagination(total);
}

function renderPagination(total) {
  const container = document.getElementById('faculty-pagination');
  if (!container) return;

  const totalPages = Math.ceil(total / state.pageSize);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <button onclick="goToPage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
      ← Prev
    </button>
  `;

  const maxVisiblePages = 5;
  let startPage = Math.max(1, state.currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let p = startPage; p <= endPage; p++) {
    const isCur = p === state.currentPage;
    html += `
      <button onclick="goToPage(${p})" aria-current="${isCur ? 'page' : ''}" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isCur ? 'bg-accent-600 text-white font-bold shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">
        ${p}
      </button>
    `;
  }

  html += `
    <button onclick="goToPage(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
      Next →
    </button>
  `;

  container.innerHTML = html;
}

function goToPage(page) {
  const totalPages = Math.ceil(state.filteredProfessors.length / state.pageSize);
  if (page < 1 || page > totalPages) return;
  state.currentPage = page;
  renderFacultyDirectory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// --- EMAIL STUDIO LOGIC ---

function selectProfessorForStudio(profId) {
  const prof = state.professors.find(p => p.id === profId);
  if (!prof) return;
  state.selectedProfessor = prof;
  updateSelectedProfessorUI();
  switchTab('studio');
  refreshEmailStudioPreview();
  showToast(`Selected Prof. ${prof.name}`, 'check');
}

function updateSelectedProfessorUI() {
  const p = state.selectedProfessor;
  if (!p) return;

  const nameEl = document.getElementById('target-prof-name');
  const metaEl = document.getElementById('target-prof-meta');
  const instBadge = document.getElementById('target-prof-inst-badge');
  const researchEl = document.getElementById('target-prof-research');
  const emailEl = document.getElementById('target-prof-email');

  if (nameEl) nameEl.textContent = p.name;
  if (metaEl) metaEl.textContent = `${p.institution || 'Premier Institute'} • ${p.department || 'Department'}`;
  if (instBadge) instBadge.textContent = p.institution || 'Institute';
  if (researchEl) researchEl.innerHTML = `<strong class="text-slate-500">Research Focus:</strong> ${escapeHtml(p.researchInterests || 'Engineering & Computer Science')}`;
  if (emailEl) emailEl.textContent = p.email || 'faculty@institute.ac.in';
}

function setStudioMode(mode) {
  state.studioMode = mode;
  const templateBtn = document.getElementById('studio-mode-template-btn');
  const aiBtn = document.getElementById('studio-mode-ai-btn');
  const templateBox = document.getElementById('studio-template-selector-box');
  const aiActionBox = document.getElementById('ai-generate-action-box');
  const gemmaRationaleBox = document.getElementById('gemma-rationale-box');

  if (mode === 'template') {
    templateBtn?.classList.add('bg-white', 'text-slate-800', 'shadow-sm', 'border', 'border-slate-200');
    templateBtn?.classList.remove('text-slate-500');
    aiBtn?.classList.remove('bg-white', 'text-slate-800', 'shadow-sm', 'border', 'border-slate-200');
    aiBtn?.classList.add('text-slate-500');
    templateBox?.classList.remove('hidden');
    aiActionBox?.classList.add('hidden');
    gemmaRationaleBox?.classList.add('hidden');
    refreshEmailStudioPreview();
  } else {
    aiBtn?.classList.add('bg-white', 'text-slate-800', 'shadow-sm', 'border', 'border-slate-200');
    aiBtn?.classList.remove('text-slate-500');
    templateBtn?.classList.remove('bg-white', 'text-slate-800', 'shadow-sm', 'border', 'border-slate-200');
    templateBtn?.classList.add('text-slate-500');
    templateBox?.classList.add('hidden');
    aiActionBox?.classList.remove('hidden');

    if (state.smartDraft) {
      gemmaRationaleBox?.classList.remove('hidden');
      applyDraftToPreview(state.smartDraft);
    } else {
      generateSmartDraft();
    }
  }
}

function onTemplateChanged(type) {
  state.activeTemplateType = type;
  refreshEmailStudioPreview();
}

function getStudentProfile() {
  return {
    name: document.getElementById('student-name-input')?.value.trim() || 'Aarav Sharma',
    institution: document.getElementById('student-inst-input')?.value.trim() || 'NIT Trichy',
    year: document.getElementById('student-year-input')?.value.trim() || '3rd Year B.Tech',
    discipline: document.getElementById('student-discipline-input')?.value.trim() || 'Computer Science and Engineering',
    dates: document.getElementById('student-dates-input')?.value.trim() || 'Dec 1, 2026 – Jan 15, 2027',
    portfolio: document.getElementById('student-portfolio-input')?.value.trim() || 'https://github.com/aarav-research',
    projectTitle: document.getElementById('student-project-title-input')?.value.trim() || 'Graph Representation Learning on Sparse Networks',
    projectDesc: document.getElementById('student-project-desc-input')?.value.trim() || 'Profiled inference latency and memory trade-offs for PyTorch Geometric message passing on citation networks.',
    tools: document.getElementById('student-tools-input')?.value.trim() || 'PyTorch, PyG, CUDA',
    task: document.getElementById('student-task-input')?.value.trim() || 'benchmarking baseline models or dataset curation'
  };
}

function saveStudentProfile() {
  const profile = getStudentProfile();
  localStorage.setItem('scholarflow_student_profile', JSON.stringify(profile));
  updateUserDisplay();
  if (state.studioMode === 'template') {
    refreshEmailStudioPreview();
  }
}

function loadSavedStudentProfile() {
  try {
    const saved = localStorage.getItem('scholarflow_student_profile');
    if (!saved) return;
    const p = JSON.parse(saved);
    if (p.name) document.getElementById('student-name-input').value = p.name;
    if (p.institution) document.getElementById('student-inst-input').value = p.institution;
    if (p.year) document.getElementById('student-year-input').value = p.year;
    if (p.discipline) document.getElementById('student-discipline-input').value = p.discipline;
    if (p.dates) document.getElementById('student-dates-input').value = p.dates;
    if (p.portfolio) document.getElementById('student-portfolio-input').value = p.portfolio;
    if (p.projectTitle) document.getElementById('student-project-title-input').value = p.projectTitle;
    if (p.projectDesc) document.getElementById('student-project-desc-input').value = p.projectDesc;
    if (p.tools) document.getElementById('student-tools-input').value = p.tools;
    if (p.task) document.getElementById('student-task-input').value = p.task;
  } catch (e) {
    console.error('Error loading saved student profile:', e);
  }
}

function refreshEmailStudioPreview() {
  const prof = state.selectedProfessor || {
    name: 'Prof. Narendra S. Chaudhari',
    institution: 'IIT Indore',
    department: 'Computer Science and Engineering',
    researchInterests: 'Graph Neural Networks & Theoretical CS',
    email: 'nsc@iiti.ac.in'
  };

  const student = getStudentProfile();

  const nameParts = prof.name.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.|Lt\.\s*Dr\.)\s+/i, '').trim().split(/\s+/);
  const surname = nameParts.length > 0 ? nameParts[nameParts.length - 1] : 'Professor';
  const topic = prof.researchInterests ? prof.researchInterests.split(/[,;]/)[0].trim() : 'your research area';

  let subject = '';
  let body = '';

  switch (state.activeTemplateType) {
    case 'A': // Targeted Paper & Baseline Match
      subject = `Winter research inquiry — ${topic}, ${student.dates}`;
      body = `Dear Professor ${surname},

I’m ${student.name}, a ${student.year} student in ${student.discipline} at ${student.institution}. I’m writing to ask whether you might consider taking on a student researcher in your group from ${student.dates}.

Your research focus in ${topic} aligns closely with my recent project on ${student.projectTitle}.

For that project, I ${student.projectDesc} using ${student.tools}. You can inspect my code and documentation here: ${student.portfolio}. During a winter stay, I could contribute to ${student.task}, while learning directly from your lab's ongoing work.

Would you be open to a brief discussion about opportunities in your group? If helpful, I would be glad to share my CV.

Best,
${student.name}
${student.year}, ${student.institution}
${student.portfolio}`;
      break;

    case 'B': // Early Learner & Foundations
      subject = `Winter research inquiry in ${topic} — ${student.name}`;
      body = `Dear Professor ${surname},

I’m ${student.name}, a ${student.year} student at ${student.institution}, developing foundational skills in ${topic}. I’m available from ${student.dates} and wanted to inquire whether your group considers student interns at my stage.

Your lab's focus on ${topic} represents a research direction I am eager to pursue. To prepare, I’ve been studying core methods and working on ${student.projectTitle}, where I gained experience with ${student.tools}.

While I am early in my research career, I am eager to help with structured tasks such as ${student.task}. My background and project work are outlined here: ${student.portfolio}.

If there might be a suitable opening, I would appreciate the chance to discuss it. If helpful, I would be glad to provide my CV.

Best,
${student.name}
${student.year}, ${student.institution}`;
      break;

    case 'C': // Coordinator / Formal Lab Inquiry
      subject = `Winter internship inquiry — ${student.discipline}, ${student.dates}`;
      body = `Dear Internship Coordinator / Lab Office,

I’m ${student.name}, a ${student.year} student in ${student.discipline} at ${student.institution}. I would like to ask whether ${prof.institution} is accepting student internship or project-training applications for ${student.dates}.

My research interest is in ${topic}. In a recent project, I worked on ${student.projectTitle} using ${student.tools}. A short summary of my project work is available at ${student.portfolio}.

Could you please direct me to the current application process and eligibility requirements? I can provide any official recommendation letters or documents required.

Thank you for your time.

Regards,
${student.name}
${student.year}, ${student.institution}`;
      break;

    case 'D': // 7-Day Follow-up
      subject = `Re: Winter research inquiry — ${topic}, ${student.dates}`;
      body = `Dear Professor ${surname},

I’m following up on my email from last week about a possible winter research opportunity in ${topic}. I remain available from ${student.dates} and very interested in your group’s research.

Since my initial note, I continued progress on ${student.projectTitle} and updated my project repository at ${student.portfolio}.

If you are considering students for this period, I would welcome the opportunity to discuss whether I could contribute to ${student.task}.

Best,
${student.name}`;
      break;

    case 'E': // 14-Day Final Closeout
      subject = `Re: Winter research inquiry — ${topic}, ${student.dates}`;
      body = `Dear Professor ${surname},

I wanted to make one final check-in on my winter research inquiry regarding ${topic}. I completely understand if you do not have capacity to take on student researchers this season.

If there is a formal summer portal or institutional application cycle your lab recommends for future openings, I would greatly appreciate being pointed toward it.

Thank you for your time and consideration.

Best,
${student.name}`;
      break;
  }

  checkResearchAlignment(prof, student);
  updatePreviewUI(subject, body);
}

function checkResearchAlignment(prof, student) {
  const warningBox = document.getElementById('alignment-warning-box');
  const warningText = document.getElementById('alignment-warning-text');
  if (!warningBox || !warningText) return;

  if (!prof || !prof.researchInterests) {
    warningBox.classList.add('hidden');
    return;
  }

  // Tokenize professor research interests
  const stopWords = new Set(['and', '&', 'the', 'in', 'of', 'for', 'to', 'on', 'with', 'at', 'by', 'from', 'an', 'a', 'as', 'systems', 'engineering', 'science', 'research', 'technologies', 'technology', 'applications', 'analysis', 'design', 'development']);
  const extractKeywords = (str) => {
    return (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  };

  const profKeywords = new Set(extractKeywords(prof.researchInterests + ' ' + (prof.department || '')));
  const studentKeywords = extractKeywords(`${student.discipline || ''} ${student.projectTitle || ''} ${student.projectDesc || ''} ${student.tools || ''}`);

  const hasOverlap = studentKeywords.some(kw => profKeywords.has(kw));

  if (!hasOverlap && profKeywords.size > 0 && studentKeywords.length > 0) {
    const profTopic = (prof.researchInterests || '').split(/[,;]/)[0].trim() || 'their listed research area';
    const profLastName = prof.name.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.|Lt\.\s*Dr\.)\s+/i, '').trim().split(/\s+/).pop();
    warningText.textContent = `Heuristic check: Your entered project description does not share obvious keywords with Prof. ${profLastName}'s listed research area (${profTopic}). Please review the draft carefully to make sure your outreach explains your interest in their specific work.`;
    warningBox.classList.remove('hidden');
  } else {
    warningBox.classList.add('hidden');
  }
}

function updatePreviewUI(subject, body) {
  const subjectInput = document.getElementById('preview-subject-input');
  const bodyTextarea = document.getElementById('preview-body-textarea');
  const wordCountEl = document.getElementById('preview-word-count');
  const placeholderStatusEl = document.getElementById('preview-placeholder-status');

  if (subjectInput) subjectInput.value = subject;
  if (bodyTextarea) bodyTextarea.value = body;

  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (wordCountEl) wordCountEl.textContent = `${words} words`;

  const placeholders = body.match(/\[([A-Za-z0-9\s/–—-]+)\]/g);
  if (placeholderStatusEl) {
    if (placeholders && placeholders.length > 0) {
      placeholderStatusEl.textContent = `⚠️ ${placeholders.length} placeholder(s) pending`;
      placeholderStatusEl.className = 'text-amber-400 font-medium';
    } else {
      placeholderStatusEl.textContent = '✓ Resolved';
      placeholderStatusEl.className = 'text-accent-400 font-medium';
    }
  }
}

// --- 100% CLIENT-SIDE SMART RESEARCH MATCH SYNTHESIS ---
function generateSmartDraft() {
  const prof = state.selectedProfessor;
  if (!prof) {
    showToast('Please select a professor first', 'alert');
    return;
  }

  const student = getStudentProfile();
  const nameParts = prof.name.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.|Lt\.\s*Dr\.)\s+/i, '').trim().split(/\s+/);
  const surname = nameParts.length > 0 ? nameParts[nameParts.length - 1] : 'Professor';
  
  // Extract key lab focus areas from listed interests
  const topics = prof.researchInterests ? prof.researchInterests.split(/[,;]+/).map(t => t.trim()).filter(Boolean) : ['Engineering'];
  const primaryTopic = topics[0] || 'your research field';
  const secondaryTopic = topics.length > 1 ? topics[1] : '';

  const subject = `Winter research inquiry — ${primaryTopic}, ${student.dates}`;
  const salutation = `Dear Professor ${surname},`;
  const focusMention = secondaryTopic ? `${primaryTopic} and ${secondaryTopic}` : primaryTopic;

  const body = `I am ${student.name}, a ${student.year} student in ${student.discipline} at ${student.institution}. I am writing to ask whether your research group has capacity to consider a visiting student researcher for a winter stay from ${student.dates}.

Your research focus in ${focusMention} aligns with my recent project on ${student.projectTitle}, where I ${student.projectDesc} using ${student.tools}. You can inspect my code implementation and documentation at ${student.portfolio}.

During a winter stay, I could assist your group with focused technical tasks such as ${student.task}, experimental benchmarking, or implementation support, while learning directly from your lab.

Would you be open to a brief conversation regarding potential openings in your group? If helpful, I would be pleased to share my CV.

Sincerely,
${student.name}
${student.year}, ${student.institution}
${student.portfolio}`;

  const rationale = `Aligned student's stated experience in "${student.projectTitle}" (${student.tools}) with Prof. ${surname}'s listed research area in ${primaryTopic}. Proposed concrete contribution (${student.task}).`;
  
  const elevatorPitch = `Hello Professor ${surname}, I'm ${student.name} from ${student.institution}. I've worked on ${student.projectTitle} using ${student.tools}. Given your lab's focus on ${primaryTopic}, I would welcome the chance to contribute to your group's implementation and benchmarking this winter.`;

  const draft = {
    subject,
    salutation,
    body,
    alignment_rationale: rationale,
    elevator_pitch: elevatorPitch
  };

  state.smartDraft = draft;
  applyDraftToPreview(draft);
  showToast('Synthesized research draft', 'check');
}

function applyDraftToPreview(draft) {
  const rationaleBox = document.getElementById('gemma-rationale-box');
  const rationaleText = document.getElementById('gemma-rationale-text');

  if (rationaleBox && rationaleText && draft.alignment_rationale) {
    rationaleText.textContent = draft.alignment_rationale;
    rationaleBox.classList.remove('hidden');
  }

  let fullBody = '';
  if (draft.salutation) fullBody += `${draft.salutation}\n\n`;
  fullBody += draft.body || '';

  updatePreviewUI(draft.subject || 'Winter research inquiry', fullBody);
  checkResearchAlignment(state.selectedProfessor, getStudentProfile());

  if (draft.elevator_pitch) {
    const pitchDisplay = document.getElementById('elevator-pitch-text-display');
    if (pitchDisplay) pitchDisplay.textContent = `"${draft.elevator_pitch}"`;
  }
}

function launchMailtoClient() {
  const prof = state.selectedProfessor;
  const email = prof ? prof.email : '';
  const subject = document.getElementById('preview-subject-input')?.value || '';
  const body = document.getElementById('preview-body-textarea')?.value || '';

  const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
  showToast('Opening native email client...', 'send');
}

function copyEmailToClipboard() {
  const subject = document.getElementById('preview-subject-input')?.value || '';
  const body = document.getElementById('preview-body-textarea')?.value || '';
  const text = `Subject: ${subject}\n\n${body}`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('Email copied to clipboard!', 'check');
  }).catch(() => {
    showToast('Failed to copy', 'alert');
  });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied ${text}`, 'check');
  });
}

// --- 100% CLIENT-SIDE WEB SPEECH SYNTHESIZER ---
function speakElevatorPitch() {
  const pitchDisplay = document.getElementById('elevator-pitch-text-display');
  const playerBox = document.getElementById('audio-player-box');
  const waveDot = document.getElementById('audio-wave-dot');
  const btnText = document.getElementById('btn-audio-pitch-text');

  let pitchText = pitchDisplay ? pitchDisplay.textContent.replace(/"/g, '').trim() : '';

  if (!pitchText) {
    const student = getStudentProfile();
    const prof = state.selectedProfessor;
    const surname = prof ? prof.name.split(' ').pop() : 'Professor';
    const topic = prof && prof.researchInterests ? prof.researchInterests.split(',')[0].trim() : 'computer science';
    pitchText = `Hello Professor ${surname}, I'm ${student.name} from ${student.institution}. I've benchmarked ${student.projectTitle} using ${student.tools}. I've closely followed your work on ${topic} and would love to contribute to your group's experimental profiling this winter.`;
    if (pitchDisplay) pitchDisplay.textContent = `"${pitchText}"`;
  }

  if (playerBox) playerBox.classList.remove('hidden');

  if (!('speechSynthesis' in window)) {
    showToast('Browser does not support Web Speech', 'alert');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(pitchText);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Prefer high quality English voice
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira')));
  if (englishVoice) utterance.voice = englishVoice;

  utterance.onstart = () => {
    state.isSpeaking = true;
    if (waveDot) waveDot.classList.add('animate-ping');
    if (btnText) btnText.textContent = 'Speaking Pitch...';
  };

  utterance.onend = () => {
    state.isSpeaking = false;
    if (waveDot) waveDot.classList.remove('animate-ping');
    if (btnText) btnText.textContent = 'Play 30s Audio Pitch';
  };

  utterance.onerror = () => {
    state.isSpeaking = false;
    if (waveDot) waveDot.classList.remove('animate-ping');
    if (btnText) btnText.textContent = 'Play 30s Audio Pitch';
  };

  window.speechSynthesis.speak(utterance);
  showToast('Playing 30s verbal pitch', 'volume-2');
}

function stopElevatorPitch() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    state.isSpeaking = false;
    const waveDot = document.getElementById('audio-wave-dot');
    const btnText = document.getElementById('btn-audio-pitch-text');
    if (waveDot) waveDot.classList.remove('animate-ping');
    if (btnText) btnText.textContent = 'Play 30s Audio Pitch';
    showToast('Speech stopped', 'info');
  }
}


// --- 6-WEEK ROADMAP LOGIC ---

function renderRoadmap() {
  const container = document.getElementById('roadmap-stages-container');
  if (!container || !state.roadmapStages || state.roadmapStages.length === 0) return;

  let totalTasks = 0;
  let completedTasks = 0;

  state.roadmapStages.forEach(stage => {
    (stage.tasks || []).forEach(task => {
      totalTasks++;
      if (state.roadmapProgress[task.id]) completedTasks++;
    });
  });

  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pctEl = document.getElementById('roadmap-progress-percentage');
  const barEl = document.getElementById('roadmap-progress-bar');
  const sumEl = document.getElementById('roadmap-tasks-summary');
  const navBadge = document.getElementById('nav-badge-progress');

  if (pctEl) pctEl.textContent = `${percentage}%`;
  if (barEl) barEl.style.width = `${percentage}%`;
  if (sumEl) sumEl.textContent = `${completedTasks} of ${totalTasks} tasks completed`;
  if (navBadge) navBadge.textContent = `${percentage}%`;

  container.innerHTML = state.roadmapStages.map(stage => {
    const stageTasks = stage.tasks || [];
    const stageCompleted = stageTasks.filter(t => state.roadmapProgress[t.id]).length;

    return `
      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-accent-50 text-accent-600 border border-accent-200">
                Week ${stage.weekNumber}
              </span>
              <h2 class="text-base font-bold text-slate-900">${escapeHtml(stage.title)}</h2>
            </div>
            <p class="text-xs text-slate-500 mt-1">${escapeHtml(stage.subtitle || '')}</p>
          </div>
          <div class="flex items-center gap-3 text-xs text-slate-500 font-mono whitespace-nowrap">
            <span>⏱ ${escapeHtml(stage.estimatedHours || '8–12 hrs')}</span>
            <span class="font-semibold text-accent-600">${stageCompleted}/${stageTasks.length} done</span>
          </div>
        </div>

        ${stage.deliverable ? `
          <div class="p-3.5 rounded-lg bg-accent-50 border border-accent-200 text-xs text-slate-700 flex items-start gap-2.5">
            <i data-lucide="award" class="w-4 h-4 text-accent-500 mt-0.5 shrink-0" aria-hidden="true"></i>
            <div>
              <strong class="text-slate-800">Milestone:</strong> ${escapeHtml(stage.deliverable)}
            </div>
          </div>
        ` : ''}

        <div class="space-y-2.5 pt-1">
          ${stageTasks.map(task => {
            const isDone = !!state.roadmapProgress[task.id];
            return `
              <div class="p-3.5 rounded-lg border ${isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'} transition-colors flex items-start gap-3">
                <input type="checkbox" id="task-${task.id}" ${isDone ? 'checked' : ''} onchange="toggleRoadmapTask('${task.id}')"
                  class="mt-1 w-4 h-4 rounded border-slate-300 focus:ring-accent-500 cursor-pointer">
                <div class="flex-1 space-y-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <label for="task-${task.id}" class="text-xs font-semibold ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'} cursor-pointer">
                      ${escapeHtml(task.title)}
                    </label>
                    ${task.estimatedEffort ? `
                      <span class="text-[10px] text-slate-400 font-mono whitespace-nowrap shrink-0">${escapeHtml(task.estimatedEffort)}</span>
                    ` : ''}
                  </div>
                  <p class="text-xs ${isDone ? 'text-slate-400' : 'text-slate-500'} leading-relaxed">
                    ${escapeHtml(task.description || '')}
                  </p>
                  ${task.tip ? `
                    <div class="pt-1 text-[11px] text-accent-600 font-medium flex items-center gap-1.5">
                      <i data-lucide="lightbulb" class="w-3.5 h-3.5 text-accent-500 shrink-0" aria-hidden="true"></i>
                      <span>Tip: ${escapeHtml(task.tip)}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  initIcons();
}

function toggleRoadmapTask(taskId) {
  if (state.roadmapProgress[taskId]) {
    delete state.roadmapProgress[taskId];
  } else {
    state.roadmapProgress[taskId] = true;
  }
  localStorage.setItem('scholarflow_roadmap_progress', JSON.stringify(state.roadmapProgress));
  renderRoadmap();
}


// --- 100% CLIENT-SIDE PIPELINE TRACKER ---

function updateTrackerMetrics() {
  const total = state.applications.length;
  const toContact = state.applications.filter(a => a.status === 'To Contact').length;
  const applied = state.applications.filter(a => a.status === 'Applied').length;
  const followup = state.applications.filter(a => a.status === 'Follow-up Sent').length;
  const interviews = state.applications.filter(a => a.status === 'Interview' || a.status === 'Accepted').length;

  const totalEl = document.getElementById('metric-total-apps');
  const tcEl = document.getElementById('metric-to-contact');
  const apEl = document.getElementById('metric-applied');
  const foEl = document.getElementById('metric-followup');
  const inEl = document.getElementById('metric-interviews');
  const navBadge = document.getElementById('nav-badge-tracker');

  if (totalEl) totalEl.textContent = total;
  if (tcEl) tcEl.textContent = toContact;
  if (apEl) apEl.textContent = applied;
  if (foEl) foEl.textContent = followup;
  if (inEl) inEl.textContent = interviews;
  if (navBadge) navBadge.textContent = total;
}

function renderApplicationsTable() {
  const tbody = document.getElementById('applications-table-body');
  const emptyState = document.getElementById('tracker-empty-state');
  if (!tbody) return;

  const filter = document.getElementById('tracker-status-filter')?.value || 'All';
  const filtered = filter === 'All' ? state.applications : state.applications.filter(a => a.status === filter);

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  tbody.innerHTML = filtered.map(app => {
    let statusClasses = 'bg-slate-100 text-slate-600 border-slate-200';
    let statusLabel = app.status;
    if (app.status === 'To Contact') statusClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    if (app.status === 'Applied') statusClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    if (app.status === 'Follow-up Sent') statusClasses = 'bg-violet-50 text-violet-700 border-violet-200';
    if (app.status === 'Interview') statusClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
    if (app.status === 'Accepted') statusClasses = 'bg-teal-50 text-teal-700 border-teal-200 font-bold';

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4">
          <div class="font-semibold text-slate-900">${escapeHtml(app.professor_name)}</div>
          <div class="text-[11px] text-slate-500 mt-0.5">${escapeHtml(app.institution)} · <span class="font-mono">${escapeHtml(app.professor_email)}</span></div>
        </td>
        <td class="py-3 px-4 text-slate-600 max-w-[200px] truncate" title="${escapeHtml(app.research_topic || '')}">
          ${escapeHtml(app.research_topic || 'Research')}
        </td>
        <td class="py-3 px-4">
          <select onchange="updateApplicationStatus('${app.id}', this.value)"
            class="text-xs font-semibold px-2 py-1 rounded-lg border ${statusClasses} focus:outline-none focus:ring-2 focus:ring-accent-100 bg-transparent cursor-pointer"
            aria-label="Status for ${escapeHtml(app.professor_name)}">
            <option value="To Contact" ${app.status === 'To Contact' ? 'selected' : ''}>To Contact</option>
            <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
            <option value="Follow-up Sent" ${app.status === 'Follow-up Sent' ? 'selected' : ''}>Follow-up Sent</option>
            <option value="Interview" ${app.status === 'Interview' ? 'selected' : ''}>Interview</option>
            <option value="Accepted" ${app.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
            <option value="Archived" ${app.status === 'Archived' ? 'selected' : ''}>Archived</option>
          </select>
        </td>
        <td class="py-3 px-4 text-slate-500 font-mono text-[11px]">
          ${app.applied_date || '—'}
        </td>
        <td class="py-3 px-4 text-slate-500 font-mono text-[11px]">
          ${app.followup_due_date || '—'}
        </td>
        <td class="py-3 px-4 text-right space-x-1">
          <button onclick="launchMailtoForApp('${app.id}')" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-accent-600 transition-colors" title="Send Email" aria-label="Send email to ${escapeHtml(app.professor_name)}">
            <i data-lucide="send" class="w-3.5 h-3.5" aria-hidden="true"></i>
          </button>
          <button onclick="deleteApplication('${app.id}')" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500 transition-colors" title="Delete" aria-label="Delete entry for ${escapeHtml(app.professor_name)}">
            <i data-lucide="trash-2" class="w-3.5 h-3.5" aria-hidden="true"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  initIcons();
}

function saveCurrentToTracker() {
  const prof = state.selectedProfessor;
  if (!prof) {
    showToast('Select a professor to track', 'alert');
    return;
  }

  const subject = document.getElementById('preview-subject-input')?.value || '';
  const body = document.getElementById('preview-body-textarea')?.value || '';

  const newApp = {
    id: `app-${Date.now()}`,
    professor_id: prof.id,
    professor_name: prof.name,
    professor_email: prof.email,
    institution: prof.institution,
    department: prof.department,
    research_topic: prof.researchInterests,
    status: 'Applied',
    subject: subject,
    body: body,
    applied_date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    followup_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  persistApplication(newApp);
  showToast(`Tracked outreach to Prof. ${prof.name}`, 'check');
}

function quickAddProfessorToTracker(profId) {
  const prof = state.professors.find(p => p.id === profId);
  if (!prof) return;

  const newApp = {
    id: `app-${Date.now()}`,
    professor_id: prof.id,
    professor_name: prof.name,
    professor_email: prof.email,
    institution: prof.institution,
    department: prof.department,
    research_topic: prof.researchInterests,
    status: 'To Contact'
  };

  persistApplication(newApp);
  showToast(`Added ${prof.name} to pipeline`, 'check');
}

function persistApplication(appData) {
  const existingIdx = state.applications.findIndex(a => a.id === appData.id);
  if (existingIdx >= 0) {
    state.applications[existingIdx] = appData;
  } else {
    state.applications.unshift(appData);
  }
  localStorage.setItem('scholarflow_pipeline', JSON.stringify(state.applications));
  updateTrackerMetrics();
  renderApplicationsTable();
}

function updateApplicationStatus(appId, newStatus) {
  const app = state.applications.find(a => a.id === appId);
  if (!app) return;
  app.status = newStatus;
  if (newStatus === 'Applied' && !app.applied_date) {
    app.applied_date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    app.followup_due_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  persistApplication(app);
}

function deleteApplication(appId) {
  state.applications = state.applications.filter(a => a.id !== appId);
  localStorage.setItem('scholarflow_pipeline', JSON.stringify(state.applications));
  updateTrackerMetrics();
  renderApplicationsTable();
  showToast('Entry removed from pipeline', 'trash-2');
}

function launchMailtoForApp(appId) {
  const app = state.applications.find(a => a.id === appId);
  if (!app) return;
  const subject = app.subject || `Winter research inquiry — ${app.research_topic || 'Research'}`;
  const body = app.body || `Dear Professor ${app.professor_name.split(' ').pop()},\n\nI am writing to inquire about research internship opportunities in your lab.\n\nBest,\n`;
  window.location.href = `mailto:${encodeURIComponent(app.professor_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// 1-Click CSV Pipeline Export
function exportPipelineCSV() {
  if (state.applications.length === 0) {
    showToast('No applications to export', 'alert');
    return;
  }

  const headers = ['Professor Name', 'Email', 'Institution', 'Department', 'Research Topic', 'Status', 'Sent Date', 'Follow-up Due'];
  const rows = state.applications.map(a => [
    `"${(a.professor_name || '').replace(/"/g, '""')}"`,
    `"${(a.professor_email || '').replace(/"/g, '""')}"`,
    `"${(a.institution || '').replace(/"/g, '""')}"`,
    `"${(a.department || '').replace(/"/g, '""')}"`,
    `"${(a.research_topic || '').replace(/"/g, '""')}"`,
    `"${a.status || ''}"`,
    `"${a.applied_date || ''}"`,
    `"${a.followup_due_date || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `scholarflow_pipeline_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Pipeline exported as CSV!', 'download');
}

// --- MODALS & UTILITIES ---

function openNewApplicationModal() {
  document.getElementById('modal-new-application')?.classList.remove('hidden');
}

function closeNewApplicationModal() {
  document.getElementById('modal-new-application')?.classList.add('hidden');
}

function submitNewApplicationModal() {
  const name = document.getElementById('modal-app-prof-name')?.value.trim();
  const email = document.getElementById('modal-app-prof-email')?.value.trim();
  const inst = document.getElementById('modal-app-inst')?.value.trim() || 'Premier Institute';
  const status = document.getElementById('modal-app-status')?.value || 'To Contact';
  const research = document.getElementById('modal-app-research')?.value.trim() || 'Engineering';

  if (!name || !email) {
    showToast('Please provide professor name and email', 'alert');
    return;
  }

  const newApp = {
    id: `app-${Date.now()}`,
    professor_name: name,
    professor_email: email,
    institution: inst,
    research_topic: research,
    status: status
  };

  persistApplication(newApp);
  closeNewApplicationModal();
  showToast(`Added ${name} to tracker`, 'check');
}

function showToast(message, iconName = 'info') {
  const toast = document.getElementById('toast-notification');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');

  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  if (iconEl && window.lucide) {
    iconEl.setAttribute('data-lucide', iconName === 'check' ? 'check-circle' : (iconName === 'alert' ? 'alert-triangle' : iconName));
    window.lucide.createIcons();
  }

  toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
  }, 2600);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
