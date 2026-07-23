// ===================== APP STATE =====================
const dashboardScreen = document.getElementById('dashboardScreen');

// Shared language state — read by anything rendered/updated via JS (as
// opposed to the static data-en/data-ur attributes the DOM handles on its
// own). Kept in sync by applyLanguage() further down.
let currentLang = 'en';
let currentUserName = '';
function t(en, ur){ return currentLang === 'ur' ? ur : en; }

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

// ===================== PROFILE PHOTO: Camera + Browse Files (Settings panel) =====================
const avatarCircles = document.querySelectorAll('.avatar-circle-sm');
const defaultAvatarHTML = avatarCircles[0].innerHTML;
let currentAvatarDataUrl = null;
function setAvatarImage(dataUrl){
  currentAvatarDataUrl = dataUrl;
  avatarCircles.forEach(el => { el.innerHTML = `<img src="${dataUrl}" alt="Profile photo">`; });
  const navPic = document.querySelector('.nav-profile .pic');
  if(navPic) navPic.innerHTML = `<img src="${dataUrl}" alt="">`;
}
function resetAvatarImage(){
  currentAvatarDataUrl = null;
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

document.getElementById('settingsCameraBtn').addEventListener('click', () => openCamera(document.getElementById('settingsCameraInput')));
document.getElementById('settingsCameraInput').addEventListener('change', (e) => handlePhotoFile(e.target.files[0]));

// ===================== SETTINGS: EDIT NAME + PHOTO (Save persists both) =====================
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
  try{
    localStorage.setItem('iub-username', name);
    if(currentAvatarDataUrl) localStorage.setItem('iub-avatar', currentAvatarDataUrl);
  }catch(e){}
  showToast(t('Profile saved', 'پروفائل محفوظ ہو گئی'));
  modal.classList.remove('show');
});
document.getElementById('settingsNameInput').addEventListener('input', (e) => {
  if(e.target.value.trim()) e.target.classList.remove('error');
});

const icons = {
    entryTest: '<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><rect x="8" y="1" width="8" height="3" rx="1.2" fill-opacity="0.4"/><path d="M8 12.4l2.3 2.3 5.4-5.7" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    scholarship: '<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.3V15c0 1.8 2.9 3.3 6 3.3s6-1.5 6-3.3v-4.7" fill-opacity="0.4"/><path d="M22 8v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>',
    vouchers: '<rect x="2.5" y="6" width="19" height="12" rx="2.4"/><circle cx="2.7" cy="12" r="2.1" fill="#fff"/><circle cx="21.3" cy="12" r="2.1" fill="#fff"/><line x1="10" y1="7.4" x2="10" y2="16.6" stroke="#fff" stroke-width="1.5" stroke-dasharray="2 2"/>',
    admissions: '<path d="M12 6c-2-1.3-4.6-1.8-7.6-1.2a1 1 0 0 0-.8 1V18a1 1 0 0 0 1.2 1c2.6-.5 4.9 0 6.7 1.3.3.2.7.2 1 0 1.8-1.3 4.1-1.8 6.7-1.3a1 1 0 0 0 1.2-1V5.8a1 1 0 0 0-.8-1c-3-.6-5.6-.1-7.6 1.2Z"/><path d="M12 6v14" stroke="#fff" stroke-width="1.3" stroke-opacity="0.55" fill="none"/>',
    timetable: '<rect x="3" y="4.5" width="18" height="17" rx="2.4"/><rect x="3" y="4.5" width="18" height="5" rx="2.4" fill-opacity="0.4"/><rect x="7" y="2" width="2" height="4" rx="1"/><rect x="15" y="2" width="2" height="4" rx="1"/><circle cx="8" cy="14" r="1.2" fill="#fff"/><circle cx="12" cy="14" r="1.2" fill="#fff"/><circle cx="16" cy="14" r="1.2" fill="#fff"/><circle cx="8" cy="18" r="1.2" fill="#fff"/><circle cx="12" cy="18" r="1.2" fill="#fff"/>',
    studentCard: '<rect x="2" y="5" width="20" height="14" rx="2.4"/><circle cx="8" cy="12" r="2.6" fill="#fff"/><rect x="13" y="9.3" width="6.5" height="1.7" rx="0.8" fill="#fff" fill-opacity="0.85"/><rect x="13" y="13" width="6.5" height="1.7" rx="0.8" fill="#fff" fill-opacity="0.85"/>',
    societies: '<circle cx="8.5" cy="8" r="3.3"/><path d="M2.3 20c0-3.4 2.8-6.2 6.2-6.2s6.2 2.8 6.2 6.2" fill-opacity="0.4"/><circle cx="17" cy="9" r="2.5" fill-opacity="0.7"/><path d="M15 13.6c2.9.3 5.2 2.7 5.2 5.7" fill-opacity="0.4"/>',
    courses: '<rect x="4" y="14" width="16" height="4" rx="1.2"/><rect x="5" y="9.5" width="14" height="4" rx="1.2" fill-opacity="0.75"/><rect x="6" y="5" width="12" height="4" rx="1.2" fill-opacity="0.5"/>',
    vehicle: '<path d="M4 16.5h16v-2.7a2 2 0 0 0-.5-1.3l-2-2.4a2 2 0 0 0-1.5-.7H8a2 2 0 0 0-1.5.7l-2 2.4A2 2 0 0 0 4 13.8v2.7Z"/><rect x="4" y="16" width="16" height="3" rx="1.2" fill-opacity="0.6"/><circle cx="7.5" cy="19" r="1.7" fill="#fff"/><circle cx="16.5" cy="19" r="1.7" fill="#fff"/><rect x="7.5" y="11" width="9" height="2.4" rx="0.8" fill="#fff" fill-opacity="0.6"/>',
    rollNo: '<rect x="6" y="2.5" width="12" height="19" rx="2.4"/><circle cx="12" cy="8" r="2.5" fill="#fff" fill-opacity="0.9"/><rect x="8.5" y="13" width="7" height="1.5" rx="0.7" fill="#fff" fill-opacity="0.6"/><rect x="8.5" y="16" width="7" height="1.5" rx="0.7" fill="#fff" fill-opacity="0.6"/>',
    clearance: '<path d="M12 2.3 4.5 5.4v6.1c0 5 3.2 9 7.5 10.2 4.3-1.2 7.5-5.2 7.5-10.2V5.4L12 2.3Z"/><path d="M8.6 12.2l2.4 2.4 4.6-4.9" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    documents: '<path d="M4 6.4a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><rect x="6.5" y="11.5" width="11" height="1.5" rx="0.7" fill="#fff" fill-opacity="0.65"/><rect x="6.5" y="14.5" width="8" height="1.5" rx="0.7" fill="#fff" fill-opacity="0.65"/>',
    liveChat: '<path d="M21 11.7a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.7-4.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.3 3.5 8.5 8.5 0 0 1 21 11.7Z"/><circle cx="8.3" cy="11.7" r="1.1" fill="#fff"/><circle cx="12.3" cy="11.7" r="1.1" fill="#fff"/><circle cx="16.3" cy="11.7" r="1.1" fill="#fff"/>',
    announcement: '<path d="M3 10.5v3a1.1 1.1 0 0 0 1.1 1.1h1.7l4 4.6V5.8l-4 4.7H4.1A1.1 1.1 0 0 0 3 10.5Z"/><path d="M14.7 7.7a5.2 5.2 0 0 1 0 8.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none" opacity="0.55"/><path d="M17.8 5.2a8.6 8.6 0 0 1 0 13.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none" opacity="0.35"/>',
    hostel: '<path d="M4 21.5V10.2a1.2 1.2 0 0 1 .5-1L11.4 4a1.2 1.2 0 0 1 1.3 0l6.9 5.2a1.2 1.2 0 0 1 .5 1v11.3Z"/><rect x="9.5" y="14.5" width="5" height="7" rx="0.8" fill="#fff" fill-opacity="0.85"/><rect x="6.3" y="12" width="2.6" height="2.6" rx="0.5" fill="#fff" fill-opacity="0.55"/><rect x="15.1" y="12" width="2.6" height="2.6" rx="0.5" fill="#fff" fill-opacity="0.55"/>',
    downloads: '<path d="M12 2.5v11.4" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" fill="none"/><path d="M7.3 9.4 12 14.1l4.7-4.7" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M4 15.5v3.7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.7" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" fill="none" opacity="0.55"/>',
    email: '<rect x="2.2" y="4.5" width="19.6" height="15" rx="2.2"/><path d="m3 6 9 6.3L21 6" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9"/>',
    contact: '<path d="M21.5 16.4v3a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.5-3 19.3 19.3 0 0 1-6-6 19.6 19.6 0 0 1-3-8.6A2 2 0 0 1 3.8 1.8h3a2 2 0 0 1 2 1.7c.13.95.36 1.88.69 2.77a2 2 0 0 1-.45 2.1l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.1-.45c.9.33 1.83.56 2.78.69a2 2 0 0 1 1.7 2.03Z"/>',
    repeatCourse: '<path d="M17 2.7 21 6.7l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M3 12.2v-1.7A4 4 0 0 1 7 6.5h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.85"/><path d="M7 21.3 3 17.3l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M21 11.8v1.7a4 4 0 0 1-4 4H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.85"/>',
    library: '<path d="M4 21V4.2a1 1 0 0 1 1-1h2.2V21Z"/><path d="M9.7 21V5.6a1 1 0 0 1 1-1h2.6a1 1 0 0 1 1 1V21Z" fill-opacity="0.7"/><path d="M17 21V9.3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V21Z" fill-opacity="0.45"/>'
  };

  // A distinct accent color per Quick Link — makes the icon badges pop
  // instead of all sharing one flat gold tone. Applied as CSS custom
  // properties so the icon fill and badge background both derive from
  // the same source color; kept vivid in both light and dark mode.
  const iconColors = {
    entryTest:'#4F46E5', scholarship:'#F59E0B', vouchers:'#10B981', admissions:'#E11D48',
    timetable:'#0EA5E9', studentCard:'#8B5CF6', societies:'#EC4899', courses:'#14B8A6',
    vehicle:'#F97316', rollNo:'#6366F1', clearance:'#22C55E', documents:'#3B82F6',
    liveChat:'#25D366', announcement:'#F43F5E', hostel:'#A855F7', downloads:'#06B6D4',
    email:'#EA4335', contact:'#0284C7', repeatCourse:'#D97706', library:'#7C3AED'
  };
  function hexToRgbTriplet(hex){
    const n = parseInt(hex.replace('#',''), 16);
    return [(n>>16)&255, (n>>8)&255, n&255].join(',');
  }


  // Real IUB portal destinations (ported from the IUB Portals Android app)
  // `gated: true` = requires an IUB login; these navigate the browser
  // straight to the real iub.edu.pk page (full page, same tab) instead of
  // opening inside the embedded viewer, so login/CAPTCHA work normally and
  // the session the student ends up with is a real IUB session in their
  // own browser — not one held by this app.
  // Grouped by which login session they use, so buttons sharing a
  // session sit together: MyIUB (my.iub.edu.pk) first, then EPortal
  // (eportal.iub.edu.pk), then the remaining links that don't need an
  // IUB login at all. (LMS has no Quick Link tile of its own — it's
  // only the "LMS" shortcut pill in the top row.)
  const quickLinks = [
    // ---- MyIUB session (my.iub.edu.pk) ----
    { key:'scholarship', label:'Scholarships', labelUr:'وظائف', url:'https://my.iub.edu.pk/scholarship/apply', gated:true },
    { key:'vouchers', label:'Vouchers', labelUr:'واؤچرز', url:'https://my.iub.edu.pk/academics/student/finance/my_vouchers', gated:true },
    { key:'timetable', label:'Time Table', labelUr:'ٹائم ٹیبل', url:'https://my.iub.edu.pk/timetable/publics', gated:true },
    { key:'studentCard', label:'Student Card', labelUr:'اسٹوڈنٹ کارڈ', url:'https://my.iub.edu.pk/cba/student/student_card', gated:true },
    { key:'societies', label:'Societies', labelUr:'سوسائٹیز', url:'https://my.iub.edu.pk/dsa/student/application#step-1', gated:true },
    { key:'vehicle', label:'Vehicle Entry', labelUr:'گاڑی کا اندراج', url:'https://my.iub.edu.pk/security/vehicle', extra:true, gated:true },
    { key:'rollNo', label:'Roll No Slips', labelUr:'رول نمبر سلپ', url:'https://my.iub.edu.pk/cms/student_survey', extra:true, gated:true },
    { key:'clearance', label:'My Clearance', labelUr:'میری کلیئرنس', url:'https://my.iub.edu.pk/cms/clearance', extra:true, gated:true },
    { key:'documents', label:'My Documents', labelUr:'میرے دستاویزات', url:'https://my.iub.edu.pk/cms/cms/std_documents', extra:true, gated:true },
    { key:'repeatCourse', label:'Repeat Course', labelUr:'دوبارہ کورس', url:'https://my.iub.edu.pk/academics/student/enrollment/course_repeat_challan', extra:true, gated:true },

    // ---- EPortal session (eportal.iub.edu.pk) ----
    { key:'entryTest', label:'Entry Test', labelUr:'انٹری ٹیسٹ', url:'https://eportal.iub.edu.pk/eportal/its', gated:true },
    { key:'admissions', label:'Admissions', labelUr:'داخلے', url:'https://eportal.iub.edu.pk/eportal/admissions', gated:true },
    { key:'courses', label:'Short Courses', labelUr:'مختصر کورسز', url:'https://eportal.iub.edu.pk/short_courses/std/students/apply', gated:true },
    { key:'hostel', label:'Hostel', labelUr:'ہاسٹل', url:'https://eportal.iub.edu.pk/eportal/hostelportal', extra:true, gated:true },

    // ---- No IUB login needed (each on its own separate domain) ----
    { key:'liveChat', label:'Live Chat', labelUr:'لائیو چیٹ', url:'https://salmanadeeb.wixsite.com/livechat', extra:true, external:true },
    { key:'announcement', label:'Announcement', labelUr:'اعلانات', url:'https://whatsapp.com/channel/0029VaF6qjjJZg44rpOzhf1O', extra:true, external:true },
    { key:'downloads', label:'Download Forms', labelUr:'فارم ڈاؤن لوڈ کریں', url:'https://www.iub.edu.pk/downloads', extra:true },
    { key:'email', label:'IUB Email', labelUr:'آئی یو بی ای میل', url:'https://mail.google.com/a/iub.edu.pk', extra:true },
    { key:'contact', label:'Contact', labelUr:'رابطہ کریں', url:'https://www.iub.edu.pk/contact', extra:true },
    { key:'library', label:'Library', labelUr:'لائبریری', url:'https://library.iub.edu.pk/', extra:true },
  ];

  const banners = [
    { text: 'ADMISSION<br>LAST DATE', textUr: 'داخلے کی<br>آخری تاریخ', image: 'assets/admission-last-date.webp', url:'https://www.iub.edu.pk/admissions' },
    { text: 'FEE<br>STRUCTURE', textUr: 'فیس کا<br>ڈھانچہ', image: 'assets/fee-structure.webp', url:'https://www.iub.edu.pk/fee-structure' },
    { text: 'MERIT<br>LIST', textUr: 'میرٹ<br>لسٹ', image: 'assets/merit-list.webp', url:'https://eportal.iub.edu.pk/meritlists/index.php?p=' },
    { text: 'TRANSPORT<br>SCHEDULE', textUr: 'ٹرانسپورٹ کا<br>شیڈول', image: 'assets/transport-schedule.webp', url:'https://drive.google.com/file/d/1Cte7DZAqOdvqTKsnzE8nQJPbgL2jFs3r/view?usp=sharing' },
  ];
  // Preload every banner photo into the browser cache right away, and
  // keep the Image objects so we can check when each has actually
  // finished loading — not just "requested".
  const preloadedBanners = banners.map(b => {
    const img = new Image();
    img.src = b.image;
    return img;
  });

  const quickGrid = document.getElementById('quickGrid');
  const quickLinkCount = document.getElementById('quickLinkCount');
  function updateServicesCount(){
    if (quickLinkCount) quickLinkCount.textContent = t(quickLinks.length + ' services', quickLinks.length + ' سروسز');
  }
  updateServicesCount();

  // Full-width section labels shown inline in the Quick Links grid,
  // right above the first tile of each session group — keyed by the
  // first item's key in that group.
  const groupLabels = {
    scholarship: { en: 'MyIUB Services', ur: 'مائی آئی یو بی سروسز' },
    entryTest:   { en: 'EPortal Services', ur: 'ای پورٹل سروسز' },
    liveChat:    { en: 'No Login Needed', ur: 'لاگ ان کی ضرورت نہیں' },
  };

  quickLinks.forEach(item => {
    const groupLabel = groupLabels[item.key];
    if(groupLabel){
      const headerEl = document.createElement('div');
      headerEl.className = 'quick-group-label' + (item.extra ? ' hidden-extra' : '');
      headerEl.setAttribute('data-en', groupLabel.en);
      headerEl.setAttribute('data-ur', groupLabel.ur);
      headerEl.textContent = t(groupLabel.en, groupLabel.ur);
      quickGrid.appendChild(headerEl);
    }
    const el = document.createElement('div');
    el.className = 'quick-item' + (item.extra ? ' hidden-extra' : '');
    const accent = iconColors[item.key] || '#F0B429';
    const rgb = hexToRgbTriplet(accent);
    el.innerHTML = `
      <span class="ic" style="--ic-color:${accent}; --ic-bg:rgba(${rgb},0.14); --ic-bg-hover:rgba(${rgb},0.3); --ic-border:rgba(${rgb},0.35);"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">${icons[item.key]}</svg></span>
      <span class="lbl" data-en="${item.label}" data-ur="${item.labelUr}">${item.label}</span>
    `;
    el.addEventListener('click', () => goTo(item));
    quickGrid.appendChild(el);
    // Keep a direct reference to this tile on the item itself, so the
    // search filter (and anything else) can look it up reliably instead
    // of assuming quickGrid.children[idx] lines up with quickLinks[idx]
    // — it doesn't, once the group-label headers above are mixed in.
    item.el = el;
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
  const bannerPhoto = document.getElementById('bannerPhoto');
  const bannerText = document.getElementById('bannerText');
  const dotsEl = document.getElementById('bannerDots');
  banners.forEach((b,i) => {
    const d = document.createElement('span');
    if(i===0) d.className='active';
    dotsEl.appendChild(d);
  });
  let bIndex = 0;
  function setBanner(i){
    bannerPhoto.style.backgroundImage = `url("${banners[i].image}")`;
    bannerText.innerHTML = t(banners[i].text, banners[i].textUr);
    [...dotsEl.children].forEach((d,idx) => d.className = idx===i ? 'active' : '');
  }
  // The very first banner is shown the instant its photo is actually ready
  // (already-cached images resolve this immediately), rather than as soon
  // as the script runs — that's what was letting the caption appear before
  // the photo had finished downloading.
  const firstBannerImg = preloadedBanners[0];
  function showFirstBanner(){ setBanner(0); }
  if(firstBannerImg.complete){
    showFirstBanner();
  } else {
    firstBannerImg.addEventListener('load', showFirstBanner, { once:true });
    firstBannerImg.addEventListener('error', showFirstBanner, { once:true });
  }
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
      goTo(item);
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

  // ===================== RESTORE SAVED PROFILE (name + photo) =====================
  try{
    const savedName = localStorage.getItem('iub-username');
    if(savedName) applyNameChange(savedName);
    const savedAvatar = localStorage.getItem('iub-avatar');
    if(savedAvatar) setAvatarImage(savedAvatar);
  }catch(e){}

  // Re-check the time-of-day greeting every few minutes in case the tab
  // stays open across a morning/afternoon/evening/night boundary.
  setInterval(updateGreeting, 5 * 60 * 1000);

  // ===================== SETTINGS: SIGN OUT (resets local profile info) =====================
  document.getElementById('signOutRow').addEventListener('click', () => {
    modal.classList.remove('show');
    resetAvatarImage();
    currentUserName = '';
    document.getElementById('settingsNameInput').value = '';
    const navPic = document.querySelector('.nav-profile .pic');
    updateGreeting();
    if(navPic) navPic.textContent = '';
    try{
      localStorage.removeItem('iub-username');
      localStorage.removeItem('iub-avatar');
    }catch(e){}
    showToast(t('Signed out', 'سائن آؤٹ ہو گیا'));
  });

  const quickLinksHead = document.getElementById('quickLinksHead');
  document.getElementById('quickSearch').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const searching = q.length > 0;
    const wasSearching = quickGrid.dataset.searching === '1';
    quickLinks.forEach((item) => {
      const el = item.el;
      const match = item.label.toLowerCase().includes(q);
      el.classList.toggle('search-hidden', !match);
      // While searching, reveal any matching item even if it's normally
      // tucked under "Show More" — otherwise those results would filter
      // out along with everything else and the grid would collapse.
      if(searching && item.extra){
        el.classList.toggle('show', match);
        if(match) el.classList.add('reveal-in');
      }
    });
    // Restore the collapsed/expanded state once the search is cleared.
    if(!searching){
      document.querySelectorAll('.hidden-extra').forEach(el => el.classList.toggle('show', expanded));
    }
    showMoreBtn.style.display = searching ? 'none' : '';
    // The instant typing starts, bring the Quick Links section into view
    // so results are visible without the person having to scroll manually.
    if(searching && !wasSearching){
      quickLinksHead.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    quickGrid.dataset.searching = searching ? '1' : '0';
  });

  // ===================== PORTAL VIEWER (in-app browser, ported from the app's WebView) =====================
  // Points at the Vercel serverless function in /api/proxy.js. Since the
  // proxy and this static site are deployed together on the same Vercel
  // project, a relative path just works — no URL to configure.
  // Set to '' to disable proxying (falls back to best-effort iframe + fallback).
  const PROXY_BASE = '/api/proxy';
  const PROXY_HOSTS = ['www.iub.edu.pk', 'iub.edu.pk', 'eportal.iub.edu.pk', 'my.iub.edu.pk', 'lms.iub.edu.pk', 'library.iub.edu.pk'];

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
  const portalTopbar = document.getElementById('portalTopbar');
  const minimizePortalBtn = document.getElementById('minimizePortal');
  const maximizePortalBtn = document.getElementById('maximizePortal');

  // Swaps the maximize button's icon between "expand" (enter full screen)
  // and "compress" (restore) depending on current state.
  const EXPAND_ICON = '<path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4"/>';
  const COMPRESS_ICON = '<path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M3 15h4a2 2 0 0 1 2 2v4M15 21v-4a2 2 0 0 1 2-2h4"/>';
  function setMaximizeIcon(isFullscreen){
    maximizePortalBtn.querySelector('svg').innerHTML = isFullscreen ? COMPRESS_ICON : EXPAND_ICON;
    maximizePortalBtn.title = isFullscreen ? t('Restore', 'بحال کریں') : t('Full screen', 'فل اسکرین');
  }

  function openPortal(label, url){
    if(!url) return showToast(label + ' — link coming soon');
    portalModal.classList.remove('minimized', 'fullscreen');
    setMaximizeIcon(false);
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

  // Central place that decides HOW a link opens:
  // - external (bell, Announcement, Live Chat): new tab, so the
  //   dashboard stays open behind it.
  // - everything else (gated IUB logins like Scholarships, all public
  //   IUB pages like Contact/Library, and Download Forms/Email) —
  //   same-tab navigation to the real page, same as the gated links
  //   always did.
  //   This MUST NOT go through the embedded iframe — IUB's login pages
  //   validate their CAPTCHA against the real my.iub.edu.pk /
  //   eportal.iub.edu.pk domain, and it will report "Invalid captcha
  //   detected" on every attempt if loaded through the proxy under a
  //   different domain. Same-tab navigation is fine for the
  //   shared-session goal: cookies persist per-domain regardless of tab
  //   or navigation history, so once a student logs into my.iub.edu.pk
  //   via one gated link, any later same-tab visit to another
  //   my.iub.edu.pk gated link is already logged in — no extra code
  //   needed for that part. The browser Back button returns to this
  //   dashboard afterward (same tab, state intact).
  function goTo(item){
    if(!item || !item.url) return showToast((item ? item.label : '') + ' — link coming soon');
    if(item.external){
      window.open(item.url, '_blank', 'noopener');
    } else {
      window.location.href = item.url;
    }
  }
  portalFrame.addEventListener('load', () => {
    portalProgress.style.transition = 'width .3s ease';
    portalProgress.style.width = '100%';
    setTimeout(() => { portalProgress.style.opacity = '0'; }, 350);
  });
  document.getElementById('closePortal').addEventListener('click', (e) => {
    e.stopPropagation();
    portalModal.classList.remove('show', 'minimized', 'fullscreen');
    setMaximizeIcon(false);
    portalFrame.src = 'about:blank';
  });
  portalModal.addEventListener('click', (e) => { if(e.target === portalModal) document.getElementById('closePortal').click(); });

  // Minimize collapses the viewer into a small docked bar in the corner —
  // the iframe keeps running behind it (no reload), and the rest of the
  // app becomes usable again. Clicking the docked bar restores it.
  minimizePortalBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    portalModal.classList.add('minimized');
  });
  portalTopbar.addEventListener('click', () => {
    if(portalModal.classList.contains('minimized')) portalModal.classList.remove('minimized');
  });

  // Full screen expands the panel to fill the viewport; clicking again restores it.
  maximizePortalBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isFullscreen = portalModal.classList.toggle('fullscreen');
    setMaximizeIcon(isFullscreen);
  });

  // Top shortcut row — EPortal / MyIUB / LMS. All three land on a login
  // dashboard protected by a domain-locked CAPTCHA, so — same reasoning
  // as gated Quick Links above — send the browser there directly rather
  // than through the embedded iframe, or login will never succeed.
  document.getElementById('scEportal').addEventListener('click', () => { window.location.href = 'https://eportal.iub.edu.pk'; });
  document.getElementById('scMyiub').addEventListener('click', () => { window.location.href = 'https://my.iub.edu.pk/cms'; });
  document.getElementById('scLms').addEventListener('click', () => { window.location.href = 'https://lms.iub.edu.pk/my/'; });

  // Banner is clickable — navigates the same tab to whichever slide is
  // currently showing (same behavior as the gated Quick Links, e.g. Scholarships).
  bannerEl.style.cursor = 'pointer';
  bannerEl.addEventListener('click', () => { window.location.href = banners[bIndex].url; });

// ===================== CREATIVE ENHANCEMENTS: motion & effects =====================
// Ripple feedback, card tilt, scroll-triggered reveals, and count-up stat
// numbers (used in the dashboard/settings). Everything here backs off
// automatically for anyone with prefers-reduced-motion set, and none of it
// is required for the app to work.
(function(){
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Ripple on click for buttons, pills and cards ----
  const RIPPLE_SELECTOR = '.btn-navy,.btn-light,.sfc-link,.close-settings,' +
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
