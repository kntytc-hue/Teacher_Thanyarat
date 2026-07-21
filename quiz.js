/**
 * @file js/quiz.js
 * @description เอนจิ้นควบคุมระบบแบบทดสอบหลังเรียน ตรวจคะแนนอัตโนมัติ และสลับสับเปลี่ยนข้อสอบสากล
 * @author ผู้เชี่ยวชาญการออกแบบการเรียนการสอนอาชีวศึกษา รายวิชา 31909-1001
 */

// ออบเจกต์สถานะจำลองของแบบทดสอบที่กำลังดำเนินการในหน้าปัจจุบัน
let quizState = {
    unitSlug: "",
    unitData: null,
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: {},
    isSubmitted: false
};

document.addEventListener("DOMContentLoaded", () => {
    initQuizEngine();
    initBookmarkEngine();
    initMarkCompleteEngine();
});

/**
 * -------------------------------------------------------------------------
 * 1. แกนหลักเอนจิ้นข้อสอบแบบโต้ตอบ (Quiz Dynamic Engine)
 * -------------------------------------------------------------------------
 */

/**
 * @function initQuizEngine
 * @description ดึงพารามิเตอร์ชื่อไฟล์ยูนิตปัจจุบันเพื่อทำการแมปปิ้งคลังข้อสอบ 20 ข้อจาก js/data.js
 */
function initQuizEngine() {
    // ดึงชื่อไฟล์ปัจจุบัน เช่น "unit-01" จาก URL Path
    const path = window.location.pathname;
    const pageName = path.substring(path.lastIndexOf('/') + 1);
    const unitSlug = pageName.replace(".html", "");
    
    // ค้นหาฐานข้อมูลรายวิชาที่ตรงกัน
    const unit = courseData.units.find(u => u.slug === unitSlug);
    if (!unit || !unit.quiz || unit.quiz.length === 0) return;

    // ตั้งค่า State เริ่มต้นของระบบควิซ
    quizState.unitSlug = unitSlug;
    quizState.unitData = unit;
    
    // ทำการโคลนคลังข้อสอบมาแบบตื้นและสั่งสุ่มเรียงลำดับข้อสอบ (Shuffle)
    quizState.questions = shuffleArray([...unit.quiz]);
    quizState.currentQuestionIndex = 0;
    quizState.userAnswers = {};
    quizState.isSubmitted = false;

    // ตรวจสอบประวัติประเมินเก่าใน LocalStorage (หากเคยสอบผ่านแล้วให้แสดงสถานะส่งแล้ว)
    const storedData = CourseStorage.loadData();
    if (storedData.quizScores[unitSlug] !== undefined) {
        quizState.isSubmitted = true;
    }

    renderCurrentQuestion();
    setupQuizNavigationListeners();
}

/**
 * @function renderCurrentQuestion
 * @description เรนเดอร์ข้อสอบและตัวเลือกตัวกรองตามดัชนีปัจจุบันลงบนโครงสร้าง HTML
 */
function renderCurrentQuestion() {
    const container = document.getElementById("quiz-question-container");
    const badge = document.getElementById("quiz-progress-badge");
    
    if (!container) return;

    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    badge.innerText = `ข้อที่ ${quizState.currentQuestionIndex + 1} / ${quizState.questions.length}`;

    // สุ่มสับเปลี่ยนตัวเลือกคำตอบสำหรับข้อสอบปรนัยเพื่อป้องกันการจำจำตำแหน่งคำตอบ
    if (!currentQuestion._shuffledChoices && currentQuestion.choices) {
        currentQuestion._shuffledChoices = shuffleArray([...currentQuestion.choices]);
    }

    let htmlContent = `
        <div class="quiz-question-card py-2">
            <h5 class="font-kanit text-dark-primary font-weight-medium mb-3 leading-relaxed">
                ${quizState.currentQuestionIndex + 1}. ${currentQuestion.question}
            </h5>
            <div class="quiz-choices-group d-flex flex-column gap-2 mt-3">
    `;

    // เรนเดอร์ข้อสอบแยกตามประเภท (ปรนัย 4 ตัวเลือก / ถูก-ผิด)
    if (currentQuestion.type === "multiple-choice" || currentQuestion.type === "true-false") {
        const choicesToRender = currentQuestion.type === "multiple-choice" ? currentQuestion._shuffledChoices : currentQuestion.choices;
        
        choicesToRender.forEach((choice, idx) => {
            const isChecked = quizState.userAnswers[currentQuestion.id] === choice;
            const checkAttr = isChecked ? "checked" : "";
            
            // กำหนดสไตล์คลาสพิเศษในกรณีที่ส่งข้อสอบแล้วเพื่อแสดงเฉลยเขียว-แดง
            let choiceClass = "form-check-label px-3 py-2 border rounded-3 w-100 d-block cursor-pointer transition-all";
            
            if (quizState.isSubmitted) {
                if (choice === currentQuestion.answer) {
                    choiceClass += " border-success bg-success-light text-success fw-bold";
                } else if (isChecked && choice !== currentQuestion.answer) {
                    choiceClass += " border-danger bg-danger-light text-danger";
                }
            } else if (isChecked) {
                // เพิ่มไฮไลต์ขอบสีฟ้าและพื้นหลังสีฟ้าอ่อนทันทีเมื่อโหลดข้อเดิมที่เคยเลือกไว้ขึ้นมาใหม่
                choiceClass += " border-primary bg-light-blue selected";
            }

            htmlContent += `
                <div class="form-check custom-choice-input p-0 m-0">
                    <input class="form-check-input d-none" type="radio" 
                           name="q-${currentQuestion.id}" id="choice-${idx}" 
                           value="${choice}" ${checkAttr} ${quizState.isSubmitted ? "disabled" : ""}>
                    <label class="${choiceClass}" for="choice-${idx}">
                        <span class="choice-prefix me-2 font-weight-medium">${String.fromCharCode(65 + idx)}.</span> ${choice}
                    </label>
                </div>
            `;
        });
    }

    // แสดงคำอธิบายเหตุผล (Explanation Block) ด้านหลังคำตอบกรณีส่งข้อสอบเรียบร้อยแล้ว
    if (quizState.isSubmitted && currentQuestion.explanation) {
        htmlContent += `
            <div class="alert alert-info border-0 rounded-4 mt-4 p-3 animate__animated animate__fadeIn">
                <strong><i class="fas fa-info-circle me-1"></i>คำอธิบายเฉลย:</strong> ${currentQuestion.explanation}
            </div>
        `;
    }

    htmlContent += `</div></div>`;
    container.innerHTML = htmlContent;

    // เปิดรับอีเวนต์การเลือกคำตอบของผู้เรียนพร้อมทำเอฟเฟกต์เปลี่ยนสี
    if (!quizState.isSubmitted) {
        const inputs = container.querySelectorAll(`input[name="q-${currentQuestion.id}"]`);
        inputs.forEach(input => {
            input.addEventListener("change", (e) => {
                // 1. บันทึกค่าคำตอบเข้าสู่ตัวแปรระบบ
                quizState.userAnswers[currentQuestion.id] = e.target.value;
                
                // 2. ล้างสไตล์การเลือก (Selected) ของตัวเลือกอื่น ๆ ในข้อเดียวกันออกก่อน
                const labels = container.querySelectorAll(".quiz-choices-group label");
                labels.forEach(label => label.classList.remove("selected", "border-primary", "bg-light-blue"));
                
                // 3. ใส่คลาสสไตล์สีฟ้าเพื่อทำไฮไลต์ให้ผู้เรียนรู้ว่าเลือกข้อนี้แล้ว
                const activeLabel = container.querySelector(`label[for="${e.target.id}"]`);
                if (activeLabel) {
                    activeLabel.classList.add("selected", "border-primary", "bg-light-blue");
                }
            });
        });
    }

    // อัปเดตสถานะการปิดใช้งานปุ่มนำทางย่อย
    document.getElementById("prev-question-btn").disabled = quizState.currentQuestionIndex === 0;
    
    // สลับข้อความปุ่มสุดท้ายเป็นส่งข้อสอบหากถึงข้อ 20
    const nextBtn = document.getElementById("next-question-btn");
    if (quizState.currentQuestionIndex === quizState.questions.length - 1) {
        nextBtn.innerHTML = quizState.isSubmitted ? 'เสร็จสิ้นบทเรียน <i class="fas fa-flag-checkered ms-2"></i>' : 'ส่งกระดาษคำตอบ <i class="fas fa-paper-plane ms-2"></i>';
    } else {
        nextBtn.innerHTML = 'ข้อถัดไป <i class="fas fa-arrow-right ms-2"></i>';
    }
}

/**
 * @function setupQuizNavigationListeners
 * @description จัดการอีเวนต์การกดปุ่มหน้า-หลัง และกลไกประมวลคะแนนผ่าน SweetAlert2 เมื่อทำครบ 20 ข้อ
 */
function setupQuizNavigationListeners() {
    const prevBtn = document.getElementById("prev-question-btn");
    const nextBtn = document.getElementById("next-question-btn");

    prevBtn.addEventListener("click", () => {
        if (quizState.currentQuestionIndex > 0) {
            quizState.currentQuestionIndex--;
            renderCurrentQuestion();
        }
    });

    nextBtn.addEventListener("click", () => {
        // คัดกรองกรณีทำข้อสอบจนถึงข้อสุดท้ายและต้องการตรวจสอบคะแนนสอบ
        if (quizState.currentQuestionIndex === quizState.questions.length - 1) {
            if (quizState.isSubmitted) {
                // หากผู้เรียนส่งคำตอบไปก่อนหน้านี้แล้ว ให้พากลับไปหน้า Dashboard สถิติ
                window.location.href = "../dashboard.html";
                return;
            }
            evaluateQuizScore();
        } else {
            // เดินหน้าไปข้อสอบข้อต่อไป
            quizState.currentQuestionIndex++;
            renderCurrentQuestion();
        }
    });
}

/**
 * @function evaluateQuizScore
 * @description ประมวลผลคะแนนคำนวณเกณฑ์ผ่าน 60% พร้อมสลักคะแนนลงฐานข้อมูล LocalStorage
 */
function evaluateQuizScore() {
    // 1. ตรวจเช็คว่าผู้เรียนกรอกข้อมูลคำตอบครบถ้วนทั้ง 20 ข้อหรือไม่
    const unAnsweredCount = quizState.questions.filter(q => !quizState.userAnswers[q.id]).length;
    
    if (unAnsweredCount > 0) {
        Swal.fire({
            title: "ตรวจพบข้อสอบว่าง!",
            text: `คุณยังไม่ได้ตอบคำถามอีกจำนวน ${unAnsweredCount} ข้อ กรุณาทำข้อสอบให้ครบทุกข้อก่อนการส่งคำรับรองคะแนน`,
            icon: "warning",
            confirmButtonText: "กลับไปทำข้อสอบ",
            confirmButtonColor: "#00B4D8"
        });
        return;
    }

    // 2. เริ่มคำนวณคะแนนรวมดิบ
    let finalCorrectCount = 0;
    quizState.questions.forEach(q => {
        if (quizState.userAnswers[q.id] === q.answer) {
            finalCorrectCount++;
        }
    });

    // 3. บันทึกผลคะแนนเข้าสู่ระบบนิเวศข้อมูลกลาง
    CourseStorage.saveQuizScore(quizState.unitSlug, finalCorrectCount);
    quizState.isSubmitted = true;
    renderCurrentQuestion(); // เรนเดอร์ซ้ำเพื่อแสดงเฉลยสีและฟีดแบ็กคำอธิบาย

    // 4. แสดง Pop-up สรุปคะแนนตามเกณฑ์วัดผลระดับอาชีวศึกษาชั้นสูง (ผ่านเกณฑ์ 12 ข้อขึ้นไป)
    const isPassed = finalCorrectCount >= 12;
    Swal.fire({
        title: isPassed ? "🎉 ยินดีด้วยคุณผ่านการประเมิน!" : "พยายามอีกครั้งนะ!",
        html: `<h4>คุณได้คะแนน: <strong>${finalCorrectCount} / 20 ข้อ</strong></h4>
               <p class="text-muted">คิดเป็นร้อยละ: ${Math.round((finalCorrectCount/20)*100)}%</p>`,
        icon: isPassed ? "success" : "error",
        confirmButtonText: "ดูสถิติและวิเคราะห์เฉลยข้อสอบ",
        confirmButtonColor: isPassed ? "#2EC4B6" : "#E63946"
    });
}

/**
 * -------------------------------------------------------------------------
 * 2. ส่วนควบคุมฟังก์ชันเสริมบทเรียน (Bookmark & Mark as Completed Engine)
 * -------------------------------------------------------------------------
 */

function initBookmarkEngine() {
    const bookmarkBtn = document.getElementById("bookmark-btn");
    if (!bookmarkBtn) return;

    const checkBookmarkStatus = () => {
        const currentData = CourseStorage.loadData();
        if (currentData.bookmarks.includes(quizState.unitSlug)) {
            bookmarkBtn.className = "btn btn-warning text-dark btn-sm rounded-3 px-3";
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark me-1"></i>คั่นหน้าแล้ว';
        } else {
            bookmarkBtn.className = "btn btn-outline-secondary btn-sm rounded-3 px-3";
            bookmarkBtn.innerHTML = '<i class="far fa-bookmark me-1"></i>คั่นหน้าไว้';
        }
    };

    checkBookmarkStatus();
    bookmarkBtn.addEventListener("click", () => {
        CourseStorage.toggleBookmark(quizState.unitSlug);
        checkBookmarkStatus();
    });
}

function initMarkCompleteEngine() {
    const markCompleteBtn = document.getElementById("mark-complete-btn");
    if (!markCompleteBtn) return;

    markCompleteBtn.addEventListener("click", () => {
        // หาเลเยอร์หมายเลข ID ของยูนิต
        const currentUnitId = quizState.unitData ? quizState.unitData.id : 1;
        CourseStorage.completeUnit(currentUnitId);
        
        Swal.fire({
            title: "บันทึกความก้าวหน้าสำเร็จ",
            text: "ระบบได้ทำการบันทึกสถานะการเรียนจบหน่วยเรียนนี้ลงในโปรไฟล์ของคุณเรียบร้อยแล้ว",
            icon: "success",
            confirmButtonText: "ตกลง",
            confirmButtonColor: "#2EC4B6"
        }).then(() => {
            // อัปเดตสถานะของ Sidebar โดยการเรียกใช้ฟังก์ชันใน main.js โกลบอล
            if (typeof renderDynamicComponents === 'function') {
                renderDynamicComponents();
                updateProgressDisplay();
            }
        });
    });
}

/**
 * @function shuffleArray
 * @description ฟังก์ชันคณิตศาสตร์ยูทิลิตีในการสับเปลี่ยนสมาชิกภายในอาร์เรย์ (Fisher-Yates Shuffle Algorithm)
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}