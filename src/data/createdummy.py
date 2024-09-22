import json
import random

# 기존 train_metadata.json 파일 읽기
with open('train_metadata.json', 'r') as f:
    original_data = json.load(f)['metadata']

# 새로운 데이터 딕셔너리 생성
new_data = {}

# 각 키에 대해 [x, y] 좌표 생성
for key, file_size in original_data.items():
    # x 좌표는 기존 파일 크기 사용
    x = random.random()
    # y 좌표는 0에서 1 사이의 임의의 값 생성
    y = random.random()
    
    # 새로운 데이터에 [x, y] 형식으로 저장
    new_data[key] = [x, y]

# 새로운 JSON 파일로 저장
with open('scatter_data_random.json', 'w') as f:
    json.dump({"metadata": new_data}, f)

print("Scatter plot data has been generated and saved to 'scatter_data.json'")