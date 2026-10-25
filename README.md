# 🎓 ScholarFlow

[![Live Demo](https://img.shields.io/badge/Live%20Demo-scholarflow--psi.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://scholarflow-psi.vercel.app/#/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![100% Client-Side](https://img.shields.io/badge/Architecture-100%25%20Client--Side-emerald.svg?style=for-the-badge)](#-highlights)

> **🚀 Live Application:** [https://scholarflow-psi.vercel.app/#/](https://scholarflow-psi.vercel.app/#/)  
> **100% Client-Side Academic Outreach & Research Workspace**  
> Helping students discover research mentors, prepare personalized outreach, follow a structured 6-week preparation plan, and manage applications in a private, browser-based workspace.

---

## ⚡ Highlights

- **100% Client-Side Architecture:** Runs entirely in your browser as a static web application. No backend server, cloud database, or account creation required. Can be opened locally or hosted on GitHub Pages, Vercel, or Netlify.
- **Privacy by Design:** Student profile data, roadmap progress, and outreach tracker entries are saved exclusively in your browser's `localStorage`. No telemetry, analytics, or application data is transmitted to external servers.
- **Direct Mail Launch:** Emails are prepared locally and launched via your device's native mail handler (`mailto:`) or copied to your clipboard. ScholarFlow never sends emails on your behalf.
- **Bundled Dataset:** Pre-indexed catalog of 7,055 faculty listings across 71 premier Indian engineering institutions (IITs, NITs, IIITs, IISc, and Central Universities) compiled from public institutional directories.
- **Responsive Modern Light UI:** Polished academic aesthetic with vertical sidebar workspace navigation, smooth tab switching, and mobile-friendly layouts.

---

## 🧭 Application Structure & Navigation

ScholarFlow is organized into two primary environments connected via a client-side hash router:

### 1. Welcoming Landing Page (`#/` or `/`)
- **Clear Product Overview:** Explains what ScholarFlow does in clear, plain language with dual direct calls to action (*Open Workspace* & *Explore Faculty Directory*).
- **First-Use Onboarding ("Start Here"):** A 3-step guide taking students from exploring research areas to configuring project details and drafting their first outreach email.
- **Workflow Preview:** A visual demonstration showing how faculty directory records feed directly into editable outreach drafts in the Email Studio.
- **Audience & Fit:** Guidance tailored for undergraduate and postgraduate students preparing for winter/summer research internships or contacting academic laboratories.
- **Data & Privacy Transparency:** Transparent disclosure of how data is stored in `localStorage`, how emails are dispatched, and how native browser APIs are utilized.

### 2. Research Workspace (`#/app`)
A focused workspace equipped with a vertical sidebar navigation system and four dedicated sections:

#### 🏛️ Faculty Directory (`#/app?tab=directory`)
- **7,055 Faculty Records:** Comprehensive dataset covering 71 institutions and 100+ departments.
- **In-Memory Search & Filtering:** Instant keyword search across professor names, departments, and listed research fields.
- **Department & Institute Selectors:** Searchable filter controls designed for desktop and mobile screens.
- **Quick Domain Chips:** One-click filtering for high-demand fields (*Machine Learning, Computer Vision, Robotics & Control, VLSI & Nanoelectronics, Power & Energy, CFD & Fluid Mechanics, Bioinformatics, Cryptography & Security*).
- **Actionable Cards:** 1-click email drafting in the Studio, direct email address copying, and instant tracking additions.

#### ✍️ Academic Email Studio (`#/app?tab=studio`)
- **5 Structured Outreach Templates:**
  - **Template A (Targeted Research Match):** Aligns a student's project contributions and code repository with the professor's listed research areas.
  - **Template B (Early Learner & Foundations):** Designed for 1st- and 2nd-year students highlighting foundational coursework and rapid ramp-up ability.
  - **Template C (Formal Lab / Coordinator Inquiry):** Polite institutional inquiry format for official departmental internship schemes.
  - **Template D (7-Day Polite Follow-Up):** Respectful check-in sharing updated project progress or reproducible benchmarks.
  - **Template E (14-Day Final Closeout):** Professional sign-off keeping doors open for upcoming research cycles.
- **Smart Alignment & Keyword Heuristics:** Evaluates keyword overlap between the student's project description and the professor's listed research area without relying on third-party AI APIs.
- **Real-Time Word Count Counter:** Tracks message length against the recommended concise academic target (<180 words).
- **Elevator Pitch Vocalizer:** Uses the browser's native **Web Speech Synthesis API** to speak a tailored 30-second spoken introduction aloud for interview preparation.

#### 🗺️ 6-Week Preparation Roadmap (`#/app?tab=roadmap`)
- **Structured 6-Stage Plan:** A systematic 23-task strategy guiding students through:
  1. *Week 1: Choose a Direction & Assess Foundations*
  2. *Week 2: Literature & Baseline Reproduction*
  3. *Week 3: Public Artifact & GitHub Report*
  4. *Week 4: Target List & Outreach Wave 1*
  5. *Week 5: Outreach Wave 2 & Polite Follow-ups*
  6. *Week 6: Interview Preparation & Wrap-Up*
- **Persistent Progress Tracking:** Interactive checklists and progress metrics saved in real time to `localStorage`.

#### 📊 Outreach Pipeline Tracker (`#/app?tab=tracker`)
- **Stage Management:** Monitor contacts across five clear stages: `To Contact` ➔ `Applied` ➔ `Follow-up Sent` ➔ `Interview` ➔ `Accepted`.
- **Automated Follow-Up Cadence:** Automatically calculates +7 day follow-up deadlines when moving contacts to `Applied`.
- **Manual Application Entry:** Modal to log mentors contacted outside the directory.
- **1-Click CSV Export:** Export your complete application pipeline into a spreadsheet for offline backup.

---

## 📂 Project Structure

```
scholarflow/
├── frontend/
│   ├── index.html            # Main single-page application & landing page
│   ├── app.js                # Core routing, UI rendering, and state management
│   ├── professors_data.js    # Bundled catalog of 7,055 faculty listings (JS variable)
│   ├── professors.json       # JSON formatted faculty data
│   ├── roadmap_data.js       # 6-week preparation milestones & tasks (JS variable)
│   └── roadmap.json          # JSON formatted roadmap data
├── scripts/                  # Data utilities (e.g. clean_excel_dataset.py)
├── README.md                 # Project documentation
└── render.yaml               # Static site deployment configuration
```

---

## 🚀 Running Locally

Because ScholarFlow requires zero compilation or backend server, you can run it immediately:

### Option 1: Direct File Access (Zero Setup)
Double-click `frontend/index.html` or open it directly in any modern browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server (Recommended)
Using Python's built-in static server:
```bash
cd frontend
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

Using Node.js:
```bash
npx serve frontend
```

---

## 🔒 Privacy & Data Transparency

- **No Remote Servers:** All application logic, search indexing, and profile storage execute 100% inside your browser session.
- **Local Persistence:** Data entered into student profiles, roadmap checklists, or the pipeline tracker stays inside your browser's `localStorage` (`scholarflow_student_profile`, `scholarflow_roadmap_progress`, `scholarflow_pipeline`).
- **No Third-Party Tracking:** No cookies, third-party analytics trackers, or user profiling scripts are included.
- **Local Audio Synthesis:** The 30-second elevator pitch feature utilizes your device's native browser speech synthesis. No audio is recorded or uploaded.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
