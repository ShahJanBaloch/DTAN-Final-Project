# 🎨 BalochHunar — Digital Artisan & Handicraft Business Platform

> **Final Project for DTAN AI Web Development Course**  
> *"Crafted by Heritage. Connected to the World."*

---

## 📌 1. Project Overview & Business Problem

### The Business Problem
Local artisans and rural craft communities in Balochistan and across Pakistan produce museum-grade, generational handicrafts (intricate *Balochi Doch* embroidery, vegetable-tanned leather goods, terracotta pottery, and organic wool kilims). However, they lack a professional digital presence.

Most artisans rely on informal channels such as WhatsApp, word-of-mouth, or exploitative middlemen who capture up to 80% of the commercial value. They lack:
* Structured, searchable digital product catalogs with transparent pricing
* Professional product copywriting in English for international and urban buyers
* Digital artisan profiles and cultural storytelling
* Centralized business, inventory, and customer inquiry management

### The Proposed Solution: BalochHunar
**BalochHunar** bridges traditional craftsmanship with modern web development and Artificial Intelligence. It provides:
1. A **high-performance public web platform** (Home, About, Handicrafts Catalog, Bespoke Services, and Contact).
2. A **secure session-based Admin Portal** for complete business management (Products, Artisans, Categories, Services, Gallery, and Inquiries).
3. **Backend-proxied AI Business Intelligence** to generate commercial descriptions, suggest smart tags, and draft cultural stories.
4. A **pure relational MySQL database** with strict referential integrity.

---

## 🏛️ 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js, Express.js (Layered MVC Architecture) |
| **Database** | MySQL (with `mysql2/promise` connection pool) |
| **Frontend** | HTML5, Tailwind CSS, Custom CSS variables, Vanilla JavaScript |
| **Security & Auth** | `bcrypt` (10 rounds), `express-session` (HTTP-only cookies), `helmet`, `express-rate-limit` |
| **Media Uploads** | `multer` (Disk storage, MIME & 5MB file validation) |
| **AI Integration** | Google Gemini 1.5 Flash API + Domain-Trained Heuristic AI Fallback Engine |
| **Testing** | Node.js Native QA Test Suite (`npm test`), Postman Collection |

---

## 🗄️ 3. Database Architecture & Relational Schema

The database (`balochhunar_db`) consists of **7 normalized relational tables**:

```
  +------------------+         +------------------+
  |    categories    |         |     artisans     |
  +------------------+         +------------------+
  | id (PK)          |         | id (PK)          |
  | name (UNIQUE)    |         | name             |
  | slug (UNIQUE)    |         | location         |
  | description      |         | experience_years |
  +--------+---------+         | craft_type       |
           | 1                 | bio, story       |
           |                   +--------+---------+
           |                            | 1
           |         N                  |
           +---------► +----------------+ ◄---+ N
                       |    products    |
                       +----------------+
                       | id (PK)        |
                       | category_id(FK)|
                       | artisan_id (FK)|
                       | name, price    |
                       | tags, image    |
                       | is_featured    |
                       +----------------+

  +------------------+         +------------------+         +------------------+
  |      users       |         |     services     |         |     gallery      |
  +------------------+         +------------------+         +------------------+
  | id (PK)          |         | id (PK)          |         | id (PK)          |
  | email (UNIQUE)   |         | title            |         | title            |
  | password (HASH)  |         | starting_price   |         | craft_type       |
  | role             |         | estimated_days   |         | image            |
  +------------------+         +------------------+         +------------------+
```

### Relational Foreign Key Constraints
* `products.category_id` $\rightarrow$ `categories.id` (`ON DELETE RESTRICT ON UPDATE CASCADE`)
* `products.artisan_id` $\rightarrow$ `artisans.id` (`ON DELETE RESTRICT ON UPDATE CASCADE`)

---

## 🚀 4. Installation & Quick Start Guide

### Prerequisites
* **Node.js** (v18+ recommended)
* **npm** (v9+ or v10+)
* **MySQL Server** or **XAMPP** (with Apache and MySQL started)

### Step 1: Clone or Navigate to the Project
```bash
cd "Baloch_Hunar"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` or verify the default `.env` file:
```env
PORT=5000
NODE_ENV=development

# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=balochhunar_db
DB_PORT=3306

# Session Security
SESSION_SECRET=balochhunar_secure_session_secret_dtan_2024

# AI Service (Optional - built-in domain AI fallback active if left blank)
AI_PROVIDER=gemini
AI_API_KEY=
```

### Step 4: Initialize & Seed MySQL Database
Run the automated database migration script:
```bash
npm run db:init
```
*(Alternatively, import `database/hunarhub.sql` via phpMyAdmin).*

### Step 5: Start the Application Server
```bash
npm run dev
```

The application is now live at:
* 🌐 **Public Storefront**: [http://localhost:5000/public/index.html](http://localhost:5000/public/index.html)
* 🔐 **Admin Login Portal**: [http://localhost:5000/admin/login.html](http://localhost:5000/admin/login.html)
* 🩺 **API Health Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 5. Default Evaluator Login Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@balochhunar.com` | `admin123` | Full Admin Console & AI Generator |

*(A convenient **"Auto-fill"** button is also provided directly on `admin/login.html` for instant login).*

---

## 🤖 6. AI Business Features

AI is deeply integrated into the actual administrative business workflow rather than being a generic detached chatbot:

1. **AI Feature 1 — Product Description Generator (`POST /api/ai/product-description`)**:
   * Takes product name, craft technique, materials, and colors $\rightarrow$ Generates an evocative, commercially persuasive catalog description.
2. **AI Feature 2 — Smart Product Tags & Taxonomy Suggester (`POST /api/ai/suggest-tags`)**:
   * Analyzes product details and suggests high-converting cultural and ecommerce tags.
3. **AI Feature 3 — Artisan Cultural Storyteller (`POST /api/ai/artisan-story`)**:
   * Transforms artisan background, location, and years of experience into *"The Story Behind the Craft"*.
4. **Zero-Failure Architecture**:
   * If an external AI API key is not configured, the platform's domain-trained heuristic generator produces authentic, culturally accurate content, ensuring 100% reliability during evaluation.

---

## 🧪 7. Automated Testing & Postman Verification

### Running Automated Test Suite
With the server running, execute:
```bash
npm test
```
This runs 17 automated tests verifying Health checks, Authentication, Category/Artisan/Product/Service CRUD, Multer upload security, Relational JOINs, Multi-faceted search queries, and AI generation.

### Postman Collection
Import `database/HunarHub_Postman_Collection.json` into Postman to test all REST endpoints.

---

## 📁 8. Project Structure

```text
balochhunar/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js     # Login, logout, stats
│   │   ├── artisanController.js  # Artisan CRUD
│   │   ├── categoryController.js # Category CRUD
│   │   ├── productController.js  # Product CRUD & search
│   │   ├── serviceController.js  # Service CRUD
│   │   ├── galleryController.js  # Gallery CRUD
│   │   ├── messageController.js  # Inquiry CRUD
│   │   └── aiController.js       # AI generation layer
│   ├── middleware/
│   │   ├── authMiddleware.js     # Session guard
│   │   ├── uploadMiddleware.js   # Multer file validation
│   │   ├── validationMiddleware.js# Input validation
│   │   └── errorMiddleware.js    # Global error handler
│   ├── routes/                   # Express route definitions
│   ├── tests/
│   │   └── api_tests.js          # Automated test runner
│   ├── utils/
│   │   └── validation.js         # Sanitization helpers
│   ├── uploads/                  # Uploaded product & artisan images
│   ├── app.js                    # Express app configuration
│   └── server.js                 # Entrypoint listener
├── frontend/
│   ├── public/                   # 5 Public Storefront Pages
│   │   ├── index.html            # Home page
│   │   ├── about.html            # About Us page
│   │   ├── products.html         # Handicrafts Catalog
│   │   ├── services.html         # Bespoke Services
│   │   └── contact.html          # Contact & Inquiries
│   ├── admin/                    # Admin Panel Pages
│   │   ├── login.html            # Login interface
│   │   ├── dashboard.html        # Live KPI Dashboard
│   │   ├── artisans.html         # Artisans management + AI Story
│   │   ├── categories.html       # Categories management
│   │   ├── products.html         # Product catalog + AI Description
│   │   ├── services.html         # Bespoke services management
│   │   ├── gallery.html          # Heritage gallery management
│   │   └── messages.html         # Inquiries inbox
│   ├── css/
│   │   └── style.css             # Theme variables & animations
│   └── js/                       # Modular frontend JavaScript
├── database/
│   ├── hunarhub.sql              # Database schema & production seeds
│   ├── initDb.js                 # CLI database initializer
│   └── HunarHub_Postman_Collection.json # Postman test suite
├── screenshots/                  # Project screenshots
├── REPORT.md                     # 3-Page Final Project Report
├── DEMO_SCRIPT.md                # 5-Minute Demonstration Script
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔒 9. Security Implementations

* **No Plaintext Passwords**: Hashed with `bcrypt` (10 salt rounds).
* **SQL Injection Immunity**: 100% parameterized queries using `mysql2/promise`.
* **Session Hijacking Defense**: `express-session` with HTTP-only cookies.
* **Brute-Force Defense**: `express-rate-limit` on login, contact, and AI routes.
* **HTTP Security Headers**: `helmet` configuration.
* **MIME File Verification**: Strict Multer image validation (`jpg`, `jpeg`, `png`, `webp`, max 5MB).
* **Environment Isolation**: `.env` is ignored by `.gitignore`.

---

## 🔮 10. Future Enhancements

* Online payment gateway integration (Stripe / JazzCash / EasyPaisa).
* Real-time WhatsApp order tracking webhook.
* Multi-language support (Urdu, Balochi, and English).
* Virtual 3D Craft Exhibit room using WebGL.

---

**Author**: BalochHunar Engineering Team
**Course**: DTAN AI Web Development Course
