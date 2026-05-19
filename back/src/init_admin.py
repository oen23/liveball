from config import SessionLocal, ADMIN_EMAIL, ADMIN_PASSWORD
from models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    with SessionLocal() as session:
        existing = session.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"✅ Админ уже существует: {ADMIN_EMAIL}")
            return
        admin = User(
            email=ADMIN_EMAIL,
            username="admin",
            hashed_password=pwd_context.hash(ADMIN_PASSWORD),
            is_admin=True
        )
        session.add(admin)
        session.commit()
        print(f"✅ Админ создан: {ADMIN_EMAIL}")

if __name__ == "__main__":
    create_admin()