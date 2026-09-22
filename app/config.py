import os
import secrets
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MYSQL_USER: str = os.getenv("MYSQL_USER", "seu_usuario")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "sua_senha")
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "sesi_gestao")

    # Chave usada para assinar os tokens de login (JWT).
    # Em produção, defina JWT_SECRET_KEY no arquivo .env — se não for definida,
    # geramos uma chave aleatória só para esta execução (funciona, mas invalida
    # os logins toda vez que o servidor reinicia, já que a chave muda).
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", secrets.token_hex(32))
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))  # 8 horas (um turno de trabalho)

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"

settings = Settings()
