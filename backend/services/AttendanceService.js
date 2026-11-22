const AttendanceRepository = require('../repositories/AttendanceRepository');
const StudentRepository = require('../repositories/StudentRepository');
const CourseRepository = require('../repositories/CourseRepository');
const { notificationDispatcher } = require('../patterns/observers');

class AttendanceService {
  constructor() {
    this.attendanceRepo = new AttendanceRepository();
    this.studentRepo = new StudentRepository();
    this.courseRepo = new CourseRepository();
  }

  isSameDay(dateString) {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  }

  async recordCourseAttendance({ courseId, date, lectureTopic, markedBy, studentRecords, isTeacher = false }) {
    // If teacher is updating and date is not today, check same-day rule
    // (Teachers can only edit same-day attendance as per feature specification)
    const existingRecords = await this.attendanceRepo.findByCourseAndDate(courseId, date);
    if (existingRecords.length > 0 && isTeacher) {
      const today = new Date().toISOString().split('T')[0];
      if (date !== today) {
        throw new Error('Teachers are only allowed to edit same-day attendance. Previous lecture records are locked.');
      }
    }

    const savedRecords = [];
    const course = await this.courseRepo.findById(courseId);

    for (const record of studentRecords) {
      const saved = await this.attendanceRepo.markAttendance({
        course_id: courseId,
        student_id: record.student_id,
        date,
        status: record.status,
        lecture_topic: lectureTopic,
        marked_by: markedBy
      });
      savedRecords.push(saved);

      // Check attendance percentage for this student
      const summary = await this.attendanceRepo.getStudentCourseAttendance(record.student_id, courseId);

      // If percentage below 75%, trigger warning notification via Observer pattern
      if (summary.isWarning) {
        const student = await this.studentRepo.findById(record.student_id);
        if (student) {
          await notificationDispatcher.notify('ATTENDANCE_WARNING', {
            studentUserId: student.user_id,
            courseId,
            title: `Attendance Warning: ${course ? course.code : 'Course'} (${summary.percentage}%)`,
            message: `Warning: Your attendance in ${course ? course.title : 'this course'} is currently ${summary.percentage}%, which is below the mandatory 75% university requirement.`,
            type: 'warning'
          });
        }
      }
    }

    return savedRecords;
  }
}

module.exports = AttendanceService;
