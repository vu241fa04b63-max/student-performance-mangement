const STORAGE_KEY = "vignan-students";
const savedStudents = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

let currentStep = 0;
let selectedStudentId = null;

const form = document.querySelector("#studentForm");
const pages = [...document.querySelectorAll(".wizard-page")];
const toast = document.querySelector("#toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function goToStep(step) {
  currentStep = step;

  pages.forEach((page, index) => {
    page.hidden = index !== step;
    page.classList.toggle("active", index === step);
  });

  document.querySelectorAll(".wizard-step-dot").forEach((dot, index) => {
    dot.classList.toggle("active", index === step);
    dot.classList.toggle("complete", index < step);
  });

  document.querySelector("#wizardProgressFill").style.width =
    `${step * 20}%`;

  document.querySelector("#wizardBack").disabled = step === 0;
  document.querySelector("#wizardNext").hidden = step === 5;
  document.querySelector("#wizardSave").hidden = step !== 5;

  document.querySelector("#wizardStepLabel").textContent =
    step === 5 ? "Ready to save" : `Step ${step + 1} of 6`;

  if (step === 5) showReview();
}

function validCurrentStep() {
  const activePage = pages[currentStep];
  const inputs = [...activePage.querySelectorAll("input, select")];

  for (const input of inputs) {
    if (!input.checkValidity()) {
      input.reportValidity();
      return false;
    }
  }

  const data = new FormData(form);

  if (currentStep === 1 && data.get("subject")) {
    if (!data.get("semester") || !data.get("internal") || !data.get("exam")) {
      document.querySelector("#wizardAlert").textContent =
        "For a subject mark, enter semester, internal marks, and end-semester marks.";
      return false;
    }
  }

  if (currentStep === 4) {
    const total = data.get("totalFee");
    const paid = data.get("paidFee");

    if ((total && !paid) || (!total && paid)) {
      document.querySelector("#wizardAlert").textContent =
        "Enter both total fee and amount paid.";
      return false;
    }

    if (Number(paid) > Number(total)) {
      document.querySelector("#wizardAlert").textContent =
        "Amount paid cannot exceed total fee.";
      return false;
    }
  }

  document.querySelector("#wizardAlert").textContent = "";
  return true;
}

function showReview() {
  const data = new FormData(form);
  const name = data.get("name") || "—";
  const studentId = data.get("studentId") || "—";

  document.querySelector("#reviewSummary").innerHTML = `
    <div class="review-tile"><span>Student</span><strong>${name}</strong><small>${studentId}</small></div>
    <div class="review-tile"><span>Department</span><strong>${data.get("department") || "—"}</strong><small>${data.get("course") || ""}</small></div>
    <div class="review-tile"><span>Parent / guardian</span><strong>${data.get("guardianName") || "—"}</strong><small>${data.get("relation") || ""}</small></div>
    <div class="review-tile"><span>Fees</span><strong>${data.get("totalFee") ? "Fee details added" : "No fee details"}</strong><small>${data.get("feeYear") || ""}</small></div>
  `;
}

function saveStudent(data) {
  const studentId = data.get("studentId").trim();

  if (savedStudents.some(student => student.studentId === studentId)) {
    showToast("That student ID is already saved.");
    goToStep(0);
    return;
  }

  const student = {
    id: Date.now(),
    name: data.get("name").trim(),
    studentId,
    department: data.get("department"),
    course: data.get("course"),
    year: data.get("year"),
    email: data.get("email"),
    phone: data.get("phone"),
    gpa: data.get("gpa"),
    attendance: data.get("attendance"),
    subject: data.get("subject"),
    semester: data.get("semester"),
    internal: data.get("internal"),
    exam: data.get("exam"),
    guardianName: data.get("guardianName"),
    relation: data.get("relation"),
    guardianPhone: data.get("guardianPhone"),
    guardianEmail: data.get("guardianEmail"),
    interBoard: data.get("interBoard"),
    interScore: data.get("interScore"),
    tenthBoard: data.get("tenthBoard"),
    tenthScore: data.get("tenthScore"),
    feeYear: data.get("feeYear"),
    totalFee: data.get("totalFee"),
    paidFee: data.get("paidFee")
  };

  savedStudents.unshift(student);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStudents));
  selectedStudentId = student.id;

  form.reset();
  goToStep(0);
  renderStudents();
  showToast("Student saved in the list.");
}

function renderStudents() {
  const searchText =
    document.querySelector("#savedStudentSearch").value.toLowerCase();

  const list = savedStudents.filter(student =>
    `${student.name} ${student.studentId} ${student.department}`
      .toLowerCase()
      .includes(searchText)
  );

  document.querySelector("#savedStudentCount").textContent =
    `${savedStudents.length} student profiles`;

  document.querySelector("#savedCountBadge").textContent =
    savedStudents.length;

  document.querySelector("#savedStudentList").innerHTML = list.length
    ? list.map(student => `
      <button class="saved-student-item" data-student="${student.id}">
        <span class="saved-avatar">${student.name[0].toUpperCase()}</span>
        <span class="saved-student-copy">
          <strong>${student.name}</strong>
          <small>${student.studentId} · ${student.department}</small>
        </span>
      </button>
    `).join("")
    : `<div class="saved-empty"><strong>No students added yet</strong></div>`;

  renderSelectedStudent();
  renderTable();
}

function renderSelectedStudent() {
  const student = savedStudents.find(item => item.id === selectedStudentId);
  const panel = document.querySelector("#selectedStudentCard");

  if (!student) {
    panel.innerHTML =
      `<div class="selected-placeholder"><p>Select a saved student to view details.</p></div>`;
    return;
  }

  panel.innerHTML = `
    <div class="selected-card-heading">
      <h3>${student.name}</h3>
      <p>${student.studentId} · ${student.department}</p>
    </div>
    <div class="selected-card-details">
      <div><span>Course</span><strong>${student.course || "—"}</strong></div>
      <div><span>Year</span><strong>${student.year || "—"}</strong></div>
      <div><span>GPA</span><strong>${student.gpa || "—"}</strong></div>
      <div><span>Attendance</span><strong>${student.attendance ? student.attendance + "%" : "—"}</strong></div>
      <div><span>Parent</span><strong>${student.guardianName || "—"}</strong></div>
      <div><span>Marks subject</span><strong>${student.subject || "—"}</strong></div>
    </div>
  `;
}

function renderTable() {
  const rows = document.querySelector("#studentRows");

  rows.innerHTML = savedStudents.length
    ? savedStudents.map(student => `
      <tr>
        <td>${student.name}</td>
        <td>${student.studentId}</td>
        <td>${student.department}</td>
        <td>${student.gpa || "—"}</td>
        <td>${student.attendance ? student.attendance + "%" : "—"}</td>
        <td>Saved</td>
        <td></td>
      </tr>
    `).join("")
    : `<tr><td colspan="7">No student records yet.</td></tr>`;

  document.querySelector("#totalStudents").textContent = savedStudents.length;
  document.querySelector("#resultCount").textContent =
    `Showing ${savedStudents.length} students`;
}

document.querySelector("#wizardNext").addEventListener("click", () => {
  if (validCurrentStep()) goToStep(currentStep + 1);
});

document.querySelector("#wizardBack").addEventListener("click", () => {
  goToStep(currentStep - 1);
});

document.querySelectorAll(".wizard-step-dot").forEach((button, index) => {
  button.addEventListener("click", () => {
    if (index < currentStep) goToStep(index);
  });
});

form.addEventListener("submit", event => {
  event.preventDefault();
  saveStudent(new FormData(form));
});

document.querySelector("#addStudentButton").addEventListener("click", () => {
  document.querySelector("#registration").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll("[data-add='students']").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelector("#registration").scrollIntoView({ behavior: "smooth" });
  });
});

document.querySelector("#savedStudentSearch").addEventListener("input", renderStudents);

document.querySelector("#savedStudentList").addEventListener("click", event => {
  const button = event.target.closest("[data-student]");
  if (!button) return;

  selectedStudentId = Number(button.dataset.student);
  renderStudents();
});

document.querySelector("#menuButton").addEventListener("click", () => {
  document.querySelector("#sidebar").classList.toggle("open");
});

document.querySelectorAll(".nav-link[href^='#']").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(item =>
      item.classList.remove("active")
    );
    link.classList.add("active");
    document.querySelector("#sidebar").classList.remove("open");
  });
});

function renderCalendar() {
  const events = {
    "2026-12-11": "Commencement of II Semester",
    "2026-12-25": "Holiday · Christmas",
    "2026-12-30": "FA-1",
    "2026-12-31": "FA-1",
    "2027-01-14": "Holiday · Bhogi",
    "2027-01-15": "Holiday · Pongal",
    "2027-01-16": "Holiday · Kanuma",
    "2027-01-26": "Holiday · Republic Day",
    "2027-02-11": "Mahotsav",
    "2027-02-12": "Mahotsav",
    "2027-02-13": "Mahotsav",
    "2027-03-04": "FA-3",
    "2027-03-05": "FA-3",
    "2027-04-13": "P-Based Assessment",
    "2027-04-22": "L-Based Assessment"
  };

  const start = Date.UTC(2026, 11, 6);
  let html = "";

  for (let week = 0; week < 22; week++) {
    html += `<tr><th>Week-${week + 1}</th>`;

    for (let day = 0; day < 7; day++) {
      const date = new Date(start + (week * 7 + day) * 86400000);
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString("en", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC"
      }).replace(" ", "-");

      html += `<td><strong>${label}</strong><span>${events[key] || ""}</span></td>`;
    }

    html += "</tr>";
  }

  document.querySelector("#calendarRows").innerHTML = html;
}

document.querySelector("#dashboardDate").textContent =
  new Date().toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).toUpperCase();

goToStep(0);
renderStudents();
renderCalendar();