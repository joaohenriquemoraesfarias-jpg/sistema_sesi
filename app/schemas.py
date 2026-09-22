from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models import CategoryEnum, UserRoleEnum

# Sibling Schemas
class SiblingBase(BaseModel):
    nome: str
    serie: str

class SiblingCreate(SiblingBase):
    pass

class SiblingResponse(SiblingBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Student Schemas
class StudentBase(BaseModel):
    category: CategoryEnum
    studentName: str
    studentBirth: Optional[str] = None
    studentRg: Optional[str] = None
    studentCpf: Optional[str] = None
    studentNat: Optional[str] = None
    studentGrade: str
    studentShift: str
    studentLaudo: str = "Não"
    laudoDesc: Optional[str] = None
    irmaoQty: int = 0
    irmaos: List[SiblingCreate] = []

    respName: str
    respBirth: Optional[str] = None
    respRg: Optional[str] = None
    respCpf: str
    respNat: Optional[str] = None
    respAddress: Optional[str] = None
    respNum: Optional[str] = None
    respBairro: Optional[str] = None
    respCep: Optional[str] = None
    respCivil: Optional[str] = None
    respEduc: Optional[str] = None
    respEmail: Optional[str] = None
    respCompany: Optional[str] = None
    respCnpj: Optional[str] = None
    telPai: Optional[str] = None
    emailPai: Optional[str] = None
    telMae: Optional[str] = None
    emailMae: Optional[str] = None
    telOutro: Optional[str] = None
    emailOutro: Optional[str] = None
    respFin: str
    respAcad: str

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: int
    timestamp: str = "" # <-- A correção salvadora está aqui!
    possui_irmao: bool
    position: Optional[int] = None
    status_vaga: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# User Schemas
class UserBase(BaseModel):
    name: str
    login: str
    role: UserRoleEnum

class UserCreate(UserBase):
    pass_word: str

class UserResponse(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# History Log Schemas
class HistoryLogResponse(BaseModel):
    id: int
    date: str
    action: str
    details: str
    user: str

    model_config = ConfigDict(from_attributes=True)

# Reminder Schemas
class ReminderCreate(BaseModel):
    texto: str

class ReminderResponse(BaseModel):
    id: int
    texto: str
    createdAt: str
    concluido: bool
    concluidoEm: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)