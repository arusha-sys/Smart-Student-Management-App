const bcrypt = require('bcryptjs');
const Database = require('../patterns/singletons/Database');
const { initSchema } = require('./schema');
const { AbsoluteGradingStrategy } = require('../patterns/strategies/GradingStrategy');
const { RegularFeeStrategy, ScholarshipFeeStrategy } = require('../patterns/strategies/FeeCalculationStrategy');
const Logger = require('../patterns/singletons/Logger');

async function seedDatabase(dbPath) {
  const logger = Logger.getInstance();
  logger.log('Starting Database Seeder...', 'SEED');

  const db = Database.getInstance(dbPath);
  await initSchema(db);

  // Clear existing records to ensure fresh seed
  const tables = [
    'notifications', 'course_materials', 'submissions', 'assignments',
    'timetables', 'announcements', 'fees', 'marks', 'attendance',
    'enrollments', 'courses', 'students', 'teachers', 'classes', 'users'
  ];

  for (const table of tables) {
    await db.run(`DELETE FROM ${table}`);
    await db.run(`DELETE FROM sqlite_sequence WHERE name='${table}'`).catch(() => {});
  }

  // 1. Password hash
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const teacherPasswordHash = await bcrypt.hash('Teacher@123', 10);
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);

  // 2. Classes
  const c1 = await db.run(`INSERT INTO classes (name, semester, section, department) VALUES ('BSCS-6A', 6, 'A', 'Computer Science')`);
  const c2 = await db.run(`INSERT INTO classes (name, semester, section, department) VALUES ('BSSE-4B', 4, 'B', 'Software Engineering')`);
  const c3 = await db.run(`INSERT INTO classes (name, semester, section, department) VALUES ('BSAI-2A', 2, 'A', 'Artificial Intelligence')`);
  const class6AId = c1.lastID;

  // 3. Admin User
  await db.run(
    `INSERT INTO users (name, email, password, role, phone, address) 
     VALUES ('University Admin', 'admin@sms.edu', ?, 'admin', '+92 300 1112233', 'Central Admin Block, University Campus')`,
    [adminPasswordHash]
  );

  // 4. Teachers
  const tUsers = [
    { name: 'Dr. Ahmed Khan', email: 'prof.ahmed@sms.edu', designation: 'Professor & HOD', dept: 'Computer Science', qual: 'Ph.D in Software Engineering' },
    { name: 'Dr. Sarah Malik', email: 'dr.sarah@sms.edu', designation: 'Associate Professor', dept: 'Computer Science', qual: 'Ph.D in Databases & Information Systems' },
    { name: 'Engr. Ali Raza', email: 'sir.ali@sms.edu', designation: 'Assistant Professor', dept: 'Computer Science', qual: 'MS in Computer Science' }
  ];

  const teacherIds = [];
  for (const t of tUsers) {
    const uRes = await db.run(
      `INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, 'teacher', '+92 301 4455667', 'Faculty Block B')`,
      [t.name, t.email, teacherPasswordHash]
    );
    const tRes = await db.run(
      `INSERT INTO teachers (user_id, designation, department, qualification) VALUES (?, ?, ?, ?)`,
      [uRes.lastID, t.designation, t.dept, t.qual]
    );
    teacherIds.push(tRes.lastID);
  }

  // 5. Students
  const sUsers = [
    { name: 'Hamza Tariq', email: 'student1@sms.edu', reg: '2023-CS-101', roll: 'CS-01', phone: '+92 321 9876543' },
    { name: 'Ayesha Noor', email: 'student2@sms.edu', reg: '2023-CS-102', roll: 'CS-02', phone: '+92 322 8765432' },
    { name: 'Bilal Hassan', email: 'student3@sms.edu', reg: '2023-CS-103', roll: 'CS-03', phone: '+92 323 7654321' }, // Low attendance candidate
    { name: 'Zainab Fatima', email: 'student4@sms.edu', reg: '2023-CS-104', roll: 'CS-04', phone: '+92 324 6543210' },
    { name: 'Usman Ghani', email: 'student5@sms.edu', reg: '2023-CS-105', roll: 'CS-05', phone: '+92 325 5432109' }
  ];

  const studentIds = [];
  const studentUserIds = [];
  for (const s of sUsers) {
    const uRes = await db.run(
      `INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, 'student', ?, 'Student Hostels / City Area')`,
      [s.name, s.email, studentPasswordHash, s.phone]
    );
    const sRes = await db.run(
      `INSERT INTO students (user_id, reg_no, class_id, semester, section, roll_no, gpa, cgpa) VALUES (?, ?, ?, 6, 'A', ?, 3.65, 3.58)`,
      [uRes.lastID, s.reg, class6AId, s.roll]
    );
    studentIds.push(sRes.lastID);
    studentUserIds.push(uRes.lastID);
  }

  // 6. Courses
  const coursesList = [
    { code: 'CS302', title: 'Software Construction & Development', credits: 3, teacherId: teacherIds[0], classId: class6AId },
    { code: 'CS305', title: 'Database Systems & Engineering', credits: 3, teacherId: teacherIds[1], classId: class6AId },
    { code: 'CS308', title: 'Design & Analysis of Algorithms', credits: 3, teacherId: teacherIds[2], classId: class6AId },
    { code: 'CS310', title: 'Computer Communication Networks', credits: 3, teacherId: teacherIds[0], classId: class6AId }
  ];

  const courseIds = [];
  for (const c of coursesList) {
    const cRes = await db.run(
      `INSERT INTO courses (code, title, credit_hours, teacher_id, class_id, semester) VALUES (?, ?, ?, ?, ?, 6)`,
      [c.code, c.title, c.credits, c.teacherId, c.classId]
    );
    courseIds.push(cRes.lastID);
  }

  // 7. Enrollments: Enroll all 5 students into the 4 courses
  for (const sid of studentIds) {
    for (const cid of courseIds) {
      await db.run(
        `INSERT INTO enrollments (student_id, course_id, semester, academic_year) VALUES (?, ?, 6, '2026')`,
        [sid, cid]
      );
    }
  }

  // 8. Attendance:
  // Create 8 past lecture dates
  const lectureDates = [
    '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26',
    '2026-11-02', '2026-11-09', '2026-11-16', '2026-11-20'
  ];

  for (const cid of courseIds) {
    for (let i = 0; i < lectureDates.length; i++) {
      const date = lectureDates[i];
      const topic = `Lecture #${i + 1} - Key concepts & applications`;

      for (let sIdx = 0; sIdx < studentIds.length; sIdx++) {
        const sid = studentIds[sIdx];
        let status = 'present';

        // Student 3 (Bilal Hassan) has 4 absences out of 8 lectures (50% attendance -> will trigger low attendance warning!)
        if (sIdx === 2 && (i === 1 || i === 3 || i === 5 || i === 7)) {
          status = 'absent';
        } else if (sIdx === 1 && i === 4) {
          status = 'late';
        }

        await db.run(
          `INSERT INTO attendance (course_id, student_id, date, status, lecture_topic, marked_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [cid, sid, date, status, topic, teacherIds[0]]
        );
      }
    }
  }

  // 9. Marks with GradingStrategy
  const grading = new AbsoluteGradingStrategy();
  const sampleMarks = [
    { quiz: 18, assignment: 19, mid: 27, final: 32 }, // 96 -> A
    { quiz: 16, assignment: 17, mid: 24, final: 28 }, // 85 -> A
    { quiz: 13, assignment: 14, mid: 20, final: 24 }, // 71 -> B
    { quiz: 17, assignment: 18, mid: 26, final: 29 }, // 90 -> A
    { quiz: 15, assignment: 16, mid: 22, final: 26 }  // 79 -> B+
  ];

  for (let sIdx = 0; sIdx < studentIds.length; sIdx++) {
    const sid = studentIds[sIdx];
    for (let cIdx = 0; cIdx < courseIds.length; cIdx++) {
      const cid = courseIds[cIdx];
      const m = sampleMarks[sIdx];
      // slight variation per course
      const variation = (cIdx % 2 === 0) ? 0 : -3;
      const total = m.quiz + m.assignment + m.mid + m.final + variation;
      const { grade, gpa } = grading.calculateGrade(total);

      await db.run(
        `INSERT INTO marks (course_id, student_id, quiz, assignment, mid, final, total, grade, gpa, grading_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'absolute')`,
        [cid, sid, m.quiz, m.assignment, m.mid + variation, m.final, total, grade, gpa]
      );
    }
  }

  // 10. Timetables
  const timetableEntries = [
    { course_id: courseIds[0], teacher_id: teacherIds[0], class_id: class6AId, day: 'Monday', start: '09:00', end: '10:30', room: 'CS Lab 3' },
    { course_id: courseIds[1], teacher_id: teacherIds[1], class_id: class6AId, day: 'Monday', start: '11:00', end: '12:30', room: 'Hall 201' },
    { course_id: courseIds[2], teacher_id: teacherIds[2], class_id: class6AId, day: 'Tuesday', start: '09:00', end: '10:30', room: 'Room 304' },
    { course_id: courseIds[3], teacher_id: teacherIds[0], class_id: class6AId, day: 'Wednesday', start: '10:00', end: '11:30', room: 'Networking Lab' },
    { course_id: courseIds[0], teacher_id: teacherIds[0], class_id: class6AId, day: 'Thursday', start: '09:00', end: '10:30', room: 'CS Lab 3' },
    { course_id: courseIds[1], teacher_id: teacherIds[1], class_id: class6AId, day: 'Friday', start: '09:30', end: '11:00', room: 'Hall 201' }
  ];

  for (const tt of timetableEntries) {
    await db.run(
      `INSERT INTO timetables (course_id, teacher_id, class_id, day, start_time, end_time, room)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tt.course_id, tt.teacher_id, tt.class_id, tt.day, tt.start, tt.end, tt.room]
    );
  }

  // 11. Fees using FeeCalculationStrategy
  const regularFeeCalc = new RegularFeeStrategy();
  const scholarshipFeeCalc = new ScholarshipFeeStrategy();

  const baseTuition = 65000;
  // Student 1: 50% merit scholarship
  const s1Fee = scholarshipFeeCalc.calculate(baseTuition, { gpa: 3.85 });
  // Student 2: Regular
  const s2Fee = regularFeeCalc.calculate(baseTuition);
  // Student 3: 25% scholarship
  const s3Fee = scholarshipFeeCalc.calculate(baseTuition, { gpa: 3.55 });
  // Student 4 & 5
  const s4Fee = regularFeeCalc.calculate(baseTuition);
  const s5Fee = regularFeeCalc.calculate(baseTuition);

  const feeData = [
    { sid: studentIds[0], title: 'Semester 6 Tuition Fee', calc: s1Fee, status: 'paid', due: '2026-10-15', paid: '2026-10-10' },
    { sid: studentIds[1], title: 'Semester 6 Tuition Fee', calc: s2Fee, status: 'paid', due: '2026-10-15', paid: '2026-10-14' },
    { sid: studentIds[2], title: 'Semester 6 Tuition Fee', calc: s3Fee, status: 'pending', due: '2026-12-01', paid: null },
    { sid: studentIds[3], title: 'Semester 6 Tuition Fee', calc: s4Fee, status: 'partial', due: '2026-12-01', paid: null },
    { sid: studentIds[4], title: 'Semester 6 Tuition Fee', calc: s5Fee, status: 'pending', due: '2026-12-01', paid: null }
  ];

  for (const f of feeData) {
    await db.run(
      `INSERT INTO fees (student_id, title, semester, base_amount, discount_type, discount_amount, final_amount, status, due_date, paid_date)
       VALUES (?, ?, 6, ?, ?, ?, ?, ?, ?, ?)`,
      [f.sid, f.title, f.calc.baseAmount, f.calc.discountType, f.calc.discountAmount, f.calc.finalAmount, f.status, f.due, f.paid]
    );
  }

  // 12. Announcements
  const notices = [
    {
      title: 'Fall 2026 Midterm Exam Schedule Announced',
      content: 'All students and faculty members are informed that Midterm Examinations will commence from next month. Check course timetables and admit cards.',
      target_role: 'all',
      target_class_id: null,
      created_by: 1
    },
    {
      title: 'Software Project Sprint Review #2',
      content: 'BSCS-6A students must submit their Sprint 2 artifacts and architecture diagrams before this Friday 5:00 PM.',
      target_role: 'class',
      target_class_id: class6AId,
      created_by: 1
    },
    {
      title: 'Faculty Meeting: Curriculum & Outcome Based Education',
      content: 'A mandatory faculty meeting will be held in Conference Room 1 on Wednesday at 2:30 PM.',
      target_role: 'teacher',
      target_class_id: null,
      created_by: 1
    }
  ];

  for (const n of notices) {
    await db.run(
      `INSERT INTO announcements (title, content, target_role, target_class_id, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [n.title, n.content, n.target_role, n.target_class_id, n.created_by]
    );
  }

  // 13. Assignments & Course Materials
  const asg1 = await db.run(
    `INSERT INTO assignments (course_id, teacher_id, title, description, deadline, max_marks)
     VALUES (?, ?, 'Design Patterns Implementation in Express', 'Implement Singleton, Factory, Strategy, Observer, and Repository patterns in a Node.js Express backend.', '2026-11-30 23:59:59', 100)`,
    [courseIds[0], teacherIds[0]]
  );

  const asg2 = await db.run(
    `INSERT INTO assignments (course_id, teacher_id, title, description, deadline, max_marks)
     VALUES (?, ?, 'Database Schema Normalization & Query Optimization', 'Design a normalized 3NF database schema and write optimized SQL queries with indexing.', '2026-12-05 23:59:59', 100)`,
    [courseIds[1], teacherIds[1]]
  );

  // Student 1 submitted Assignment 1
  await db.run(
    `INSERT INTO submissions (assignment_id, student_id, submission_text, file_url, marks_obtained, feedback, submitted_at, graded_at)
     VALUES (?, ?, 'Here is the GitHub link and documentation for our project design patterns implementation.', 'https://github.com/student/patterns-project', 95.0, 'Excellent design and clean code separation.', '2026-11-20 14:00:00', '2026-11-21 10:00:00')`,
    [asg1.lastID, studentIds[0]]
  );

  // Course Materials
  await db.run(
    `INSERT INTO course_materials (course_id, teacher_id, title, description, file_url)
     VALUES (?, ?, 'Lecture 1: Software Architecture and MVC Patterns', 'Introductory slides explaining Model-View-Controller and Repository decoupling.', 'https://sms.edu/materials/lecture1-mvc.pdf')`,
    [courseIds[0], teacherIds[0]]
  );

  await db.run(
    `INSERT INTO course_materials (course_id, teacher_id, title, description, file_url)
     VALUES (?, ?, 'Lecture 2: Creational & Behavioral Patterns', 'In-depth notes on Singleton, Factory, Strategy, and Observer pattern architectures.', 'https://sms.edu/materials/lecture2-patterns.pdf')`,
    [courseIds[0], teacherIds[0]]
  );

  // 14. Notifications
  await db.run(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, 'Attendance Warning: Attendance Below 75%', 'Your attendance in CS308 has fallen below 75% (50.0%). Please meet your course instructor immediately.', 'warning')`,
    [studentUserIds[2]] // Bilal Hassan
  );

  await db.run(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, 'Assignment Graded', 'Your submission for "Design Patterns Implementation" has been graded. Marks: 95/100', 'success')`,
    [studentUserIds[0]]
  );

  logger.log('Database seeding successfully completed with sample data!', 'SEED');
  return { success: true };
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
