const MarkRepository = require('../repositories/MarkRepository');
const StudentRepository = require('../repositories/StudentRepository');
const { GradingContext, AbsoluteGradingStrategy, RelativeGradingStrategy } = require('../patterns/strategies/GradingStrategy');
const { notificationDispatcher } = require('../patterns/observers');

class GradingService {
  constructor() {
    this.markRepo = new MarkRepository();
    this.studentRepo = new StudentRepository();
    this.absoluteStrategy = new AbsoluteGradingStrategy();
    this.relativeStrategy = new RelativeGradingStrategy();
    this.gradingContext = new GradingContext(this.absoluteStrategy);
  }

  async recordMarks({ courseId, studentId, quiz = 0, assignment = 0, mid = 0, final = 0, gradingType = 'absolute', classContext = {} }) {
    const total = Number(quiz) + Number(assignment) + Number(mid) + Number(final);

    if (gradingType === 'relative') {
      this.gradingContext.setStrategy(this.relativeStrategy);
    } else {
      this.gradingContext.setStrategy(this.absoluteStrategy);
    }

    const { grade, gpa } = this.gradingContext.execute(total, classContext);

    const savedMark = await this.markRepo.saveMark({
      course_id: courseId,
      student_id: studentId,
      quiz,
      assignment,
      mid,
      final,
      total,
      grade,
      gpa,
      grading_type: gradingType
    });

    // Update student's overall GPA
    await this.markRepo.calculateAndSaveStudentGPA(studentId);

    // Notify student about marks update via Observer pattern
    const student = await this.studentRepo.findById(studentId);
    if (student) {
      await notificationDispatcher.notify('MARKS_UPDATED', {
        studentUserId: student.user_id,
        courseId,
        title: 'Marks & Grade Updated',
        message: `Your marks have been updated. Total: ${total}/100, Grade: ${grade}, GPA: ${gpa}`,
        type: 'info'
      });
    }

    return savedMark;
  }

  async recordBatchCourseMarks(courseId, marksArray, gradingType = 'absolute') {
    let context = {};

    if (gradingType === 'relative') {
      // Pre-calculate class statistics for relative curve
      const totalMarksList = marksArray.map(m => Number(m.quiz || 0) + Number(m.assignment || 0) + Number(m.mid || 0) + Number(m.final || 0));
      const mean = totalMarksList.reduce((sum, v) => sum + v, 0) / Math.max(totalMarksList.length, 1);
      const variance = totalMarksList.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / Math.max(totalMarksList.length, 1);
      const stdDev = Math.sqrt(variance) || 10;
      context = { mean, stdDev };
    }

    const results = [];
    for (const item of marksArray) {
      const res = await this.recordMarks({
        courseId,
        studentId: item.student_id,
        quiz: item.quiz,
        assignment: item.assignment,
        mid: item.mid,
        final: item.final,
        gradingType,
        classContext: context
      });
      results.push(res);
    }

    return results;
  }
}

module.exports = GradingService;
