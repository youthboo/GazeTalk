from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
from pythainlp import word_tokenize
from collections import defaultdict
from typing import List, Dict, Tuple
from pathlib import Path

app = Flask(__name__)
CORS(app)

class ThaiPredictiveText:
    def __init__(self):
        self.word_transitions: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.word_frequencies: Dict[str, int] = defaultdict(int)
        self.total_words = 0

    def preprocess_text(self, text: str) -> List[str]:
        """ตัดคำภาษาไทยและทำความสะอาดข้อมูลเพิ่มเติม"""
        text = text.lower()
        text = re.sub(r"[0-9]", "", text)  # ลบตัวเลข
        text = re.sub(r"[^\w\s]", "", text)  # ลบสัญลักษณ์พิเศษ
        words = word_tokenize(text, engine="newmm")
        words = [w for w in words if w.strip() and not w.isspace()]
        return words

    def train(self, texts: List[str]) -> None:
        """เทรนโมเดลด้วยข้อความภาษาไทย"""
        for text in texts:
            words = self.preprocess_text(text)
            for word in words:
                self.word_frequencies[word] += 1
                self.total_words += 1

    def predict_words_by_prefix(self, prefix: str, n_suggestions: int = 3) -> List[Tuple[str, float]]:
        """ทำนายคำที่เริ่มต้นด้วย prefix หรือคำที่เกี่ยวข้องกับ prefix"""
        prefix = prefix.lower().strip()
        if not prefix:
            return []

        # ค้นหาคำที่เริ่มต้นด้วย prefix
        candidates = {word: count for word, count in self.word_frequencies.items() if word.startswith(prefix)}

        # หากไม่มีคำที่เริ่มต้นด้วย prefix ลองค้นหาคำที่มี prefix เป็นส่วนหนึ่ง
        if not candidates:
            candidates = {word: count for word, count in self.word_frequencies.items() if prefix in word}

        if not candidates:
            return []

        total_candidates = sum(candidates.values())
        predictions = [(word, count / total_candidates) for word, count in candidates.items()]
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:n_suggestions]

# โหลดโมเดลจากไฟล์ JSON
def load_model_from_json(file_path: str) -> ThaiPredictiveText:
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            data = json.load(file)
        loaded_model = ThaiPredictiveText()

        loaded_model.word_transitions = {k: defaultdict(int, v) for k, v in data.get("word_transitions", {}).items()}

        loaded_model.word_frequencies = defaultdict(int, data.get("word_frequencies", {}))

        loaded_model.total_words = sum(loaded_model.word_frequencies.values())
        return loaded_model
    except Exception as e:
        print(f"Error loading model from JSON: {e}")
        raise

# โหลดโมเดลเมื่อเริ่มต้น
current_dir = Path(__file__).resolve().parent
model_path = current_dir / "model_med_pack.json"

model = load_model_from_json(str(model_path))

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    input_text = data.get('input_text', '').strip()
    
    # หาก input_text ว่าง ให้ส่งคำตอบว่างกลับ
    if not input_text:
        return jsonify({'predictions': []}), 200

    # ทำนายคำถัดไป
    predictions = model.predict_words_by_prefix(input_text)
    return jsonify({'predictions': [{'word': word, 'probability': prob} for word, prob in predictions]})

if __name__ == '__main__':
    app.run(host="0.0.0.0",debug=True, port=83)