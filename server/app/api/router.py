from fastapi import APIRouter

from app.api.dashboard.admin import announcements as admin_announcements
from app.api.dashboard.admin import home as admin_home
from app.api.dashboard.admin import logs as admin_logs
from app.api.dashboard.admin import prompt as admin_prompt
from app.api.dashboard.admin import users as admin_users
from app.api.dashboard.user import quizzes as user_quizzes
from app.api.public import auth

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(user_quizzes.router, prefix="/quizzes", tags=["quizzes"])
router.include_router(admin_home.router, prefix="/admin", tags=["admin"])
router.include_router(admin_users.router, prefix="/admin/users", tags=["admin"])
router.include_router(admin_logs.router, prefix="/admin/logs", tags=["admin"])
router.include_router(admin_prompt.router, prefix="/admin/prompt", tags=["admin"])
router.include_router(admin_announcements.router, prefix="/admin/announcements", tags=["admin"])