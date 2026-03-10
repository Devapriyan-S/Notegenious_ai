from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import uuid
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

from database import get_db
from models import SignupRequest, LoginRequest, ProfileUpdate, TokenResponse, UserResponse, SignupPendingResponse, OTPVerifyRequest

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))

# In-memory OTP store: email -> {otp, expires, pw_hash, full_name}
otp_store: dict = {}


def send_otp_email(to_email: str, otp: str) -> None:
    """Send a 6-digit OTP to the given email address via SMTP."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    if not smtp_user or not smtp_password:
        # SMTP not configured — log OTP to console for development
        print(f"[OTP] Verification code for {to_email}: {otp}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "NoteGenius AI — Email Verification Code"
    msg["From"] = formataddr(("Notegenious AI", smtp_from))
    msg["To"] = to_email

    text_body = f"Your NoteGenius AI verification code is: {otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email."
    html_body = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#7c3aed;">NoteGenius AI</h2>
      <p>Your email verification code is:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#7c3aed;padding:16px 0;">{otp}</div>
      <p style="color:#666;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="color:#999;font-size:12px;">If you did not request this, please ignore this email.</p>
    </div>
    """
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, to_email, msg.as_string())


def send_invite_email(to_email: str) -> None:
    """Send an invitation to join NoteGenius AI."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)
    app_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

    if not smtp_user or not smtp_password:
        print(f"[INVITE] Invitation for {to_email}: sign up at {app_url}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "You've been invited to NoteGenius AI"
    msg["From"] = formataddr(("Notegenious AI", smtp_from))
    msg["To"] = to_email

    text_body = (
        f"You've been invited to collaborate on NoteGenius AI.\n\n"
        f"Sign up for free at: {app_url}\n\n"
        f"If you did not expect this invitation, please ignore this email."
    )
    html_body = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#7c3aed;">NoteGenius AI</h2>
      <p>Someone has invited you to collaborate on their notes!</p>
      <p>Sign up for free to get started:</p>
      <a href="{app_url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Join NoteGenius AI</a>
      <p style="color:#999;font-size:12px;">If you did not expect this, please ignore this email.</p>
    </div>
    """
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, to_email, msg.as_string())


def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/signup", response_model=SignupPendingResponse, status_code=200)
def signup(body: SignupRequest):
    with get_db() as conn:
        cur = conn.cursor()
        # Check if email already exists
        cur.execute("SELECT id FROM backend_users WHERE email = %s", (body.email,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Email already registered")

    # Generate OTP and store pending signup data
    otp = str(random.randint(100000, 999999))
    pw_hash = hash_password(body.password)
    otp_store[body.email] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=10),
        "pw_hash": pw_hash,
        "full_name": body.full_name or "",
    }

    # Send OTP via email (falls back to console log if SMTP not configured)
    try:
        send_otp_email(body.email, otp)
    except Exception as e:
        print(f"[OTP] Failed to send email to {body.email}: {e}")
        print(f"[OTP] Verification code for {body.email}: {otp}")

    return SignupPendingResponse(
        message="OTP sent to your email. Please verify to complete sign up.",
        email=body.email,
    )


@router.post("/verify-otp", response_model=TokenResponse, status_code=201)
def verify_otp(body: OTPVerifyRequest):
    pending = otp_store.get(body.email)
    if not pending:
        raise HTTPException(status_code=400, detail="OTP expired or not found. Please sign up again.")
    if datetime.utcnow() > pending["expires"]:
        del otp_store[body.email]
        raise HTTPException(status_code=400, detail="OTP has expired. Please sign up again.")
    if pending["otp"] != body.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP code.")

    # Create user in database
    user_id = str(uuid.uuid4())
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO backend_users (id, email, password_hash, full_name)
               VALUES (%s, %s, %s, %s) RETURNING *""",
            (user_id, body.email, pending["pw_hash"], pending["full_name"])
        )
        user = dict(cur.fetchone())

    # Clean up OTP store
    del otp_store[body.email]

    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user["id"]),
            email=user["email"],
            full_name=user["full_name"] or "",
            avatar_url=user["avatar_url"] or "",
            groq_api_key=user["groq_api_key"] or "",
            created_at=user["created_at"]
        )
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM backend_users WHERE email = %s", (body.email,))
        user = cur.fetchone()
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(str(user["id"]))
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user["id"]),
            email=user["email"],
            full_name=user["full_name"] or "",
            avatar_url=user["avatar_url"] or "",
            groq_api_key=user["groq_api_key"] or "",
            created_at=user["created_at"]
        )
    )


@router.get("/me", response_model=UserResponse)
def get_me(user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM backend_users WHERE id = %s", (user_id,))
        user = cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=str(user["id"]),
        email=user["email"],
        full_name=user["full_name"] or "",
        avatar_url=user["avatar_url"] or "",
        groq_api_key=user["groq_api_key"] or "",
        created_at=user["created_at"]
    )


@router.put("/profile", response_model=UserResponse)
def update_profile(body: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [user_id]
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            f"UPDATE backend_users SET {set_clause} WHERE id = %s RETURNING *",
            values
        )
        user = cur.fetchone()
    return UserResponse(
        id=str(user["id"]),
        email=user["email"],
        full_name=user["full_name"] or "",
        avatar_url=user["avatar_url"] or "",
        groq_api_key=user["groq_api_key"] or "",
        created_at=user["created_at"]
    )


@router.post("/logout")
def logout():
    # JWT is stateless — client just discards the token
    return {"message": "Logged out successfully"}


@router.get("/check-email")
def check_email(email: str):
    """Check whether an email address is registered."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM backend_users WHERE email = %s", (email,))
        exists = cur.fetchone() is not None
    return {"exists": exists}
