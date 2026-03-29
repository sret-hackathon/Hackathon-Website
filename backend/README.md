# SRET Hackathon Platform — Email Backend (Flask)

This is the Python Flask backend responsible for sending OTPs, Registration Confirmations, and Team Invites via Gmail SMTP.

## Local Setup

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configuration (`.env`)**:
    Create a `.env` file in this directory:
    ```env
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASSWORD=your_gmail_app_password
    FRONTEND_URL=http://localhost:5173
    ```
    *Note: Use a "Google App Password," not your regular password.*

3.  **Run Locally**:
    ```bash
    python api.py
    ```

## Deployment on Render.com

1.  **Push to GitHub**: Create a new repository and push only the contents of this `backend/` folder (or the whole project if you prefer).
2.  **Create a New Web Service**:
    - Connect your GitHub repo.
    - **Environment**: `Python`
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `gunicorn api:app`
3.  **Environment Variables**:
    In the Render dashboard, add the variables from step 2 above.
4.  **Update Frontend**:
    Once you have the Render URL (e.g., `https://hack-api.onrender.com`), update the `.env` file in the **frontend root directory**:
    ```env
    VITE_EMAIL_API=https://hack-api.onrender.com
    ```
