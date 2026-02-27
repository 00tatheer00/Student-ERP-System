import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import Department from '../models/Department.js';

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
  { courseCode: 'CS101', courseName: 'Programming Fundamentals', department: 'CS', semester: 1, creditHours: 4 },
  { courseCode: 'CS201', courseName: 'Data Structures', department: 'CS', semester: 2, creditHours: 4 },
  { courseCode: 'CS301', courseName: 'Operating Systems', department: 'CS', semester: 3, creditHours: 3 },
  { courseCode: 'AI101', courseName: 'Machine Learning', department: 'AI', semester: 3, creditHours: 4 },
  { courseCode: 'AI201', courseName: 'Deep Learning', department: 'AI', semester: 4, creditHours: 4 },
  { courseCode: 'CY101', courseName: 'Network Security', department: 'CY', semester: 3, creditHours: 3 },
  { courseCode: 'CY201', courseName: 'Ethical Hacking', department: 'CY', semester: 4, creditHours: 3 },
  { courseCode: 'DS101', courseName: 'Data Mining', department: 'DS', semester: 3, creditHours: 4 },
  { courseCode: 'DS201', courseName: 'Big Data Analytics', department: 'DS', semester: 4, creditHours: 4 },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ucs-erp');
  console.log('Connected to MongoDB');

  await Department.deleteMany({});
  await Department.insertMany(departments);
  console.log('Departments seeded');

  await Course.deleteMany({});
  await Course.insertMany(courses);
  console.log('Courses seeded');

  const adminExists = await User.findOne({ email: 'admin@ucs.edu.pk' });
  if (!adminExists) {
    await User.create({
      email: 'admin@ucs.edu.pk',
      password: 'admin123',
      fullName: 'System Admin',
      role: 'admin',
    });
    console.log('Admin user created: admin@ucs.edu.pk / admin123');
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

  const studentCount = await Student.countDocuments();
  if (studentCount === 0) {
    await Student.create({
      fullName: 'Ali Hassan',
      fatherName: 'Hassan Ahmed',
      CNIC: '35201-1234567-1',
      phone: '0300-1234567',
      email: 'ali@student.ucs.edu.pk',
      address: 'Lahore, Pakistan',
      department: 'CS',
      program: 'BS',
      semester: 3,
      batch: 2023,
      status: 'active',
    });
    console.log('Sample student created');
  }

  console.log('Seed completed');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
