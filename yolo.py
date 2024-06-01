import torch
import numpy as np
import cv2
import os
import json  # JSON 사용을 위한 임포트

# YOLOv5 모델 로드
model = torch.hub.load('ultralytics/yolov5', 'yolov5n', pretrained=True)

def load_and_detect(image_path):
    # 이미지 로드
    img = cv2.imread(image_path)
    if img is None:
        print(f"이미지 파일을 읽을 수 없습니다: {image_path}")
        return

    # 이미지를 모델에 입력하고 결과를 얻음
    results = model(img, size=640)
    detections = []  # 감지 결과를 저장할 리스트

    # results.xyxy[0]에는 [x1, y1, x2, y2, confidence, class] 정보가 포함됨
    for *xyxy, conf, cls in results.xyxy[0]:
        label = model.names[int(cls)]  # 클래스 이름
        xyxy = [int(i) for i in xyxy]  # 좌표를 정수로 변환
        obj_width = xyxy[2] - xyxy[0]  # 객체 너비
        obj_height = xyxy[3] - xyxy[1]  # 객체 높이

        # 객체 크기에 따라 폰트 크기와 두께 동적 조정
        font_scale = 0.4 + (obj_width * obj_height) / (img.shape[1] * img.shape[0]) * 2
        thickness = max(1, int(font_scale * 1.5))
        cv2.rectangle(img, (xyxy[0], xyxy[1]), (xyxy[2], xyxy[3]), (0, 255, 0), thickness)
        cv2.putText(img, f'{label} {conf:.2f}', (xyxy[0], max(xyxy[1] - 10, 0)), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 0), thickness)

        # 감지 결과를 리스트에 추가
        detections.append({"label": label, "confidence": f"{conf:.2f}", "bbox": xyxy})

    # 결과 이미지 저장
    save_path = image_path.replace("uploads", "detected")
    cv2.imwrite(save_path, img)
    print(f"Saved detected image to {save_path}")

    # 감지된 객체 정보를 JSON 파일로 저장
    json_save_path = image_path.replace("uploads", "detected").replace(".png", ".json").replace(".jpg", ".json")
    with open(json_save_path, 'w') as f:
        json.dump(detections, f, indent=4)
    print(f"Saved detection results to {json_save_path}")

image_paths = ["uploads/e_image.png", "uploads/enhanced_image.png"]
for image_path in image_paths:
    load_and_detect(image_path)
