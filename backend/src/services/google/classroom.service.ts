import { getGoogleClients } from '../../config/google';
import { query } from '../../config/database';
import logger from '../../config/logger';

export class GoogleClassroomService {
  /**
   * Sync all courses for a teacher
   */
  static async syncTeacherCourses(userId: string, accessToken: string, refreshToken?: string) {
    try {
      const { classroom } = getGoogleClients(accessToken, refreshToken);
      
      // Fetch courses from Google Classroom
      const response = await classroom.courses.list({
        teacherId: 'me',
        courseStates: ['ACTIVE'],
      });

      const courses = response.data.courses || [];
      logger.info(`Found ${courses.length} courses for teacher ${userId}`);

      // Sync each course to database
      for (const course of courses) {
        await query(
          `INSERT INTO classes (google_classroom_id, name, section, description, room, teacher_id, enrollment_code, synced_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (google_classroom_id)
           DO UPDATE SET
             name = EXCLUDED.name,
             section = EXCLUDED.section,
             description = EXCLUDED.description,
             room = EXCLUDED.room,
             enrollment_code = EXCLUDED.enrollment_code,
             synced_at = NOW(),
             updated_at = NOW()
           RETURNING *`,
          [
            course.id,
            course.name,
            course.section,
            course.descriptionHeading,
            course.room,
            userId,
            course.enrollmentCode,
          ]
        );
      }

      return courses;
    } catch (error) {
      logger.error('Error syncing teacher courses:', error);
      throw new Error('Failed to sync courses from Google Classroom');
    }
  }

  /**
   * Sync student enrollments
   */
  static async syncStudentCourses(userId: string, accessToken: string, refreshToken?: string) {
    try {
      const { classroom } = getGoogleClients(accessToken, refreshToken);
      
      // Fetch courses where user is a student
      const response = await classroom.courses.list({
        studentId: 'me',
        courseStates: ['ACTIVE'],
      });

      const courses = response.data.courses || [];
      logger.info(`Found ${courses.length} courses for student ${userId}`);

      // Sync enrollments
      for (const course of courses) {
        // First, ensure the course exists (might be created by teacher)
        const classResult = await query(
          `INSERT INTO classes (google_classroom_id, name, section, description, room, synced_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (google_classroom_id)
           DO UPDATE SET
             name = EXCLUDED.name,
             section = EXCLUDED.section,
             description = EXCLUDED.description,
             room = EXCLUDED.room,
             synced_at = NOW()
           RETURNING id`,
          [course.id, course.name, course.section, course.descriptionHeading, course.room]
        );

        const classId = classResult.rows[0].id;

        // Create enrollment
        await query(
          `INSERT INTO class_enrollments (class_id, student_id, status)
           VALUES ($1, $2, 'active')
           ON CONFLICT (class_id, student_id)
           DO UPDATE SET status = 'active'`,
          [classId, userId]
        );
      }

      return courses;
    } catch (error) {
      logger.error('Error syncing student courses:', error);
      throw new Error('Failed to sync student courses');
    }
  }

  /**
   * Sync assignments for a specific course
   */
  static async syncCourseAssignments(
    courseId: string,
    classId: string,
    accessToken: string,
    refreshToken?: string
  ) {
    try {
      const { classroom } = getGoogleClients(accessToken, refreshToken);
      
      const response = await classroom.courses.courseWork.list({
        courseId: courseId,
        courseWorkStates: ['PUBLISHED', 'DRAFT'],
      });

      const assignments = response.data.courseWork || [];
      logger.info(`Found ${assignments.length} assignments for course ${courseId}`);

      for (const assignment of assignments) {
        await query(
          `INSERT INTO assignments (
            google_classroom_id, class_id, title, description, due_date, 
            points, assignment_type, state, synced_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT (google_classroom_id)
          DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            due_date = EXCLUDED.due_date,
            points = EXCLUDED.points,
            state = EXCLUDED.state,
            synced_at = NOW(),
            updated_at = NOW()
          RETURNING *`,
          [
            assignment.id,
            classId,
            assignment.title,
            assignment.description,
            assignment.dueDate ? this.parseDueDate(assignment.dueDate, assignment.dueTime) : null,
            assignment.maxPoints,
            assignment.workType,
            assignment.state,
          ]
        );
      }

      return assignments;
    } catch (error) {
      logger.error('Error syncing course assignments:', error);
      throw new Error('Failed to sync assignments');
    }
  }

  /**
   * Sync student submissions for an assignment
   */
  static async syncStudentSubmissions(
    courseId: string,
    assignmentId: string,
    dbAssignmentId: string,
    accessToken: string,
    refreshToken?: string
  ) {
    try {
      const { classroom } = getGoogleClients(accessToken, refreshToken);
      
      const response = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: courseId,
        courseWorkId: assignmentId,
      });

      const submissions = response.data.studentSubmissions || [];
      logger.info(`Found ${submissions.length} submissions for assignment ${assignmentId}`);

      for (const submission of submissions) {
        // Get student's user ID from database
        const studentResult = await query(
          'SELECT id FROM users WHERE google_id = $1',
          [submission.userId]
        );

        if (studentResult.rows.length === 0) continue;

        const studentId = studentResult.rows[0].id;

        await query(
          `INSERT INTO submissions (
            google_submission_id, assignment_id, student_id, state, 
            grade, draft_grade, late, submitted_at, returned_at, 
            submission_history, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (google_submission_id)
          DO UPDATE SET
            state = EXCLUDED.state,
            grade = EXCLUDED.grade,
            draft_grade = EXCLUDED.draft_grade,
            late = EXCLUDED.late,
            submitted_at = EXCLUDED.submitted_at,
            returned_at = EXCLUDED.returned_at,
            submission_history = EXCLUDED.submission_history,
            updated_at = NOW()
          RETURNING *`,
          [
            submission.id,
            dbAssignmentId,
            studentId,
            submission.state,
            submission.assignedGrade,
            submission.draftGrade,
            submission.late || false,
            submission.updateTime,
            null, // returnedTimestamp not available in API response
            JSON.stringify(submission.submissionHistory || []),
          ]
        );
      }

      return submissions;
    } catch (error) {
      logger.error('Error syncing student submissions:', error);
      throw new Error('Failed to sync submissions');
    }
  }

  /**
   * Create a new assignment in Google Classroom
   */
  static async createAssignment(
    courseId: string,
    assignmentData: any,
    accessToken: string,
    refreshToken?: string
  ) {
    try {
      const { classroom } = getGoogleClients(accessToken, refreshToken);
      
      const response = await classroom.courses.courseWork.create({
        courseId: courseId,
        requestBody: {
          title: assignmentData.title,
          description: assignmentData.description,
          workType: assignmentData.workType || 'ASSIGNMENT',
          state: assignmentData.state || 'PUBLISHED',
          maxPoints: assignmentData.maxPoints,
          dueDate: assignmentData.dueDate,
          dueTime: assignmentData.dueTime,
        },
      });

      logger.info(`Created assignment ${response.data.id} in course ${courseId}`);
      return response.data;
    } catch (error) {
      logger.error('Error creating assignment:', error);
      throw new Error('Failed to create assignment in Google Classroom');
    }
  }

  /**
   * Get student's assignments with submission status
   */
  static async getStudentAssignments(studentId: string) {
    try {
      const result = await query(
        `SELECT 
          a.id, a.title, a.description, a.due_date, a.points, a.state,
          c.name as class_name, c.section,
          s.state as submission_state, s.grade, s.late, s.submitted_at,
          CASE 
            WHEN s.state = 'TURNED_IN' THEN 'submitted'
            WHEN s.state = 'RETURNED' THEN 'graded'
            WHEN a.due_date < NOW() AND s.state IS NULL THEN 'overdue'
            ELSE 'pending'
          END as status
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        JOIN class_enrollments ce ON c.id = ce.class_id
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
        WHERE ce.student_id = $1 AND ce.status = 'active' AND a.state = 'published'
        ORDER BY a.due_date ASC NULLS LAST`,
        [studentId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching student assignments:', error);
      throw new Error('Failed to fetch assignments');
    }
  }

  /**
   * Helper: Parse Google Classroom due date format
   */
  private static parseDueDate(dueDate: any, dueTime?: any): Date | null {
    if (!dueDate) return null;
    
    const { year, month, day } = dueDate;
    const hour = dueTime?.hours || 23;
    const minute = dueTime?.minutes || 59;
    
    return new Date(year, month - 1, day, hour, minute);
  }
}

export default GoogleClassroomService;
