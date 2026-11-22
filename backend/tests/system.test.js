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

describe('Smart Student Management System - SCD Unit Tests', () => {

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
  describe('8. Repository Pattern (In-Memory SQLite Database)', () => {
    let inMemoryDb;
    let userRepo;
    let courseRepo;

    beforeAll(async () => {
      Database.resetInstance();
      inMemoryDb = Database.getInstance(':memory:');
      await initSchema(inMemoryDb);
      userRepo = new UserRepository();
      courseRepo = new CourseRepository();
    });

    afterAll(() => {
      Database.resetInstance();
    });

    test('UserRepository performs CRUD methods cleanly without direct SQL in services', async () => {
      const user = await userRepo.create({
        name: 'Repo Test User',
        email: 'repotest@sms.edu',
        password: 'hashedpassword',
        role: 'student'
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBe('Repo Test User');

      // Find by email
      const found = await userRepo.findByEmail('repotest@sms.edu');
      expect(found.id).toBe(user.id);

      // Update
      const updated = await userRepo.update(user.id, { phone: '+92 300 0000000' });
      expect(updated.phone).toBe('+92 300 0000000');

      // Block
      const blocked = await userRepo.setBlockedStatus(user.id, true);
      expect(blocked.is_blocked).toBe(1);
    });

    test('CourseRepository creates and retrieves courses', async () => {
      const course = await courseRepo.create({
        code: 'CS201',
        title: 'Object Oriented Programming',
        credit_hours: 4,
        semester: 3
      });

      expect(course.code).toBe('CS201');
      const retrieved = await courseRepo.findById(course.id);
      expect(retrieved.title).toBe('Object Oriented Programming');
    });
  });

  // Test 9: Attendance Percentage Calculation & Warning Trigger (<75%)
  describe('9. Attendance Percentage Calculation', () => {
    test('accurately calculates attendance % and identifies when below 75%', () => {
      // 8 lectures: 5 present, 1 late (0.5), 2 absent = 5.5 / 8 = 68.75% (< 75%)
      const totalLectures = 8;
      const presentCount = 5;
      const lateCount = 1;
      const effectivePresent = presentCount + (lateCount * 0.5);
      const percentage = Number(((effectivePresent / totalLectures) * 100).toFixed(1));
      const isWarning = percentage < 75.0;

      expect(percentage).toBe(68.8);
      expect(isWarning).toBe(true);

      // 8 lectures: 7 present, 0 late, 1 absent = 7 / 8 = 87.5% (>= 75%)
      const highPct = Number(((7 / 8) * 100).toFixed(1));
      expect(highPct).toBe(87.5);
      expect(highPct < 75.0).toBe(false);
    });
  });

  // Test 10: GPA Calculation
  describe('10. GPA Calculation', () => {
    test('computes weighted GPA from multiple courses correctly', () => {
      const courseGrades = [
        { credit_hours: 3, gpa: 4.0 }, // 12
        { credit_hours: 3, gpa: 3.7 }, // 11.1
        { credit_hours: 4, gpa: 3.0 }, // 12
        { credit_hours: 3, gpa: 3.3 }  // 9.9
      ];

      let totalPoints = 0;
      let totalCredits = 0;

      courseGrades.forEach(c => {
        totalPoints += c.gpa * c.credit_hours;
        totalCredits += c.credit_hours;
      });

      const calculatedGPA = Number((totalPoints / totalCredits).toFixed(2));
      // Total points: 45.0, total credits: 13 -> 45 / 13 = 3.46
      expect(calculatedGPA).toBe(3.46);
    });
  });

  // Test 11: Auth Service (Login & Verification)
  describe('11. AuthService (Login & Password Verification)', () => {
    let inMemoryDb;
    let authService;
    let userRepo;

    beforeAll(async () => {
      Database.resetInstance();
      inMemoryDb = Database.getInstance(':memory:');
      await initSchema(inMemoryDb);
      userRepo = new UserRepository();
      authService = new AuthService();

      const hashed = await bcrypt.hash('Secret@123', 10);
      await userRepo.create({
        name: 'Auth Test User',
        email: 'authtest@sms.edu',
        password: hashed,
        role: 'student'
      });
    });

    afterAll(() => {
      Database.resetInstance();
    });

    test('authenticates valid credentials and returns JWT token', async () => {
      const result = await authService.login('authtest@sms.edu', 'Secret@123');
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('authtest@sms.edu');

      // Verify token
      const decoded = jwt.decode(result.token);
      expect(decoded.email).toBe('authtest@sms.edu');
      expect(decoded.role).toBe('student');
    });

    test('rejects incorrect password with error', async () => {
      await expect(authService.login('authtest@sms.edu', 'WrongPass')).rejects.toThrow('Invalid email or password');
    });

    test('rejects non-existent email with error', async () => {
      await expect(authService.login('nobody@sms.edu', 'Secret@123')).rejects.toThrow('Invalid email or password');
    });
  });

  // Test 12: Role Middleware
  describe('12. Role Middleware (Authorization)', () => {
    test('authorizes user with allowed role and calls next()', () => {
      const req = { user: { id: 1, role: 'admin' } };
      const res = {};
      const next = jest.fn();

      const middleware = authorize(['admin', 'teacher']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('rejects user with unauthorized role with 403 Forbidden', () => {
      const req = { user: { id: 2, role: 'student' } };
      const statusFn = jest.fn().mockReturnThis();
      const jsonFn = jest.fn();
      const res = { status: statusFn, json: jsonFn };
      const next = jest.fn();

      const middleware = authorize(['admin']);
      middleware(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(403);
      expect(jsonFn).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Forbidden') }));
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects unauthenticated request with 401', () => {
      const req = {}; // no req.user
      const statusFn = jest.fn().mockReturnThis();
      const jsonFn = jest.fn();
      const res = { status: statusFn, json: jsonFn };
      const next = jest.fn();

      const middleware = authorize(['admin']);
      middleware(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

});
