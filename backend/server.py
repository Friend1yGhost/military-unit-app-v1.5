from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY", "military-secret-key-change-in-production")
ALGORITHM = "HS256"
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str = "user"  # "user" or "admin"
    verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class News(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    image_url: Optional[str] = None
    author_id: str
    author_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NewsCreate(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None

class DutyRoster(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    duty_type: str  # "guard", "patrol", "kitchen", etc.
    position: str
    shift_start: datetime
    shift_end: datetime
    rotation_cycle: str  # "daily", "weekly", "monthly"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DutyRosterCreate(BaseModel):
    user_id: str
    duty_type: str
    position: str
    shift_start: str  # ISO format
    shift_end: str  # ISO format
    rotation_cycle: str
    notes: Optional[str] = None

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "military_unit_settings"
    unit_name: str = "Военная Часть"
    unit_icon: str = "https://cdn-icons-png.flaticon.com/512/2913/2913133.png"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SettingsUpdate(BaseModel):
    unit_name: Optional[str] = None
    unit_icon: Optional[str] = None

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Seed admin user and default settings
@app.on_event("startup")
async def seed_admin():
    admin_email = "sheremet.b.s@gmail.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    
    if not existing_admin:
        admin_user = User(
            email=admin_email,
            full_name="Администратор",
            role="admin",
            verified=True
        )
        admin_doc = admin_user.model_dump()
        admin_doc['created_at'] = admin_doc['created_at'].isoformat()
        admin_doc['password'] = get_password_hash("8662196415q")
        
        await db.users.insert_one(admin_doc)
        logger.info(f"Admin user created: {admin_email}")
    
    # Seed default settings
    existing_settings = await db.settings.find_one({"id": "military_unit_settings"})
    if not existing_settings:
        default_settings = Settings()
        settings_doc = default_settings.model_dump()
        settings_doc['updated_at'] = settings_doc['updated_at'].isoformat()
        await db.settings.insert_one(settings_doc)
        logger.info("Default settings created")

# Auth Routes
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role="user",
        verified=True  # Auto-verify for now
    )
    
    user_doc = user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    user_doc['password'] = get_password_hash(user_data.password)
    
    await db.users.insert_one(user_doc)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": credentials.email})
    
    # Convert to User model
    user_doc.pop('password')
    user_doc.pop('_id')
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# News Routes
@api_router.get("/news", response_model=List[News])
async def get_news():
    news_list = await db.news.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for news in news_list:
        if isinstance(news['created_at'], str):
            news['created_at'] = datetime.fromisoformat(news['created_at'])
    
    return news_list

@api_router.post("/news", response_model=News)
async def create_news(news_data: NewsCreate, current_user: User = Depends(get_admin_user)):
    news = News(
        title=news_data.title,
        content=news_data.content,
        image_url=news_data.image_url,
        author_id=current_user.id,
        author_name=current_user.full_name
    )
    
    news_doc = news.model_dump()
    news_doc['created_at'] = news_doc['created_at'].isoformat()
    
    await db.news.insert_one(news_doc)
    return news

@api_router.put("/news/{news_id}", response_model=News)
async def update_news(news_id: str, news_data: NewsUpdate, current_user: User = Depends(get_admin_user)):
    existing_news = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not existing_news:
        raise HTTPException(status_code=404, detail="News not found")
    
    update_data = {k: v for k, v in news_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.news.update_one({"id": news_id}, {"$set": update_data})
    
    updated_news = await db.news.find_one({"id": news_id}, {"_id": 0})
    if isinstance(updated_news['created_at'], str):
        updated_news['created_at'] = datetime.fromisoformat(updated_news['created_at'])
    
    return News(**updated_news)

@api_router.delete("/news/{news_id}")
async def delete_news(news_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"message": "News deleted successfully"}

# Duty Roster Routes
@api_router.get("/duties", response_model=List[DutyRoster])
async def get_all_duties(current_user: User = Depends(get_current_user)):
    duties = await db.duties.find({}, {"_id": 0}).sort("shift_start", 1).to_list(1000)
    
    for duty in duties:
        if isinstance(duty['created_at'], str):
            duty['created_at'] = datetime.fromisoformat(duty['created_at'])
        if isinstance(duty['shift_start'], str):
            duty['shift_start'] = datetime.fromisoformat(duty['shift_start'])
        if isinstance(duty['shift_end'], str):
            duty['shift_end'] = datetime.fromisoformat(duty['shift_end'])
    
    return duties

@api_router.get("/duties/my", response_model=List[DutyRoster])
async def get_my_duties(current_user: User = Depends(get_current_user)):
    duties = await db.duties.find({"user_id": current_user.id}, {"_id": 0}).sort("shift_start", 1).to_list(1000)
    
    for duty in duties:
        if isinstance(duty['created_at'], str):
            duty['created_at'] = datetime.fromisoformat(duty['created_at'])
        if isinstance(duty['shift_start'], str):
            duty['shift_start'] = datetime.fromisoformat(duty['shift_start'])
        if isinstance(duty['shift_end'], str):
            duty['shift_end'] = datetime.fromisoformat(duty['shift_end'])
    
    return duties

@api_router.post("/duties", response_model=DutyRoster)
async def create_duty(duty_data: DutyRosterCreate, current_user: User = Depends(get_admin_user)):
    # Get user info
    user_doc = await db.users.find_one({"id": duty_data.user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    duty = DutyRoster(
        user_id=duty_data.user_id,
        user_name=user_doc['full_name'],
        duty_type=duty_data.duty_type,
        position=duty_data.position,
        shift_start=datetime.fromisoformat(duty_data.shift_start),
        shift_end=datetime.fromisoformat(duty_data.shift_end),
        rotation_cycle=duty_data.rotation_cycle,
        notes=duty_data.notes
    )
    
    duty_doc = duty.model_dump()
    duty_doc['created_at'] = duty_doc['created_at'].isoformat()
    duty_doc['shift_start'] = duty_doc['shift_start'].isoformat()
    duty_doc['shift_end'] = duty_doc['shift_end'].isoformat()
    
    await db.duties.insert_one(duty_doc)
    return duty

@api_router.delete("/duties/{duty_id}")
async def delete_duty(duty_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.duties.delete_one({"id": duty_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Duty not found")
    return {"message": "Duty deleted successfully"}

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return users

# Settings Routes
@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings_doc = await db.settings.find_one({"id": "military_unit_settings"}, {"_id": 0})
    
    if not settings_doc:
        # Return default settings if none exist
        default_settings = Settings()
        return default_settings
    
    if isinstance(settings_doc.get('updated_at'), str):
        settings_doc['updated_at'] = datetime.fromisoformat(settings_doc['updated_at'])
    
    return Settings(**settings_doc)

@api_router.put("/settings", response_model=Settings)
async def update_settings(settings_data: SettingsUpdate, current_user: User = Depends(get_admin_user)):
    update_data = {k: v for k, v in settings_data.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.settings.update_one(
        {"id": "military_unit_settings"},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        # Create if doesn't exist
        default_settings = Settings(**update_data)
        settings_doc = default_settings.model_dump()
        settings_doc['updated_at'] = settings_doc['updated_at'].isoformat()
        await db.settings.insert_one(settings_doc)
    
    updated_settings = await db.settings.find_one({"id": "military_unit_settings"}, {"_id": 0})
    
    if isinstance(updated_settings['updated_at'], str):
        updated_settings['updated_at'] = datetime.fromisoformat(updated_settings['updated_at'])
    
    return Settings(**updated_settings)

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()