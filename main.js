/**
 * @file js/main.js
 * @description เอนจิ้นหลักในการควบคุม UI/UX, โหลดข้อมูลบทเรียน และจัดการ Event Listeners ทั้งหมดในระบบ Static Web Application
 * @author นักพัฒนา Full Stack & นักออกแบบ UX/UI รายวิชา 31909-1001
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. เรียกใช้งานฟังก์ชันเริ่มต้นระบบโครงสร้างและสไตล์
    initTheme();
    initSidebar();
    initBackToTop();
    initLoadingScreen();
    
    // 2. ตรวจสอบหน้าและเรนเดอร์ข้อมูลอย่างเหมาะสม
    renderDynamicComponents();
    updateProgressDisplay();
    initSearchEngine();
});

/**
 * -------------------------------------------------------------------------
 * 1. ส่วนควบคุมระบบสไตล์และเอฟเฟกต์ปฏิสัมพันธ์ (Theme, Sidebar, Screen, Scroll)
 * -------------------------------------------------------------------------
 */

/**
 * @function initTheme
 * @description ตรวจสอบและตั้งค่าธีมหน้าจอ (Dark/Light Mode) จาก LocalStorage
 */
function initTheme() {
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    if (!themeToggleBtn) return;

    const currentData = CourseStorage.loadData();
    const currentTheme = currentData.theme || "light";

    // ตั้งค่าคลาสให้กับ body ตามค่าเริ่มต้น
    if (currentTheme === "dark") {
        document.body.classList.add("dark-mode");
        document.body.classList.remove("light-mode");
        themeToggleBtn.innerHTML = '<i class="fas fa-sun fa-lg"></i>';
    } else {
        document.body.classList.add("light-mode");
        document.body.classList.remove("dark-mode");
        themeToggleBtn.innerHTML = '<i class="fas fa-moon fa-lg"></i>';
    }

    // เปิดรับ Event การคลิกสลับโหมด
    themeToggleBtn.addEventListener("click", () => {
        const targetTheme = CourseStorage.toggleTheme();
        if (targetTheme === "dark") {
            document.body.classList.add("dark-mode");
            document.body.classList.remove("light-mode");
            themeToggleBtn.innerHTML = '<i class="fas fa-sun fa-lg"></i>';
            showSwalToast("เปิดใช้งานโหมดกลางคืน", "info");
        } else {
            document.body.classList.add("light-mode");
            document.body.classList.remove("dark-mode");
            themeToggleBtn.innerHTML = '<i class="fas fa-moon fa-lg"></i>';
            showSwalToast("เปิดใช้งานโหมดกลางวัน", "success");
        }
    });
}

/**
 * @function initSidebar
 * @description ควบคุมการสลับคลาสเปิด-ปิดแถบนำทาง (Sidebar Navigation) ทั้งเวอร์ชัน Desktop และ Mobile
 */
function initSidebar() {
    const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
    const mainSidebar = document.getElementById("main-sidebar");

    if (sidebarToggleBtn && mainSidebar) {
        sidebarToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            mainSidebar.classList.toggle("open");
        });

        // ปิด Sidebar เมื่อมีการคลิกพื้นที่อื่นบนหน้าจอมือถือ
        document.addEventListener("click", (e) => {
            if (window.innerWidth <= 991.98 && mainSidebar.classList.contains("open")) {
                if (!mainSidebar.contains(e.target) && e.target !== sidebarToggleBtn) {
                    mainSidebar.classList.remove("open");
                }
            }
        });
    }
}

/**
 * @function initBackToTop
 * @description ควบคุมการแสดงผลและตรวจจับการกดเลื่อนหน้าจอขึ้นไปด้านบนสุด (Back to Top Button)
 */
function initBackToTop() {
    const backToTopBtn = document.getElementById("back-to-top-btn");
    if (!backToTopBtn) return;

    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add("show");
        } else {
            backToTopBtn.classList.remove("show");
        }
    });

    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

/**
 * @function initLoadingScreen
 * @description ควบคุมอนิเมชันการซ่อน Loading Screen เมื่อข้อมูลตัวโครงสร้างทั้งหมดผ่านการประมวลผลเสร็จสิ้น
 */
function initLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = "0";
            setTimeout(() => {
                loadingScreen.style.display = "none";
                // เรียกใช้งาน AOS Animation Engine หลังจากโหลดเสร็จสิ้น
                if (typeof AOS !== 'undefined') {
                    AOS.init({ duration: 800, once: true });
                }
            }, 300);
        }, 400); // ดีเลย์เล็กน้อยเพื่อความนุ่มนวลของ UX
    }
}

/**
 * -------------------------------------------------------------------------
 * 2. ส่วนโครงสร้างข้อมูล (Data Rendering Engine & Progress Injection)
 * -------------------------------------------------------------------------
 */

/**
 * @function renderDynamicComponents
 * @description เจนเนอเรตเมนู 15 หน่วยบทเรียนลงในสถาปัตยกรรม Sidebar และ Grid บนหน้าแรกแบบไร้รอยต่อ
 */
function renderDynamicComponents() {
    const sidebarMenuInjector = document.getElementById("sidebar-menu-injector");
    const unitsGridInjector = document.getElementById("course-units-grid-injector");
    
    // ตรวจสอบข้อมูลผู้เรียน ป้องกันกรณีที่ courseData หรือข้อมูลผู้ใช้ยังไม่ถูกโหลด
    if (typeof courseData === 'undefined' || !courseData.units) return;
    const userData = CourseStorage.loadData();

    // ตัวแปรตรวจเช็ค Path ของการระบุที่อยู่ไฟล์บทเรียนกรณีเปิดจากหน้าแรกหรือในโฟลเดอร์ pages/
    const isSubPage = window.location.pathname.includes("/pages/");
    const basePath = isSubPage ? "" : "pages/";
    const homePath = isSubPage ? "../index.html" : "index.html";
    const dashboardPath = isSubPage ? "../dashboard.html" : "dashboard.html";

    // 2.1 เตรียมโครงสร้างสตรีงสำหรับ Sidebar และ Grid
    let sidebarHTML = `
        <li><a href="${homePath}"><i class="fas fa-home me-2"></i>หน้าแรก</a></li>
        <li><a href="${dashboardPath}"><i class="fas fa-tachometer-alt me-2"></i>Dashboard ผู้เรียน</a></li>
        <li><hr class="text-white-50 my-2"></li>
    `;
    let unitsGridHTML = "";

    // วนลูปสร้างข้อมูลเก็บไว้ในตัวแปรก่อนเขียนลง DOM (Optimization)
    courseData.units.forEach(unit => {
        const isCompleted = userData.completedUnits ? userData.completedUnits.includes(unit.id) : false;
        const checkIcon = isCompleted ? '<i class="fas fa-check-circle text-success ms-auto"></i>' : '';
        
        sidebarHTML += `
            <li>
                <a href="${basePath}${unit.slug}.html" title="${unit.title}">
                    <i class="fas fa-book me-2 fs-7"></i>
                    <span class="text-truncate">น.${unit.id} ${unit.title}</span>
                    ${checkIcon}
                </a>
            </li>
        `;

        // 2.2 หากหน้าปัจจุบันมีคอนเทนเนอร์ Grid (เช่น หน้าแรก index.html) ให้เก็บค่า HTML เข้าตัวแปรไว้
        if (unitsGridInjector) {
            const hasScore = userData.quizScores && userData.quizScores[unit.slug] !== undefined;
            const scoreBadge = hasScore ? `<span class="badge bg-success">คะแนนบทเรียน: ${userData.quizScores[unit.slug]}/20</span>` : '<span class="badge bg-secondary">ยังไม่ได้รับคะแนน</span>';
            const completedBadge = isCompleted ? '<span class="badge bg-info text-dark"><i class="fas fa-check me-1"></i>เรียนเสร็จสิ้น</span>' : '';
            
            unitsGridHTML += `
                <div class="col-xl-4 col-md-6" data-aos="fade-up">
                    <div class="card custom-card h-100 shadow-sm border-0 position-relative">
                        <div class="card-body p-4 d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge bg-primary">หน่วยที่ ${unit.id}</span>
                                <div class="d-flex gap-1">${completedBadge}${scoreBadge}</div>
                            </div>
                            <h5 class="card-title font-kanit text-dark-primary font-weight-bold mt-2 mb-3 line-clamp-2">${unit.title}</h5>
                            <p class="card-text text-secondary fs-7 mb-4 line-clamp-3">ศึกษาโครงสร้างสถาปัตยกรรมและรายละเอียดเชิงปฏิบัติการประจำรายวิชา เพื่อส่งเสริมสมรรถนะเทคโนโลยีคอมพิวเตอร์</p>
                            <div class="mt-auto pt-2">
                                <a href="${basePath}${unit.slug}.html" class="btn btn-outline-primary btn-sm w-100 py-2 rounded-3 fw-medium">
                                    <i class="fas fa-graduation-cap me-1"></i>เข้าสู่หน่วยเรียนรู้
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    // เรนเดอร์ลงหน้าจอจริงเพียงครั้งเดียว (Render Once)
    if (sidebarMenuInjector) sidebarMenuInjector.innerHTML = sidebarHTML;
    if (unitsGridInjector) unitsGridInjector.innerHTML = unitsGridHTML;
}

/**
 * @function updateProgressDisplay
 * @description อัปเดตการแสดงผลเปอร์เซ็นต์ แถบความก้าวหน้าบนหน้าเว็บโดยดึงผ่าน ProgressTracker Engine
 */
function updateProgressDisplay() {
    const globalProgressBar = document.getElementById("global-progress-bar");
    const completedUnitsText = document.getElementById("completed-units-text");

    if (globalProgressBar) {
        if (typeof ProgressTracker === 'undefined' || typeof courseData === 'undefined') return;
        
        const progressPercent = ProgressTracker.calculateProgress();
        const data = CourseStorage.loadData();
        const completedCount = data.completedUnits ? data.completedUnits.length : 0;
        
        globalProgressBar.style.width = `${progressPercent}%`;
        globalProgressBar.setAttribute("aria-valuenow", progressPercent);
        globalProgressBar.innerText = `${progressPercent}%`;

        if (completedUnitsText) {
            completedUnitsText.innerText = `ผ่านแล้ว ${completedCount} จาก ${courseData.units.length} หน่วยการเรียน`;
        }
    }
}

/**
 * -------------------------------------------------------------------------
 * 3. ระบบค้นหาและการทำงานร่วมกับยูทิลิตีระบบ (Global Search Engine & SweetAlert)
 * -------------------------------------------------------------------------
 */

/**
 * @function initSearchEngine
 * @description ค้นหาหัวข้อบทเรียนและลิงก์เชื่อมโยงไปยังหน้าดังกล่าวอย่างรวดเร็ว
 */
function initSearchEngine() {
    const searchInput = document.getElementById("global-search-input");
    const searchBtn = document.getElementById("global-search-btn");

    if (!searchInput) return;

    const executeSearch = () => {
        if (typeof courseData === 'undefined' || typeof Swal === 'undefined') return;
        
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        // ค้นหาเปรียบเทียบในอาร์เรย์ข้อมูลหน่วยเรียนรู้
        const matchedUnit = courseData.units.find(unit => unit.title.toLowerCase().includes(query));
        const isSubPage = window.location.pathname.includes("/pages/");
        const basePath = isSubPage ? "" : "pages/";

        if (matchedUnit) {
            Swal.fire({
                title: "พบเนื้อหาบทเรียน!",
                text: `ตรงกับหน่วยที่ ${matchedUnit.id}: ${matchedUnit.title}`,
                icon: "success",
                confirmButtonText: "นำทางไปทันที",
                confirmButtonColor: "#00B4D8"
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = `${basePath}${matchedUnit.slug}.html`;
                }
            });
        } else {
            Swal.fire({
                title: "ไม่พบข้อมูลบทเรียน",
                text: "กรุณาลองป้อนคำค้นหาคำสำคัญอื่นๆ เช่น โพรเซส, เมมโมรี, หรือ ยูนิต",
                icon: "warning",
                confirmButtonText: "ตกลง",
                confirmButtonColor: "#E63946"
            });
        }
    };

    if (searchBtn) searchBtn.addEventListener("click", executeSearch);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") executeSearch();
    });
}

/**
 * @function showSwalToast
 * @description ยูทิลิตี้แจ้งเตือนแบบ Pop-up ขนาดเล็กบริเวณมุมหน้าจอ (Toast Notification)
 */
function showSwalToast(message, icon = "success") {
    if (typeof Swal === 'undefined') return;
    
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
    Toast.fire({
        icon: icon,
        title: message
    });
}