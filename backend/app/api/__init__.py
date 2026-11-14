from fastapi import APIRouter

from app.api import agent, analysis, cases, documents, health, inputs

api_router = APIRouter(prefix="/api")
for _module in (health, cases, inputs, analysis, agent, documents):
    api_router.include_router(_module.router)

__all__ = ["api_router"]
