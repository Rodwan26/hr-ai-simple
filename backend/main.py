from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from app.limiter import limiter
from app.routers import resume

app = FastAPI()

# Add Limiter middleware
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Allow frontend communication
origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# تسجيل الراوتر
app.include_router(resume.router, prefix="/api", tags=["resumes"])

@app.get("/")
def root():
    return {"message": "HR AI Platform API"}