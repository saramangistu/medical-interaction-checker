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

## 📂 Project Structure

project/
│── app.js # Main entry point
│── Dockerfile # Docker container definition
│── .dockerignore
│── .env.example # Example environment variables
│── config/ # Config files
│── controllers/ # Business logic
│── middleware/ # Custom middleware (auth, upload)
│── models/ # Mongoose schemas
│── routes/ # Route definitions
│── views/ # EJS templates
│── public/ # Static files (CSS, images, uploads)



---

## ⚙️ Setup

### 1. Clone repository
```bash
git clone https://github.com/saramangistu/medical-interaction-checker.git
cd medical-interaction-checker

