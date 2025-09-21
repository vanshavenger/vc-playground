from ultralytics import YOLO

model = YOLO("yolo11n.pt")
results = model.predict(
    source="image.png", imgsz=640, conf=0.25
)

for r in results:
    r.save(filename="inference.jpg")
