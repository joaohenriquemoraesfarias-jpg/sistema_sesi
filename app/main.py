"""
Ponto de entrada da aplicação.

As rotas em si moraram para app/routes/ (um arquivo por assunto: alunos,
usuários, histórico, lembretes, autenticação). Aqui só ficam: criação do
app, middlewares, inclusão dos routers e o "encaixe" do front-end estático.
"""
import webbrowser
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base, SessionLocal
from app.crud import create_default_user
from app.routes import auth, students, users, history, reminders

# Pasta do front-end (index.html, script.js, style.css, sesi.png), servida pelo próprio FastAPI
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Criar tabelas automaticamente no MySQL (só cria as que faltam, não altera as existentes).
    # Fica aqui dentro (e não solto no topo do arquivo) para que só aconteça quando o
    # servidor realmente sobe — importar este módulo (como os testes automatizados fazem)
    # não deve, por si só, tentar abrir uma conexão com o banco de dados.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        create_default_user(db)
    finally:
        db.close()

    webbrowser.open("http://127.0.0.1:8000/")
    yield

app = FastAPI(title="API Gestão Escolar SESI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROTAS DA API (cada router cuida de um assunto — veja app/routes/) ---
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(users.router)
app.include_router(history.router)
app.include_router(reminders.router)

# --- FRONT-END ---
# Serve index.html, script.js, style.css e sesi.png direto pelo FastAPI.
# Precisa ser a ÚLTIMA coisa registrada no app: assim as rotas /api acima
# continuam funcionando normalmente, e tudo que não é /api cai aqui,
# devolvendo o index.html (html=True). É isso que permite abrir o sistema
# inteiro com um único comando, sem precisar de um Live Server separado.
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)