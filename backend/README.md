# FastAPI Backend for Internal CRM Dashboard

This is the backend API server built with FastAPI for the Internal CRM Dashboard.

## Features

- **Student Management**: CRUD operations, search, analytics, bulk import/export
- **Email Integration**: Send emails to students via Resend API
- **Authentication**: JWT-based authentication (integrated with Firebase Auth)
- **Database**: Firestore integration with optional PostgreSQL support
- **Caching**: Redis integration for improved performance

## Project Structure

```
backend/
├── app/
│   ├── api/                 # API endpoints
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── students.py     # Student management endpoints
│   │   └── email.py        # Email sending endpoints
│   ├── core/               # Core configuration
│   │   ├── config.py       # Settings and configuration
│   │   ├── database.py     # Database connections
│   │   └── auth.py         # Authentication utilities
│   ├── models/             # Pydantic models
│   │   ├── student.py      # Student data models
│   │   └── email.py        # Email data models
│   └── services/           # Business logic
│       ├── student_service.py  # Student operations
│       └── email_service.py    # Email operations
├── main.py                 # FastAPI application entry point
├── start.py                # Startup script
├── requirements.txt        # Python dependencies
└── env.example            # Environment variables template
```

## Setup

1. **Install Python 3.13** (latest version)

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp env.example .env
   # Edit .env with your actual configuration values
   ```

5. **Run the server**:
   ```bash
   python start.py
   ```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- **Interactive API docs**: `http://localhost:8000/docs`
- **ReDoc documentation**: `http://localhost:8000/redoc`

## Environment Variables

Copy `env.example` to `.env` and configure:

- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Firebase service account private key
- `FIREBASE_CLIENT_EMAIL`: Firebase service account email
- `RESEND_API_KEY`: Resend API key for email sending
- `SECRET_KEY`: JWT secret key (change in production)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get token
- `POST /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout

### Students
- `GET /api/students/` - Get all students (with filters)
- `GET /api/students/{id}` - Get specific student
- `POST /api/students/` - Create new student
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student
- `POST /api/students/search` - Search students
- `POST /api/students/bulk/import` - Bulk import students
- `POST /api/students/bulk/export` - Export students
- `POST /api/students/analytics` - Get analytics
- `POST /api/students/register` - Public student registration
- `POST /api/students/validate` - Validate student data

### Email
- `POST /api/email/send` - Send email to student
- `POST /api/email/test` - Test email functionality

## Development

To run in development mode with auto-reload:
```bash
python start.py
```

The server will automatically reload when you make changes to the code.

## Production Deployment

For production deployment, use a production ASGI server like Gunicorn with Uvicorn workers:

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
