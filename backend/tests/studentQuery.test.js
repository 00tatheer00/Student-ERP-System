import { describe, it, expect } from 'vitest';
import { activeStudentMatch } from '../utils/studentQuery.js';

describe('activeStudentMatch', () => {
  it('marks soft-delete filter with optional fields', () => {
    expect(activeStudentMatch()).toEqual({ deletedAt: null });
    expect(activeStudentMatch({ status: 'active' })).toEqual({ deletedAt: null, status: 'active' });
  });
});
