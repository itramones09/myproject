import os
import json
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pwdlib import PasswordHash
from dotenv import load_dotenv
from google import genai


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# ============================================================
# GEMINI CLIENT
# ============================================================

if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY
    )
else:
    gemini_client = None
    print(
        "WARNING: GEMINI_API_KEY was not found in .env"
    )


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI Web Application API",
    description=(
        "FastAPI backend with authentication, "
        "Todo CRUD, Gemini AI and Health Assistant"
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://myproject-rho-liard.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# FILE LOCATIONS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

USERS_FILE = BASE_DIR / "users.json"
TODOS_FILE = BASE_DIR / "todo.json"


# ============================================================
# PASSWORD HASHING
# ============================================================

password_hash = PasswordHash.recommended()


# ============================================================
# REQUEST MODELS
# ============================================================


class SignupRequest(BaseModel):
    username: str
    password: str
    name: Optional[str] = None
    email: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str
    name: Optional[str] = None
    email: Optional[str] = None


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None


class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    completed: bool = False


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None


class AIRequest(BaseModel):
    message: str


class SymptomRequest(BaseModel):
    age: Optional[int] = None
    sex: Optional[str] = None
    symptoms: str
    duration: Optional[str] = None
    severity: Optional[str] = None
    medications: Optional[str] = None


# ============================================================
# JSON FILE INITIALIZATION
# ============================================================


def ensure_json_files():

    if not USERS_FILE.exists():
        USERS_FILE.write_text(
            "[]",
            encoding="utf-8",
        )

    if not TODOS_FILE.exists():
        TODOS_FILE.write_text(
            "[]",
            encoding="utf-8",
        )


ensure_json_files()


# ============================================================
# USER JSON FUNCTIONS
# ============================================================


def load_users():

    ensure_json_files()

    try:

        with open(
            USERS_FILE,
            "r",
            encoding="utf-8",
        ) as file:

            data = json.load(file)

            if isinstance(data, list):
                return data

            return []

    except (
        json.JSONDecodeError,
        FileNotFoundError,
    ):
        return []


def save_users(users):

    with open(
        USERS_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            users,
            file,
            indent=4,
            ensure_ascii=False,
        )


# ============================================================
# TODO JSON FUNCTIONS
# ============================================================


def load_todos():

    ensure_json_files()

    try:

        with open(
            TODOS_FILE,
            "r",
            encoding="utf-8",
        ) as file:

            data = json.load(file)

            if isinstance(data, list):
                return data

            return []

    except (
        json.JSONDecodeError,
        FileNotFoundError,
    ):
        return []


def save_todos(todos):

    with open(
        TODOS_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            todos,
            file,
            indent=4,
            ensure_ascii=False,
        )


# ============================================================
# HELPER FUNCTIONS
# ============================================================


def get_next_user_id(users):

    if not users:
        return 1

    return max(
        int(user.get("id", 0))
        for user in users
    ) + 1


def get_next_todo_id(todos):

    if not todos:
        return 1

    return max(
        int(todo.get("id", 0))
        for todo in todos
    ) + 1


def public_user(user):

    return {
        "id": user.get("id"),
        "username": user.get("username"),
        "name": user.get("name"),
        "email": user.get("email"),
        "created_at": user.get(
            "created_at"
        ),
    }


# ============================================================
# ROOT
# ============================================================


@app.get("/")
def root():

    return {
        "message":
            "FastAPI backend is running.",
        "features": [
            "Authentication",
            "Users",
            "Todo CRUD",
            "Gemini AI",
            "AI Todo Analysis",
            "Health Assistant",
        ],
    }


# ============================================================
# HEALTH CHECK
# ============================================================


@app.get("/health")
def health():

    return {
        "status": "ok",
        "gemini_connected":
            GEMINI_API_KEY is not None,
    }


# ============================================================
# AUTH STATUS
# ============================================================


@app.get("/auth/status")
def auth_status():

    users = load_users()

    return {
        "has_users": len(users) > 0,
        "user_count": len(users),
    }


# ============================================================
# SIGNUP
# ============================================================


@app.post("/auth/signup")
def signup(
    request: SignupRequest,
):

    users = load_users()

    username = request.username.strip()

    if not username:

        raise HTTPException(
            status_code=400,
            detail="Username is required.",
        )

    if not request.password:

        raise HTTPException(
            status_code=400,
            detail="Password is required.",
        )

    for user in users:

        if (
            user.get(
                "username",
                "",
            ).lower()
            == username.lower()
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Username already exists."
                ),
            )

    new_user = {
        "id":
            get_next_user_id(users),

        "username":
            username,

        "password_hash":
            password_hash.hash(
                request.password
            ),

        "name":
            request.name or "",

        "email":
            request.email or "",

        "created_at":
            datetime.now().isoformat(),
    }

    users.append(new_user)

    save_users(users)

    return {
        "message":
            "Account created successfully.",
        "user":
            public_user(new_user),
    }


# ============================================================
# LOGIN
# ============================================================


@app.post("/auth/login")
def login(
    request: LoginRequest,
):

    users = load_users()

    username = request.username.strip()

    user = next(
        (
            user
            for user in users
            if (
                user.get(
                    "username",
                    "",
                ).lower()
                == username.lower()
            )
        ),
        None,
    )

    if not user:

        raise HTTPException(
            status_code=
                status.HTTP_401_UNAUTHORIZED,

            detail=(
                "Invalid username "
                "or password."
            ),
        )

    stored_hash = user.get(
        "password_hash"
    )

    if not stored_hash:

        raise HTTPException(
            status_code=
                status.HTTP_401_UNAUTHORIZED,

            detail=(
                "Invalid username "
                "or password."
            ),
        )

    try:

        valid_password = (
            password_hash.verify(
                request.password,
                stored_hash,
            )
        )

    except Exception:

        valid_password = False

    if not valid_password:

        raise HTTPException(
            status_code=
                status.HTTP_401_UNAUTHORIZED,

            detail=(
                "Invalid username "
                "or password."
            ),
        )

    return {
        "message":
            "Login successful.",

        "user":
            public_user(user),
    }


# ============================================================
# USERS - GET ALL
# ============================================================


@app.get("/users")
def get_users():

    users = load_users()

    return [
        public_user(user)
        for user in users
    ]


# ============================================================
# USERS - GET ONE
# ============================================================


@app.get("/users/{user_id}")
def get_user(
    user_id: int,
):

    users = load_users()

    user = next(
        (
            user
            for user in users
            if int(
                user.get(
                    "id",
                    0,
                )
            ) == user_id
        ),
        None,
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    return public_user(user)


# ============================================================
# USERS - CREATE
# ============================================================


@app.post("/users")
def create_user(
    request: UserCreate,
):

    users = load_users()

    username = request.username.strip()

    if not username:

        raise HTTPException(
            status_code=400,
            detail="Username is required.",
        )

    for user in users:

        if (
            user.get(
                "username",
                "",
            ).lower()
            == username.lower()
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Username already exists."
                ),
            )

    new_user = {
        "id":
            get_next_user_id(users),

        "username":
            username,

        "password_hash":
            password_hash.hash(
                request.password
            ),

        "name":
            request.name or "",

        "email":
            request.email or "",

        "created_at":
            datetime.now().isoformat(),
    }

    users.append(new_user)

    save_users(users)

    return {
        "message":
            "User created successfully.",

        "user":
            public_user(new_user),
    }


# ============================================================
# USERS - UPDATE
# ============================================================


@app.put("/users/{user_id}")
def update_user(
    user_id: int,
    request: UserUpdate,
):

    users = load_users()

    user_index = next(
        (
            index
            for index, user
            in enumerate(users)
            if int(
                user.get(
                    "id",
                    0,
                )
            ) == user_id
        ),
        None,
    )

    if user_index is None:

        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    user = users[user_index]

    if request.username is not None:

        username = (
            request.username.strip()
        )

        for existing in users:

            if (
                int(
                    existing.get(
                        "id",
                        0,
                    )
                )
                != user_id
                and existing.get(
                    "username",
                    "",
                ).lower()
                == username.lower()
            ):

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Username "
                        "already exists."
                    ),
                )

        user["username"] = username

    if request.name is not None:
        user["name"] = request.name

    if request.email is not None:
        user["email"] = request.email

    if request.password:

        user["password_hash"] = (
            password_hash.hash(
                request.password
            )
        )

    users[user_index] = user

    save_users(users)

    return {
        "message":
            "User updated successfully.",

        "user":
            public_user(user),
    }


# ============================================================
# USERS - DELETE
# ============================================================


@app.delete("/users/{user_id}")
def delete_user(
    user_id: int,
):

    users = load_users()

    user_exists = any(
        int(
            user.get(
                "id",
                0,
            )
        ) == user_id
        for user in users
    )

    if not user_exists:

        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    users = [
        user
        for user in users
        if int(
            user.get(
                "id",
                0,
            )
        ) != user_id
    ]

    save_users(users)

    return {
        "message":
            "User deleted successfully."
    }


# ============================================================
# TODOS - GET ALL
# ============================================================


@app.get("/todos")
def get_todos():

    return load_todos()


# ============================================================
# TODOS - GET ONE
# ============================================================


@app.get("/todos/{todo_id}")
def get_todo(
    todo_id: int,
):

    todos = load_todos()

    todo = next(
        (
            todo
            for todo in todos
            if int(
                todo.get(
                    "id",
                    0,
                )
            ) == todo_id
        ),
        None,
    )

    if not todo:

        raise HTTPException(
            status_code=404,
            detail="Todo not found.",
        )

    return todo


# ============================================================
# TODOS - CREATE
# ============================================================


@app.post("/todos")
def create_todo(
    request: TodoCreate,
):

    todos = load_todos()

    title = request.title.strip()

    if not title:

        raise HTTPException(
            status_code=400,
            detail=(
                "Todo title is required."
            ),
        )

    new_todo = {
        "id":
            get_next_todo_id(todos),

        "title":
            title,

        "description":
            request.description or "",

        "completed":
            request.completed,

        "created_at":
            datetime.now().isoformat(),
    }

    todos.append(new_todo)

    save_todos(todos)

    return new_todo


# ============================================================
# TODOS - UPDATE
# ============================================================


@app.put("/todos/{todo_id}")
def update_todo(
    todo_id: int,
    request: TodoUpdate,
):

    todos = load_todos()

    todo_index = next(
        (
            index
            for index, todo
            in enumerate(todos)
            if int(
                todo.get(
                    "id",
                    0,
                )
            ) == todo_id
        ),
        None,
    )

    if todo_index is None:

        raise HTTPException(
            status_code=404,
            detail="Todo not found.",
        )

    todo = todos[todo_index]

    if request.title is not None:

        title = request.title.strip()

        if not title:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Todo title "
                    "cannot be empty."
                ),
            )

        todo["title"] = title

    if request.description is not None:

        todo["description"] = (
            request.description
        )

    if request.completed is not None:

        todo["completed"] = (
            request.completed
        )

    todo["updated_at"] = (
        datetime.now().isoformat()
    )

    todos[todo_index] = todo

    save_todos(todos)

    return todo


# ============================================================
# TODOS - DELETE
# ============================================================


@app.delete("/todos/{todo_id}")
def delete_todo(
    todo_id: int,
):

    todos = load_todos()

    exists = any(
        int(
            todo.get(
                "id",
                0,
            )
        ) == todo_id
        for todo in todos
    )

    if not exists:

        raise HTTPException(
            status_code=404,
            detail="Todo not found.",
        )

    todos = [
        todo
        for todo in todos
        if int(
            todo.get(
                "id",
                0,
            )
        ) != todo_id
    ]

    save_todos(todos)

    return {
        "message":
            "Todo deleted successfully."
    }


# ============================================================
# TODOS - TOGGLE COMPLETE
# ============================================================


@app.patch("/todos/{todo_id}/toggle")
def toggle_todo(
    todo_id: int,
):

    todos = load_todos()

    todo_index = next(
        (
            index
            for index, todo
            in enumerate(todos)
            if int(
                todo.get(
                    "id",
                    0,
                )
            ) == todo_id
        ),
        None,
    )

    if todo_index is None:

        raise HTTPException(
            status_code=404,
            detail="Todo not found.",
        )

    todo = todos[todo_index]

    todo["completed"] = not todo.get(
        "completed",
        False,
    )

    todo["updated_at"] = (
        datetime.now().isoformat()
    )

    todos[todo_index] = todo

    save_todos(todos)

    return todo


# ============================================================
# GEMINI GENERAL AI
# ============================================================


@app.post("/api/ai")
def ask_gemini(
    request: AIRequest,
):

    if gemini_client is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Gemini API key "
                "is not configured."
            ),
        )

    message = request.message.strip()

    if not message:

        raise HTTPException(
            status_code=400,
            detail=(
                "Message cannot be empty."
            ),
        )

    try:

        interaction = (
            gemini_client
            .interactions
            .create(
                model=
                    "gemini-3.8-flash",

                input=message,
            )
        )

        return {
            "response":
                interaction.output_text
        }

    except Exception as error:

        print(
            "Gemini error:",
            str(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Gemini AI is temporarily "
                "unavailable."
            ),
        )


# ============================================================
# GEMINI CONNECTION TEST
# ============================================================


@app.get("/api/ai/test")
def test_gemini():

    if gemini_client is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Gemini API key "
                "is not configured."
            ),
        )

    try:

        interaction = (
            gemini_client
            .interactions
            .create(
                model=
                    "gemini-3.8-flash",

                input=(
                    "Reply only with: "
                    "Gemini is connected successfully."
                ),
            )
        )

        return {
            "status":
                "connected",

            "response":
                interaction.output_text,
        }

    except Exception as error:

        print(
            "Gemini test error:",
            str(error),
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# AI HEALTH SYMPTOM ASSISTANT
# ============================================================


@app.post(
    "/api/health-assistant"
)
def health_assistant(
    request: SymptomRequest,
):

    if gemini_client is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Gemini API is "
                "not configured."
            ),
        )

    symptoms = (
        request.symptoms.strip()
    )

    if not symptoms:

        raise HTTPException(
            status_code=400,
            detail=(
                "Please enter symptoms."
            ),
        )

    patient_age = (
        str(request.age)
        if request.age is not None
        else "Not provided"
    )

    patient_sex = (
        request.sex
        if request.sex
        else "Not provided"
    )

    duration = (
        request.duration
        if request.duration
        else "Not provided"
    )

    severity = (
        request.severity
        if request.severity
        else "Not provided"
    )

    medications = (
        request.medications
        if request.medications
        else "Not provided"
    )

    prompt = f"""
You are a cautious health symptom assessment assistant.

You are NOT a replacement for a doctor or qualified healthcare professional.

Do not state that you have confirmed a diagnosis.

Use the patient's information only to provide general health guidance.

PATIENT INFORMATION

Age:
{patient_age}

Sex:
{patient_sex}

Symptoms:
{symptoms}

Duration:
{duration}

Severity:
{severity}

Current medications:
{medications}


Respond using exactly these sections:


1. SYMPTOM SUMMARY

Briefly summarize the symptoms described.


2. POSSIBLE CAUSES

List reasonable possible explanations.

Clearly say these are possibilities and not a confirmed diagnosis.

Do not exaggerate unlikely conditions.


3. URGENCY

Choose one of these:

SELF CARE / MONITOR

SEE A HEALTHCARE PROVIDER

URGENT MEDICAL CARE

EMERGENCY

Explain briefly why.


4. RECOMMENDED ACTION

Give simple practical next steps.

If appropriate, advise consultation with a healthcare professional.


5. GENERAL SELF-CARE

Provide only safe general self-care advice.

Examples may include:

- rest
- hydration
- monitoring symptoms
- eating appropriately
- avoiding strenuous activity when appropriate

Do not prescribe prescription medication.

Do not tell the patient to stop prescribed medication.

Be cautious about recommending medicines because allergies,
drug interactions, pregnancy, medical conditions and other
factors may not be known.


6. WARNING SIGNS

List symptoms or changes that should prompt urgent
or emergency medical attention.

If symptoms indicate a possible emergency such as:

- severe difficulty breathing
- severe chest pain
- loss of consciousness
- stroke-like symptoms
- severe bleeding
- severe allergic reaction
- severe confusion

make the emergency recommendation prominent.


7. IMPORTANT NOTE

State clearly that this AI assessment cannot confirm a diagnosis
and does not replace evaluation by a qualified healthcare
professional.
"""

    try:

        interaction = (
            gemini_client
            .interactions
            .create(
                model=
                    "gemini-3.8-flash",

                input=prompt,
            )
        )

        return {
            "response":
                interaction.output_text
        }

    except Exception as error:

        print(
            "Health Assistant error:",
            str(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "The AI Health Assistant "
                "is temporarily unavailable."
            ),
        )
