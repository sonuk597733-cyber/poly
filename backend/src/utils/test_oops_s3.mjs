async function test() {
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "faculty.demo@subharti.org", password: "Faculty@123" })
  });
  const loginData = await loginRes.json();
  console.log("Login result:", loginData.success, loginData.user?.fullName);
  if (!loginData.success) {
    console.log("Login failed message:", loginData.message);
    return;
  }
  const token = loginData.token;

  // 1. Get subjects
  const subRes = await fetch("http://localhost:5000/api/academic/sessional/subjects?branch=CSE&semester=Semester%205", {
    headers: { Authorization: "Bearer " + token }
  });
  const subData = await subRes.json();
  const oopsSub = subData.subjects.find((s) => s.subjectCode === "PCS-504P");
  console.log("PCS-504P found in curriculum:", oopsSub ? {
    name: oopsSub.subjectName,
    code: oopsSub.subjectCode,
    s1Max: oopsSub.sessional1Max,
    s2Max: oopsSub.sessional2Max,
    s3Max: oopsSub.sessional3Max
  } : "NOT FOUND");

  // 2. Test PUT /api/academic/sessional/max-marks for Sessional 3 to 25
  const updateRes = await fetch("http://localhost:5000/api/academic/sessional/max-marks", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      branch: "CSE",
      semester: "Semester 5",
      subjectCode: "PCS-504P",
      subjectName: "OOPS with Java",
      sessionalNumber: 3,
      maxMarks: 25,
      academicSession: "2024-2025"
    })
  });
  const updateData = await updateRes.json();
  console.log("Update max-marks response status:", updateRes.status);
  console.log("Update max-marks response body:", JSON.stringify(updateData, null, 2));

  // 3. Verify getSessionalSubjects now returns sessional3Max = 25
  const verifySubRes = await fetch("http://localhost:5000/api/academic/sessional/subjects?branch=CSE&semester=Semester%205", {
    headers: { Authorization: "Bearer " + token }
  });
  const verifySubData = await verifySubRes.json();
  const updatedOops = verifySubData.subjects.find((s) => s.subjectCode === "PCS-504P");
  console.log("After update PCS-504P s3Max:", updatedOops?.sessional3Max);

  // 4. Verify getSessionalMarks returns configuredMax = 25
  const marksRes = await fetch("http://localhost:5000/api/academic/sessional/marks?branch=CSE&semester=Semester%205&subject=OOPS%20with%20Java&sessionalNumber=3", {
    headers: { Authorization: "Bearer " + token }
  });
  const marksData = await marksRes.json();
  console.log("Marks API response:", marksData);

  // 5. Test saving candidate marks for Sonu kumar & Rishabh under the new 25 ceiling
  const studentsRes = await fetch("http://localhost:5000/api/academic/student-directory?branch=CSE&limit=10", {
    headers: { Authorization: "Bearer " + token }
  });
  const studentsData = await studentsRes.json();
  console.log("Directory students:", studentsData.students?.length);
}

test().catch(console.error);
