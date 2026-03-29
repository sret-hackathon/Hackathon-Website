import os
import random
import smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

EMAIL_USER = os.environ.get('EMAIL_USER')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')


def send_gmail(to_email, subject, body_html, body_text):
    """Shared helper to send via Gmail SMTP."""
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("ERROR: Mail credentials not configured.")
        return False, "Server email configuration is missing."
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = f"SRET Hackathon Club <{EMAIL_USER}>"
        msg['To'] = to_email
        msg.set_content(body_text)
        msg.add_alternative(body_html, subtype='html')
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)
        print(f"Email sent to {to_email}")
        return True, "Email sent successfully"
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")
        return False, str(e)


# ─────────────────────────────────────────────
# ROUTE 1: Send OTP for mobile verification
# ─────────────────────────────────────────────
@app.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    to_email = data.get('to_email')
    to_name = data.get('to_name', 'Student')
    otp = data.get('otp')

    if not to_email or not otp:
        return jsonify({"error": "Missing to_email or otp"}), 400

    subject = "Your SRET Hackathon Club OTP"
    body_text = f"Hi {to_name},\n\nYour OTP is: {otp}\n\nThis code expires in 10 minutes.\n\n— SRET Hackathon Club"
    body_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0a66c2, #004182); padding: 2rem; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 1.5rem;">⚡ SRET Hackathon Club</h1>
      </div>
      <div style="padding: 2rem; text-align: center;">
        <p style="color: #374151; font-size: 1rem;">Hi <b>{to_name}</b>, your verification code is:</p>
        <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0;">
          <span style="font-size: 2.5rem; font-weight: 900; letter-spacing: 0.5rem; color: #166534;">{otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 0.9rem;">This OTP expires in <b>10 minutes</b>. Do not share it with anyone.</p>
      </div>
      <div style="background: #f9fafb; padding: 1rem; text-align: center;">
        <p style="color: #9ca3af; font-size: 0.8rem; margin: 0;">SRET Coding &amp; Hackathon Club · Sri Ramachandra Engineering &amp; Technology</p>
      </div>
    </div>"""
    ok, msg = send_gmail(to_email, subject, body_html, body_text)
    return jsonify({"message": msg} if ok else {"error": msg}), 200 if ok else 500


# ─────────────────────────────────────────────
# ROUTE 2: Registration Confirmation Email
# ─────────────────────────────────────────────
@app.route('/send-registration-confirm', methods=['POST'])
def send_registration_confirm():
    data = request.json
    to_email = data.get('to_email')
    to_name = data.get('to_name', 'Student')
    hackathon_name = data.get('hackathon_name', 'Hackathon')
    team_name = data.get('team_name', 'Solo')
    xp_awarded = data.get('xp_awarded', 25)

    if not to_email:
        return jsonify({"error": "Missing to_email"}), 400

    subject = f"🎉 Registration Confirmed — {hackathon_name}"
    body_text = f"Hi {to_name},\n\nYou have successfully registered for {hackathon_name}!\nTeam: {team_name}\nXP Awarded: +{xp_awarded} SRET Points\n\nGood luck!\n— SRET Hackathon Club"
    body_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0a66c2, #004182); padding: 2rem; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 1.5rem;">⚡ SRET Hackathon Club</h1>
      </div>
      <div style="padding: 2rem;">
        <h2 style="color: #166534; margin-top: 0;">🎉 You're Registered!</h2>
        <p style="color: #374151;">Hi <b>{to_name}</b>,</p>
        <p style="color: #374151;">Your registration for <b>{hackathon_name}</b> has been confirmed on the SRET platform!</p>
        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 4px; padding: 1rem; margin: 1.5rem 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: #6b7280;">Hackathon</span>
            <b style="color: #166534;">{hackathon_name}</b>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: #6b7280;">Team</span>
            <b style="color: #166534;">{team_name}</b>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">XP Awarded</span>
            <b style="color: #f59e0b;">+{xp_awarded} SRET Points ⭐</b>
          </div>
        </div>
        <p style="color: #374151; font-size: 0.9rem;">Check your <b>Student Dashboard</b> to submit your PPT and track your team's progress. Good luck! 🚀</p>
        <a href="{FRONTEND_URL}/dashboard/student" style="display: inline-block; background: #0a66c2; color: white; padding: 0.75rem 1.5rem; border-radius: 25px; text-decoration: none; font-weight: bold; margin-top: 0.5rem;">Open Dashboard →</a>
      </div>
      <div style="background: #f9fafb; padding: 1rem; text-align: center;">
        <p style="color: #9ca3af; font-size: 0.8rem; margin: 0;">SRET Coding &amp; Hackathon Club</p>
      </div>
    </div>"""
    ok, msg = send_gmail(to_email, subject, body_html, body_text)
    return jsonify({"message": msg} if ok else {"error": msg}), 200 if ok else 500


# ─────────────────────────────────────────────
# ROUTE 3: Team Member Invite Email
# ─────────────────────────────────────────────
@app.route('/send-team-invite', methods=['POST'])
def send_team_invite():
    data = request.json
    to_email = data.get('to_email')
    to_name = data.get('to_name', 'Student')
    leader_name = data.get('leader_name', 'your teammate')
    team_name = data.get('team_name', 'a team')
    hackathon_name = data.get('hackathon_name', 'a hackathon')

    if not to_email:
        return jsonify({"error": "Missing to_email"}), 400

    subject = f"🤝 Team Invite — {hackathon_name}"
    body_text = f"Hi {to_name},\n\n{leader_name} has added you to team '{team_name}' for {hackathon_name}.\n\nLog in to your SRET Dashboard to Accept or Decline.\n— SRET Hackathon Club"
    body_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0a66c2, #004182); padding: 2rem; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 1.5rem;">⚡ SRET Hackathon Club</h1>
      </div>
      <div style="padding: 2rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🤝</div>
        <h2 style="color: #1e3a8a; margin-top: 0;">You've been invited to a team!</h2>
        <p style="color: #374151;">Hi <b>{to_name}</b>,</p>
        <p style="color: #374151;"><b>{leader_name}</b> has added you to team <b>"{team_name}"</b> for <b>{hackathon_name}</b> on the SRET platform.</p>
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; text-align: left;">
          <p style="color: #92400e; margin: 0; font-size: 0.9rem;">⚠️ You need to <b>accept this invite</b> in your Student Dashboard to confirm your team membership. Decline if you didn't expect this.</p>
        </div>
        <a href="{FRONTEND_URL}/dashboard/student" style="display: inline-block; background: #16a34a; color: white; padding: 0.75rem 1.5rem; border-radius: 25px; text-decoration: none; font-weight: bold;">Accept / Decline Invite →</a>
      </div>
      <div style="background: #f9fafb; padding: 1rem; text-align: center;">
        <p style="color: #9ca3af; font-size: 0.8rem; margin: 0;">SRET Coding &amp; Hackathon Club</p>
      </div>
    </div>"""
    ok, msg = send_gmail(to_email, subject, body_html, body_text)
    return jsonify({"message": msg} if ok else {"error": msg}), 200 if ok else 500


# ─────────────────────────────────────────────
# LEGACY: Original team invite route kept
# ─────────────────────────────────────────────
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
    subject = f'Action Required: Join {team_name} on SRET HackClub!'
    body_text = f"Hi {to_name},\n\nYou have been invited to join '{team_name}'.\nVerify here: {verify_link}\n\nGood luck!\n— SRET Hackathon Club"
    body_html = f"<p>Hi <b>{to_name}</b>,</p><p>You've been invited to join <b>{team_name}</b>.</p><p><a href='{verify_link}'>Click to verify and join</a></p>"
    ok, msg = send_gmail(to_email, subject, body_html, body_text)
    return jsonify({"message": msg} if ok else {"error": msg}), 200 if ok else 500


if __name__ == '__main__':
    print("Starting SRET HackClub Email API on port 5000...")
    app.run(port=5000, debug=True)
