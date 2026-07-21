/**
 * @file js/progress.js
 * @description ตัวคำนวณอัตราความก้าวหน้าทางวิชาการและวิเคราะห์เกณฑ์รับใบประกาศนียบัตร
 */

const ProgressTracker = {
  // คำนวณเปอร์เซ็นต์ความคืบหน้าของบทเรียน 15 หน่วย
  calculateProgress() {
    const data = CourseStorage.loadData();
    const totalUnits = courseData.units.length;
    const completedCount = data.completedUnits.length;
    return Math.round((completedCount / totalUnits) * 100);
  },

  // คำนวณคะแนนเฉลี่ยแบบทดสอบหลังเรียนทั้งหมดที่มีการทำแล้ว
  calculateAverageScore() {
    const data = CourseStorage.loadData();
    const scores = Object.values(data.quizScores);
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, current) => sum + current, 0);
    // แปลงให้เป็นเปอร์เซ็นต์เฉลี่ยเต็ม 100% (สมมติคะแนนเต็มแต่ละชุดคือ 20 ข้อ)
    const avgRaw = total / scores.length;
    return Math.round((avgRaw / 20) * 100);
  },

  // ตรวจสอบความผ่านเกณฑ์รับใบประกาศนียบัตร
  checkCertificateEligibility() {
    const progress = this.calculateProgress();
    const avgPercent = this.calculateAverageScore();
    
    // เกณฑ์: เรียนครบ 15 หน่วย (100%) และ คะแนนเฉลี่ยไม่น้อยกว่า 60%
    return progress === 100 && avgPercent >= 60;
  }
};