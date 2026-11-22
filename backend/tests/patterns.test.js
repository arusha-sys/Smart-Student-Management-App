const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Patterns
const UserFactory = require('../patterns/factories/UserFactory');
const { AbsoluteGradingStrategy, RelativeGradingStrategy, GradingContext } = require('../patterns/strategies/GradingStrategy');
const { PdfExportStrategy, ExcelExportStrategy, ReportExportContext } = require('../patterns/strategies/ReportExportStrategy');
const { RegularFeeStrategy, ScholarshipFeeStrategy } = require('../patterns/strategies/FeeCalculationStrategy');
const Database = require('../patterns/singletons/Database');
const Logger = require('../patterns/singletons/Logger');
const NotificationSubject = require('../patterns/observers/NotificationSubject');
const EmailLogObserver = require('../patterns/observers/EmailLogObserver');

// Repositories & Services
const UserRepository = require('../repositories/UserRepository');
const CourseRepository = require('../repositories/CourseRepository');
const AttendanceRepository = require('../repositories/AttendanceRepository');
const MarkRepository = require('../repositories/MarkRepository');
const AuthService = require('../services/AuthService');
const { authorize, authenticate } = require('../middleware/authMiddleware');
const { initSchema } = require('../database/schema');


describe('Design Patterns', () => {

  // Test 1: Factory Pattern - UserFactory
  describe('1. UserFactory Pattern', () => {
    test('creates Admin, Teacher, and Student instances with appropriate properties', () => {
      const admin = UserFactory.create('admin', { name: 'Admin User', email: 'admin@test.com' });
      const teacher = UserFactory.create('teacher', { name: 'Teacher User', email: 'teacher@test.com', designation: 'Professor' });
      const student = UserFactory.create('student', { name: 'Student User', email: 'student@test.com', reg_no: '2026-CS-01' });

      expect(admin.role).toBe('admin');
      expect(admin.canManageUsers()).toBe(true);

      expect(teacher.role).toBe('teacher');
      expect(teacher.designation).toBe('Professor');

      expect(student.role).toBe('student');
      expect(student.reg_no).toBe('2026-CS-01');
    });

    test('throws error when creating an invalid user role', () => {
      expect(() => UserFactory.create('superhero', {})).toThrow('Invalid user role');
      expect(() => UserFactory.create('', {})).toThrow('User role is required');
    });
  });

  // Test 2: Strategy Pattern - AbsoluteGradingStrategy
  describe('2. AbsoluteGradingStrategy', () => {
    test('calculates correct letter grades and GPA based on score thresholds', () => {
      const strategy = new AbsoluteGradingStrategy();

      expect(strategy.calculateGrade(92)).toEqual({ grade: 'A', gpa: 4.0 });
      expect(strategy.calculateGrade(85)).toEqual({ grade: 'A', gpa: 4.0 });
      expect(strategy.calculateGrade(82)).toEqual({ grade: 'A-', gpa: 3.7 });
      expect(strategy.calculateGrade(76)).toEqual({ grade: 'B+', gpa: 3.3 });
      expect(strategy.calculateGrade(72)).toEqual({ grade: 'B', gpa: 3.0 });
      expect(strategy.calculateGrade(68)).toEqual({ grade: 'B-', gpa: 2.7 });
      expect(strategy.calculateGrade(61)).toEqual({ grade: 'C+', gpa: 2.3 });
      expect(strategy.calculateGrade(55)).toEqual({ grade: 'C', gpa: 2.0 });
      expect(strategy.calculateGrade(50)).toEqual({ grade: 'D', gpa: 1.0 });
      expect(strategy.calculateGrade(42)).toEqual({ grade: 'F', gpa: 0.0 });
    });
  });

  // Test 3: Strategy Pattern - RelativeGradingStrategy
  describe('3. RelativeGradingStrategy', () => {
    test('calculates curved grade and GPA based on class mean and standard deviation', () => {
      const strategy = new RelativeGradingStrategy();
      const context = { mean: 60, stdDev: 10 };

      // Marks = 76 -> zScore = (76 - 60) / 10 = 1.6 >= 1.5 -> A (4.0)
      expect(strategy.calculateGrade(76, context)).toEqual({ grade: 'A', gpa: 4.0 });

      // Marks = 61 -> zScore = (61 - 60) / 10 = 0.1 >= 0.0 -> B (3.0)
      expect(strategy.calculateGrade(61, context)).toEqual({ grade: 'B', gpa: 3.0 });

      // Marks = 38 -> zScore = (38 - 60) / 10 = -2.2 < -2.0 -> F (0.0)
      expect(strategy.calculateGrade(38, context)).toEqual({ grade: 'F', gpa: 0.0 });
    });
  });

  // Test 4: Strategy Pattern - ReportExportStrategy
  describe('4. ReportExportStrategy (PDF & Excel)', () => {
    const headers = ['student_name', 'course_code', 'grade'];
    const rows = [
      { student_name: 'Hamza Tariq', course_code: 'CS302', grade: 'A' },
      { student_name: 'Ayesha Noor', course_code: 'CS302', grade: 'B+' }
    ];

    test('PdfExportStrategy produces valid PDF buffer and mime type', async () => {
      const pdfStrategy = new PdfExportStrategy();
      const result = await pdfStrategy.export('Course Results', rows, headers);

      expect(result.mimeType).toBe('application/pdf');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    test('ExcelExportStrategy produces valid Excel/XLSX buffer and mime type', async () => {
      const excelStrategy = new ExcelExportStrategy();
      const result = await excelStrategy.export('Course Results', rows, headers);

      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  // Test 5: Strategy Pattern - FeeCalculationStrategy
  describe('5. FeeCalculationStrategy', () => {
    test('RegularFeeStrategy applies no discount', () => {
      const regular = new RegularFeeStrategy();
      const res = regular.calculate(50000);
      expect(res.baseAmount).toBe(50000);
      expect(res.discountAmount).toBe(0);
      expect(res.finalAmount).toBe(50000);
    });

    test('ScholarshipFeeStrategy applies merit waiver for high GPA', () => {
      const scholarship = new ScholarshipFeeStrategy();
      const res = scholarship.calculate(50000, { gpa: 3.85 });
      expect(res.baseAmount).toBe(50000);
      expect(res.discountAmount).toBe(25000); // 50% waiver
      expect(res.finalAmount).toBe(25000);
    });
  });

  // Test 6: Singleton Pattern - Database and Logger
  describe('6. Singleton Pattern', () => {
    test('Database.getInstance() returns the identical singleton instance', () => {
      const db1 = Database.getInstance();
      const db2 = Database.getInstance();
      expect(db1).toBe(db2);
    });

    test('Logger.getInstance() returns the identical singleton instance and logs entries', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);

      logger1.log('Test singleton log message');
      const recent = logger2.getRecentLogs(1);
      expect(recent.length).toBe(1);
      expect(recent[0]).toContain('Test singleton log message');
    });
  });

  // Test 7: Observer Pattern - NotificationSubject and Observers
  describe('7. Observer Pattern', () => {
    test('notifies attached observers when an event is dispatched', async () => {
      const subject = new NotificationSubject();
      let callCount = 0;
      let receivedPayload = null;

      const mockObserver = {
        name: 'MockObserver',
        update: async (event, payload) => {
          callCount++;
          receivedPayload = payload;
          return { handled: true };
        }
      };

      subject.attach(mockObserver);
      await subject.notify('TEST_EVENT', { title: 'Exam Alert', count: 42 });

      expect(callCount).toBe(1);
      expect(receivedPayload.title).toBe('Exam Alert');

      // Detach
      subject.detach(mockObserver);
      await subject.notify('TEST_EVENT_2', {});
      expect(callCount).toBe(1); // not incremented after detach
    });

    test('EmailLogObserver records dispatched email events', async () => {
      const emailObserver = new EmailLogObserver();
      await emailObserver.update('NEW_ASSIGNMENT', { title: 'Homework #1', message: 'Due in 3 days' });

      expect(emailObserver.deliveryLogs.length).toBe(1);
      expect(emailObserver.deliveryLogs[0].title).toBe('Homework #1');
    });
  });

  // Test 8: Repositories using an In-Memory SQLite Database
});
