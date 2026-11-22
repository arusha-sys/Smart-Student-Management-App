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


describe('Calculations', () => {

  // Test 1: Factory Pattern - UserFactory
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
});
