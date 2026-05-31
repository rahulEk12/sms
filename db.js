// Mock Data - GitHub Pages ke liye (Backend nahi hai)

const mockStudents = [
  { 
    id: 1, 
    name: "Aarav Sharma", 
    class: "10-A", 
    rollNumber: "101", 
    parentName: "Ramesh Sharma", 
    attendance: 92, 
    feeStatus: "Paid", 
    email: "aarav.sharma@example.com",
    gender: "Male",
    contact: "+91 98765 43210",
    paidAmount: 45000,
    pendingAmount: 0,
    bgGradient: "linear-gradient(135deg, #FF6B6B, #FF8E53)",
    initials: "AS"
  },
  { 
    id: 2, 
    name: "Ananya Verma", 
    class: "10-A", 
    rollNumber: "102", 
    parentName: "Sanjay Verma", 
    attendance: 88, 
    feeStatus: "Pending", 
    email: "ananya.v@example.com",
    gender: "Female",
    contact: "+91 87654 32109",
    paidAmount: 20000,
    pendingAmount: 25000,
    bgGradient: "linear-gradient(135deg, #4E65FF, #92EFFD)",
    initials: "AV"
  },
  { 
    id: 3, 
    name: "Kabir Mehta", 
    class: "12-B", 
    rollNumber: "103", 
    parentName: "Anil Mehta", 
    attendance: 91, 
    feeStatus: "Paid", 
    email: "kabir.m@example.com",
    gender: "Male",
    contact: "+91 76543 21098",
    paidAmount: 50000,
    pendingAmount: 0,
    bgGradient: "linear-gradient(135deg, #11998e, #38ef7d)",
    initials: "KM"
  },
  { 
    id: 4, 
    name: "Isha Patel", 
    class: "12-B", 
    rollNumber: "104", 
    parentName: "Vijay Patel", 
    attendance: 86, 
    feeStatus: "Unpaid", 
    email: "isha.p@example.com",
    gender: "Female",
    contact: "+91 65432 10987",
    paidAmount: 0,
    pendingAmount: 50000,
    bgGradient: "linear-gradient(135deg, #FC466B, #3F5EFB)",
    initials: "IP"
  },
  { 
    id: 5, 
    name: "Rohan Gupta", 
    class: "10-A", 
    rollNumber: "105", 
    parentName: "Sunil Gupta", 
    attendance: 81, 
    feeStatus: "Pending", 
    email: "rohan.g@example.com",
    gender: "Male",
    contact: "+91 99887 76655",
    paidAmount: 30000,
    pendingAmount: 15000,
    bgGradient: "linear-gradient(135deg, #f857a6, #ff5858)",
    initials: "RG"
  },
  { 
    id: 6, 
    name: "Priya Singh", 
    class: "11-C", 
    rollNumber: "106", 
    parentName: "Rajesh Singh", 
    attendance: 95, 
    feeStatus: "Paid", 
    email: "priya.s@example.com",
    gender: "Female",
    contact: "+91 88776 65544",
    paidAmount: 48000,
    pendingAmount: 0,
    bgGradient: "linear-gradient(135deg, #00c6ff, #0072ff)",
    initials: "PS"
  }
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
  const newStudent = { 
    id: Date.now(), 
    ...studentData,
    bgGradient: studentData.bgGradient || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    initials: studentData.initials || studentData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  };
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
