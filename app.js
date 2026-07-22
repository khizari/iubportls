// ===================== SCREEN FLOW: login -> welcome -> dashboard =====================
const loginScreen = document.getElementById('loginScreen');
const welcomeScreen = document.getElementById('welcomeScreen');
const dashboardScreen = document.getElementById('dashboardScreen');

// Shared language state — read by anything rendered/updated via JS (as
// opposed to the static data-en/data-ur attributes the DOM handles on its
// own). Kept in sync by applyLanguage() further down.
let currentLang = 'en';
let currentUserName = '';
function t(en, ur){ return currentLang === 'ur' ? ur : en; }

function goToWelcome(name){
  document.getElementById('welcomeGreeting').textContent = t('Welcome, ', 'خوش آمدید، ') + name + ' 👋';
  loginScreen.style.display = 'none';
  welcomeScreen.style.display = 'flex';
}

// Picks the right greeting based on the current time of day.
function timeOfDayGreeting(){
  const hour = new Date().getHours();
  if(hour < 12) return t('Good Morning', 'صبح بخیر');
  if(hour < 17) return t('Good Afternoon', 'دوپہر بخیر');
  if(hour < 21) return t('Good Evening', 'شام بخیر');
  return t('Good Night', 'شب بخیر');
}

function updateGreeting(){
  const navTxt = document.querySelector('.nav-profile .txt');
  if(!navTxt) return;
  if(currentUserName){
    navTxt.innerHTML = t('Hi ', '') + currentUserName + (currentLang === 'ur' ? '،' : ',') +
      '<small>' + timeOfDayGreeting() + '</small>';
  } else {
    navTxt.innerHTML = t('Hi,', '') + '<small>' + timeOfDayGreeting() + '</small>';
  }
}

function goToDashboard(name){
  welcomeScreen.style.display = 'none';
  dashboardScreen.style.display = 'block';
  currentUserName = name;
  const navPic = document.querySelector('.nav-profile .pic');
  updateGreeting();
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
// Two avatar previews exist (login screen + settings panel), plus the small
// nav-bar avatar — all three stay in sync whenever a new photo is chosen.
const avatarCircles = document.querySelectorAll('.avatar-circle-sm');
const defaultAvatarHTML = avatarCircles[0].innerHTML;
function setAvatarImage(dataUrl){
  avatarCircles.forEach(el => { el.innerHTML = `<img src="${dataUrl}" alt="Profile photo">`; });
  const navPic = document.querySelector('.nav-profile .pic');
  if(navPic) navPic.innerHTML = `<img src="${dataUrl}" alt="">`;
}
function resetAvatarImage(){
  avatarCircles.forEach(el => { el.innerHTML = defaultAvatarHTML; });
}
function handlePhotoFile(file){
  if(!file) return;
  if(!file.type.startsWith('image/')){
    showToast('Please choose an image file');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => setAvatarImage(e.target.result);
  reader.readAsDataURL(file);
}
document.getElementById('browseBtn').addEventListener('click', () => document.getElementById('browseInput').click());
document.getElementById('browseInput').addEventListener('change', (e) => handlePhotoFile(e.target.files[0]));
document.getElementById('settingsBrowseBtn').addEventListener('click', () => document.getElementById('settingsBrowseInput').click());
document.getElementById('settingsBrowseInput').addEventListener('change', (e) => handlePhotoFile(e.target.files[0]));

// ===================== LIVE CAMERA CAPTURE =====================
// Camera buttons open an actual live camera feed (getUserMedia) so they're
// visually and functionally distinct from Browse Files, which always opens
// the plain file/gallery picker. If the browser or device has no camera
// access, we fall back to the file input's capture-mode picker instead.
const cameraModal = document.getElementById('cameraModal');
const cameraVideo = document.getElementById('cameraVideo');
const cameraCanvas = document.getElementById('cameraCanvas');
let cameraStream = null;
let cameraFallbackInput = null;

async function openCamera(fallbackInput){
  cameraFallbackInput = fallbackInput;
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    fallbackInput.click();
    return;
  }
  try{
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    cameraVideo.srcObject = cameraStream;
    cameraModal.classList.add('show');
  }catch(err){
    showToast(t('Camera unavailable — choose a photo instead', 'کیمرہ دستیاب نہیں — براہ کرم تصویر منتخب کریں'));
    fallbackInput.click();
  }
}
function closeCamera(){
  if(cameraStream){ cameraStream.getTracks().forEach(track => track.stop()); cameraStream = null; }
  cameraVideo.srcObject = null;
  cameraModal.classList.remove('show');
}
function capturePhoto(){
  const w = cameraVideo.videoWidth, h = cameraVideo.videoHeight;
  if(!w || !h) return;
  cameraCanvas.width = w;
  cameraCanvas.height = h;
  const ctx = cameraCanvas.getContext('2d');
  // Undo the mirrored preview so the captured photo reads correctly.
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(cameraVideo, 0, 0, w, h);
  setAvatarImage(cameraCanvas.toDataURL('image/png'));
  closeCamera();
}
document.getElementById('cameraCaptureBtn').addEventListener('click', capturePhoto);
document.getElementById('cameraCancelBtn').addEventListener('click', closeCamera);
cameraModal.addEventListener('click', (e) => { if(e.target === cameraModal) closeCamera(); });

document.getElementById('cameraBtn').addEventListener('click', () => openCamera(document.getElementById('cameraInput')));
document.getElementById('cameraInput').addEventListener('change', (e) => handlePhotoFile(e.target.files[0]));
document.getElementById('settingsCameraBtn').addEventListener('click', () => openCamera(document.getElementById('settingsCameraInput')));
document.getElementById('settingsCameraInput').addEventListener('change', (e) => handlePhotoFile(e.target.files[0]));

// ===================== SETTINGS: EDIT NAME =====================
function applyNameChange(name){
  currentUserName = name;
  updateGreeting();
  const navPic = document.querySelector('.nav-profile .pic');
  if(navPic && !navPic.querySelector('img')) navPic.textContent = name.charAt(0).toUpperCase();
}
document.getElementById('settingsSaveNameBtn').addEventListener('click', () => {
  const input = document.getElementById('settingsNameInput');
  const name = input.value.trim();
  if(!name){
    input.classList.add('error');
    input.focus();
    return;
  }
  input.classList.remove('error');
  applyNameChange(name);
  showToast(t('Name updated', 'نام تبدیل ہو گیا'));
});
document.getElementById('settingsNameInput').addEventListener('input', (e) => {
  if(e.target.value.trim()) e.target.classList.remove('error');
});

const icons = {
    entryTest: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8.5 12l2.2 2.2L16 9"/><line x1="8" y1="7" x2="16" y2="7"/>',
    scholarship: '<path d="M2 9 12 4l10 5-10 5L2 9Z"/><path d="M6 11.2V16c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.8"/><path d="M22 9v6.5"/>',
    vouchers: '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/><line x1="10" y1="6" x2="10" y2="18" stroke-dasharray="2.4 2.4"/>',
    admissions: '<path d="M12 6.2c-2-1.4-4.8-1.9-8-1.2v13c3.2-.7 6-.2 8 1.2 2-1.4 4.8-1.9 8-1.2V5c-3.2-.7-6-.2-8 1.2Z"/><line x1="12" y1="6.2" x2="12" y2="19.2"/>',
    timetable: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    studentCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><line x1="14" y1="10" x2="18" y2="10"/><line x1="14" y1="14" x2="18" y2="14"/>',
    societies: '<circle cx="8.5" cy="8" r="3.2"/><path d="M2.5 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.2 13.5c2.7.2 4.8 2.5 4.8 5.3"/>',
    courses: '<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="5" y1="8" x2="19" y2="8"/><line x1="9" y1="3" x2="9" y2="8"/>',
    vehicle: '<path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 17V9l2-5h14l2 5v8"/>',
    rollNo: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="17.5" x2="13" y2="17.5"/>',
    clearance: '<path d="M12 2.5 5 5.3v5.8c0 4.7 3 8.6 7 9.9 4-1.3 7-5.2 7-9.9V5.3Z"/><path d="M9 12l2 2 4-4.5"/>',
    documents: '<path d="M3.5 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/>',
    liveChat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/>',
    announcement: '<path d="M3 11v3a1 1 0 0 0 1 1h2l3.5 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M15 8a4 4 0 0 1 0 8"/><path d="M18 5a8 8 0 0 1 0 14"/>',
    hostel: '<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-6h6v6"/>',
    downloads: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    contact: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
    repeatCourse: '<path d="M17 2.5 21 6.5 17 10.5"/><path d="M3 12v-1.5A4 4 0 0 1 7 6.5h14"/><path d="M7 21.5 3 17.5 7 13.5"/><path d="M21 12v1.5a4 4 0 0 1-4 4H3"/>',
    library: '<path d="M4 21V4a1 1 0 0 1 1-1h2.5v18"/><path d="M10.5 21V5.5a1 1 0 0 1 1-1H14a1 1 0 0 1 1 1V21"/><path d="M18 21V10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v11"/>'
  };


  // Real IUB portal destinations (ported from the IUB Portals Android app)
  const quickLinks = [
    { key:'entryTest', label:'Entry Test', labelUr:'انٹری ٹیسٹ', url:'https://eportal.iub.edu.pk/eportal/its' },
    { key:'scholarship', label:'Scholarships', labelUr:'وظائف', url:'https://my.iub.edu.pk/scholarship/apply' },
    { key:'vouchers', label:'Vouchers', labelUr:'واؤچرز', url:'https://my.iub.edu.pk/academics/student/finance/my_vouchers' },
    { key:'admissions', label:'Admissions', labelUr:'داخلے', url:'https://eportal.iub.edu.pk/eportal/admissions' },
    { key:'timetable', label:'Time Table', labelUr:'ٹائم ٹیبل', url:'https://my.iub.edu.pk/timetable/publics' },
    { key:'studentCard', label:'Student Card', labelUr:'اسٹوڈنٹ کارڈ', url:'https://my.iub.edu.pk/cba/student/student_card' },
    { key:'societies', label:'Societies', labelUr:'سوسائٹیز', url:'https://my.iub.edu.pk/dsa/student/application#step-1' },
    { key:'courses', label:'Short Courses', labelUr:'مختصر کورسز', url:'https://eportal.iub.edu.pk/short_courses/std/students/apply' },
    { key:'vehicle', label:'Vehicle Entry', labelUr:'گاڑی کا اندراج', url:'https://my.iub.edu.pk/security/vehicle', extra:true },
    { key:'rollNo', label:'Roll No Slips', labelUr:'رول نمبر سلپ', url:'https://my.iub.edu.pk/cms/student_survey', extra:true },
    { key:'clearance', label:'My Clearance', labelUr:'میری کلیئرنس', url:'https://my.iub.edu.pk/cms/clearance', extra:true },
    { key:'documents', label:'My Documents', labelUr:'میرے دستاویزات', url:'https://my.iub.edu.pk/cms/cms/std_documents', extra:true },
    { key:'liveChat', label:'Live Chat', labelUr:'لائیو چیٹ', url:'https://salmanadeeb.wixsite.com/livechat', extra:true },
    { key:'announcement', label:'Announcement', labelUr:'اعلانات', url:'https://whatsapp.com/channel/0029VaF6qjjJZg44rpOzhf1O', extra:true, external:true },
    { key:'hostel', label:'Hostel', labelUr:'ہاسٹل', url:'https://eportal.iub.edu.pk/eportal/hostelportal', extra:true },
    { key:'downloads', label:'Download Forms', labelUr:'فارم ڈاؤن لوڈ کریں', url:'https://www.iub.edu.pk/downloads', extra:true },
    { key:'email', label:'IUB Email', labelUr:'آئی یو بی ای میل', url:'https://mail.google.com/a/iub.edu.pk', extra:true },
    { key:'contact', label:'Contact', labelUr:'رابطہ کریں', url:'https://www.iub.edu.pk/contact', extra:true },
    { key:'repeatCourse', label:'Repeat Course', labelUr:'دوبارہ کورس', url:'https://my.iub.edu.pk/academics/student/enrollment/course_repeat_challan', extra:true },
    { key:'library', label:'Library', labelUr:'لائبریری', url:'https://library.iub.edu.pk/', extra:true },
  ];

  const banners = [
    { text: 'ADMISSION<br>LAST DATE', textUr: 'داخلے کی<br>آخری تاریخ', image: 'assets/admission-last-date.jpg', url:'https://www.iub.edu.pk/admissions' },
    { text: 'FEE<br>STRUCTURE', textUr: 'فیس کا<br>ڈھانچہ', image: 'assets/fee-structure.jpg', url:'https://www.iub.edu.pk/fee-structure' },
    { text: 'MERIT<br>LIST', textUr: 'میرٹ<br>لسٹ', image: 'assets/merit-list.jpg', url:'https://eportal.iub.edu.pk/meritlists/index.php?p=' },
    { text: 'TRANSPORT<br>SCHEDULE', textUr: 'ٹرانسپورٹ کا<br>شیڈول', image: 'assets/transport-schedule.jpg', url:'https://drive.google.com/file/d/1Cte7DZAqOdvqTKsnzE8nQJPbgL2jFs3r/view?usp=sharing' },
  ];

  const quickGrid = document.getElementById('quickGrid');
  const quickLinkCount = document.getElementById('quickLinkCount');
  function updateServicesCount(){
    if (quickLinkCount) quickLinkCount.textContent = t(quickLinks.length + ' services', quickLinks.length + ' سروسز');
  }
  updateServicesCount();

  quickLinks.forEach(item => {
    const el = document.createElement('div');
    el.className = 'quick-item' + (item.extra ? ' hidden-extra' : '');
    el.innerHTML = `
      <span class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${icons[item.key]}</svg></span>
      <span class="lbl" data-en="${item.label}" data-ur="${item.labelUr}">${item.label}</span>
    `;
    el.addEventListener('click', () => {
      if(item.external){
        window.open(item.url, '_blank', 'noopener');
      } else {
        openPortal(el.querySelector('.lbl').textContent, item.url);
      }
    });
    quickGrid.appendChild(el);
  });

  const showMoreBtn = document.createElement('button');
  showMoreBtn.className = 'show-more-btn';
  function updateShowMoreLabel(){
    showMoreBtn.textContent = expanded ? t('Show Less', 'کم دکھائیں') : t('Show More', 'مزید دکھائیں');
  }
  let expanded = false;
  updateShowMoreLabel();
  quickGrid.appendChild(showMoreBtn);
  showMoreBtn.addEventListener('click', () => {
    expanded = !expanded;
    document.querySelectorAll('.hidden-extra').forEach(el => {
      el.classList.toggle('show', expanded);
      if(expanded) el.classList.add('reveal-in');
    });
    updateShowMoreLabel();
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
    bannerEl.style.backgroundImage =
      `linear-gradient(90deg, rgba(10,16,38,0.88) 0%, rgba(10,16,38,0.55) 45%, rgba(10,16,38,0.15) 100%), url("${banners[i].image}")`;
    bannerText.innerHTML = t(banners[i].text, banners[i].textUr);
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
  function openSettings(){
    document.getElementById('settingsNameInput').value = currentUserName;
    modal.classList.add('show');
  }
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('sidebarSettingsLink').addEventListener('click', (e) => {
    setActiveSidebarLink(e.currentTarget);
    closeSidebar();
    openSettings();
  });
  document.getElementById('closeSettings').addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('show'); });

  document.getElementById('sidebarHelpBtn').addEventListener('click', () => {
    closeSidebar();
    const item = quickLinks.find(q => q.key === 'contact');
    if(item) openPortal(item.label, item.url);
  });

  // ===================== BELL / NOTIFICATIONS =====================
  document.getElementById('notifBtn').addEventListener('click', () => {
    window.open('https://whatsapp.com/channel/0029VaF6qjjJZg44rpOzhf1O', '_blank', 'noopener');
  });

  // ===================== SETTINGS: CHANGE MODE (NIGHT/DAY) =====================
  const modeToggle = document.getElementById('modeToggle');
  const modeValue = document.getElementById('modeValue');
  function applyTheme(dark){
    document.body.classList.toggle('dark-mode', dark);
    modeToggle.classList.toggle('on', dark);
    modeToggle.setAttribute('aria-checked', dark ? 'true' : 'false');
    modeValue.textContent = t(dark ? 'Night Mode' : 'Day Mode', dark ? 'رات کا موڈ' : 'دن کا موڈ');
    try{ localStorage.setItem('iub-theme', dark ? 'dark' : 'light'); }catch(e){}
  }
  modeToggle.addEventListener('click', () => applyTheme(!document.body.classList.contains('dark-mode')));
  let savedTheme = 'light';
  try{ savedTheme = localStorage.getItem('iub-theme') || 'light'; }catch(e){}
  applyTheme(savedTheme === 'dark');

  // ===================== SETTINGS: CHANGE LANGUAGE (EN / UR) =====================
  const languageSelect = document.getElementById('languageSelect');
  function applyLanguage(lang){
    currentLang = lang === 'ur' ? 'ur' : 'en';
    document.documentElement.lang = currentLang;
    document.body.classList.toggle('lang-ur', currentLang === 'ur');
    document.querySelectorAll('[data-en]').forEach(el => {
      el.textContent = currentLang === 'ur' ? el.getAttribute('data-ur') : el.getAttribute('data-en');
    });
    document.querySelectorAll('[data-en-placeholder]').forEach(el => {
      el.placeholder = currentLang === 'ur' ? el.getAttribute('data-ur-placeholder') : el.getAttribute('data-en-placeholder');
    });
    languageSelect.value = currentLang;
    // Refresh everything rendered/updated via JS (dynamic content the
    // data-en/data-ur DOM scan above can't reach on its own).
    updateGreeting();
    updateServicesCount();
    updateShowMoreLabel();
    setBanner(bIndex);
    modeValue.textContent = t(
      document.body.classList.contains('dark-mode') ? 'Night Mode' : 'Day Mode',
      document.body.classList.contains('dark-mode') ? 'رات کا موڈ' : 'دن کا موڈ'
    );
    try{ localStorage.setItem('iub-lang', lang); }catch(e){}
  }
  languageSelect.addEventListener('change', (e) => applyLanguage(e.target.value));
  let savedLang = 'en';
  try{ savedLang = localStorage.getItem('iub-lang') || 'en'; }catch(e){}
  applyLanguage(savedLang);

  // Re-check the time-of-day greeting every few minutes in case the tab
  // stays open across a morning/afternoon/evening/night boundary.
  setInterval(updateGreeting, 5 * 60 * 1000);

  // ===================== SETTINGS: SIGN OUT =====================
  document.getElementById('signOutRow').addEventListener('click', () => {
    modal.classList.remove('show');
    document.getElementById('usernameInput').value = '';
    resetAvatarImage();
    currentUserName = '';
    const navPic = document.querySelector('.nav-profile .pic');
    updateGreeting();
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
  document.getElementById('scEportal').addEventListener('click', (e) => openPortal(e.currentTarget.textContent, 'https://eportal.iub.edu.pk'));
  document.getElementById('scMyiub').addEventListener('click', (e) => openPortal(e.currentTarget.textContent, 'https://my.iub.edu.pk/cms'));
  document.getElementById('scLms').addEventListener('click', (e) => openPortal(e.currentTarget.textContent, 'https://lms.iub.edu.pk/my/'));

  // Banner is clickable — opens whichever slide is currently showing
  bannerEl.style.cursor = 'pointer';
  bannerEl.addEventListener('click', () => openPortal(banners[bIndex].text.replace('<br>', ' '), banners[bIndex].url));

// ===================== CREATIVE ENHANCEMENTS: motion & effects =====================
// Ripple feedback, card tilt, scroll-triggered reveals, and the login-screen
// stat counters. Everything here backs off automatically for anyone with
// prefers-reduced-motion set, and none of it is required for the app to work.
(function(){
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Ripple on click for buttons, pills and cards ----
  const RIPPLE_SELECTOR = '.login-submit,.btn-navy,.btn-light,.sfc-btn,.close-settings,' +
    '.shortcut-pill,.show-more-btn,.quick-item,.nav-icon-btn,.portal-icon-btn,.sidebar-close-btn,.portal-stuck-btn';
  function spawnRipple(el, x, y){
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.4;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (x - rect.left - size / 2) + 'px';
    ripple.style.top = (y - rect.top - size / 2) + 'px';
    el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }
  if(!reducedMotion){
    document.addEventListener('click', (e) => {
      const el = e.target.closest(RIPPLE_SELECTOR);
      if(el) spawnRipple(el, e.clientX, e.clientY);
    });
  }

  // ---- Subtle 3D tilt on Quick Links cards ----
  if(!reducedMotion){
    document.querySelectorAll('.quick-item').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (px * 10).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (py * -10).toFixed(2) + 'deg');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // ---- Staggered scroll/appear reveal for cards, announcements, banner ----
  const revealTargets = document.querySelectorAll('.quick-item:not(.hidden-extra), .announce-item, .banner-row, .shortcut-row');
  if(!reducedMotion && 'IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('reveal-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((el, i) => {
      el.style.transitionDelay = Math.min(i * 40, 400) + 'ms';
      io.observe(el);
    });
  } else {
    revealTargets.forEach(el => el.classList.add('reveal-in'));
    document.querySelectorAll('.quick-item').forEach(el => el.classList.add('reveal-in'));
  }

  // ---- Count-up animation for the login screen's stat numbers ----
  function animateCounter(el, target, duration){
    if(reducedMotion){ el.textContent = target; return; }
    const start = performance.now();
    function step(now){
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if(p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  document.querySelectorAll('[data-count]').forEach(el => {
    animateCounter(el, parseInt(el.getAttribute('data-count'), 10) || 0, 1100);
  });
})();
