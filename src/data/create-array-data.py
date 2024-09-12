import json
import random

# 기존 JSON 파일을 읽습니다.
with open('train_label_metadata.json', 'r') as json_file:
    original_data = json.load(json_file)

# 새로운 JSON 데이터 생성
new_data = {"metadata": {}}

for key in original_data["metadata"].keys():
    # 0개에서 3개까지의 랜덤한 길이의 배열 생성
    array_length = random.randint(0, 3)
    new_data["metadata"][key] = [random.randint(0, 9) for _ in range(array_length)]

# JSON 파일로 저장
with open('new_train_label_metadata.json', 'w') as json_file:
    json.dump(new_data, json_file, indent=4)

print("새로운 JSON 파일이 생성되었습니다: src/data/new_train_label_metadata.json")