# 🩺 Medical Interaction Checker

A web application that allows patients and doctors to check **drug–condition interactions** and **food–condition safety** using external APIs and AI analysis (Ollama).  
The system supports user registration (patients & doctors), account management, doctor panel for managing patients, and image-based food analysis.

---

## 🚀 Features
- **Authentication & Roles**: Patient and Doctor registration/login with profile images.
- **Patient Account Management**: Update details, delete account (patients only).
- **Doctor Panel**: View, edit, create, and delete patients.
- **Drug–Condition Interaction Check**: Uses **OpenFDA API** to detect potential drug risks.
- **Food–Condition Interaction Analysis**:
  - Detects food from uploaded images via **Imagga API**.
  - Fetches ingredients from **USDA API**.
  - Runs safety analysis with **Ollama AI**.
- **Profile Image Validation**: Ensures uploaded images contain a person.
- **Deployment**: Hosted live on **Render**.

---

## 🛠️ Tech Stack
- **Backend**: Node.js + Express.js
- **Frontend**: EJS templates + CSS (custom, Bootstrap-based)
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: Express-session (MemoryStore in academic version)
- **File Uploads**: Multer
- **External APIs**:
  - [OpenFDA](https://open.fda.gov/apis/)
  - [Imagga](https://imagga.com/)
  - [USDA FDC](https://fdc.nal.usda.gov/api-guide.html)
  - [Ollama](https://ollama.ai/)

---

## 🗂️ Project Structure
```plaintext
Project/
├── config/               # API keys, DB, Ollama config
├── controllers/          # Server-side logic
├── models/               # MongoDB schemas
├── routes/               # Express routes
├── views/
│   ├── pages/            # EJS templates
│   └── partials/         # Header, Footer, Navbar
├── public/
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side scripts
│   └── uploads/          # Uploaded images
├── .env                  # Environment variables
├── app.js                # Main Express app
└── package.json

```

## ⚙️ Setup

### 1. Clone repository
```bash
git clone https://github.com/saramangistu/medical-interaction-checker.git
cd medical-interaction-checker
```
---
## 🚀 Running the Docker Image Locally

1. Make sure you have Docker installed.

2. Create an environment file (e.g. `.env` or `envINTERACTION`) with the following variables:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/medicaldb
IMAGGA_API_KEY=your_key
IMAGGA_API_SECRET=your_secret
USDA_API_KEY=your_key
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-r1:latest

3. Run the container:
docker run -p 3000:3000 --env-file /path/to/envINTERACTION medapp

4. Open the app in your browser:
👉 http://localhost:3000

5. 
