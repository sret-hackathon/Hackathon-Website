import os
import smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
# Enable CORS so the local frontend on port 8000 can talk to us on port 5000
CORS(app, resources={r"/send-email": {"origins": "*"}})

EMAIL_USER = os.environ.get('EMAIL_USER')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD')

@app.route('/send-email', methods=['POST'])
def send_email():
    data = request.json
    
    if not data:
        return jsonify({"error": "Invalid request body"}), 400

    to_name = data.get('to_name')
    to_email = data.get('to_email')
    team_name = data.get('team_name')
    verify_link = data.get('verify_link')

    if not all([to_name, to_email, team_name, verify_link]):
        return jsonify({"error": "Missing required email fields"}), 400

    if not EMAIL_USER or not EMAIL_PASSWORD or EMAIL_USER == "your_email@gmail.com":
         print("ERROR: Mail credentials not configured in .env file.")
         return jsonify({"error": "Server email configuration is missing or invalid"}), 500

    msg = EmailMessage()
    msg['Subject'] = f'Action Required: Join {team_name} on HackClub!'
    msg['From'] = EMAIL_USER
    msg['To'] = to_email

    email_body = f"""Hi {to_name},

You have been invited to join the hackathon team "{team_name}".

Please click the link below to verify your email and join the team:
{verify_link}

Good luck!
HackClub Team
"""
    msg.set_content(email_body)

    try:
        # Use SMTP configuration for Gmail
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)
            
        print(f"Successfully sent email to {to_email}")
        return jsonify({"message": "Email sent successfully"}), 200
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting HackClub Email API on port 5000...")
    app.run(port=5000, debug=True)
