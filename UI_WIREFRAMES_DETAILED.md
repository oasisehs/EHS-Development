# EHS Suite - UI Wireframes & Component Specifications

## 📐 Wireframe Guide

This document provides detailed wireframes for all pending UI modules aligned with the Enterprise Architecture.

---

## Phase 1: TIER 1 - High Priority (Weeks 1-2)

### 1. EMPLOYEE LIFECYCLE MANAGEMENT PORTAL

#### 1.1 Employee Directory Dashboard

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Employees                              👤 John Doe    ║
║ 🔙 Dashboard                                                        ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Quick Stats:                                                      ║
║  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ║
║  │ Total: 542  │ │ Active: 520 │ │ On Leave: 15 │ │ Compliance │ ║
║  │             │ │             │ │              │ │    95.2%   │ ║
║  └─────────────┘ └─────────────┘ └──────────────┘ └────────────┘ ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ 🔍 Search: [_________________] 📁 Department ▼ Status ▼    │ ║
║  │ [+ Add Employee] [📤 Import CSV] [📥 Export] [Bulk Actions] │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ EMPLOYEE CARDS GRID                                          │ ║
║  │                                                               │ ║
║  │ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ ║
║  │ │ 📷              │  │ 📷              │  │ 📷              │ ║
║  │ │ John Doe        │  │ Jane Smith      │  │ Mike Johnson    │ ║
║  │ │ Safety Officer  │  │ Safety Manager  │  │ Operator        │ ║
║  │ │ Operations      │  │ Operations      │  │ Manufacturing   │ ║
║  │ │ ✅ Active       │  │ ✅ Active       │  │ ✅ Active       │ ║
║  │ │ Compliance: 95% │  │ Compliance: 98% │  │ Compliance: 87% │ ║
║  │ │                 │  │                 │  │                 │ ║
║  │ │ [👁 View]       │  │ [👁 View]       │  │ [👁 View]       │ ║
║  │ │ [✏️ Edit]       │  │ [✏️ Edit]       │  │ [✏️ Edit]       │ ║
║  │ │ [📚 Training]   │  │ [📚 Training]   │  │ [📚 Training]   │ ║
║  │ └─────────────────┘  └─────────────────┘  └─────────────────┘ ║
║  │                                                               │ ║
║  │ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ ║
║  │ │ 📷              │  │ 📷              │  │ 📷              │ ║
║  │ │ [More Cards...]                                            │ ║
║  │ └─────────────────┘  └─────────────────┘  └─────────────────┘ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  < Prev 1 2 3 Next >                                              ║
╚════════════════════════════════════════════════════════════════════╝
```

#### 1.2 Employee Profile Page

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Employees / John Doe                  👤 John Doe    ║
║ 🔙 Back to Employees                                              ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌─────────────────────────────────────────────────────────────┐ ║
║  │  📷                                                          │ ║
║  │  John Doe                          [✏️ Edit] [🗑️ Remove]   │ ║
║  │  Safety Officer | Operations                                │ ║
║  │  Email: john.doe@company.com                                │ ║
║  │  Phone: +1-555-0123                                         │ ║
║  │  Status: ✅ Active                                          │ ║
║  │  Joined: 2020-03-15                                         │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  ║
║  │ 📊 Compliance    │ │ 📚 Training      │ │ 🛟 PPE           │  ║
║  │    95%           │ │    12 Completed  │ │    Assigned      │  ║
║  │ ✅ Up to Date    │ │ ⚠️  1 Pending    │ │ ✅ Current       │  ║
║  └──────────────────┘ └──────────────────┘ └──────────────────┘  ║
║                                                                    ║
║  TABS: [Overview] [Training] [Compliance] [Incidents] [Documents] ║
║                                                                    ║
║  ╔══════════════════════════════════════════════════════════════╗ ║
║  ║ OVERVIEW TAB                                                 ║ ║
║  ║                                                              ║ ║
║  ║ Recent Training:                                             ║ ║
║  ║ • Safety Orientation - Completed 2026-10-20                 ║ ║
║  ║ • Fire Drill - Completed 2026-10-15                         ║ ║
║  ║                                                              ║ ║
║  ║ Next Training Due:                                           ║ ║
║  ║ • CPR Certification - Due 2026-11-30 ⚠️                      ║ ║
║  ║ • Forklift Operation - Due 2026-12-15                       ║ ║
║  ║                                                              ║ ║
║  ║ Recent Incidents:                                            ║ ║
║  ║ • Minor cut - 2026-10-10 - Resolved                         ║ ║
║  ║                                                              ║ ║
║  ║ [📄 Download Profile] [📧 Send Notification] [🔐 Manage Access] ║
║  ╚══════════════════════════════════════════════════════════════╝ ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

#### 1.3 Onboarding Wizard

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Onboarding Wizard                    👤 Admin User    ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Onboarding Progress: [Step 1/5 ████░░░░░░] 20%                  ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │                                                              │ ║
║  │  STEP 1: BASIC INFORMATION                                   │ ║
║  │                                                              │ ║
║  │  Full Name: [________________________]                       │ ║
║  │  Email:     [________________________]                       │ ║
║  │  Phone:     [________________________]                       │ ║
║  │  Department: [Operations ▼]                                 │ ║
║  │  Job Title:  [________________________]                       │ ║
║  │  Manager:    [Search Manager ▼]                             │ ║
║  │  Start Date: [📅 2026-11-01]                                 │ ║
║  │                                                              │ ║
║  │  [⬅️ Skip] [Next ➡️]                                          │ ║
║  │                                                              │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  Status Indicator:                                                ║
║  ┌─────────────────────────────────────────────────────────────┐ ║
║  │ Step 1: Basic Info          ⏳ In Progress                  │ ║
║  │ Step 2: Compliance Checklist ⏳ Waiting                      │ ║
║  │ Step 3: Training Assignment  ⏳ Waiting                      │ ║
║  │ Step 4: PPE & Equipment      ⏳ Waiting                      │ ║
║  │ Step 5: Review & Submit      ⏳ Waiting                      │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

### 2. DOCUMENT MANAGEMENT PORTAL

#### 2.1 Document Repository Dashboard

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Documents                             👤 John Doe    ║
║ 🔙 Dashboard                                                        ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Document Stats:                                                   ║
║  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ║
║  │ Total: 1,450│ │ This Month: │ │ Pending OCR: │ │ Expiring:  │ ║
║  │             │ │      127    │ │      23      │ │      8     │ ║
║  └─────────────┘ └─────────────┘ └──────────────┘ └────────────┘ ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ [+ Upload Document] [🔍 Advanced Search] [📊 Reports]       │ ║
║  │                                                              │ ║
║  │ Category Filter:                                             │ ║
║  │ [☐ Safety Policies] [☐ Incident Reports] [☐ Certifications]│ ║
║  │ [☐ Audits]         [☐ Compliance Docs]  [☐ Training Docs]  │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  ╔══════════════════════════════════════════════════════════════╗ ║
║  ║ DRAG & DROP UPLOAD ZONE (Optional)                           ║ ║
║  ║                                                              ║ ║
║  ║      📁 Drag files here or click to select                  ║ ║
║  ║                                                              ║ ║
║  ║  Supported: PDF, DOC, XLS, Images, CSV                      ║ ║
║  ║  Max size: 100MB                                            ║ ║
║  ║                                                              ║ ║
║  ╚══════════════════════════════════════════════════════════════╝ ║
║                                                                    ║
║  DOCUMENT LIST TABLE:                                             ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ 📄 Name         │Category    │Date      │OCR │Status │Action│ ║
║  │──────────────────────────────────────────────────────────────│ ║
║  │ Safety Policy   │Policies   │2026-10-20│✅  │Active │👁 📝 │ ║
║  │ Incident #2541  │Incidents  │2026-10-18│⏳  │Review │👁 📝 │ ║
║  │ ISO 45001 Cert  │Compliance │2026-09-15│✅  │Active │👁 📝 │ ║
║  │ Audit Report    │Audits     │2026-08-30│✅  │Active │👁 📝 │ ║
║  │ Training Log    │Training   │2026-10-25│⏳  │Pending│👁 📝 │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  < Prev 1 2 3 Next > Showing 1-5 of 1,450                         ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

#### 2.2 Document Upload & OCR Processing

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Upload Document                      👤 John Doe    ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  STEP 1: SELECT DOCUMENT TYPE                                     ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ Document Type: [Safety Policy ▼]                            │ ║
║  │                                                              │ ║
║  │ File Upload: [📁 Select File or Drag Here]                  │ ║
║  │              Selected: Incident_Report_2541.pdf (2.3 MB)    │ ║
║  │                                                              │ ║
║  │ Tags: [+Safety] [+Production] [+Add Tag...]                 │ ║
║  │                                                              │ ║
║  │ [⬅️ Cancel] [Next ➡️]                                         │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  STEP 2: OCR PROCESSING (Optional)                                ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ ☐ Enable OCR Processing (Extract text from image/PDF)       │ ║
║  │   Using: Tesseract OCR + spaCy NLP                          │ ║
║  │                                                              │ ║
║  │   Preview: [Extracted Text Preview]                         │ ║
║  │   ┌──────────────────────────────────────────┐              │ ║
║  │   │ Incident Report #2541                    │              │ ║
║  │   │ Date: 2026-10-18                         │              │ ║
║  │   │ Location: Manufacturing Floor 3          │              │ ║
║  │   │ Severity: High                           │              │ ║
║  │   │ ...                                      │              │ ║
║  │   └──────────────────────────────────────────┘              │ ║
║  │                                                              │ ║
║  │ [⬅️ Back] [Upload ➡️]                                         │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  STEP 3: UPLOAD PROGRESS                                          ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ Uploading...                                                 │ ║
║  │ ████████████░░░░░░░░  65% Complete                           │ ║
║  │                                                              │ ║
║  │ Processing OCR...                                            │ ║
║  │ Step 1/3: File Upload ✅                                     │ ║
║  │ Step 2/3: OCR Analysis ⏳ In Progress                        │ ║
║  │ Step 3/3: Indexing    ⏳ Waiting                             │ ║
║  │                                                              │ ║
║  │ Estimated time: 2 minutes remaining                          │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

#### 2.3 Document Search & Retrieval

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Search Documents                      👤 John Doe    ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ 🔍 Search: [incident management procedures ▌]               │ ║
║  │                                                              │ ║
║  │ Filters:                                                     │ ║
║  │ Category: [All ▼] Date Range: [Last 30 Days ▼] Status: [All▼]║
║  │ Department: [All ▼] Keyword: [incident, safety]             │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  SEARCH RESULTS: 47 documents found                                ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ 1. 📄 Incident Management Procedures                        │ ║
║  │    Category: Safety Policies | Updated: 2026-10-20          │ ║
║  │    Relevance: 🟡🟡🟡🟡🟡 (Highly Relevant)                    │ ║
║  │    Excerpt: "When an incident occurs, immediately notify    │ ║
║  │    the safety officer and complete the incident form..."    │ ║
║  │    [👁 View] [📥 Download] [🔗 Share]                       │ ║
║  │                                                              │ ║
║  ├──────────────────────────────────────────────────────────────┤ ║
║  │ 2. 📄 Emergency Response Plan                               │ ║
║  │    Category: Safety Policies | Updated: 2026-09-15          │ ║
║  │    Relevance: 🟡🟡🟡🟡 (Relevant)                            │ ║
║  │    Excerpt: "In case of an incident involving safety...     │ ║
║  │    [👁 View] [📥 Download] [🔗 Share]                       │ ║
║  │                                                              │ ║
║  ├──────────────────────────────────────────────────────────────┤ ║
║  │ 3. 📄 Incident Report #2541                                 │ ║
║  │    Category: Incident Reports | Updated: 2026-10-18         │ ║
║  │    Relevance: 🟡🟡🟡 (Somewhat Relevant)                    │ ║
║  │    Excerpt: "A minor injury incident occurred in the...     │ ║
║  │    [👁 View] [📥 Download] [🔗 Share]                       │ ║
║  │                                                              │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  < Prev 1 2 3 ... 10 Next > Results per page: [10 ▼]             ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

### 3. INCIDENT & COMPLIANCE MANAGEMENT

#### 3.1 Incident Dashboard

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Incidents                             👤 John Doe    ║
║ 🔙 Dashboard                                                        ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Incident Summary:                                                 ║
║  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ║
║  │🔴 Critical: │ │🟠 High: 5   │ │🟡 Medium: 12 │ │🟢 Low: 23  │ ║
║  │     2       │ │             │ │              │ │            │ ║
║  └─────────────┘ └─────────────┘ └──────────────┘ └────────────┘ ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ [+ Report Incident] [Filter] [Export] [Analytics]           │ ║
║  │                                                              │ ║
║  │ Status: [All ▼] Priority: [All ▼] Department: [All ▼]      │ ║
║  │ Date Range: [This Month ▼]                                  │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  INCIDENTS GRID:                                                   ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │                                                              │ ║
║  │  ┌────────────────────────────────────────────────────────┐ ║ ║
║  │  │ 🔴 CRITICAL: Equipment Failure in Manufacturing       │ ║ ║
║  │  │ Incident ID: INC-2541                                 │ ║ ║
║  │  │ Date: 2026-10-27 14:30                                │ ║ ║
║  │  │ Location: Manufacturing Floor 3                       │ ║ ║
║  │  │ Status: [Investigation ⏳]                            │ ║ ║
║  │  │ Assigned To: Mike Johnson                             │ ║ ║
║  │  │ Due Date: 2026-11-03 (4 days remaining)              │ ║ ║
║  │  │ Description: Critical equipment shutdown...           │ ║ ║
║  │  │ [📄 View Details] [✏️ Edit] [❌ Close] [📧 Notify]     │ ║ ║
║  │  └────────────────────────────────────────────────────────┘ ║ ║
║  │                                                              │ ║
║  │  ┌────────────────────────────────────────────────────────┐ ║ ║
║  │  │ 🟠 HIGH: Chemical Spill in Storage Area               │ ║ ║
║  │  │ Incident ID: INC-2540                                 │ ║ ║
║  │  │ Date: 2026-10-26 09:15                                │ ║ ║
║  │  │ Location: Chemical Storage 2B                         │ ║ ║
║  │  │ Status: [Root Cause Analysis 🔄]                     │ ║ ║
║  │  │ Assigned To: Jane Smith                               │ ║ ║
║  │  │ Due Date: 2026-10-30 (1 day remaining) ⚠️             │ ║ ║
║  │  │ Description: Improper storage led to spill...         │ ║ ║
║  │  │ [📄 View Details] [✏️ Edit] [❌ Close] [📧 Notify]     │ ║ ║
║  │  └────────────────────────────────────────────────────────┘ ║ ║
║  │                                                              │ ║
║  │  [More incidents...] (Showing 1-2 of 42)                   │ ║
║  │                                                              │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

#### 3.2 Incident Report Form

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Report Incident                       👤 John Doe    ║
║ 🔙 Back to Incidents                                              ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Incident Report Form                                              ║
║  Progress: [Step 2/4 ████████░░░░░░░░░░] 50%                      ║
║                                                                    ║
║  ╔══════════════════════════════════════════════════════════════╗ ║
║  ║ STEP 1: BASIC INFORMATION (Completed ✅)                    ║ ║
║  ║                                                              ║ ║
║  ║ STEP 2: INCIDENT DETAILS (In Progress ⏳)                    ║ ║
║  ║                                                              ║ ║
║  ║ What happened? *                                             ║ ║
║  ║ [Text area...                                                ║ ║
║  ║  Equipment failure occurred during morning shift. The         ║ ║
║  ║  main conveyor belt stopped abruptly, causing a backup...] ║ ║
║  ║                                                              ║ ║
║  ║ Severity Level: *                                            ║ ║
║  ║ ⚫ Critical   ⚫ High   ⚫ Medium   ⚫ Low                     ║ ║
║  ║                                                              ║ ║
║  ║ Injuries Sustained: *                                        ║ ║
║  ║ ⚫ None   ⚫ Minor   ⚫ Moderate   ⚫ Severe                   ║ ║
║  ║                                                              ║ ║
║  ║ Number of People Involved: [2__]                            ║ ║
║  ║                                                              ║
║  ║ Environmental Impact: ☐ Spill  ☐ Emission  ☐ Other        ║ ║
║  ║                                                              ║ ║
║  ║ Equipment Involved: [Conveyor Belt System 2A    ]           ║ ║
║  ║                                                              ║
║  ║ Witness Names: [John Smith, Mike Johnson          ]         ║ ║
║  ║                                                              ║
║  ║ Photos/Evidence: [📎 Attach Files] (3 files attached)        ║ ║
║  ║                                                              ║ ║
║  ║ [⬅️ Back] [Next ➡️]                                           ║ ║
║  ╚══════════════════════════════════════════════════════════════╝ ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

#### 3.3 Compliance Checklist

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Compliance Checklist                  👤 John Doe    ║
║ 🔙 Dashboard                                                        ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Daily Safety Compliance Checklist                                 ║
║  Department: Manufacturing | Today: 2026-10-27                     ║
║                                                                    ║
║  Overall Compliance: ████████░░░░░░░░░░ 80%                       ║
║  Items Completed: 16/20                                            ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │                                                              │ ║
║  │ GENERAL SAFETY (8/8) ✅ Complete                             │ ║
║  │ ☑ Work area clean & organized                               │ ║
║  │ ☑ Emergency exits accessible                                │ ║
║  │ ☑ First aid kit stocked                                     │ ║
║  │ ☑ PPE available & in good condition                         │ ║
║  │ ☑ Equipment properly labeled                                │ ║
║  │ ☑ Hazard warnings visible                                   │ ║
║  │ ☑ Daily briefing completed                                  │ ║
║  │ ☑ Incident log reviewed                                     │ ║
║  │                                                              │ ║
║  │ EQUIPMENT & MACHINERY (4/5) ⏳ In Progress                    │ ║
║  │ ☑ Equipment inspection completed                            │ ║
║  │ ☑ Safety guards in place                                    │ ║
║  │ ☑ Maintenance log updated                                   │ ║
║  │ ☑ Lock-out/Tag-out procedures followed                      │ ║
║  │ ☐ Forklift certification current ⚠️ OVERDUE                 │ ║
║  │   [📋 Assign Training] [📧 Send Reminder]                   │ ║
║  │                                                              │ ║
║  │ CHEMICAL SAFETY (3/4) ⏳ In Progress                          │ ║
║  │ ☑ SDS sheets accessible                                     │ ║
║  │ ☑ Spill kits available                                      │ ║
║  │ ☑ Storage area organized                                    │ ║
║  │ ☐ Chemical inventory updated ❌ PENDING                      │ ║
║  │   [📝 Complete Now]                                         │ ║
║  │                                                              │ ║
║  │ PERSONNEL (1/3) ❌ Not Started                               │ ║
║  │ ☑ Attendance tracked                                        │ ║
║  │ ☐ Health checks completed                                   │ ║
║  │ ☐ Incident reports filed                                    │ ║
║  │                                                              │ ║
║  │ [✅ Mark Complete] [💬 Add Notes] [📧 Submit for Review]    │ ║
║  │                                                              │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  Checked by: [Supervisor Name ▼]  Signature: _____________        ║
║  Time: 14:30                      Date: 2026-10-27               ║
║                                                                    ║
║  [⬅️ Cancel] [📤 Submit Checklist]                                ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## Phase 2: TIER 2 - Important (Weeks 3-4)

### 4. HR DASHBOARD

#### 4.1 HR Dashboard Overview

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / HR Dashboard                          👤 HR Admin    ║
║ 🔙 Dashboard                                                        ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  HR Overview:                                                      ║
║  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ║
║  │ Total Staff:│ │ On Leave:   │ │ New Hires:   │ │ Attrition: │ ║
║  │     542     │ │      15     │ │       8      │ │    2.1%    │ ║
║  └─────────────┘ └─────────────┘ └──────────────┘ └────────────┘ ║
║                                                                    ║
║  Quick Actions:                                                    ║
║  [➕ Add Employee] [📅 Manage Leaves] [📚 Assign Training]         ║
║  [👥 Department View] [📊 Reports] [⚙️ Settings]                  ║
║                                                                    ║
║  ╔══════════════════════════════════════════════════════════════╗ ║
║  ║ Leave Requests (Pending: 3)                                  ║ ║
║  ║ ┌──────────────────────────────────────────────────────────┐ ║ ║
║  ║ │ John Smith - Annual Leave (5 days) - 2026-11-01 to 11-05│ ║ ║
║  ║ │ [✅ Approve] [❌ Reject] [⏳ Need More Info]               │ ║ ║
║  ║ │                                                           │ ║ ║
║  ║ │ Jane Doe - Sick Leave (1 day) - 2026-10-28              │ ║ ║
║  ║ │ [✅ Approve] [❌ Reject] [⏳ Need More Info]               │ ║ ║
║  ║ │                                                           │ ║ ║
║  ║ │ Mike Johnson - Maternity Leave (12 weeks) - 2026-12-01  │ ║ ║
║  ║ │ [✅ Approve] [❌ Reject] [⏳ Need More Info]               │ ║ ║
║  ║ └──────────────────────────────────────────────────────────┘ ║ ║
║  ╚══════════════════════════════════════════════════════════════╝ ║
║                                                                    ║
║  Attendance Heatmap (This Week):                                   ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │   Mon   Tue   Wed   Thu   Fri                                │ ║
║  │  ████  ████  ████  ████  ███░                                │ ║
║  │  95%   98%   100%  97%   94%    (Attendance Trend)           │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### 5. TRAINING & CERTIFICATION MANAGEMENT

#### 5.1 Training Catalog & Assignment

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Training                              👤 HR Admin    ║
║ 🔙 Dashboard                                                        ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Training Stats:                                                   ║
║  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ║
║  │ Courses: 45 │ │ Enrolled: 342│ │ Pending: 28  │ │ Completed: │ ║
║  │             │ │              │ │              │ │    1847    │ ║
║  └─────────────┘ └─────────────┘ └──────────────┘ └────────────┘ ║
║                                                                    ║
║  [+ Create Course] [📊 Reports] [⚙️ Settings]                     ║
║                                                                    ║
║  TRAINING CATALOG:                                                 ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │                                                              │ ║
║  │  ┌────────────────────────────────────────────────────────┐ ║ ║
║  │  │ 📚 Safety Orientation                                 │ ║ ║
║  │  │ Duration: 4 hours | Enrolled: 95/150                 │ ║ ║
║  │  │ Completion Rate: 85% ████████░░                       │ ║ ║
║  │  │ Status: Active                                        │ ║ ║
║  │  │ [👥 View Enrollees] [✏️ Edit] [📊 Statistics]          │ ║ ║
║  │  └────────────────────────────────────────────────────────┘ ║ ║
║  │                                                              │ ║
║  │  ┌────────────────────────────────────────────────────────┐ ║ ║
║  │  │ 🏥 First Aid & CPR Certification                      │ ║ ║
║  │  │ Duration: 8 hours | Enrolled: 34/50                  │ ║ ║
║  │  │ Completion Rate: 72% ███████░░░                       │ ║ ║
║  │  │ Status: Active                                        │ ║ ║
║  │  │ Next Session: 2026-11-05                              │ ║ ║
║  │  │ [👥 View Enrollees] [✏️ Edit] [📊 Statistics]          │ ║ ║
║  │  └────────────────────────────────────────────────────────┘ ║ ║
║  │                                                              │ ║
║  │  ┌────────────────────────────────────────────────────────┐ ║ ║
║  │  │ 🚪 Fire Safety & Emergency Procedures                 │ ║ ║
║  │  │ Duration: 2 hours | Enrolled: 128/200                │ ║ ║
║  │  │ Completion Rate: 91% █████████░                       │ ║ ║
║  │  │ Status: Active                                        │ ║ ║
║  │  │ [👥 View Enrollees] [✏️ Edit] [📊 Statistics]          │ ║ ║
║  │  └────────────────────────────────────────────────────────┘ ║ ║
║  │                                                              │ ║
║  │  [More courses...] (Showing 1-3 of 45)                      │ ║
║  │                                                              │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  BULK ASSIGNMENT:                                                  ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ Select Employees: [Name Search...]                          │ ║
║  │ ☑ All Operations Dept (120)                                 │ ║
║  │ ☑ John Doe                                                  │ ║
║  │ ☑ Jane Smith                                                │ ║
║  │                                                              │ ║
║  │ Select Course: [Safety Orientation ▼]                      │ ║
║  │ Due Date: [📅 2026-12-31]                                   │ ║
║  │                                                              │ ║
║  │ [⬅️ Cancel] [📧 Send Invitations]                            │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### 6. ASSET & EQUIPMENT MANAGEMENT

#### 6.1 Equipment Inventory Dashboard

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Assets & Equipment                    👤 John Doe    ║
║ 🔙 Dashboard                                                        ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Asset Overview:                                                   ║
║  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ║
║  │ Total Items:│ │ Functional: │ │ Maintenance: │ │ Expired:   │ ║
║  │    1,240    │ │    1,180    │ │      42      │ │     18     │ ║
║  └─────────────┘ └─────────────┘ └──────────────┘ └────────────┘ ║
║                                                                    ║
║  [+ Add Equipment] [📤 Import] [📥 Export] [🔧 Maintenance Log]    ║
║                                                                    ║
║  EQUIPMENT INVENTORY:                                              ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ Equipment Type Filter: [All ▼]  Status: [All ▼]              │ ║
║  │                                                              │ ║
║  │ ┌────────────────────────────────────────────────────────┐  ║
║  │ │ 📦 Forklift #FKL-001                                 │  ║
║  │ │ Serial: SN-45821-FL | Location: Warehouse A         │  ║
║  │ │ Status: ✅ Operational                               │  ║
║  │ │ Last Maintenance: 2026-10-20                         │  ║
║  │ │ Next Maintenance: 2026-11-20                         │  ║
║  │ │ Certification: ⚠️ Expires 2026-12-15 (48 days left) │  ║
║  │ │ [🔍 View Details] [📝 Maintenance] [📄 Certificate]  │  ║
║  │ └────────────────────────────────────────────────────────┘  ║
║  │                                                              │ ║
║  │ ┌────────────────────────────────────────────────────────┐  ║
║  │ │ 📦 Scaffolding #SCF-012                              │  ║
║  │ │ Serial: SN-38291-SC | Location: Site 3               │  ║
║  │ │ Status: ⚠️ Under Maintenance                          │  ║
║  │ │ Last Inspection: 2026-10-18                          │  ║
║  │ │ Expected Return: 2026-10-31                          │  ║
║  │ │ Certification: ✅ Valid until 2027-03-15             │  ║
║  │ │ [🔍 View Details] [📝 Maintenance] [📄 Certificate]  │  ║
║  │ └────────────────────────────────────────────────────────┘  ║
║  │                                                              │ ║
║  │ ┌────────────────────────────────────────────────────────┐  ║
║  │ │ 📦 Ladder #LAD-045                                   │  ║
║  │ │ Serial: SN-12045-LA | Location: Tools Storage        │  ║
║  │ │ Status: ❌ Out of Service                             │  ║
║  │ │ Last Inspection: 2026-08-30                          │  ║
║  │ │ Issue: Damaged rung (needs replacement)              │  ║
║  │ │ Certification: ❌ Expired 2026-09-30                  │  ║
║  │ │ [🔍 View Details] [📝 Maintenance] [🗑️ Retire Item]  │  ║
║  │ └────────────────────────────────────────────────────────┘  ║
║  │                                                              │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  < Prev 1 2 3 Next > Showing 1-3 of 1,240                         ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## Phase 3: TIER 3 - Enhancement (Weeks 5-6)

### 7. MANAGEMENT DASHBOARD (EXECUTIVE VIEW)

#### 7.1 Executive Dashboard

```
╔════════════════════════════════════════════════════════════════════╗
║ EHS Suite / Executive Dashboard                   👤 CEO/Manager ║
║ 🔙 Dashboard                                                        ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  KEY PERFORMANCE INDICATORS (KPIs):                                ║
║                                                                    ║
║  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐         ║
║  │ Safety Score   │ │ Compliance %   │ │ Incidents/Qtr  │         ║
║  │     92.5%      │ │     94.2%      │ │       12       │         ║
║  │ ↑ +2.3% vs Qtr │ │ ↑ +1.8% vs Qtr │ │ ↓ -3 vs Qtr   │         ║
║  └────────────────┘ └────────────────┘ └────────────────┘         ║
║                                                                    ║
║  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐         ║
║  │ Training Hrs   │ │ Cost Savings   │ │ Lost Time      │         ║
║  │   12,450 hrs   │ │   $450K saved  │ │   145 days     │         ║
║  │ ↑ +18% vs Year │ │ ↑ +12% vs Year │ │ ↓ -25% vs Year │         ║
║  └────────────────┘ └────────────────┘ └────────────────┘         ║
║                                                                    ║
║  TRENDS & ANALYTICS:                                               ║
║                                                                    ║
║  Safety Score Trend (Last 12 Months):                             ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ 100%  ┌─────────────────────────────────┐                   │ ║
║  │  90%  │                ╱╲        ╱╲    ╱ │                   │ ║
║  │  80%  │    ╱╲    ╱╲  ╱    ╲    ╱    ╲╱   │ ← Target: 95%   │ ║
║  │  70%  │  ╱    ╲╱    ╱        ╲╱           │                   │ ║
║  │       └──────────────────────────────────┘                   │ ║
║  │       Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec         │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  Incident Breakdown by Department (This Quarter):                ║
║  ┌──────────────────────────────────────────────────────────────┐ ║
║  │ Operations:        ████████░░ 8 incidents (67%)             │ ║
║  │ Manufacturing:     ████░░░░░░ 3 incidents (25%)             │ ║
║  │ Warehouse:         ██░░░░░░░░ 1 incident  (8%)              │ ║
║  │ Total:             12 incidents                              │ ║
║  └──────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
║  PREDICTIVE ALERTS:                                                ║
║  ⚠️  High-risk pattern detected in Warehouse team                 ║
║  ⚠️  Equipment maintenance backlog growing (42 items pending)     ║
║  ✅ Operations dept on track for compliance targets               ║
║                                                                    ║
║  QUICK REPORTS:                                                    ║
║  [📊 Quarterly Report] [📄 Compliance Audit] [🎯 Target Progress]║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 🎨 Design System & Component Library

### Color Palette
```
Primary Colors:
  Navy Blue:    #1e5a96  (Brand color)
  Orange:       #ff8c42  (Accent)
  
Status Colors:
  Success:      #2ecc71  (Green)
  Warning:      #f39c12  (Orange)
  Danger:       #e74c3c  (Red)
  Info:         #3498db  (Blue)
  
Neutral:
  Light:        #ecf0f1  (Light gray)
  Medium:       #95a5a6  (Medium gray)
  Dark:         #2c3e50  (Dark gray)
  White:        #ffffff
```

### Component Patterns

#### Button Styles
```
Primary: Navy Blue bg, white text, hover darker
Secondary: Light gray bg, navy text, hover darker
Danger: Red bg, white text, hover darker
Ghost: Transparent, navy text, hover light gray

States: Normal, Hover, Active, Disabled, Loading
```

#### Card Layout
```
Card:
  - Rounded corners (8px)
  - Box shadow (elevation)
  - Padding: 16px - 24px
  - Hover: Slight scale up, shadow increase
  
Card Header:
  - Title + subtitle (optional)
  - Action buttons (right-aligned)
  
Card Body:
  - Main content area
  - Flexible layout
  
Card Footer:
  - Action buttons / meta info
  - Timestamp, status
```

#### Form Elements
```
Input Fields:
  - Border: 1px solid #ddd
  - Focus: Blue outline
  - Placeholder: Light gray text
  - Error: Red border + error message
  
Labels:
  - Above input (left-aligned)
  - Required: Red asterisk
  - Helper text: Smaller, gray
  
Validation:
  - Real-time feedback
  - Green check for valid
  - Red X for invalid
  - Error messages inline
```

#### Table Layout
```
Header:
  - Navy blue background
  - White text, bold
  - Sortable columns (▲▼ indicator)
  
Rows:
  - Alternating light gray backgrounds
  - Hover: Highlight row
  - Clickable: Cursor pointer
  
Actions:
  - Right-aligned buttons
  - Icon-based (👁 📝 🗑️)
  - Tooltip on hover
  
Pagination:
  - Bottom-aligned
  - Prev/Next buttons
  - Page number selector
```

---

## 📋 Implementation Checklist

### Phase 1 Completion Criteria
- [ ] Employee Directory (3.0 hrs)
- [ ] Employee Profiles (4.0 hrs)
- [ ] Onboarding Wizard (6.0 hrs)
- [ ] Document Upload Interface (5.0 hrs)
- [ ] OCR Processing UI (4.0 hrs)
- [ ] Document Search (3.0 hrs)
- [ ] Incident Dashboard (4.0 hrs)
- [ ] Incident Report Form (6.0 hrs)
- [ ] Compliance Checklist (4.0 hrs)
- **Total Phase 1: ~39 hours**

### Phase 2 Completion Criteria
- [ ] HR Dashboard (4.0 hrs)
- [ ] Leave Management (5.0 hrs)
- [ ] Training Catalog (5.0 hrs)
- [ ] Course Assignment (4.0 hrs)
- [ ] Asset Inventory (5.0 hrs)
- [ ] Maintenance Tracking (4.0 hrs)
- **Total Phase 2: ~27 hours**

### Phase 3 Completion Criteria
- [ ] Executive Dashboard (8.0 hrs)
- [ ] Predictive Analytics (6.0 hrs)
- [ ] Travel Portal (7.0 hrs)
- [ ] Settings & Admin (5.0 hrs)
- [ ] API Integration (8.0 hrs)
- **Total Phase 3: ~34 hours**

**Grand Total: ~100 hours of development**

---

**Document Status:** Complete  
**Version:** 1.0  
**Last Updated:** October 27, 2026
