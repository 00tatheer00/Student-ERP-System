import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';
import Fee from '../models/Fee.js';
import Fine from '../models/Fine.js';
import Course from '../models/Course.js';
import Department from '../models/Department.js';
import AcademicTerm from '../models/AcademicTerm.js';
import Enrollment from '../models/Enrollment.js';
import CoursePrerequisite from '../models/CoursePrerequisite.js';
import DegreeRequirement from '../models/DegreeRequirement.js';
import ExamHall from '../models/ExamHall.js';
import ExamSession from '../models/ExamSession.js';
import ExamSeatAssignment from '../models/ExamSeatAssignment.js';
import MalpracticeLog from '../models/MalpracticeLog.js';
import ServiceLedger from '../models/ServiceLedger.js';

dotenv.config();

const departments = [
  { code: 'CS', name: 'Computer Science' },
  { code: 'SE', name: 'Software Engineering' },
  { code: 'AI', name: 'Artificial Intelligence' },
  { code: 'CY', name: 'Cybersecurity' },
  { code: 'DS', name: 'Data Science' },
  { code: 'IT', name: 'Information Technology' },
];

const courses = [
  // CS
  { courseCode: 'CS101', courseName: 'Programming Fundamentals', department: 'CS', semester: 1, creditHours: 4 },
  { courseCode: 'CS102', courseName: 'Discrete Structures', department: 'CS', semester: 1, creditHours: 3 },
  { courseCode: 'CS201', courseName: 'Data Structures', department: 'CS', semester: 2, creditHours: 4 },
  { courseCode: 'CS202', courseName: 'Database Systems', department: 'CS', semester: 2, creditHours: 4 },
  { courseCode: 'CS301', courseName: 'Operating Systems', department: 'CS', semester: 3, creditHours: 3 },
  { courseCode: 'CS302', courseName: 'Computer Networks', department: 'CS', semester: 3, creditHours: 3 },

  // SE
  { courseCode: 'SE101', courseName: 'Software Engineering Principles', department: 'SE', semester: 1, creditHours: 4 },
  { courseCode: 'SE102', courseName: 'Version Control & Collaboration', department: 'SE', semester: 1, creditHours: 2 },
  { courseCode: 'SE201', courseName: 'Requirements Engineering', department: 'SE', semester: 2, creditHours: 4 },
  { courseCode: 'SE202', courseName: 'System Design', department: 'SE', semester: 2, creditHours: 4 },
  { courseCode: 'SE301', courseName: 'Software Architecture', department: 'SE', semester: 3, creditHours: 3 },
  { courseCode: 'SE302', courseName: 'Software Testing', department: 'SE', semester: 3, creditHours: 3 },
  { courseCode: 'SE401', courseName: 'Agile Methods', department: 'SE', semester: 4, creditHours: 4 },
  { courseCode: 'SE402', courseName: 'DevOps & CI/CD', department: 'SE', semester: 4, creditHours: 3 },

  // AI
  { courseCode: 'AI101', courseName: 'Machine Learning', department: 'AI', semester: 3, creditHours: 4 },
  { courseCode: 'AI102', courseName: 'Data Ethics & Preprocessing', department: 'AI', semester: 3, creditHours: 3 },
  { courseCode: 'AI201', courseName: 'Deep Learning', department: 'AI', semester: 4, creditHours: 4 },
  { courseCode: 'AI202', courseName: 'Reinforcement Learning', department: 'AI', semester: 4, creditHours: 3 },

  // CY
  { courseCode: 'CY101', courseName: 'Network Security', department: 'CY', semester: 3, creditHours: 3 },
  { courseCode: 'CY102', courseName: 'Cryptography', department: 'CY', semester: 3, creditHours: 4 },
  { courseCode: 'CY201', courseName: 'Ethical Hacking', department: 'CY', semester: 4, creditHours: 3 },
  { courseCode: 'CY202', courseName: 'Security Operations', department: 'CY', semester: 4, creditHours: 4 },

  // DS
  { courseCode: 'DS101', courseName: 'Data Mining', department: 'DS', semester: 3, creditHours: 4 },
  { courseCode: 'DS102', courseName: 'Statistics for Data Science', department: 'DS', semester: 3, creditHours: 3 },
  { courseCode: 'DS201', courseName: 'Big Data Analytics', department: 'DS', semester: 4, creditHours: 4 },
  { courseCode: 'DS202', courseName: 'Machine Learning for Data Science', department: 'DS', semester: 4, creditHours: 3 },

  // IT
  { courseCode: 'IT101', courseName: 'Web Technologies', department: 'IT', semester: 1, creditHours: 4 },
  { courseCode: 'IT102', courseName: 'UX & Frontend Engineering', department: 'IT', semester: 1, creditHours: 3 },
  { courseCode: 'IT201', courseName: 'Network Fundamentals', department: 'IT', semester: 2, creditHours: 4 },
  { courseCode: 'IT202', courseName: 'Operating & Systems Administration', department: 'IT', semester: 2, creditHours: 3 },
  { courseCode: 'IT301', courseName: 'Cloud Computing', department: 'IT', semester: 3, creditHours: 3 },
  { courseCode: 'IT302', courseName: 'IoT Systems', department: 'IT', semester: 3, creditHours: 3 },
  { courseCode: 'IT401', courseName: 'Mobile Application Development', department: 'IT', semester: 4, creditHours: 4 },
  { courseCode: 'IT402', courseName: 'IT Governance & Security', department: 'IT', semester: 4, creditHours: 3 },
];

const deptSemesterPool = {
  CS: [1, 2, 3],
  SE: [1, 2, 3, 4],
  AI: [3, 4],
  CY: [3, 4],
  DS: [3, 4],
  IT: [1, 2, 3, 4],
};

const firstNames = ['Ali', 'Hassan', 'Ahmed', 'Omar', 'Bilal', 'Faisal', 'Noman', 'Zain', 'Usman', 'Yasir', 'Muneeb', 'Umair'];
const lastNames = ['Hassan', 'Khan', 'Ahmed', 'Rehman', 'Raza', 'Ibrahim', 'Saeed', 'Sharif', 'Qureshi', 'Hussain', 'Malik', 'Nawaz'];
const fatherNames = ['Hassan Ahmed', 'Saeed Khan', 'Rehman Malik', 'Ghulam Mustafa', 'Asif Mahmood', 'Zafar Hussain', 'Nadeem Raza'];
const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Multan', 'Faisalabad', 'Peshawar'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const gradeFromMarks = (marks) => {
  if (marks >= 85) return 'A';
  if (marks >= 70) return 'B';
  if (marks >= 55) return 'C';
  if (marks >= 45) return 'D';
  return 'F';
};

const pointsFromGrade = (grade) => {
  switch (grade) {
    case 'A':
      return 4;
    case 'B':
      return 3;
    case 'C':
      return 2;
    case 'D':
      return 1;
    default:
      return 0;
  }
};

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ucs-erp');
  console.log('Connected to MongoDB');

  await Department.deleteMany({});
  await Department.insertMany(departments);
  console.log('Departments seeded');

  await Course.deleteMany({});
  await Course.insertMany(courses);
  console.log('Courses seeded');

  // Clear module data only when we want a full reseed.
  // By default we append dummy data to keep your existing seeded data.
  const existingStudentsTotal = await Student.countDocuments();
  const shouldClearModules = process.env.CLEAR_MODULES === 'true' || existingStudentsTotal === 0;

  if (shouldClearModules) {
    await User.deleteMany({
      email: { $in: ['student.portal@ucs.edu.pk', 'parent.portal@ucs.edu.pk'] },
    });
    // Clear module data (we keep User accounts like admin/teacher/reception/hod).
    await Enrollment.deleteMany({});
    await AcademicTerm.deleteMany({});
    await CoursePrerequisite.deleteMany({});
    await DegreeRequirement.deleteMany({});
    await ExamSeatAssignment.deleteMany({});
    await ExamSession.deleteMany({});
    await ExamHall.deleteMany({});
    await MalpracticeLog.deleteMany({});
    await ServiceLedger.deleteMany({});
    await Student.deleteMany({});
    await Attendance.deleteMany({});
    await Result.deleteMany({});
    await Fee.deleteMany({});
    await Fine.deleteMany({});
    console.log('Cleared student/attendance/results/fees/fines + extended academic collections');
  } else {
    console.log('Appending additional dummy students + related module data');
  }

  // ---- Students ----
  const studentsToCreate = [];
  for (const [deptIndex, dept] of departments.entries()) {
    const semPool = deptSemesterPool[dept.code] || [1, 2, 3, 4];
    const addMin = parseInt(process.env.ADD_STUDENTS_MIN || '11', 10);
    const addMax = parseInt(process.env.ADD_STUDENTS_MAX || '30', 10);
    const addCount = randInt(addMin, addMax);

    // Use existing counts to avoid collisions in studentId/CNIC.
    const existingCountForDept = await Student.countDocuments({ department: dept.code });

    for (let i = 1; i <= addCount; i++) {
      const seq = existingCountForDept + i;
      const semester = pick(semPool);
      // Make MS slightly less common for nicer variety.
      const program = semester <= 4 && Math.random() < 0.25 ? 'MS' : 'BS';
      const first = pick(firstNames);
      const last = pick(lastNames);
      const fullName = `${first} ${last}`;
      const fatherFullName = pick(fatherNames);
      const phone = `03${deptIndex + 1}${String(seq).padStart(7, '0')}`.slice(0, 10);
      const email = `${first}.${last}${dept.code.toLowerCase()}${seq}@student.ucs.edu.pk`.toLowerCase();

      // Provide our own studentId so the hook doesn't rely on countDocuments.
      const studentId = `UCS-${dept.code}-${String(seq).padStart(3, '0')}`;
      const CNIC = `35${deptIndex}${String(seq).padStart(6, '0')}-${(seq % 9) + 1}`;

      studentsToCreate.push({
        studentId,
        fullName,
        fatherName: fatherFullName,
        CNIC,
        phone,
        email,
        address: `${pick(cities)}, Pakistan`,
        department: dept.code,
        program,
        semester,
        batch: randInt(2021, 2026),
        profilePhoto: '',
        status: 'active',
      });
    }
  }

  const createdStudents = await Student.insertMany(studentsToCreate);
  console.log(`Students added: ${createdStudents.length}`);

  // Helper: get candidate courses for a student.
  const getCoursesFor = (deptCode, semester) => {
    const exact = courses.filter((c) => c.department === deptCode && c.semester === semester);
    if (exact.length) return exact;
    const fallback = courses.filter((c) => c.department === deptCode);
    return fallback.length ? fallback : courses;
  };

  // ---- Attendance + Results ----
  const attendanceToCreate = [];
  const resultsToCreate = [];

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 25);
  baseDate.setHours(0, 0, 0, 0);

  for (const student of createdStudents) {
    const deptCode = student.department;
    const studentSemester = student.semester;
    const candidates = getCoursesFor(deptCode, studentSemester);
    const chosen = candidates.slice(0, 2); // keep it small + consistent

    // Attendance dates: 5 consecutive days.
    for (const [courseIdx, course] of chosen.entries()) {
      for (let day = 0; day < 5; day++) {
        // Store at midnight so "same day" comparisons work consistently.
        const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + day);
        const roll = Math.random();
        const status = roll < 0.78 ? 'present' : roll < 0.88 ? 'late' : roll < 0.97 ? 'absent' : 'excused';
        const methodRoll = Math.random();
        const method = methodRoll < 0.7 ? 'manual' : methodRoll < 0.9 ? 'qr' : 'biometric';

        attendanceToCreate.push({
          studentId: student._id,
          courseCode: course.courseCode,
          date,
          status,
          method,
        });
      }
    }

    // Results for the student's semester based on the chosen courses.
    const courseResults = chosen.map((course) => {
      // skew towards passing grades for nicer demo data
      const marks = randInt(50, 100);
      const grade = gradeFromMarks(marks);
      return {
        courseCode: course.courseCode,
        marks,
        grade,
        creditHours: course.creditHours,
      };
    });

    const totalCredits = courseResults.reduce((sum, c) => sum + c.creditHours, 0) || 1;
    const gpaRaw = courseResults.reduce((sum, c) => sum + pointsFromGrade(c.grade) * c.creditHours, 0) / totalCredits;
    const GPA = Math.round(gpaRaw * 100) / 100;
    const CGPA = clamp(Math.round((GPA + randInt(-10, 10) / 10) * 100) / 100, 0, 4);

    resultsToCreate.push({
      studentId: student._id,
      semester: studentSemester,
      courses: courseResults,
      GPA,
      CGPA,
    });
  }

  await Attendance.insertMany(attendanceToCreate);
  await Result.insertMany(resultsToCreate);
  console.log(`Attendance seeded: ${attendanceToCreate.length}, Results seeded: ${resultsToCreate.length}`);

  // ---- Fees ----
  const feeToCreate = [];
  for (const student of createdStudents) {
    const semesterFee = randInt(25000, 60000);
    const labFee = randInt(4000, 12000);
    const libraryFee = randInt(2000, 8000);
    const totalAmount = semesterFee + labFee + libraryFee;

    const roll = Math.random();
    const status = roll < 0.6 ? 'paid' : roll < 0.9 ? 'partial' : 'pending';

    const feeDoc = {
      studentId: student._id,
      semester: student.semester,
      semesterFee,
      labFee,
      libraryFee,
      totalAmount,
      paidAmount: 0,
      paymentHistory: [],
      status,
    };

    if (status === 'paid') {
      feeDoc.paidAmount = totalAmount;
      feeDoc.paymentHistory.push({
        amount: totalAmount,
        type: 'semester',
        paidAt: new Date(),
        receiptNo: `RCPT-${student.department}-${student.semester}-${randInt(1000, 9999)}`,
      });
    } else if (status === 'partial') {
      const partial = Math.round(totalAmount * (0.4 + Math.random() * 0.4));
      feeDoc.paidAmount = partial;
      feeDoc.paymentHistory.push({
        amount: partial,
        type: 'semester',
        paidAt: new Date(),
        receiptNo: `RCPT-${student.department}-${student.semester}-${randInt(1000, 9999)}`,
      });
    }

    feeToCreate.push(feeDoc);
  }

  await Fee.insertMany(feeToCreate);
  console.log(`Fees seeded: ${feeToCreate.length}`);

  // ---- Fines ----
  const fineTypes = ['late_submission', 'plagiarism', 'no_id_card', 'discipline_violation'];
  const fineToCreate = [];
  for (const student of createdStudents) {
    if (Math.random() > 0.25) continue; // ~25% fines for demo variety
    const type = pick(fineTypes);
    const amount = randInt(1000, 10000);
    const roll = Math.random();
    const status = roll < 0.7 ? 'pending' : 'paid';

    fineToCreate.push({
      studentId: student._id,
      type,
      amount,
      description: `Auto-generated dummy fine: ${type.replaceAll('_', ' ')}`,
      status,
      paidAt: status === 'paid' ? new Date() : undefined,
    });
  }

  if (fineToCreate.length) {
    await Fine.insertMany(fineToCreate);
  }
  console.log(`Fines seeded: ${fineToCreate.length}`);

  const adminEmails = ['admin@uop.edu.pk', 'admin@ucs.edu.pk'];
  let adminUser = await User.findOne({ email: { $in: adminEmails } });
  if (!adminUser) {
    await User.create({
      email: 'admin@uop.edu.pk',
      password: 'admin123',
      fullName: 'System Admin',
      role: 'admin',
    });
    console.log('Admin user created: admin@uop.edu.pk / admin123');
  } else {
    let adminChanged = false;
    if (adminUser.email === 'admin@ucs.edu.pk') {
      adminUser.email = 'admin@uop.edu.pk';
      adminChanged = true;
    }
    if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      adminChanged = true;
    }
    if (!adminUser.isActive) {
      adminUser.isActive = true;
      adminChanged = true;
    }
    if (adminChanged) {
      await adminUser.save();
      console.log('Admin account normalized: admin@uop.edu.pk with admin role');
    }
  }

  const teacherExists = await User.findOne({ email: 'teacher@ucs.edu.pk' });
  if (!teacherExists) {
    await User.create({
      email: 'teacher@ucs.edu.pk',
      password: 'teacher123',
      fullName: 'Dr. Ahmed Khan',
      role: 'teacher',
      department: 'CS',
    });
    console.log('Teacher user created: teacher@ucs.edu.pk / teacher123');
  }

  const receptionExists = await User.findOne({ email: 'reception@ucs.edu.pk' });
  if (!receptionExists) {
    await User.create({
      email: 'reception@ucs.edu.pk',
      password: 'reception123',
      fullName: 'Reception Staff',
      role: 'reception',
    });
    console.log('Reception user created: reception@ucs.edu.pk / reception123');
  }

  const hodExists = await User.findOne({ email: 'hod@ucs.edu.pk' });
  if (!hodExists) {
    await User.create({
      email: 'hod@ucs.edu.pk',
      password: 'hod123',
      fullName: 'Dr. HOD CS',
      role: 'hod',
      department: 'CS',
    });
    console.log('HOD user created: hod@ucs.edu.pk / hod123');
  }

  // ---- Academic term, prerequisites, degree plan, exam hall, portal demo users ----
  const demoStudent = createdStudents.find((s) => s.department === 'CS') || createdStudents[0];
  if (demoStudent) {
    let term = await AcademicTerm.findOne({ isActive: true });
    if (!term) {
      const enrollmentOpenAt = new Date();
      enrollmentOpenAt.setDate(enrollmentOpenAt.getDate() - 14);
      const enrollmentCloseAt = new Date();
      enrollmentCloseAt.setDate(enrollmentCloseAt.getDate() + 120);
      const addDropDeadline = new Date();
      addDropDeadline.setDate(addDropDeadline.getDate() + 90);
      term = await AcademicTerm.create({
        label: 'Open Term (demo)',
        semester: 1,
        year: 2026,
        enrollmentOpenAt,
        enrollmentCloseAt,
        addDropDeadline,
        isActive: true,
      });
      console.log('Academic term created (enrollment window open for demo)');
    }

    await CoursePrerequisite.updateOne(
      { courseCode: 'CS201', prerequisiteCourseCode: 'CS101' },
      { $setOnInsert: { courseCode: 'CS201', prerequisiteCourseCode: 'CS101' } },
      { upsert: true }
    );

    await DegreeRequirement.updateOne(
      { program: 'BS', department: 'CS' },
      {
        $set: {
          title: 'CS BS core (demo)',
          requiredCourseCodes: ['CS101', 'CS102', 'CS201'],
        },
      },
      { upsert: true }
    );

    await ExamHall.updateOne(
      { code: 'HALL-A' },
      { $setOnInsert: { code: 'HALL-A', name: 'Main Auditorium', capacity: 200 } },
      { upsert: true }
    );

    const studentPortalEmail = 'student.portal@ucs.edu.pk';
    if (!(await User.findOne({ email: studentPortalEmail }))) {
      await User.create({
        email: studentPortalEmail,
        password: 'portal123',
        fullName: `Portal: ${demoStudent.fullName}`,
        role: 'student',
        linkedStudentId: demoStudent._id,
      });
      console.log(`Portal student: ${studentPortalEmail} / portal123 → ${demoStudent.studentId}`);
    }

    const parentPortalEmail = 'parent.portal@ucs.edu.pk';
    if (!(await User.findOne({ email: parentPortalEmail }))) {
      await User.create({
        email: parentPortalEmail,
        password: 'portal123',
        fullName: 'Demo Parent',
        role: 'parent',
        parentOfStudentIds: [demoStudent._id],
      });
      console.log(`Portal parent: ${parentPortalEmail} / portal123`);
    }
  }

  console.log('Seed completed');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
