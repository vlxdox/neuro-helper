"""
Скрипт для загрузки seed.json в базу данных
Запуск: python -m backend.app.utils.seed
"""

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database.session import SessionLocal, init_db
from backend.app.database.models import NeuralNet, Tag, NeuralNetTag


def load_seed_data(json_path: str):
    """Загружает нейросети из JSON файла в БД"""
    
    init_db()
    
    db = SessionLocal()
    
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        neural_nets_data = data.get("neural_nets", [])
        print(f"Найдено {len(neural_nets_data)} нейросетей для загрузки")
        
        all_tags = set()
        for nn in neural_nets_data:
            for tag_name in nn.get("tags", []):
                all_tags.add(tag_name)
        
        print(f"Найдено {len(all_tags)} уникальных тегов")
        
        tag_objects = {}
        for tag_name in all_tags:
            existing_tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if existing_tag:
                tag_objects[tag_name] = existing_tag
            else:
                new_tag = Tag(name=tag_name)
                db.add(new_tag)
                db.flush()
                tag_objects[tag_name] = new_tag
        
        db.commit()
        print(f"Теги загружены: {len(tag_objects)}")
        
        count = 0
        for nn_data in neural_nets_data:
            existing = db.query(NeuralNet).filter(NeuralNet.name == nn_data["name"]).first()
            if existing:
                print(f"  Пропуск (уже есть): {nn_data['name']}")
                continue
            
            # Создаём нейросеть
            neural_net = NeuralNet(
                name=nn_data["name"],
                description=nn_data["description"],
                url=nn_data["url"],
                price_type=nn_data.get("price_type", "freemium"),
                price_details=nn_data.get("price_details", ""),
                platforms=nn_data.get("platforms", ["web"]),
                has_api=nn_data.get("has_api", False),
                complexity=nn_data.get("complexity", "low"),
                languages=nn_data.get("languages", ["en"]),
                sanctions=nn_data.get("sanctions", False),
            )
            db.add(neural_net)
            db.flush()  # получаем id
            
            # Добавляем теги
            for tag_name in nn_data.get("tags", []):
                tag = tag_objects.get(tag_name)
                if tag:
                    neural_net_tag = NeuralNetTag(
                        neural_net_id=neural_net.id,
                        tag_id=tag.id
                    )
                    db.add(neural_net_tag)
            
            count += 1
            print(f"  Загружено ({count}): {nn_data['name']}")
        
        db.commit()
        print(f"\n✅ Готово! Загружено {count} нейросетей.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка: {e}")
        raise
    finally:
        db.close()


def main():
    # Путь к seed.json (в корне проекта)
    seed_path = PROJECT_ROOT / "seed.json"
    
    if not seed_path.exists():
        print(f"❌ Файл seed.json не найден: {seed_path}")
        print("Поместите seed.json в корень проекта")
        return
    
    load_seed_data(str(seed_path))


if __name__ == "__main__":
    main()