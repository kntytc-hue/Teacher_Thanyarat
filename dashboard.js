/**
 * @file js/dashboard.js
 * @description คำนวณประมวลผลทางสถิติ, ควบคุมการวาดกราฟวิเคราะห์คะแนนด้วย Chart.js และตรวจสอบเงื่อนไขการออกเกียรติบัตรอิเล็กทรอนิกส์
 * @author แผนกวิชาเทคโนโลยีคอมพิวเตอร์ รายวิชา 31909-1001
 */

document.addEventListener("DOMContentLoaded", () => {
    // เรียกใช้งานฟังก์ชันย่อยสำหรับการอัปเดตและเรนเดอร์ข้อมูลบน Dashboard
    renderMetricsWidgets();
    renderScoresChart();
    initDashboardActions();
});

/**
 * @function renderMetricsWidgets
 * @description คำนวณค่าทางสถิติจากหน่วยความจำ LocalStorage เพื่อฉีดข้อมูลลงในอินเทอร์เฟซแต่ละส่วน
 */
function renderMetricsWidgets() {
    const userData = CourseStorage.loadData();
    const totalUnitsCount = courseData.units.length; // 15
    const completedUnitsCount = userData.completedUnits.length;
    const progressPercent = ProgressTracker.calculateProgress();

    // 1. ดึงอิลิเมนต์แต่ละ Widget
    const widgetCompleted = document.getElementById("widget-completed-count");
    const widgetProgress = document.getElementById("widget-progress-percent");
    const widgetAvgScore = document.getElementById("widget-avg-score");
    const widgetCertStatus = document.getElementById("widget-cert-status");
    const downloadCertBtn = document.getElementById("download-cert-btn");
    const certMainIcon = document.getElementById("cert-main-icon");

    // 2. ประมวลผลคะแนนสอบเฉลี่ยของบทเรียนทั้งหมดที่มีประวัติการสอบ
    const quizSlugs = Object.keys(userData.quizScores);
    let avgScore = 0.00;
    if (quizSlugs.length > 0) {
        const totalScoreSum = quizSlugs.reduce((sum, slug) => sum + userData.quizScores[slug], 0);
        avgScore = (totalScoreSum / quizSlugs.length).toFixed(2);
    }

    // 3. ฉีดค่าลงอินเทอร์เฟซตัวเลขสถิติ
    if (widgetCompleted) widgetCompleted.innerText = `${completedUnitsCount} / ${totalUnitsCount}`;
    if (widgetProgress) widgetProgress.innerText = `${progressPercent}%`;
    if (widgetAvgScore) widgetAvgScore.innerText = avgScore;

    // 4. ตรวจสอบเงื่อนไขใบรับรองเกียรติบัตร (ต้องเรียนจบและสอบครบทั้ง 15 หน่วยการเรียน)
    const isEligibleForCert = (completedUnitsCount === totalUnitsCount) && (quizSlugs.length === totalUnitsCount);

    if (isEligibleForCert) {
        if (widgetCertStatus) {
            widgetCertStatus.innerText = "ผ่านเกณฑ์สำเร็จ";
            widgetCertStatus.className = "font-kanit mb-0 font-weight-bold fs-5 text-success text-uppercase";
        }
        if (downloadCertBtn) {
            downloadCertBtn.removeAttribute("disabled");
            downloadCertBtn.className = "btn btn-success btn-lg w-100 py-3 rounded-3 shadow";
        }
        if (certMainIcon) {
            certMainIcon.className = "fas fa-medal fa-4x text-warning animate__animated animate__bounceIn";
        }
    } else {
        if (widgetCertStatus) {
            widgetCertStatus.innerText = "ยังไม่ผ่านเกณฑ์";
            widgetCertStatus.className = "font-kanit mb-0 font-weight-bold fs-5 text-muted text-uppercase";
        }
    }
}

/**
 * @function renderScoresChart
 * @description รวบรวมข้อมูลคะแนนสอบของบทเรียน 15 หน่วยการเรียน มาพล็อตกราฟแท่งสีสันสวยงามด้วยเอนจิ้น Chart.js
 */
function renderScoresChart() {
    const chartCtx = document.getElementById("scoresAnalyticsChart");
    if (!chartCtx) return;

    const userData = CourseStorage.loadData();
    
    // ตั้งค่าป้ายกำกับแกน X เป็น รายชื่อรหัสย่อหน่วยที่ 1 - 15
    const chartLabels = courseData.units.map(u => `น.${u.id}`);
    
    // ดึงค่าคะแนนรายบทเรียนจากฐานข้อมูล หากยังไม่ได้สอบให้บันทึกเป็นค่า 0 คะแนนเป็นค่าเริ่มต้น
    const chartDataValues = courseData.units.map(u => userData.quizScores[u.slug] || 0);

    // ตรวจสอบธีมปัจจุบันเพื่อเลือกสไตล์สีกราฟให้สอดคล้องกับ Dark/Light Mode
    const isDarkMode = document.body.classList.contains("dark-mode");
    const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";
    const textColor = isDarkMode ? "#94A3B8" : "#6C757D";

    // สถาปัตยกรรมการเรนเดอร์ออบเจกต์ Chart.js
    new Chart(chartCtx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'คะแนนสอบที่ได้รับ (เต็ม 20)',
                data: chartDataValues,
                backgroundColor: 'rgba(0, 180, 216, 0.75)',
                borderColor: '#00B4D8',
                borderWidth: 1.5,
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        font: { family: 'Sarabun', size: 12 },
                        color: textColor
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20,
                    grid: { color: gridColor },
                    ticks: {
                        stepSize: 5,
                        font: { family: 'Sarabun' },
                        color: textColor
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: 'Sarabun', size: 11 },
                        color: textColor
                    }
                }
            }
        }
    });
}

/**
 * @function initDashboardActions
 * @description เปิดรับ Event ปฏิสัมพันธ์การกดปุ่มพิมพ์ใบประกาศนียบัตร และปุ่มรีเซ็ตล้างประวัติข้อมูลทั้งหมด
 */
function initDashboardActions() {
    const downloadCertBtn = document.getElementById("download-cert-btn");
    const resetDataBtn = document.getElementById("reset-data-btn");

    // 1. ฟังก์ชันสิทธิ์การพิมพ์พิมพ์เกียรติบัตรเมื่อผ่านเกณฑ์
    if (downloadCertBtn) {
        downloadCertBtn.addEventListener("click", () => {
            Swal.fire({
                title: '<strong>เกียรติบัตรอิเล็กทรอนิกส์สำเร็จการศึกษา</strong>',
                icon: 'success',
                html: `
                    <div class="text-center p-3 border rounded bg-light" style="font-family: 'Sarabun', sans-serif;">
                        <h4 class="font-kanit text-primary fw-bold mb-3">ขอรับรองว่า</h4>
                        <h5 class="text-dark fw-bold mb-2">อาจารย์ธัญญรัตน์ ตาเล๊ะ</h5>
                        <p class="mb-3 text-secondary">ได้ผ่านการประเมินผลการเรียนออนไลน์อย่างสมบูรณ์แบบในรายวิชา</p>
                        <h6 class="fw-bold text-success mb-1">รหัสวิชา 31909-1001 ระบบปฏิบัติการ</h6>
                        <small class="text-muted d-block mt-4">ออกให้ ณ วันที่ 4 กรกฎาคม พ.ศ. 2026</small>
                    </div>
                `,
                showCloseButton: true,
                confirmButtonText: '<i class="fas fa-print me-1"></i>สั่งพิมพ์เกียรติบัตร',
                confirmButtonColor: '#2EC4B6'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.print(); // เรียกคำสั่งระบบปฏิบัติการพิมพ์เอกสารหน้าปัจจุบัน
                }
            });
        });
    }

    // 2. ฟังก์ชันยืนยันความปลอดภัยก่อนทำการล้างฐานข้อมูลประวัติ
    if (resetDataBtn) {
        resetDataBtn.addEventListener("click", () => {
            Swal.fire({
                title: "คุณแน่ใจหรือไม่?",
                text: "ประวัติการเรียนรวมถึงคะแนนเก็บทั้ง 15 หน่วยการเรียนรู้จะถูกลบและไม่สามารถกู้คืนได้!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#E63946",
                cancelButtonColor: "#6C757D",
                confirmButtonText: "ใช่, ล้างข้อมูลทันที!",
                cancelButtonText: "ยกเลิก"
            }).then((result) => {
                if (result.isConfirmed) {
                    CourseStorage.clearAllData();
                    Swal.fire({
                        title: "รีเซ็ตข้อมูลสำเร็จ!",
                        text: "ระบบกำลังพาท่านกลับสู่หน้าแรกเพื่อเริ่มต้นใหม่อีกครั้ง",
                        icon: "success",
                        confirmButtonColor: "#00B4D8"
                    }).then(() => {
                        window.location.href = "index.html";
                    });
                }
            });
        });
    }
}