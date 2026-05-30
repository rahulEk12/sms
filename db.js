// Mock Data - GitHub Pages ke liye (Backend nahi hai)

const mockStudents = [
  { id: 1, name: "Aarav Sharma", class: "10-A", rollNo: 101, parent: "Ramesh Sharma", attendance: 92, feeStatus: "Paid", email: "aarav.sharma@example.com" },
  { id: 2, name: "Ananya Verma", class: "10-A", rollNo: 102, parent: "Sanjay Verma", attendance: 88, feeStatus: "Pending", email: "ananya.v@example.com" },
  { id: 3, name: "Kabir Mehta", class: "12-B", rollNo: 103, parent: "Anil Mehta", attendance: 91, feeStatus: "Paid", email: "kabir.m@example.com" },
  { id: 4, name: "Isha Patel", class: "12-B", rollNo: 104, parent: "Vijay Patel", attendance: 86, feeStatus: "Unpaid", email: "isha.p@example.com" },
  { id: 5, name: "Rohan Gupta", class: "10-A", rollNo: 105, parent: "Sunil Gupta", attendance: 81, feeStatus: "Pending", email: "rohan.g@example.com" },
  { id: 6, name: "Priya Singh", class: "11-C", rollNo: 106, parent: "Rajesh Singh", attendance: 95, feeStatus: "Paid", email: "priya.s@example.com" }
];

const mockTeachers = [
  { id: 1, name: "Dr. Rajesh Kumar", subject: "Mathematics", qualification: "PhD" },
  { id: 2, name: "Mrs. Priya Sharma", subject: "English", qualification: "M.Ed" },
  { id: 3, name: "Mr. Amit Patel", subject: "Science", qualification: "B.Sc" }
];

const mockDashboard = {
  totalStudents: 6,
  avgAttendance: 89,
  feesCollected: 193000,
  pendingFees: 90000
};

// No-op initialization
export async function initDatabase() {
  console.log("Using mock data for GitHub Pages");
}

// Student APIs - Return Mock Data
export async function getStudents() {
  return mockStudents;
}

export async function saveStudent(studentData) {
  const newStudent = { id: Date.now(), ...studentData };
  mockStudents.push(newStudent);
  return newStudent;
}

export async function deleteStudent(id) {
  const index = mockStudents.findIndex(s => s.id === id);
  if (index !== -1) mockStudents.splice(index, 1);
  return { success: true };
}

// Teacher APIs - Return Mock Data
export async function getTeachers() {
  return mockTeachers;
}

export async function saveTeacher(teacherData) {
  const newTeacher = { id: Date.now(), ...teacherData };
  mockTeachers.push(newTeacher);
  return newTeacher;
}

export async function deleteTeacher(id) {
  const index = mockTeachers.findIndex(t => t.id === id);
  if (index !== -1) mockTeachers.splice(index, 1);
  return { success: true };
}

// Attendance APIs
export async function getAttendance(date, className) {
  return mockStudents.filter(s => s.class === className);
}

export async function saveAttendance(date, className, records) {
  return { success: true, message: "Attendance saved" };
}

// Invoice APIs
export async function getInvoices() {
  return mockStudents.map(s => ({
    id: s.id,
    studentName: s.name,
    amount: Math.random() * 50000,
    status: s.feeStatus
  }));
}

export async function payInvoice(invoiceId, amountPaid) {
  return { success: true, message: "Payment processed" };
}

// Weekly Tests APIs
export async function getWeeklyTests(className) {
  return [
    { id: 1, studentId: 1, subject: "Math", marks: 85, maxMarks: 100 },
    { id: 2, studentId: 2, subject: "Math", marks: 92, maxMarks: 100 },
    { id: 3, studentId: 3, subject: "English", marks: 78, maxMarks: 100 }
  ];
}

export async function saveWeeklyTest(testData) {
  return { id: Date.now(), ...testData };
}

export async function deleteWeeklyTest(testId) {
  return { success: true };
}
