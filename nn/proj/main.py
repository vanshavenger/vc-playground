from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import numpy as np
from PIL import Image
from io import BytesIO
import tf_keras

MODEL = tf_keras.models.load_model("models/model_v3")
CLASS_NAMES = ["Early Blight", "Late Blight", "Healthy"]

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    message: str


class HealthResponse(BaseModel):
    status: str
    message: str


app = FastAPI(
    title="🧠 Neural Network Prediction API",
    description="""
    ## Neural Network Prediction API
    
    A production-ready FastAPI application for image classification using neural networks.
    
    ### Features:
    * 🔒 **Enterprise Security**: Complete protection with security headers
    * 🌐 **CORS Enabled**: Cross-origin resource sharing support
    * 📁 **File Upload**: Image prediction via file upload
    * 📚 **Auto Documentation**: Interactive API docs
    * 🚀 **Production Ready**: Optimized for deployment
    
    ### Endpoints:
    * `GET /` - Welcome message
    * `POST /predict` - Upload image for prediction
    * `GET /health` - Health check endpoint
    """,
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
    return response


@app.get(
    "/",
    summary="Welcome Endpoint",
    description="Returns a welcome message with API information",
)
async def read_root():
    """Welcome endpoint with basic API information."""
    return {
        "message": "Welcome to Neural Network Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "active",
    }
    

def read_file_as_image(data) -> np.ndarray:
    image= np.array(Image.open(BytesIO(data)))
    return image

@app.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict Image",
    description="Upload an image file to get neural network prediction",
)
async def predict(
    file: UploadFile = File(..., description="Image file to predict (JPEG, PNG)"),
) -> PredictionResponse:
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    image = read_file_as_image(await file.read())
    
    img_batch = np.expand_dims(image, axis=0)

    predictions = MODEL.predict(img_batch)

    predicted_class = np.argmax(predictions[0])
    confidence = np.max(predictions[0])

    return PredictionResponse(
        prediction=CLASS_NAMES[predicted_class],
        confidence=confidence,
        message="Prediction completed successfully",
    )


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Check if the API is running properly",
)
async def health_check():
    """Health check endpoint for monitoring."""
    return HealthResponse(status="healthy", message="API is running properly")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
