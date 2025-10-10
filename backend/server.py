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
    rank: Optional[str] = None  # військове звання
    role: str = "user"  # "user" or "admin"
    verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    rank: Optional[str] = None

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
    is_external: bool = False
    external_url: Optional[str] = None
    source: Optional[str] = None
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
    unit_subtitle: str = "Информационная Система"
    unit_icon: str = "https://cdn-icons-png.flaticon.com/512/2913/2913133.png"
    news_title: str = "Новости Части"
    news_subtitle: str = "Актуальная информация и объявления военной части"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SettingsUpdate(BaseModel):
    unit_name: Optional[str] = None
    unit_subtitle: Optional[str] = None
    unit_icon: Optional[str] = None
    news_title: Optional[str] = None
    news_subtitle: Optional[str] = None

class Group(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    member_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    member_ids: Optional[List[str]] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    rank: Optional[str] = None
    role: Optional[str] = None

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
        rank=user_data.rank,
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

@api_router.put("/auth/profile", response_model=User)
async def update_profile(user_data: UserUpdate, current_user: User = Depends(get_current_user)):
    update_data = {}
    
    if user_data.full_name:
        update_data['full_name'] = user_data.full_name
    if user_data.rank is not None:
        update_data['rank'] = user_data.rank
    if user_data.email:
        # Check if email already exists
        existing = await db.users.find_one({"email": user_data.email, "id": {"$ne": current_user.id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data['email'] = user_data.email
    if user_data.password:
        update_data['password'] = get_password_hash(user_data.password)
    
    if update_data:
        await db.users.update_one({"id": current_user.id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password": 0})
    if isinstance(updated_user['created_at'], str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    
    return User(**updated_user)

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

@api_router.put("/duties/{duty_id}", response_model=DutyRoster)
async def update_duty(duty_id: str, duty_data: DutyRosterCreate, current_user: User = Depends(get_admin_user)):
    existing_duty = await db.duties.find_one({"id": duty_id}, {"_id": 0})
    if not existing_duty:
        raise HTTPException(status_code=404, detail="Duty not found")
    
    # Get user info
    user_doc = await db.users.find_one({"id": duty_data.user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {
        "user_id": duty_data.user_id,
        "user_name": user_doc['full_name'],
        "duty_type": duty_data.duty_type,
        "position": duty_data.position,
        "shift_start": datetime.fromisoformat(duty_data.shift_start).isoformat(),
        "shift_end": datetime.fromisoformat(duty_data.shift_end).isoformat(),
        "rotation_cycle": duty_data.rotation_cycle,
        "notes": duty_data.notes
    }
    
    await db.duties.update_one({"id": duty_id}, {"$set": update_data})
    
    updated_duty = await db.duties.find_one({"id": duty_id}, {"_id": 0})
    if isinstance(updated_duty['created_at'], str):
        updated_duty['created_at'] = datetime.fromisoformat(updated_duty['created_at'])
    if isinstance(updated_duty['shift_start'], str):
        updated_duty['shift_start'] = datetime.fromisoformat(updated_duty['shift_start'])
    if isinstance(updated_duty['shift_end'], str):
        updated_duty['shift_end'] = datetime.fromisoformat(updated_duty['shift_end'])
    
    return DutyRoster(**updated_duty)

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

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate, current_user: User = Depends(get_admin_user)):
    existing_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {}
    if user_data.full_name:
        update_data['full_name'] = user_data.full_name
    if user_data.email:
        other_user = await db.users.find_one({"email": user_data.email, "id": {"$ne": user_id}})
        if other_user:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data['email'] = user_data.email
    if user_data.password:
        update_data['password'] = get_password_hash(user_data.password)
    if user_data.role:
        update_data['role'] = user_data.role
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if isinstance(updated_user['created_at'], str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    
    return User(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# Groups Routes
@api_router.get("/groups", response_model=List[Group])
async def get_groups(current_user: User = Depends(get_current_user)):
    groups = await db.groups.find({}, {"_id": 0}).to_list(1000)
    
    for group in groups:
        if isinstance(group['created_at'], str):
            group['created_at'] = datetime.fromisoformat(group['created_at'])
    
    return groups

@api_router.post("/groups", response_model=Group)
async def create_group(group_data: GroupCreate, current_user: User = Depends(get_admin_user)):
    group = Group(
        name=group_data.name,
        description=group_data.description,
        member_ids=[]
    )
    
    group_doc = group.model_dump()
    group_doc['created_at'] = group_doc['created_at'].isoformat()
    
    await db.groups.insert_one(group_doc)
    return group

@api_router.put("/groups/{group_id}", response_model=Group)
async def update_group(group_id: str, group_data: GroupUpdate, current_user: User = Depends(get_admin_user)):
    existing_group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not existing_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    update_data = {k: v for k, v in group_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.groups.update_one({"id": group_id}, {"$set": update_data})
    
    updated_group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if isinstance(updated_group['created_at'], str):
        updated_group['created_at'] = datetime.fromisoformat(updated_group['created_at'])
    
    return Group(**updated_group)

@api_router.delete("/groups/{group_id}")
async def delete_group(group_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.groups.delete_one({"id": group_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"message": "Group deleted successfully"}

@api_router.get("/groups/my", response_model=List[Group])
async def get_my_groups(current_user: User = Depends(get_current_user)):
    groups = await db.groups.find({"member_ids": current_user.id}, {"_id": 0}).to_list(1000)
    
    for group in groups:
        if isinstance(group['created_at'], str):
            group['created_at'] = datetime.fromisoformat(group['created_at'])
    
    return groups

@api_router.get("/groups/{group_id}/members", response_model=List[User])
async def get_group_members(group_id: str, current_user: User = Depends(get_current_user)):
    """Get all members of a specific group"""
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if current user is a member of this group
    if current_user.id not in group.get('member_ids', []) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all members
    members = []
    for member_id in group.get('member_ids', []):
        user_doc = await db.users.find_one({"id": member_id}, {"_id": 0, "password": 0})
        if user_doc:
            if isinstance(user_doc['created_at'], str):
                user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
            members.append(User(**user_doc))
    
    return members

# External News Integration
import feedparser
from bs4 import BeautifulSoup

import httpx

async def fetch_image_from_page(url: str) -> str:
    """Fetch post-thumbnail image from news page"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find post-thumbnail image
            thumbnail = soup.find('img', class_='post-thumbnail')
            if thumbnail and thumbnail.get('src'):
                return thumbnail['src']
            
            # Fallback: find any large image
            og_image = soup.find('meta', property='og:image')
            if og_image and og_image.get('content'):
                return og_image['content']
                
        return None
    except Exception as e:
        logger.error(f"Error fetching image from {url}: {e}")
        return None

async def fetch_armyinform_news():
    """Fetch news from ArmyInform RSS feed"""
    try:
        feed_url = "https://armyinform.com.ua/category/news/feed/"
        feed = feedparser.parse(feed_url)
        
        news_items = []
        for entry in feed.entries[:10]:  # Get latest 10 news
            # Check if news already exists
            existing = await db.news.find_one({"external_url": entry.link})
            if existing:
                continue
            
            # Extract clean summary (first 200 chars)
            summary = entry.summary if hasattr(entry, 'summary') else entry.title
            soup = BeautifulSoup(summary, 'html.parser')
            clean_summary = soup.get_text()[:200] + "..."
            
            # Fetch image from actual page with post-thumbnail class
            image_url = await fetch_image_from_page(entry.link)
            
            news = News(
                title=entry.title,
                content=clean_summary,
                image_url=image_url,
                author_id="armyinform",
                author_name="ArmyInform",
                is_external=True,
                external_url=entry.link,
                source="armyinform.com.ua",
                created_at=datetime.now(timezone.utc)
            )
            
            news_doc = news.model_dump()
            news_doc['created_at'] = news_doc['created_at'].isoformat()
            
            await db.news.insert_one(news_doc)
            news_items.append(news)
        
        return news_items
    except Exception as e:
        logger.error(f"Error fetching ArmyInform news: {e}")
        return []

@api_router.post("/news/sync-armyinform")
async def sync_armyinform_news(current_user: User = Depends(get_admin_user)):
    """Manually sync news from ArmyInform"""
    news_items = await fetch_armyinform_news()
    return {
        "message": f"Синхронізовано {len(news_items)} новин",
        "count": len(news_items)
    }

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