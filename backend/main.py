from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

from pydantic import BaseModel, EmailStr

from pwdlib import PasswordHash

import jwt

from datetime import datetime, timedelta, timezone

import json
import os

from typing import Optional


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="ITFR Todo API",
    description="Todo and authentication API using JSON storage",
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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# FILE PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

USERS_FILE = os.path.join(
    BASE_DIR,
    "users.json"
)

TODO_FILE = os.path.join(
    BASE_DIR,
    "todo.json"
)


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = "CHANGE_THIS_SECRET_KEY_BEFORE_DEPLOYMENT"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ============================================================
# SECURITY
# ============================================================

password_hash = PasswordHash.recommended()

security = HTTPBearer()


# ============================================================
# INITIALIZE JSON FILES
# ============================================================

def initialize_files():

    if not os.path.exists(USERS_FILE):

        with open(
            USERS_FILE,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                [],
                file,
                indent=4
            )


    if not os.path.exists(TODO_FILE):

        with open(
            TODO_FILE,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                [],
                file,
                indent=4
            )


initialize_files()


# ============================================================
# JSON HELPERS
# ============================================================

def load_json(file_path):

    try:

        with open(
            file_path,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(file)

    except FileNotFoundError:

        return []

    except json.JSONDecodeError:

        return []


def save_json(
    file_path,
    data
):

    with open(
        file_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            indent=4
        )


# ============================================================
# USER HELPERS
# ============================================================

def load_users():

    return load_json(
        USERS_FILE
    )


def save_users(users):

    save_json(
        USERS_FILE,
        users
    )


# ============================================================
# TODO HELPERS
# ============================================================

def load_todos():

    return load_json(
        TODO_FILE
    )


def save_todos(todos):

    save_json(
        TODO_FILE,
        todos
    )


# ============================================================
# PASSWORD FUNCTIONS
# ============================================================

def hash_password(
    password: str
):

    return password_hash.hash(
        password
    )


def verify_password(
    password: str,
    hashed_password: str
):

    return password_hash.verify(
        password,
        hashed_password
    )


# ============================================================
# JWT FUNCTIONS
# ============================================================

def create_access_token(
    user_id: int
):

    expiration = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "exp": expiration,
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return token


def get_current_user(
    credentials: HTTPAuthorizationCredentials
    = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        try:

            user_id = int(user_id)

        except ValueError:

            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Authentication token has expired",
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    users = load_users()

    user = next(
        (
            user
            for user in users
            if user["id"] == user_id
        ),
        None,
    )

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="User no longer exists",
        )

    return user


# ============================================================
# PYDANTIC MODELS
# ============================================================

class UserCreate(BaseModel):

    name: str

    email: EmailStr


class UserUpdate(BaseModel):

    name: str

    email: EmailStr


class SignupRequest(BaseModel):

    name: str

    email: EmailStr

    password: str


class LoginRequest(BaseModel):

    email: EmailStr

    password: str


class TodoCreate(BaseModel):

    title: str

    completed: bool = False


class TodoUpdate(BaseModel):

    title: Optional[str] = None

    completed: Optional[bool] = None


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "ITFR Todo API is running",
        "storage": "JSON",
        "authentication": True,
    }


# ============================================================
# AUTHENTICATION
# ============================================================

# ------------------------------------------------------------
# SIGNUP
# ------------------------------------------------------------

@app.post("/auth/signup")
def signup(
    user_data: SignupRequest
):

    users = load_users()

    email = user_data.email.lower()

    # --------------------------------------------------------
    # Check duplicate email
    # --------------------------------------------------------

    existing_user = next(
        (
            user
            for user in users
            if user["email"].lower() == email
        ),
        None,
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email is already registered",
        )

    # --------------------------------------------------------
    # Generate ID
    # --------------------------------------------------------

    if users:

        new_id = max(
            user["id"]
            for user in users
        ) + 1

    else:

        new_id = 1

    # --------------------------------------------------------
    # Create user
    # --------------------------------------------------------

    new_user = {
        "id": new_id,
        "name": user_data.name,
        "email": email,
        "password_hash": hash_password(
            user_data.password
        ),
    }

    users.append(
        new_user
    )

    save_users(
        users
    )

    # --------------------------------------------------------
    # Never return password hash
    # --------------------------------------------------------

    return {
        "message": "User created successfully",
        "user": {
            "id": new_user["id"],
            "name": new_user["name"],
            "email": new_user["email"],
        },
    }


# ------------------------------------------------------------
# LOGIN
# ------------------------------------------------------------

@app.post("/auth/login")
def login(
    login_data: LoginRequest
):

    users = load_users()

    email = login_data.email.lower()

    user = next(
        (
            user
            for user in users
            if user["email"].lower() == email
        ),
        None,
    )

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        login_data.password,
        user["password_hash"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token(
        user["id"]
    )

    return {
        "message": "Login successful",

        "access_token": token,

        "token_type": "bearer",

        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        },
    }


# ------------------------------------------------------------
# CURRENT USER
# ------------------------------------------------------------

@app.get("/auth/me")
def get_current_user_info(
    current_user=Depends(
        get_current_user
    )
):

    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
    }


# ============================================================
# USER CRUD
# ============================================================
#
# These endpoints preserve the API your current Next.js
# User Management page already uses.
#
# IMPORTANT:
# These are administrative CRUD endpoints.
# Authentication protection can be added later if desired.
#
# ============================================================


# ------------------------------------------------------------
# GET USERS
# ------------------------------------------------------------

@app.get("/users")
def get_users():

    users = load_users()

    # Never expose password hashes.

    return [
        {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        }
        for user in users
    ]


# ------------------------------------------------------------
# CREATE USER
# ------------------------------------------------------------

@app.post("/users")
def create_user(
    user_data: UserCreate
):

    users = load_users()

    email = user_data.email.lower()

    existing_user = next(
        (
            user
            for user in users
            if user["email"].lower() == email
        ),
        None,
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email is already registered",
        )

    if users:

        new_id = max(
            user["id"]
            for user in users
        ) + 1

    else:

        new_id = 1

    # --------------------------------------------------------
    # IMPORTANT
    #
    # Users created through /users do not have a password.
    #
    # For authentication accounts use:
    #
    # POST /auth/signup
    #
    # --------------------------------------------------------

    new_user = {
        "id": new_id,
        "name": user_data.name,
        "email": email,
        "password_hash": None,
    }

    users.append(
        new_user
    )

    save_users(
        users
    )

    return {
        "id": new_user["id"],
        "name": new_user["name"],
        "email": new_user["email"],
    }


# ------------------------------------------------------------
# UPDATE USER
# ------------------------------------------------------------

@app.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdate
):

    users = load_users()

    user = next(
        (
            user
            for user in users
            if user["id"] == user_id
        ),
        None,
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Check duplicate email.

    email = user_data.email.lower()

    duplicate = next(
        (
            other
            for other in users
            if other["id"] != user_id
            and other["email"].lower() == email
        ),
        None,
    )

    if duplicate:

        raise HTTPException(
            status_code=400,
            detail="Email is already registered",
        )

    user["name"] = user_data.name
    user["email"] = email

    save_users(
        users
    )

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
    }


# ------------------------------------------------------------
# DELETE USER
# ------------------------------------------------------------

@app.delete("/users/{user_id}")
def delete_user(
    user_id: int
):

    users = load_users()

    user = next(
        (
            user
            for user in users
            if user["id"] == user_id
        ),
        None,
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    users.remove(
        user
    )

    save_users(
        users
    )

    # --------------------------------------------------------
    # Also delete this user's Todos.
    # --------------------------------------------------------

    todos = load_todos()

    todos = [
        todo
        for todo in todos
        if todo.get("user_id") != user_id
    ]

    save_todos(
        todos
    )

    return {
        "message": "User deleted successfully",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        },
    }


# ============================================================
# TODO CRUD
# ============================================================

# ------------------------------------------------------------
# GET TODOS
# ------------------------------------------------------------

@app.get("/todos")
def get_todos(
    current_user=Depends(
        get_current_user
    )
):

    todos = load_todos()

    user_todos = [
        todo
        for todo in todos
        if todo.get("user_id")
        == current_user["id"]
    ]

    return user_todos


# ------------------------------------------------------------
# CREATE TODO
# ------------------------------------------------------------

@app.post("/todos")
def create_todo(
    todo_data: TodoCreate,
    current_user=Depends(
        get_current_user
    )
):

    todos = load_todos()

    if todos:

        new_id = max(
            todo["id"]
            for todo in todos
        ) + 1

    else:

        new_id = 1

    new_todo = {
        "id": new_id,
        "user_id": current_user["id"],
        "title": todo_data.title,
        "completed": todo_data.completed,
    }

    todos.append(
        new_todo
    )

    save_todos(
        todos
    )

    return new_todo


# ------------------------------------------------------------
# UPDATE TODO
# ------------------------------------------------------------

@app.put("/todos/{todo_id}")
def update_todo(
    todo_id: int,
    todo_data: TodoUpdate,
    current_user=Depends(
        get_current_user
    )
):

    todos = load_todos()

    todo = next(
        (
            todo
            for todo in todos
            if todo["id"] == todo_id
            and todo.get("user_id")
            == current_user["id"]
        ),
        None,
    )

    if todo is None:

        raise HTTPException(
            status_code=404,
            detail="Todo not found",
        )

    if todo_data.title is not None:

        todo["title"] = todo_data.title

    if todo_data.completed is not None:

        todo["completed"] = todo_data.completed

    save_todos(
        todos
    )

    return todo


# ------------------------------------------------------------
# DELETE TODO
# ------------------------------------------------------------

@app.delete("/todos/{todo_id}")
def delete_todo(
    todo_id: int,
    current_user=Depends(
        get_current_user
    )
):

    todos = load_todos()

    todo = next(
        (
            todo
            for todo in todos
            if todo["id"] == todo_id
            and todo.get("user_id")
            == current_user["id"]
        ),
        None,
    )

    if todo is None:

        raise HTTPException(
            status_code=404,
            detail="Todo not found",
        )

    todos.remove(
        todo
    )

    save_todos(
        todos
    )

    return {
        "message": "Todo deleted successfully",
        "todo": todo,
    }