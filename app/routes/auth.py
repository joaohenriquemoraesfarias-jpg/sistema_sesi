"""Rota de login. Gera o token JWT que todas as outras rotas protegidas exigem."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import User
from app.security import verify_password, is_legacy_plaintext, create_access_token
from app.crud import migrate_password_to_hash

router = APIRouter(tags=["Autenticação"])


class UserLogin(BaseModel):
    username: str
    password: str


@router.post("/api/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == credentials.username).first()

    if not user or not verify_password(credentials.password, user.pass_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos"
        )

    # Conta antiga, criada antes da atualização de segurança: a senha ainda está
    # em texto puro no banco. Como o login deu certo, aproveitamos para já salvar
    # com hash — na próxima vez, essa conta já entra pelo caminho seguro.
    if is_legacy_plaintext(user.pass_hash):
        migrate_password_to_hash(db, user, credentials.password)

    token = create_access_token({"sub": user.login, "name": user.name, "role": user.role.value})
    return {"access_token": token, "token_type": "bearer", "username": user.login, "role": user.role, "name": user.name}