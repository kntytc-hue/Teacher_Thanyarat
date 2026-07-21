/**
 * @file js/storage.js
 * @description ระบบจัดการฐานข้อมูลภายในบราวเซอร์ (LocalStorage Core Utility)
 */

const CourseStorage = {
  STORAGE_KEY: "os_course_student_data",

  // ค่าเริ่มต้นระบบฐานข้อมูลฝั่งไคลเอนต์
  getInitialState() {
    return {
      completedUnits: [],
      quizScores: {},
      midtermScore: null,
      studyTime: 0,
      bookmarks: [],
      theme: "light"
    };
  },

  // ดึงข้อมูลทั้งหมด
  loadData() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      const initial = this.getInitialState();
      this.saveData(initial);
      return initial;
    }
    return JSON.parse(raw);
  },

  // บันทึกข้อมูลทับลง Storage
  saveData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  // บันทึกสถานะเรียนจบหน่วย
  completeUnit(unitId) {
    const data = this.loadData();
    if (!data.completedUnits.includes(unitId)) {
      data.completedUnits.push(unitId);
      this.saveData(data);
    }
    return data;
  },

  // บันทึกคะแนนแบบทดสอบหลังเรียน
  saveQuizScore(unitSlug, score) {
    const data = this.loadData();
    data.quizScores[unitSlug] = score;
    this.saveData(data);
    return data;
  },

  // สลับและบันทึกธีมของหน้าเว็บ
  toggleTheme() {
    const data = this.loadData();
    data.theme = data.theme === "light" ? "dark" : "light";
    this.saveData(data);
    return data.theme;
  },

  // จัดการ Bookmark
  toggleBookmark(unitSlug) {
    const data = this.loadData();
    const index = data.bookmarks.indexOf(unitSlug);
    if (index === -1) {
      data.bookmarks.push(unitSlug);
    } else {
      data.bookmarks.splice(index, 1);
    }
    this.saveData(data);
    return data.bookmarks;
  }
};