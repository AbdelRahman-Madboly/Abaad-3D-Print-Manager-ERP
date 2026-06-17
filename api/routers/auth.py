from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from api import deps

router = APIRouter(tags=["auth"])


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: str
    username: str
    display_name: str
    role: str


class LoginResponse(BaseModel):
    token: str
    user: UserOut


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/auth/login", response_model=LoginResponse)
def login(body: LoginRequest):
    auth = deps.get_auth()
    ok, msg, user = auth.login(body.username, body.password)
    if not ok:
        raise HTTPException(status_code=401, detail=msg)
    token = deps.create_session(user)
    return LoginResponse(
        token=token,
        user=UserOut(
            id=user.id,
            username=user.username,
            display_name=user.display_name or user.username,
            role=user.role,
        ),
    )


@router.get("/auth/me", response_model=UserOut)
def me(current_user=Depends(deps.get_current_user)):
    return UserOut(
        id=current_user.id,
        username=current_user.username,
        display_name=current_user.display_name or current_user.username,
        role=current_user.role,
    )


@router.post("/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        deps.remove_session(token)
    return {"ok": True}
