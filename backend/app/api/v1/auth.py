from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.user import UserCreate, UserLogin, UserOut, Token
from backend.app.auth.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    email = user_in.email.strip().lower()
    if len(user_in.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Official email is already registered. Please sign in.")
    
    user = User(
        name=user_in.name.strip(),
        email=email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        agency=user_in.agency or "National Cyber Coordination Desk",
        jurisdiction=user_in.jurisdiction or "National"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log registration event
    audit = AuditLog(
        user_id=user.id,
        action="REGISTER",
        entity_type="USER",
        entity_id=str(user.id),
        metadata_json=f'{{"role": "{user.role}", "agency": "{user.agency}"}}'
    )
    db.add(audit)
    db.commit()

    token = create_access_token(data={"sub": user.email, "role": user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        email=user.email,
        name=user.name,
        agency=user.agency,
        jurisdiction=user.jurisdiction
    )

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    email = login_data.email.strip().lower()
    email_variants = list(set([
        email,
        email.replace("@pravaah.gov.in", "@sanketra.gov.in"),
        email.replace("@pravaah.gov.in", "@cybershield.gov.in"),
        email.replace("@sanketra.gov.in", "@pravaah.gov.in"),
        email.replace("@sanketra.gov.in", "@cybershield.gov.in"),
        email.replace("@cybershield.gov.in", "@pravaah.gov.in"),
        email.replace("@cybershield.gov.in", "@sanketra.gov.in"),
    ]))
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = db.query(User).filter(User.email.in_(email_variants)).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        metadata_json=f'{{"role": "{user.role}"}}'
    )
    db.add(audit)
    db.commit()

    token = create_access_token(data={"sub": user.email, "role": user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        email=user.email,
        name=user.name,
        agency=user.agency,
        jurisdiction=user.jurisdiction
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
