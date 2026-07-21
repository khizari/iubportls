// ===================== SCREEN FLOW: login -> welcome -> dashboard =====================
const loginScreen = document.getElementById('loginScreen');
const welcomeScreen = document.getElementById('welcomeScreen');
const dashboardScreen = document.getElementById('dashboardScreen');

function goToWelcome(name){
  document.getElementById('welcomeGreeting').textContent = 'Welcome, ' + name + ' 👋';
  loginScreen.style.display = 'none';
  welcomeScreen.style.display = 'flex';
}

function goToDashboard(name){
  welcomeScreen.style.display = 'none';
  dashboardScreen.style.display = 'block';
  const navTxt = document.querySelector('.nav-profile .txt');
  const navPic = document.querySelector('.nav-profile .pic');
  if(navTxt) navTxt.innerHTML = 'Hi ' + name + ',<small>Good Morning</small>';
  if(navPic && !navPic.querySelector('img')) navPic.textContent = name.charAt(0).toUpperCase();
}

function validateUsername(){
  const input = document.getElementById('usernameInput');
  const error = document.getElementById('usernameError');
  const name = input.value.trim();
  if(!name){
    input.classList.add('error');
    error.classList.add('show');
    input.focus();
    return null;
  }
  input.classList.remove('error');
  error.classList.remove('show');
  return name;
}

document.getElementById('usernameInput').addEventListener('input', (e) => {
  if(e.target.value.trim()){
    e.target.classList.remove('error');
    document.getElementById('usernameError').classList.remove('show');
  }
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const name = validateUsername();
  if(name) goToWelcome(name);
});
document.getElementById('enterDashboardBtn').addEventListener('click', () => {
  const name = validateUsername();
  if(name) goToDashboard(name);
});

// ===================== PROFILE PHOTO: Camera + Browse Files =====================
const avatarCircle = document.querySelector('.avatar-circle-sm');
const defaultAvatarHTML = avatarCircle.innerHTML;
function handlePhotoFile(file){
  if(!file) return;
  if(!file.type.startsWith('image/')){
    showToast('Please choose an image file');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    avatarCircle.innerHTML = `<img src="${e.target.result}" alt="Profile photo">`;
    const navPic = document.querySelector('.nav-profile .pic');
    if(navPic) navPic.innerHTML = `<img src="${e.target.result}" alt="">`;
  };
  reader.readAsDataURL(file);
}
document.getElementById('cameraBtn').addEventListener('click', () => document.getElementById('cameraInput').click());
document.getElementById('browseBtn').addEventListener('click', () => document.getElementById('browseInput').click());
document.getElementById('cameraInput').addEventListener('change', (e) => handlePhotoFile(e.target.files[0]));
document.getElementById('browseInput').addEventListener('change', (e) => handlePhotoFile(e.target.files[0]));

const icons = {
    entryTest: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    scholarship: '<circle cx="12" cy="8" r="6"/><path d="M9.7 13.5 8 22l4-2 4 2-1.7-8.5"/>',
    vouchers: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>',
    admissions: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    timetable: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    studentCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><line x1="14" y1="10" x2="18" y2="10"/><line x1="14" y1="14" x2="18" y2="14"/>',
    societies: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="4" r="1.6"/><circle cx="20" cy="9" r="1.6"/><circle cx="17" cy="19" r="1.6"/><circle cx="7" cy="19" r="1.6"/><circle cx="4" cy="9" r="1.6"/>',
    courses: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    vehicle: '<path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 17V9l2-5h14l2 5v8"/>',
    rollNo: '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>',
    clearance: '<path d="M9 11l3 3L22 4"/><rect x="3" y="4" width="14" height="17" rx="2"/>',
    documents: '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/>',
    liveChat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/>',
    announcement: '<path d="M3 11v3a1 1 0 0 0 1 1h2l3.5 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M15 8a4 4 0 0 1 0 8"/><path d="M18 5a8 8 0 0 1 0 14"/>',
    hostel: '<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-6h6v6"/>',
    downloads: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    contact: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
    repeatCourse: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    hostelItems: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>'
  };

  // Real IUB portal destinations (ported from the IUB Portals Android app)
  const quickLinks = [
    { key:'entryTest', label:'Entry Test', url:'https://eportal.iub.edu.pk/eportal/its' },
    { key:'scholarship', label:'Scholarships', url:'https://my.iub.edu.pk/scholarship/apply' },
    { key:'vouchers', label:'Vouchers', url:'https://my.iub.edu.pk/academics/student/finance/my_vouchers' },
    { key:'admissions', label:'Admissions', url:'https://eportal.iub.edu.pk/eportal/admissions' },
    { key:'timetable', label:'Time Table', url:'https://my.iub.edu.pk/timetable/publics' },
    { key:'studentCard', label:'Student Card', url:'https://my.iub.edu.pk/cba/student/student_card' },
    { key:'societies', label:'Societies', url:'https://my.iub.edu.pk/dsa/student/application#step-1' },
    { key:'courses', label:'Short Courses', url:'https://eportal.iub.edu.pk/short_courses/std/students/apply' },
    { key:'vehicle', label:'Vehicle Entry', url:'https://my.iub.edu.pk/security/vehicle', extra:true },
    { key:'rollNo', label:'Roll No Slips', url:'https://my.iub.edu.pk/cms/student_survey', extra:true },
    { key:'clearance', label:'My Clearance', url:'https://my.iub.edu.pk/cms/clearance', extra:true },
    { key:'documents', label:'My Documents', url:'https://my.iub.edu.pk/cms/cms/std_documents', extra:true },
    { key:'liveChat', label:'Live Chat', url:'https://salmanadeeb.wixsite.com/livechat', extra:true },
    { key:'announcement', label:'Announcement', url:'https://www.iub.edu.pk/news-update', extra:true },
    { key:'hostel', label:'Hostel', url:'https://eportal.iub.edu.pk/eportal/hostelportal', extra:true },
    { key:'downloads', label:'Download Forms', url:'https://www.iub.edu.pk/downloads', extra:true },
    { key:'email', label:'IUB Email', url:'https://mail.google.com/a/iub.edu.pk', extra:true },
    { key:'contact', label:'Contact', url:'https://www.iub.edu.pk/contact', extra:true },
    { key:'repeatCourse', label:'Repeat Course', url:'https://my.iub.edu.pk/academics/student/enrollment/course_repeat_challan', extra:true },
    { key:'hostelItems', label:'Hostel Items', url:'https://drive.google.com/file/d/1bezTSeYr4f6TmPcD84SXtRf1v3IS-dfP/view', extra:true },
  ];

  const banners = [
    { text: 'ADMISSION<br>LAST DATE', bg: 'linear-gradient(120deg, #16234F 0%, #2C3E7A 100%)', url:'https://www.iub.edu.pk/admissions' },
    { text: 'FEE<br>STRUCTURE', bg: 'linear-gradient(120deg, #F0B429 0%, #C98F14 100%)', url:'https://www.iub.edu.pk/fee-structure' },
    { text: 'MERIT<br>LIST', bg: 'linear-gradient(120deg, #16234F 0%, #0D163A 100%)', url:'https://eportal.iub.edu.pk/meritlists/index.php?p=' },
    { text: 'TRANSPORT<br>SCHEDULE', bg: 'linear-gradient(120deg, #F0B429 0%, #C98F14 100%)', url:'https://drive.google.com/file/d/1Cte7DZAqOdvqTKsnzE8nQJPbgL2jFs3r/view?usp=sharing' },
  ];

  const quickGrid = document.getElementById('quickGrid');
  const quickLinkCount = document.getElementById('quickLinkCount');
  if (quickLinkCount) quickLinkCount.textContent = quickLinks.length + ' services';

  quickLinks.forEach(item => {
    const el = document.createElement('div');
    el.className = 'quick-item' + (item.extra ? ' hidden-extra' : '');
    el.innerHTML = `
      <span class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${icons[item.key]}</svg></span>
      <span class="lbl">${item.label}</span>
    `;
    el.addEventListener('click', () => openPortal(item.label, item.url));
    quickGrid.appendChild(el);
  });

  const showMoreBtn = document.createElement('button');
  showMoreBtn.className = 'show-more-btn';
  showMoreBtn.textContent = 'Show More';
  quickGrid.appendChild(showMoreBtn);
  let expanded = false;
  showMoreBtn.addEventListener('click', () => {
    expanded = !expanded;
    document.querySelectorAll('.hidden-extra').forEach(el => el.classList.toggle('show', expanded));
    showMoreBtn.textContent = expanded ? 'Show Less' : 'Show More';
  });

  const bannerEl = document.getElementById('banner');
  const bannerText = document.getElementById('bannerText');
  const dotsEl = document.getElementById('bannerDots');
  banners.forEach((b,i) => {
    const d = document.createElement('span');
    if(i===0) d.className='active';
    dotsEl.appendChild(d);
  });
  let bIndex = 0;
  function setBanner(i){
    bannerEl.style.background = banners[i].bg;
    bannerText.innerHTML = banners[i].text;
    [...dotsEl.children].forEach((d,idx) => d.className = idx===i ? 'active' : '');
  }
  setBanner(0);
  setInterval(() => { bIndex = (bIndex+1) % banners.length; setBanner(bIndex); }, 3400);

  let toastTimer;
  function showToast(msg){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ===================== SIDEBAR NAVIGATION =====================
  // Wire every sidebar item that has a data-key to the matching entry in
  // quickLinks, so it opens the same portal as its Quick Links tile.
  const sidebarEl = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  function openSidebar(){
    sidebarEl.classList.add('show');
    sidebarBackdrop.classList.add('show');
  }
  function closeSidebar(){
    sidebarEl.classList.remove('show');
    sidebarBackdrop.classList.remove('show');
  }
  document.getElementById('hamburgerBtn').addEventListener('click', openSidebar);
  document.getElementById('sidebarCloseBtn').addEventListener('click', closeSidebar);
  sidebarBackdrop.addEventListener('click', closeSidebar);

  const sidebarLinks = document.querySelectorAll('.sidebar .side-link');
  function setActiveSidebarLink(el){
    sidebarLinks.forEach(l => l.classList.remove('active'));
    if(el) el.classList.add('active');
  }
  document.getElementById('navDashboard').addEventListener('click', (e) => {
    setActiveSidebarLink(e.currentTarget);
    closeSidebar();
  });
  document.querySelectorAll('.sidebar .side-link[data-key]').forEach(link => {
    link.addEventListener('click', () => {
      const key = link.getAttribute('data-key');
      const item = quickLinks.find(q => q.key === key);
      setActiveSidebarLink(link);
      closeSidebar();
      if(item) openPortal(item.label, item.url);
    });
  });

  const modal = document.getElementById('settingsModal');
  document.getElementById('settingsBtn').addEventListener('click', () => modal.classList.add('show'));
  document.getElementById('sidebarSettingsLink').addEventListener('click', (e) => {
    setActiveSidebarLink(e.currentTarget);
    closeSidebar();
    modal.classList.add('show');
  });
  document.getElementById('closeSettings').addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('show'); });
  document.getElementById('profileCta').addEventListener('click', () => document.getElementById('browseInput').click());

  // ===================== BELL / NOTIFICATIONS =====================
  document.getElementById('notifBtn').addEventListener('click', () => {
    window.open('https://www.iub.edu.pk/news-update', '_blank', 'noopener');
  });

  // ===================== SETTINGS: CHANGE MODE (NIGHT/DAY) =====================
  const modeToggle = document.getElementById('modeToggle');
  const modeKnob = modeToggle.querySelector('.knob');
  const modeTxt = modeToggle.querySelector('.txt');
  function applyTheme(dark){
    document.body.classList.toggle('dark-mode', dark);
    modeToggle.classList.toggle('on', dark);
    modeKnob.textContent = dark ? '☀️' : '🌙';
    modeTxt.textContent = dark ? 'DAY MODE' : 'NIGHT MODE';
    try{ localStorage.setItem('iub-theme', dark ? 'dark' : 'light'); }catch(e){}
  }
  modeToggle.addEventListener('click', () => applyTheme(!document.body.classList.contains('dark-mode')));
  let savedTheme = 'light';
  try{ savedTheme = localStorage.getItem('iub-theme') || 'light'; }catch(e){}
  applyTheme(savedTheme === 'dark');

  // ===================== SETTINGS: CHANGE LANGUAGE (EN / UR) =====================
  const languageRow = document.getElementById('languageRow');
  const languageValue = document.getElementById('languageValue');
  function applyLanguage(lang){
    document.documentElement.lang = lang === 'ur' ? 'ur' : 'en';
    document.body.classList.toggle('lang-ur', lang === 'ur');
    document.querySelectorAll('[data-en]').forEach(el => {
      el.textContent = lang === 'ur' ? el.getAttribute('data-ur') : el.getAttribute('data-en');
    });
    document.querySelectorAll('[data-en-placeholder]').forEach(el => {
      el.placeholder = lang === 'ur' ? el.getAttribute('data-ur-placeholder') : el.getAttribute('data-en-placeholder');
    });
    languageValue.textContent = lang === 'ur' ? 'اردو' : 'English';
    try{ localStorage.setItem('iub-lang', lang); }catch(e){}
  }
  languageRow.addEventListener('click', () => {
    const next = document.documentElement.lang === 'ur' ? 'en' : 'ur';
    applyLanguage(next);
  });
  let savedLang = 'en';
  try{ savedLang = localStorage.getItem('iub-lang') || 'en'; }catch(e){}
  applyLanguage(savedLang);

  // ===================== SETTINGS: SIGN OUT =====================
  document.getElementById('signOutRow').addEventListener('click', () => {
    modal.classList.remove('show');
    document.getElementById('usernameInput').value = '';
    avatarCircle.innerHTML = defaultAvatarHTML;
    const navTxt = document.querySelector('.nav-profile .txt');
    const navPic = document.querySelector('.nav-profile .pic');
    if(navTxt) navTxt.innerHTML = 'Hi,<small>Good Morning</small>';
    if(navPic) navPic.textContent = '';
    dashboardScreen.style.display = 'none';
    welcomeScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
    showToast('Signed out');
  });

  document.getElementById('quickSearch').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    quickLinks.forEach((item, idx) => {
      const el = quickGrid.children[idx];
      const match = item.label.toLowerCase().includes(q);
      el.classList.toggle('search-hidden', !match);
    });
  });

  // ===================== PORTAL VIEWER (in-app browser, ported from the app's WebView) =====================
  // Points at the Vercel serverless function in /api/proxy.js. Since the
  // proxy and this static site are deployed together on the same Vercel
  // project, a relative path just works — no URL to configure.
  // Set to '' to disable proxying (falls back to best-effort iframe + fallback).
  const PROXY_BASE = '/api/proxy';
  const PROXY_HOSTS = ['www.iub.edu.pk', 'iub.edu.pk', 'eportal.iub.edu.pk', 'my.iub.edu.pk', 'lms.iub.edu.pk'];

  function proxiedUrl(url){
    if(!PROXY_BASE) return url;
    try{
      const u = new URL(url);
      if(PROXY_HOSTS.includes(u.hostname)){
        const sep = PROXY_BASE.includes('?') ? '&' : '?';
        return PROXY_BASE + sep + 'url=' + encodeURIComponent(url);
      }
    }catch(e){ /* fall through to the raw url */ }
    return url;
  }

  const portalModal = document.getElementById('portalModal');
  const portalFrame = document.getElementById('portalFrame');
  const portalTitle = document.getElementById('portalTitle');
  const portalOpenNew = document.getElementById('portalOpenNew');
  const portalProgress = document.getElementById('portalProgress');

  function openPortal(label, url){
    if(!url) return showToast(label + ' — link coming soon');
    portalTitle.textContent = label;
    // "Open in new tab" always points at the real IUB URL, never the proxy
    portalOpenNew.href = url;
    portalProgress.style.transition = 'none';
    portalProgress.style.width = '0%';
    portalProgress.style.opacity = '1';
    requestAnimationFrame(() => {
      portalProgress.style.transition = 'width 1.6s ease';
      portalProgress.style.width = '75%';
    });
    portalFrame.src = proxiedUrl(url);
    portalModal.classList.add('show');
  }
  portalFrame.addEventListener('load', () => {
    portalProgress.style.transition = 'width .3s ease';
    portalProgress.style.width = '100%';
    setTimeout(() => { portalProgress.style.opacity = '0'; }, 350);
  });
  document.getElementById('closePortal').addEventListener('click', () => {
    portalModal.classList.remove('show');
    portalFrame.src = 'about:blank';
  });
  portalModal.addEventListener('click', (e) => { if(e.target === portalModal) document.getElementById('closePortal').click(); });

  // Top shortcut row — EPortal / MyIUB / LMS
  document.getElementById('scEportal').addEventListener('click', () => openPortal('EPortal', 'https://eportal.iub.edu.pk'));
  document.getElementById('scMyiub').addEventListener('click', () => openPortal('MyIUB', 'https://my.iub.edu.pk/cms'));
  document.getElementById('scLms').addEventListener('click', () => openPortal('LMS', 'https://lms.iub.edu.pk/my/'));

  // Banner is clickable — opens whichever slide is currently showing
  bannerEl.style.cursor = 'pointer';
  bannerEl.addEventListener('click', () => openPortal(banners[bIndex].text.replace('<br>', ' '), banners[bIndex].url));
