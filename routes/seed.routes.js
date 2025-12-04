const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');

const router = express.Router();

// POST /seed/demo-data - Add demo courses, lessons, and quizzes
router.post('/demo-data', async (req, res) => {
  try {
    // Get or create a demo instructor user
    // First, try to get an existing user, or create a demo instructor
    let instructorId = null;
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    if (existingUsers && existingUsers.users && existingUsers.users.length > 0) {
      instructorId = existingUsers.users[0].id;
    } else {
      // Create a demo instructor user
      const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: 'instructor@onlineedutech.com',
        password: 'demo123456',
        email_confirm: true,
        user_metadata: { role: 'instructor' }
      });
      if (newUser) instructorId = newUser.user.id;
    }

    // Demo courses
    const demoCourses = [
      {
        title: 'Complete React Development Course',
        description: 'Master React from basics to advanced concepts. Learn hooks, state management, and building real-world applications.',
        thumbnail_url: 'https://picsum.photos/seed/react/400/300',
        is_premium: false,
        price: 0,
        instructor_id: instructorId,
      },
      {
        title: 'Node.js & Express.js Masterclass',
        description: 'Build scalable backend APIs with Node.js and Express. Learn RESTful APIs, authentication, and database integration.',
        thumbnail_url: 'https://picsum.photos/seed/nodejs/400/300',
        is_premium: true,
        price: 49.99,
        instructor_id: instructorId,
      },
      {
        title: 'TypeScript for Modern Development',
        description: 'Deep dive into TypeScript. Learn type safety, advanced types, generics, and building type-safe applications.',
        thumbnail_url: 'https://picsum.photos/seed/typescript/400/300',
        is_premium: false,
        price: 0,
        instructor_id: instructorId,
      },
      {
        title: 'Full-Stack JavaScript Development',
        description: 'Complete guide to building full-stack applications with JavaScript, React, Node.js, and databases.',
        thumbnail_url: 'https://picsum.photos/seed/fullstack/400/300',
        is_premium: true,
        price: 79.99,
        instructor_id: instructorId,
      },
      {
        title: 'MongoDB & Database Design',
        description: 'Learn MongoDB from scratch. Master database design, queries, aggregation, and best practices.',
        thumbnail_url: 'https://picsum.photos/seed/mongodb/400/300',
        is_premium: false,
        price: 0,
        instructor_id: instructorId,
      },
      {
        title: 'Next.js 14 Complete Guide',
        description: 'Build modern web applications with Next.js 14. Learn SSR, SSG, API routes, and deployment.',
        thumbnail_url: 'https://picsum.photos/seed/nextjs/400/300',
        is_premium: true,
        price: 59.99,
        instructor_id: instructorId,
      },
    ];

    // Insert courses
    const { data: courses, error: courseError } = await supabaseAdmin
      .from('courses')
      .insert(demoCourses)
      .select();

    if (courseError) {
      return res.status(400).json({ message: 'Failed to seed courses: ' + courseError.message });
    }

    let totalQuizzes = 0;
    let totalLessons = 0;

    // Add lessons and quizzes for each course
    if (courses && courses.length > 0) {
      for (const course of courses) {
        // Add lessons for each course
        const lessons = [
          {
            course_id: course.id,
            title: `Introduction to ${course.title.split(' ')[0]}`,
            description: `Get started with ${course.title}`,
            video_path: `videos/${course.id}/lesson-1.mp4`,
            position: 1,
          },
          {
            course_id: course.id,
            title: `${course.title.split(' ')[0]} Fundamentals`,
            description: `Learn the fundamentals of ${course.title}`,
            video_path: `videos/${course.id}/lesson-2.mp4`,
            position: 2,
          },
          {
            course_id: course.id,
            title: `Advanced ${course.title.split(' ')[0]}`,
            description: `Master advanced concepts`,
            video_path: `videos/${course.id}/lesson-3.mp4`,
            position: 3,
          },
        ];

        const { error: lessonError } = await supabaseAdmin.from('lessons').insert(lessons);
        if (!lessonError) totalLessons += lessons.length;

        // Add quizzes for each course
        const quizzes = [
          {
            course_id: course.id,
            question: `What is the main purpose of ${course.title.split(' ')[0]}?`,
            options: JSON.stringify([
              `To build modern applications with ${course.title.split(' ')[0]}`,
              'To manage databases',
              'To design user interfaces',
              'To write server-side code'
            ]),
            correct_index: 0,
          },
          {
            course_id: course.id,
            question: `Which feature is most important in ${course.title.split(' ')[0]}?`,
            options: JSON.stringify([
              'Core concepts and best practices',
              'Color schemes',
              'File organization',
              'Naming conventions'
            ]),
            correct_index: 0,
          },
          {
            course_id: course.id,
            question: `How do you get started with ${course.title.split(' ')[0]}?`,
            options: JSON.stringify([
              'Follow the course lessons step by step',
              'Read documentation only',
              'Watch random videos',
              'Skip the basics'
            ]),
            correct_index: 0,
          },
        ];

        const { error: quizError } = await supabaseAdmin.from('quizzes').insert(quizzes);
        if (!quizError) totalQuizzes += quizzes.length;
      }
    }

    res.json({ 
      message: 'Demo data seeded successfully',
      courses: courses?.length || 0,
      lessons: totalLessons,
      quizzes: totalQuizzes
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ message: error.message || 'Failed to seed demo data' });
  }
});

module.exports = router;