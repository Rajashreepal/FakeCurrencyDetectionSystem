# CurrencyGuard AI - Fake Currency Detection System

A comprehensive AI-powered system for detecting counterfeit currency using deep learning and computer vision techniques.

## 🚀 Features

- **Multi-Currency Support**: Supports USD, INR, EUR, GBP, and other currencies
- **AI-Powered Detection**: Uses deep learning models for accurate counterfeit detection
- **Real-time Processing**: Fast image analysis and decision making
- **Risk Assessment**: Provides confidence scores and risk levels
- **Quality Validation**: Checks image quality before processing
- **Fallback Rules**: Rule-based detection for currencies without trained models
- **RESTful API**: Easy integration with web and mobile applications
- **Modern Frontend**: React-based user interface

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **FastAPI Framework**: High-performance async API
- **PyTorch Models**: Deep learning models for currency detection
- **ONNX Runtime**: Optimized model inference
- **Decision Engine**: Multi-factor risk assessment
- **Model Registry**: Centralized model management

### Frontend (React/Vite)
- **React 18**: Modern UI framework
- **Vite**: Fast development and build tool
- **Responsive Design**: Works on desktop and mobile
- **Real-time Results**: Instant feedback on uploads

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Configuration
│   │   ├── services/      # Business logic
│   │   └── main.py        # FastAPI application
│   ├── models/            # Trained ML models
│   │   └── currency/      # Currency-specific models
│   ├── scripts/           # Utility scripts
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── src/               # React source code
│   ├── public/            # Static assets
│   └── package.json       # Node.js dependencies
└── docker-compose.yml     # Container orchestration
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

### Environment Configuration
1. Copy `.env.example` to `.env` in both backend and frontend directories
2. Update configuration values as needed

## 🚀 Running the Application

### Development Mode

**Backend:**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Using Docker
```bash
docker-compose up --build
```

## 📊 Model Information

### Supported Currencies
- **USD**: Denomination classification model (7 classes)
- **INR**: Image authenticity model
- **EUR, GBP, OTHER**: Rule-based fallback detection

### Model Performance
- **USD Model**: 87.15% balanced accuracy
- **Training Data**: 11,005 training samples, 2,747 validation samples
- **Model Format**: PyTorch (.pt) and ONNX (.onnx) for production

## 🔧 API Usage

### Upload Currency Image
```bash
POST /api/v1/detect
Content-Type: multipart/form-data

{
  "file": <image_file>
}
```

### Response Format
```json
{
  "prediction": "authentic|counterfeit|suspicious",
  "confidence": 0.85,
  "risk_level": "low|medium|high",
  "currency": "USD",
  "denomination": "20 Dollar",
  "processing_time": 1.23
}
```

## 🎯 Key Components

### Decision Engine
- Multi-factor risk assessment
- Quality validation (sharpness, brightness, size)
- Model confidence weighting
- Fallback rule integration

### Model Registry
- Centralized model loading and management
- GPU/CPU optimization
- Model versioning and metrics tracking

### Risk Engine
- Configurable risk thresholds
- Quality penalty calculations
- Denomination mismatch detection

## 🔒 Security Features

- Input validation and sanitization
- File type and size restrictions
- CORS protection
- Error handling and logging

## 📈 Performance

- **Processing Time**: < 2 seconds per image
- **Supported Formats**: JPEG, PNG, WebP
- **Max File Size**: 15MB
- **Concurrent Requests**: Async processing support

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

## 📝 Configuration

Key configuration options in `backend/app/core/config.py`:
- `risk_counterfeit_threshold`: 0.68
- `risk_suspicious_threshold`: 0.40
- `quality_fail_threshold`: 0.42
- `max_upload_mb`: 15
- `prefer_gpu`: false (set to true for GPU acceleration)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Rajashree Pal** - Backend Developer & ML Engineer
- **Project Team** - Frontend Development & Testing

## 🙏 Acknowledgments

- Deep learning models trained on currency datasets
- FastAPI and React communities
- PyTorch and ONNX runtime teams

---

**Version**: 5.1.0-decision-engine  
**Last Updated**: May 2026