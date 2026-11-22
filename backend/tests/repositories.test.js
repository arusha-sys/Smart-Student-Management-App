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


describe('Repositories', () => {

  // Test 1: Factory Pattern - UserFactory
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
});
