import Result from '../models/Result.js';
import CoursePrerequisite from '../models/CoursePrerequisite.js';

const PASS_GRADES = new Set(['A', 'B', 'C', 'D']);

export async function studentPassedCourse(studentId, courseCode) {
  const cc = String(courseCode).toUpperCase().trim();
  const results = await Result.find({ studentId });
  for (const r of results) {
    for (const c of r.courses || []) {
      if (String(c.courseCode).toUpperCase() === cc && PASS_GRADES.has(c.grade)) return true;
    }
  }
  return false;
}

export async function assertPrerequisitesMet(studentId, courseCode) {
  const cc = String(courseCode).toUpperCase().trim();
  const prereqs = await CoursePrerequisite.find({ courseCode: cc });
  const missing = [];
  for (const p of prereqs) {
    const pc = String(p.prerequisiteCourseCode).toUpperCase();
    const ok = await studentPassedCourse(studentId, pc);
    if (!ok) missing.push(pc);
  }
  if (missing.length) {
    const err = new Error(`Missing prerequisites: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }
}
