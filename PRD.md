# Product Requirement Document (PRD)
## Project Name: Sarvottam Diksha — Independent Branded Tuition Platform

---

## 1. Executive Summary & Background

### 1.1 Context & Problem Statement
The teacher currently relies on a third-party EdTech organisation/platform that costs **₹15,000 for 2 years** (equivalent to **₹625/month**). While the existing application has all necessary tuition management features, the teacher lacks ownership of student data, brand identity, course content delivery, and payment processing.

### 1.2 Strategic Objective
The core objective is to replace the third-party platform with a **100% independently owned, custom-branded tuition platform** named **Sarvottam Diksha**. The new system will eliminate third-party organization dependencies, grant full admin control over courses, students, tests, and revenue, and significantly lower recurring operating costs (targeting **₹0 to minimal infrastructure hosting costs** vs ₹625/month).

### 1.3 Key Constraints & Principles
* **Initial Development Budget**: **Hard maximum of ₹1,000** (using open-source and free-tier infrastructure).
* **Recurring Cost Target**: Substantially lower than ₹625/month (leveraging free hosting tiers like Render/Vercel/Fly.io + SQLite/Supabase free database + pay-as-you-grow payment gateways).
* **Functional Parity First**: Replicate all core capabilities visible in the reference application before adding major enhancements.
* **No Frontend Trust for Payments**: All course unlocks must be crypto-verified server-side via webhooks.

---

## 2. Product Goals & Success Metrics

### 2.1 Core Goals
1. **Complete Ownership**: Custom brand identity ("Sarvottam Diksha"), custom logo, teacher profile, and direct payment collection into teacher's bank account.
2. **Seamless Course Unlocking**: Automated backend verification that unlocks courses instantly upon successful payment.
3. **Robust MCQ Test Engine**: Practice tests with chapter organization, instant evaluation, answer keys, and performance diagnostics.
4. **Comprehensive Admin Portal**: Self-serve management of courses, chapters, media files, tests, questions, students, and purchase records.
5. **High Scalability Architecture**: Scalable design supporting up to 10,000 total registered students without performance bottlenecks.

### 2.2 Key Performance Indicators (KPIs)
* **Payment Unlock Latency**: < 3 seconds from gateway confirmation to course status update.
* **Payment Failure Rate**: < 1% due to technical glitches (supported by idempotent webhooks).
* **Page Load Speed**: < 1.5 seconds on standard mobile 4G networks.
* **Test Evaluation Latency**: Immediate (< 500 ms) upon exam submission.

---

## 3. Target User Personas

| Persona | Role | Primary Goals | Key Pain Points |
| :--- | :--- | :--- | :--- |
| **Student** | Learner (School / Competitive exams) | Browse courses, purchase securely via UPI/Card, view video lectures & study materials, take MCQ tests, track scores. | Cluttered UI, confusing course access, lack of instant feedback on tests. |
| **Teacher / Admin** | Platform Owner & Educator | Manage branding, upload course content, create test series, view enrolled students, track revenue, maintain total ownership. | Dependence on expensive software vendor (₹15k/2yr), lack of control over student data and payment settlements. |

---

## 4. System Architecture & Tech Stack

```
[ Student App / Admin Portal (React + Tailwind CSS) ]
                        │  HTTP / REST API (JWT Authenticated)
                        ▼
           [ Node.js + Express Backend ]
            ├── Auth Module (bcrypt + JWT)
            ├── Course & Media Access Controller
            ├── MCQ Evaluation Engine
            ├── Payment Webhook & Verification (Razorpay HMAC)
            └── Dynamic Branding Service
                        │
                        ▼
         [ Database Layer: Prisma + SQLite ]
        (Scalable to PostgreSQL / Supabase free tier)
```

### Stack Details
* **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons, React Router DOM v6.
* **Backend**: Node.js, Express.js REST API.
* **Database**: Prisma ORM with SQLite (zero-config, zero-cost, portable database).
* **Payment Processing**: Razorpay / Cashfree integration (₹0 setup fee, 2% transaction fee, zero fixed monthly charges).
* **Authentication**: JSON Web Tokens (JWT) + HTTP headers + bcrypt password hashing.

---

## 5. Detailed Functional Specifications

### 5.1 Module 1: Teacher Branding & Customization Engine
* **Branding Tokens**: Configurable platform name ("Sarvottam Diksha"), tagline, logo image, primary visual accent color (`#4F46E5` indigo default), contact details, support email, and social links.
* **Admin Control**: Teacher can update basic branding information dynamically via the Admin Settings portal without modifying source code.

### 5.2 Module 2: Authentication & User Management
* **Roles**: `STUDENT` and `ADMIN`.
* **Registration / Login**: Student registration via Name, Email, Phone Number, and Password. Secure login returning JWT token.
* **Profile Management**: Profile picture, enrolled courses, test history, and recent payment receipts.

### 5.3 Module 3: Home & Student Dashboard
* **Hero Banner**: Branded Sarvottam Diksha welcome section highlighting teacher expertise.
* **Course Showcase**: Featured courses, category filters, price badges, and validity period display.
* **Free Study Material Hub**: Quick links to sample PDFs, notes, and trial practice tests.
* **Announcements / Live Schedule**: Admin-posted notices, upcoming live class notifications, and updates.

### 5.4 Module 4: Course System & Content Delivery
* **Course Catalog**: Course thumbnail, title, description, duration/validity (e.g., 365 days), price, and discount tag.
* **Course Details Page**: Comprehensive overview including curriculum breakdown (Chapters & Modules), total video count, total PDF study materials, total MCQ practice tests, course features, and a prominent **BUY NOW** CTA.
* **Content Hierarchy**:
  ```
  Course -> Chapter -> Content Item (Video URL / PDF Document / Notes)
  ```
* **Content Access Control**: Backend authorization endpoint verifying active `Purchase` record before returning media stream URLs or download links.

### 5.5 Module 5: Payment Gateway & Automated Course Unlock Logic
* **Supported Payment Methods**: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, NetBanking, and Wallets.
* **Payment Flow**:
  1. Student clicks **BUY NOW** on course detail page.
  2. Backend generates a cryptographic Razorpay/Cashfree Order ID with amount and currency (INR).
  3. Client opens gateway checkout modal.
  4. Upon completion, gateway sends payment response (Order ID, Payment ID, Signature) to backend verification API.
  5. **Server-Side HMAC Verification**: Backend independently re-calculates cryptographic signature using secret key.
  6. **Idempotency Guarantee**: Checks if `transactionId` is already processed to prevent double-unlocking.
  7. Status recorded as `SUCCESS` -> `Purchase` entry created -> Course status automatically toggled to `UNLOCKED` in student profile -> Confirmation email/notification sent.

### 5.6 Module 6: "My Courses" & Protected Learning Portal
* **Enrolled View**: Grid of all purchased courses with progress indicators.
* **Course Viewer UI**:
  * Left Sidebar: Accordion listing Chapters, Content Items (Videos/PDFs), and MCQ Tests.
  * Main Area: Video Player / PDF Viewer / MCQ Test Launcher.
  * Strict access enforcement: Direct URL tampering for paid content returns HTTP 403 Forbidden for non-purchased users.

### 5.7 Module 7: Interactive MCQ Test Series Engine
* **Structure**: Test associated with Course/Chapter with parameters: Title, Time Limit (minutes), Pass Percentage, Total Marks, Negative Marking per wrong answer.
* **Question Bank**: Multiple Choice Questions (Question Text, Options A/B/C/D, Correct Answer, Marks, Explanation).
* **Test Interface**:
  * Live Countdown Timer.
  * Question Navigation Grid (Answered, Unanswered, Marked for Review).
  * Auto-Submit on time expiry.
* **Instant Evaluation & Report**:
  * Overall Score & Grade (e.g., 85/100).
  * Accuracy Percentage & Time Taken.
  * Breakdown: Correct Answers, Wrong Answers, Unanswered.
  * Detailed Answer Key Review with step-by-step explanations.

### 5.8 Module 8: Free Study Material & Assignments
* **Free Resources**: Dedicated tab accessible without payment containing downloadable PDFs, syllabus outlines, and sample papers.
* **Assignments**: Admin can publish homework/assignments with file attachments and due dates.

### 5.9 Module 9: Comprehensive Admin Portal
* **Admin Dashboard**: Analytics counters for Total Registered Students, Active Courses, Total Purchases, Total Revenue (₹), Recent Transactions, and Recent Test Activity.
* **Course Builder**: Create, edit, publish/unpublish, and organize courses, chapters, videos, and PDFs.
* **Test & Question Builder**: Create test series, add questions, set options, define correct options, set negative marks, and link tests to specific courses.
* **Student Management**: View registered students, inspect student profiles, check course enrollment status, manually grant/revoke access if necessary.
* **Payment & Revenue Audit**: Filterable transaction logs showing Student Name, Course Title, Amount, Payment ID, Gateway Status, and Date/Time.
* **Branding Settings**: Portal form to modify app name, logo, contact phone/email, and accent colors instantly.

### 5.10 Module 10: Legal, Compliance & Privacy Pages
* **Privacy Policy**: Covers data collection (Name, Email, Phone), payment processing disclosure (handled securely via PCI-DSS compliant gateways without storing raw card data), account rights, and data deletion requests.
* **Terms & Conditions**: Operational rules, course usage guidelines, content protection/copyright notice.
* **Refund & Cancellation Policy**: Standard policy outlining eligibility for refunds on course purchases.
* **Contact & Support**: Support email, phone number, address, and inquiry form.

---

## 6. Database Schema Specification (Prisma)

```prisma
model User {
  id           String       @id @default(uuid())
  name         String
  email        String       @unique
  phone        String
  passwordHash String
  role         Role         @default(STUDENT)
  avatarUrl    String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  purchases    Purchase[]
  testAttempts TestAttempt[]
}

enum Role {
  STUDENT
  ADMIN
}

model BrandingSettings {
  id           String   @id @default("default")
  appName      String   @default("Sarvottam Diksha")
  tagline      String   @default("Excellence in Education & Online Coaching")
  logoUrl      String?
  primaryColor String   @default("#4F46E5")
  contactEmail String   @default("contact@sarvottamdiksha.com")
  contactPhone String   @default("+91 98765 43210")
  address      String   @default("Sarvottam Diksha Learning Center, India")
  updatedAt    DateTime @updatedAt
}

model Course {
  id           String        @id @default(uuid())
  title        String
  description  String
  category     String        @default("General")
  price        Float
  originalPrice Float?
  validityDays Int          @default(365)
  thumbnail    String?
  isPublished  Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  chapters     Chapter[]
  tests        Test[]
  purchases    Purchase[]
}

model Chapter {
  id         String    @id @default(uuid())
  courseId   String
  course     Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title      String
  orderIndex Int       @default(0)
  contents   Content[]
  tests      Test[]
}

model Content {
  id           String   @id @default(uuid())
  chapterId    String
  chapter      Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  title        String
  type         ContentType // VIDEO, PDF, NOTES
  url          String
  duration     String?
  isFreePreview Boolean @default(false)
  orderIndex   Int      @default(0)
  createdAt    DateTime @default(now())
}

enum ContentType {
  VIDEO
  PDF
  NOTES
}

model Purchase {
  id             String        @id @default(uuid())
  userId         String
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId       String
  course         Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)
  amount         Float
  paymentGateway String        @default("RAZORPAY")
  paymentStatus  PaymentStatus @default(PENDING)
  orderId        String        @unique
  paymentId      String?       @unique
  signature      String?
  createdAt      DateTime      @default(now())
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}

model Test {
  id              String        @id @default(uuid())
  courseId        String
  course          Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)
  chapterId       String?
  chapter         Chapter?      @relation(fields: [chapterId], references: [id])
  title           String
  durationMinutes Int           @default(30)
  totalMarks      Int           @default(100)
  negativeMarks   Float         @default(0.0)
  passPercentage  Float         @default(40.0)
  isPublished     Boolean       @default(true)
  createdAt       DateTime      @default(now())
  questions       Question[]
  testAttempts    TestAttempt[]
}

model Question {
  id            String              @id @default(uuid())
  testId        String
  test          Test                @relation(fields: [testId], references: [id], onDelete: Cascade)
  questionText  String
  optionA       String
  optionB       String
  optionC       String
  optionD       String
  correctOption String              // "A", "B", "C", or "D"
  explanation   String?
  marks         Float               @default(1.0)
  userAnswers   TestAttemptAnswer[]
}

model TestAttempt {
  id                 String              @id @default(uuid())
  userId             String
  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  testId             String
  test               Test                @relation(fields: [testId], references: [id], onDelete: Cascade)
  score              Float
  maxScore           Float
  correctCount       Int
  wrongCount         Int
  unansweredCount    Int
  accuracyPercentage Float
  timeTakenSeconds   Int
  submittedAt        DateTime            @default(now())
  answers            TestAttemptAnswer[]
}

model TestAttemptAnswer {
  id             String      @id @default(uuid())
  attemptId      String
  attempt        TestAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  questionId     String
  question       Question    @relation(fields: [questionId], references: [id], onDelete: Cascade)
  selectedOption String?     // "A", "B", "C", "D" or null
  isCorrect      Boolean
  scoreEarned    Float
}

model FreeResource {
  id          String   @id @default(uuid())
  title       String
  type        ContentType
  url         String
  category    String   @default("General")
  description String?
  createdAt   DateTime @default(now())
}

model Announcement {
  id        String   @id @default(uuid())
  title     String
  message   String
  createdAt DateTime @default(now())
}
```

---

## 7. Non-Functional Requirements

1. **Security**:
   * Password hashing with bcrypt (10 rounds).
   * JWT tokens passed via Authorization headers (`Bearer <token>`).
   * Zero raw card/bank data stored locally.
   * HMAC-SHA256 signature verification for payment webhooks.
2. **Performance**:
   * API responses delivered within < 200 ms.
   * Client bundle optimized via Vite tree-shaking & code-splitting.
3. **Scalability**:
   * Clean separation of concerns between API routes, controllers, and Prisma data layer.
   * Database schema ready to migrate seamlessly from SQLite to PostgreSQL / Supabase as user base grows to 10,000+ students.
4. **Cost Efficiency**:
   * Initial dev cost: **₹0** (within ₹1,000 budget constraint).
   * Recurring cost: **₹0 - ₹250/month** (using free tier deployment options), saving the teacher **₹625+/month**.

---

## 8. Implementation Roadmap

- [x] **Milestone 1: PRD & Architectural Blueprint Approval**
- [ ] **Milestone 2: Database Layer & Backend Express API Setup** (Auth, Courses, Payments, Tests)
- [ ] **Milestone 3: Student App Interface** (Home, Course Catalog, Course Detail, Free Resources, Legal Pages)
- [ ] **Milestone 4: Real Payment Integration & Auto-Unlock Engine** (Razorpay modal + HMAC verification)
- [ ] **Milestone 5: MCQ Test Engine & Detailed Result Analytics**
- [ ] **Milestone 6: Admin Portal & Branding Management**
- [ ] **Milestone 7: Comprehensive Testing & Verification**
