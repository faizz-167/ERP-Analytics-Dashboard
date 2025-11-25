import db from "@/database/drizzle";
import {
  departments,
  subjects,
  students,
  marks,
  attendance,
} from "@/database/schema";
import { sql } from "drizzle-orm";

// Helper function to generate realistic marks based on student performance level
function generateMarks(
  performanceLevel: "excellent" | "good" | "average" | "poor" | "struggling"
) {
  let cat1, cat2, cat3, semester;

  switch (performanceLevel) {
    case "excellent":
      cat1 = Math.floor(Math.random() * 8) + 43; // 43-50
      cat2 = Math.floor(Math.random() * 8) + 43; // 43-50
      cat3 = Math.floor(Math.random() * 8) + 43; // 43-50
      semester = Math.floor(Math.random() * 11) + 85; // 85-95
      break;
    case "good":
      cat1 = Math.floor(Math.random() * 8) + 35; // 35-42
      cat2 = Math.floor(Math.random() * 8) + 35; // 35-42
      cat3 = Math.floor(Math.random() * 8) + 35; // 35-42
      semester = Math.floor(Math.random() * 15) + 70; // 70-84
      break;
    case "average":
      cat1 = Math.floor(Math.random() * 10) + 25; // 25-34
      cat2 = Math.floor(Math.random() * 10) + 25; // 25-34
      cat3 = Math.floor(Math.random() * 10) + 25; // 25-34
      semester = Math.floor(Math.random() * 15) + 55; // 55-69
      break;
    case "poor":
      cat1 = Math.floor(Math.random() * 10) + 15; // 15-24
      cat2 = Math.floor(Math.random() * 10) + 15; // 15-24
      cat3 = Math.floor(Math.random() * 10) + 15; // 15-24
      semester = Math.floor(Math.random() * 15) + 40; // 40-54
      break;
    case "struggling":
      cat1 = Math.floor(Math.random() * 15) + 5; // 5-19
      cat2 = Math.floor(Math.random() * 15) + 5; // 5-19
      cat3 = Math.floor(Math.random() * 15) + 5; // 5-19
      semester = Math.floor(Math.random() * 15) + 25; // 25-39
      break;
  }

  return { cat1, cat2, cat3, semester };
}

// Helper function to get attendance probability based on performance
function getAttendanceProbability(performanceLevel: string): number {
  switch (performanceLevel) {
    case "excellent":
      return 0.95; // 95% attendance
    case "good":
      return 0.88; // 88% attendance
    case "average":
      return 0.78; // 78% attendance
    case "poor":
      return 0.65; // 65% attendance
    case "struggling":
      return 0.5; // 50% attendance
    default:
      return 0.85;
  }
}

// Indian student names
const indianNames = [
  "Aarav Kumar",
  "Aditi Sharma",
  "Arjun Patel",
  "Ananya Singh",
  "Rohan Gupta",
  "Priya Reddy",
  "Vivek Menon",
  "Sneha Iyer",
  "Karthik Krishnan",
  "Divya Nair",
  "Rahul Verma",
  "Aishwarya Rao",
  "Siddharth Joshi",
  "Pooja Desai",
  "Amit Shah",
  "Kavya Pillai",
  "Nikhil Agarwal",
  "Riya Kapoor",
  "Varun Mehta",
  "Shreya Malhotra",
  "Aditya Pandey",
  "Neha Chopra",
  "Aryan Sinha",
  "Anjali Bhat",
  "Harsh Bansal",
  "Tanvi Kulkarni",
  "Rohit Saxena",
  "Megha Trivedi",
  "Pranav Goyal",
  "Sakshi Arora",
  "Kunal Thakur",
  "Nisha Chauhan",
  "Sai Prasad",
  "Ishita Jain",
  "Manish Tiwari",
  "Kritika Bose",
  "Akash Mishra",
  "Deepika Shetty",
  "Shubham Yadav",
  "Ritika Bhatt",
  "Vishal Kohli",
  "Preeti Dutta",
  "Abhishek Ghosh",
  "Shruti Mukherjee",
  "Vikram Rana",
  "Anushka Das",
  "Gaurav Dubey",
  "Simran Kaur",
  "Rajesh Kumar",
  "Pallavi Hegde",
  "Manoj Reddy",
  "Swati Naik",
  "Kiran Patil",
  "Meera Sethi",
  "Sandeep Varma",
  "Gayatri Raman",
  "Pavan Kumar",
  "Bhavana Menon",
  "Chetan Iyer",
  "Lakshmi Nair",
  "Suresh Gupta",
  "Kavita Sharma",
  "Naveen Patel",
  "Anjana Singh",
  "Dinesh Rao",
  "Shalini Joshi",
  "Prakash Desai",
  "Madhuri Shah",
  "Ramesh Pillai",
  "Usha Agarwal",
  "Gopal Kapoor",
  "Sunita Mehta",
  "Mahesh Malhotra",
  "Rekha Pandey",
  "Ashok Chopra",
  "Vandana Sinha",
  "Sunil Bhat",
  "Rani Bansal",
  "Ravi Kulkarni",
  "Poornima Saxena",
  "Naresh Trivedi",
  "Kamala Goyal",
  "Rajiv Arora",
  "Indira Thakur",
  "Mohan Chauhan",
  "Geetha Prasad",
  "Krishna Jain",
  "Savitri Tiwari",
  "Balaji Bose",
  "Shakuntala Mishra",
  "Murali Shetty",
  "Vasudha Yadav",
  "Shankar Bhatt",
  "Padma Kohli",
  "Venkatesan Dutta",
  "Jayanthi Ghosh",
  "Srinivas Mukherjee",
  "Lalitha Rana",
  "Anand Das",
  "Shanthi Dubey",
  "Ramakrishnan Kaur",
  "Kalyani Kumar",
  "Subramanian Hegde",
  "Parvathi Reddy",
  "Ganesh Naik",
  "Vimala Patil",
  "Jagadeesh Sethi",
  "Saroja Varma",
  "Vijay Raman",
  "Radha Kumar",
  "Saravanan Menon",
  "Mythili Iyer",
  "Balasubramanian Nair",
  "Devika Gupta",
  "Murugan Sharma",
  "Selvi Patel",
  "Thangaraj Singh",
  "Meenakshi Rao",
  "Raghavan Joshi",
  "Malathi Desai",
  "Senthil Shah",
  "Bhagyalakshmi Pillai",
  "Karthikeyan Agarwal",
  "Sharmila Kapoor",
  "Prakash Mehta",
];

// Helper to assign performance level
function assignPerformanceLevel(
  index: number,
  total: number
): "excellent" | "good" | "average" | "poor" | "struggling" {
  const percentage = (index / total) * 100;

  if (percentage < 15) return "excellent"; // Top 15%
  if (percentage < 40) return "good"; // Next 25%
  if (percentage < 70) return "average"; // Next 30%
  if (percentage < 90) return "poor"; // Next 20%
  return "struggling"; // Bottom 10%
}

// Helper to get a random name
function getRandomName(usedNames: Set<string>): string {
  let name;
  do {
    name = indianNames[Math.floor(Math.random() * indianNames.length)];
  } while (usedNames.has(name));
  usedNames.add(name);
  return name;
}

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear all tables in correct order (respecting foreign key constraints)
    console.log("🗑️  Clearing existing data...");
    await db.delete(attendance);
    await db.delete(marks);
    await db.delete(students);
    await db.delete(subjects);

    // Check if users table exists and clear it if needed
    try {
      await db.execute(
        sql`DELETE FROM users WHERE role != 'admin' OR role IS NULL`
      );
      console.log("   Cleared non-admin users");
    } catch (error) {
      console.log("   No users to clear or users table doesn't exist");
    }

    await db.delete(departments);

    // Reset sequences
    await db.execute(sql`ALTER SEQUENCE departments_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE subjects_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE students_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE marks_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE attendance_id_seq RESTART WITH 1`);

    // 1. Insert Departments
    console.log("📚 Inserting departments...");
    const depts = await db
      .insert(departments)
      .values([
        { name: "CSE" },
        { name: "ECE" },
        { name: "IT" },
        { name: "AIML" },
        { name: "AIDS" },
      ])
      .returning();

    console.log(`✅ Created ${depts.length} departments`);

    // 2. Insert Subjects
    console.log("📖 Inserting subjects...");
    const subjectsData = await db
      .insert(subjects)
      .values([
        // CSE Subjects
        {
          name: "Data Structures",
          code: "CS201",
          semester: 3,
          departmentId: depts[0].id,
        },
        {
          name: "Cloud Computing",
          code: "CS301",
          semester: 5,
          departmentId: depts[0].id,
        },
        {
          name: "Deep Learning",
          code: "CS401",
          semester: 7,
          departmentId: depts[0].id,
        },
        {
          name: "OOPS",
          code: "CS101",
          semester: 2,
          departmentId: depts[0].id,
        },
        {
          name: "Database Management Systems",
          code: "CS202",
          semester: 4,
          departmentId: depts[0].id,
        },

        // ECE Subjects
        {
          name: "Digital Signal Processing",
          code: "EC301",
          semester: 5,
          departmentId: depts[1].id,
        },
        {
          name: "VLSI Design",
          code: "EC401",
          semester: 6,
          departmentId: depts[1].id,
        },
        {
          name: "Microprocessors",
          code: "EC201",
          semester: 4,
          departmentId: depts[1].id,
        },

        // IT Subjects
        {
          name: "Web Development",
          code: "IT301",
          semester: 5,
          departmentId: depts[2].id,
        },
        {
          name: "Network Security",
          code: "IT401",
          semester: 7,
          departmentId: depts[2].id,
        },
        {
          name: "Software Engineering",
          code: "IT201",
          semester: 4,
          departmentId: depts[2].id,
        },

        // AIML Subjects
        {
          name: "Machine Learning",
          code: "AI301",
          semester: 5,
          departmentId: depts[3].id,
        },
        {
          name: "Deep Learning",
          code: "AI401",
          semester: 6,
          departmentId: depts[3].id,
        },
        {
          name: "Natural Language Processing",
          code: "AI501",
          semester: 7,
          departmentId: depts[3].id,
        },

        // AIDS Subjects
        {
          name: "Data Science Fundamentals",
          code: "DS201",
          semester: 3,
          departmentId: depts[4].id,
        },
        {
          name: "Big Data Analytics",
          code: "DS301",
          semester: 5,
          departmentId: depts[4].id,
        },
        {
          name: "Data Visualization",
          code: "DS401",
          semester: 6,
          departmentId: depts[4].id,
        },
      ])
      .returning();

    console.log(`✅ Created ${subjectsData.length} subjects`);

    // 3. Insert Students with Performance Levels
    console.log("👥 Inserting students...");
    const studentsList = [];
    const studentPerformance = new Map(); // Store performance level for each student
    const usedNames = new Set<string>(); // Track used names

    // Generate 30 students for CSE
    for (let i = 1; i <= 30; i++) {
      const regNum = `CSE2023${String(i).padStart(3, "0")}`;
      const performance = assignPerformanceLevel(i, 30);
      studentsList.push({
        registerNumber: regNum,
        name: getRandomName(usedNames),
        departmentId: depts[0].id,
      });
      studentPerformance.set(regNum, performance);
    }

    // Generate 25 students for ECE
    for (let i = 1; i <= 25; i++) {
      const regNum = `ECE2023${String(i).padStart(3, "0")}`;
      const performance = assignPerformanceLevel(i, 25);
      studentsList.push({
        registerNumber: regNum,
        name: getRandomName(usedNames),
        departmentId: depts[1].id,
      });
      studentPerformance.set(regNum, performance);
    }

    // Generate 28 students for IT
    for (let i = 1; i <= 28; i++) {
      const regNum = `IT2023${String(i).padStart(3, "0")}`;
      const performance = assignPerformanceLevel(i, 28);
      studentsList.push({
        registerNumber: regNum,
        name: getRandomName(usedNames),
        departmentId: depts[2].id,
      });
      studentPerformance.set(regNum, performance);
    }

    // Generate 20 students for AIML
    for (let i = 1; i <= 20; i++) {
      const regNum = `AIML2023${String(i).padStart(3, "0")}`;
      const performance = assignPerformanceLevel(i, 20);
      studentsList.push({
        registerNumber: regNum,
        name: getRandomName(usedNames),
        departmentId: depts[3].id,
      });
      studentPerformance.set(regNum, performance);
    }

    // Generate 22 students for AIDS
    for (let i = 1; i <= 22; i++) {
      const regNum = `AIDS2023${String(i).padStart(3, "0")}`;
      const performance = assignPerformanceLevel(i, 22);
      studentsList.push({
        registerNumber: regNum,
        name: getRandomName(usedNames),
        departmentId: depts[4].id,
      });
      studentPerformance.set(regNum, performance);
    }

    const studentsData = await db
      .insert(students)
      .values(studentsList)
      .returning();

    console.log(`✅ Created ${studentsData.length} students`);

    // 4. Insert Marks with Realistic Performance
    console.log("📊 Inserting marks...");
    const marksList = [];

    for (const student of studentsData) {
      const performance = studentPerformance.get(student.registerNumber);

      // Get subjects for this student's department
      const deptSubjects = subjectsData.filter(
        (s) => s.departmentId === student.departmentId
      );

      for (const subject of deptSubjects) {
        const studentMarks = generateMarks(performance!);

        marksList.push({
          studentId: student.id,
          subjectId: subject.id,
          cat1: studentMarks.cat1,
          cat2: studentMarks.cat2,
          cat3: studentMarks.cat3,
          semester: studentMarks.semester,
        });
      }
    }

    await db.insert(marks).values(marksList);
    console.log(`✅ Created ${marksList.length} mark records`);

    // 5. Insert Attendance with Realistic Patterns
    console.log("📅 Inserting attendance...");
    const attendanceList = [];

    // Generate attendance for 30 working days (Sept-Oct 2024)
    const attendanceDates = [
      "2024-09-02",
      "2024-09-03",
      "2024-09-04",
      "2024-09-05",
      "2024-09-06",
      "2024-09-09",
      "2024-09-10",
      "2024-09-11",
      "2024-09-12",
      "2024-09-13",
      "2024-09-16",
      "2024-09-17",
      "2024-09-18",
      "2024-09-19",
      "2024-09-20",
      "2024-09-23",
      "2024-09-24",
      "2024-09-25",
      "2024-09-26",
      "2024-09-27",
      "2024-09-30",
      "2024-10-01",
      "2024-10-02",
      "2024-10-03",
      "2024-10-04",
      "2024-10-07",
      "2024-10-08",
      "2024-10-09",
      "2024-10-10",
      "2024-10-11",
    ];

    for (const student of studentsData) {
      const performance = studentPerformance.get(student.registerNumber);
      const attendanceProb = getAttendanceProbability(performance!);

      const deptSubjects = subjectsData.filter(
        (s) => s.departmentId === student.departmentId
      );

      for (const subject of deptSubjects) {
        for (const date of attendanceDates) {
          const isPresent = Math.random() < attendanceProb;
          attendanceList.push({
            studentId: student.id,
            subjectId: subject.id,
            attendanceDate: date,
            status: isPresent ? ("Present" as const) : ("Absent" as const),
          });
        }
      }
    }

    // Insert in batches
    const batchSize = 1000;
    for (let i = 0; i < attendanceList.length; i += batchSize) {
      const batch = attendanceList.slice(i, i + batchSize);
      await db.insert(attendance).values(batch);
      console.log(
        `   Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          attendanceList.length / batchSize
        )}`
      );
    }

    console.log(`✅ Created ${attendanceList.length} attendance records`);

    console.log("\n✨ Database seeded successfully!");
    console.log("\n📈 Summary:");
    console.log(`   - Departments: ${depts.length}`);
    console.log(`   - Subjects: ${subjectsData.length}`);
    console.log(`   - Students: ${studentsData.length}`);
    console.log(`   - Mark Records: ${marksList.length}`);
    console.log(`   - Attendance Records: ${attendanceList.length}`);
    console.log("\n👥 Student Performance Distribution:");
    console.log(`   - Excellent (85-95%): ~15% of students`);
    console.log(`   - Good (70-84%): ~25% of students`);
    console.log(`   - Average (55-69%): ~30% of students`);
    console.log(`   - Poor (40-54%): ~20% of students`);
    console.log(`   - Struggling (25-39%): ~10% of students`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
