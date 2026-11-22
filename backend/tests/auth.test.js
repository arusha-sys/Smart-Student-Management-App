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


describe('Authentication', () => {

  // Test 1: Factory Pattern - UserFactory
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
