# Sistema de Gestão de Fila de Matrículas — SESI

Sistema web para gerenciar a fila de espera de matrículas do SESI, aplicando
automaticamente as regras de prioridade de cadastro (categoria do candidato,
possuir irmão já matriculado, e ordem de chegada) e oferecendo um painel
administrativo completo para acompanhar e gerenciar essa fila.

Projeto desenvolvido como parte de uma competição de resolução de problemas
do SESI, com apoio de IA (Claude/Anthropic) como ferramenta de
desenvolvimento e aprendizado — todas as decisões de arquitetura, revisão de
segurança e testes foram acompanhadas e validadas ao longo do processo.



## Funcionalidades

- **Fila com prioridade automática** — ordena os candidatos por categoria
  (Industriário → Colaborador → Empresário Industrial → Convênio →
  Comunidade), depois por quem já tem irmão matriculado, e por último por
  ordem de cadastro.
- **Autenticação real** — login com senha protegida por hash (bcrypt) e
  token JWT, com dois papéis: **admin** (acesso total) e **atendente**
  (cadastro e consulta da fila).
- **Cadastro completo de aluno e responsável**, com validação de CPF (dígitos
  verificadores, não só contagem de caracteres) e bloqueio de CPF duplicado.
- **Painel administrativo**: gestão de usuários do sistema e histórico
  auditável de todas as ações (quem cadastrou, editou ou excluiu o quê, e
  quando).
- **Lembretes pessoais** por usuário — anotações rápidas que não se misturam
  entre quem está usando o sistema.
- **Comprovante de cadastro** para impressão, com a posição do aluno na fila.
- **Acessibilidade**: ajuste de tamanho de fonte, alto contraste, fonte
  facilitada para dislexia e espaçamento entre linhas ajustável.
- **Tema claro/escuro**, com preferência salva no navegador.

## Tecnologias

**Back-end:** Python, FastAPI, SQLAlchemy, Pydantic, MySQL, JWT (python-jose),
bcrypt.
**Front-end:** HTML, CSS e JavaScript puros (sem framework, sem etapa de
build) — servidos diretamente pelo próprio FastAPI.
**Testes:** pytest, com banco SQLite isolado em memória (não depende de um
MySQL rodando para os testes passarem).

## Arquitetura e estrutura de pastas

```
integrador/
├── app/
│   ├── main.py            # cria o app, plugs os routers e serve o front-end
│   ├── config.py          # configurações (lidas de variáveis de ambiente)
│   ├── database.py        # conexão com o MySQL (SQLAlchemy)
│   ├── models.py          # tabelas do banco de dados
│   ├── schemas.py         # validação de entrada/saída (Pydantic)
│   ├── crud.py            # regras de acesso e manipulação do banco
│   ├── security.py        # hash de senha (bcrypt) e tokens (JWT)
│   ├── dependencies.py     # proteções de rota (login exigido / só admin)
│   └── routes/            # cada arquivo cuida de um assunto da API
│       ├── auth.py         #   login
│       ├── students.py     #   cadastro, fila, edição e exclusão de alunos
│       ├── users.py        #   gestão de usuários (Painel Admin)
│       ├── history.py      #   histórico de atividades (Painel Admin)
│       └── reminders.py    #   lembretes pessoais
├── static/                # front-end (HTML/CSS/JS), servido pelo FastAPI
├── tests/                 # testes automatizados (pytest)
├── requirements.txt        # dependências de produção
├── requirements-dev.txt    # dependências extras só para desenvolvimento/testes
├── .env.example            # modelo das variáveis de ambiente (copie para .env)
└── iniciar.bat             # atalho para subir o sistema no Windows
```

A API segue uma organização em camadas: as rotas (`routes/`) tratam apenas de
HTTP (receber o pedido, validar, devolver a resposta), a lógica de acesso ao
banco fica isolada em `crud.py`, e a validação de dados fica em `schemas.py` —
nenhuma rota manipula o banco diretamente.

## Como rodar

### 1. Pré-requisitos
- Python 3.10 ou mais recente
- Um servidor MySQL rodando (local ou remoto)

### 2. Instalação
```bash
# Clone o repositório e entre na pasta
git clone <url-do-repositorio>
cd integrador

# Crie e ative um ambiente virtual (recomendado)
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Linux/Mac

# Instale as dependências
pip install -r requirements.txt
```

### 3. Configuração
Copie o `.env.example` para `.env` e ajuste com os dados do seu MySQL:
```bash
cp .env.example .env   # Linux/Mac
copy .env.example .env # Windows
```

### 4. Executar
```bash
python -m uvicorn app.main:app --port 8000
```
Ou, no Windows, dando duplo clique em `iniciar.bat` (fora do VS Code — o
terminal integrado dele tem instabilidades conhecidas para manter o
servidor de pé).

O sistema abre automaticamente em `http://127.0.0.1:8000/`.

**Login padrão na primeira execução:** usuário `admin`, senha `Sesi@2026!`
(recomendado trocar após o primeiro acesso, pelo próprio Painel Admin).

### 5. Rodar os testes automatizados
```bash
pip install -r requirements-dev.txt
pytest
```
Os testes usam um banco SQLite isolado em memória — não é preciso ter o
MySQL rodando para rodá-los, e eles não tocam no banco de dados real.

## Segurança

- Senhas nunca são salvas em texto puro — são protegidas com hash bcrypt.
- Toda rota que lê ou altera dados exige um token JWT válido, verificado
  no servidor (não apenas escondido no front-end).
- Rotas administrativas (gestão de usuários, histórico) exigem
  especificamente o papel de admin, também verificado no servidor.
- Contas criadas antes desta atualização de segurança são migradas
  automaticamente para hash no primeiro login, sem interrupção de acesso.

## Limitações conhecidas / possíveis evoluções futuras

- O front-end ainda está em um único arquivo `script.js`; separá-lo em
  módulos por responsabilidade é uma melhoria de organização planejada.
- Não há migração de esquema de banco automatizada (ex: Alembic) — mudanças
  de coluna em tabelas já existentes exigem ajuste manual.
- O token de login expira em 8 horas (configurável via `JWT_EXPIRE_MINUTES`
  no `.env`), sem um mecanismo de renovação automática.
