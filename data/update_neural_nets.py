import sqlite3
import json
import os

# Путь к файлам (настройте под свою структуру)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(SCRIPT_DIR, 'neurohelper.db')  # или просто 'neurohelper.db'
JSON_PATH = os.path.join(SCRIPT_DIR, 'seed.json')

def update_neural_nets():
    print("=" * 50)
    print("🔄 ОБНОВЛЕНИЕ БАЗЫ ДАННЫХ НЕЙРОСЕТЯМИ")
    print("=" * 50)
    
    # Проверяем существование файлов
    if not os.path.exists(DB_PATH):
        print(f"❌ База данных не найдена: {DB_PATH}")
        print(f"   Укажите правильный путь к БД")
        return False
    
    if not os.path.exists(JSON_PATH):
        print(f"❌ JSON файл не найден: {JSON_PATH}")
        return False
    
    print(f"✅ База данных: {DB_PATH}")
    print(f"✅ JSON файл: {JSON_PATH}")
    
    # Читаем JSON
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    neural_nets = data.get('neural_nets', [])
    print(f"📖 Найдено нейросетей в JSON: {len(neural_nets)}")
    
    # Подключаемся к БД
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Получаем существующие нейросети
    cursor.execute("SELECT name FROM neural_nets")
    existing_names = set(row[0] for row in cursor.fetchall())
    print(f"📋 Существующих нейросетей в БД: {len(existing_names)}")
    
    # Словарь для тегов
    cursor.execute("SELECT id, name FROM tags")
    tags_cache = {name: id for id, name in cursor.fetchall()}
    
    # Счетчики
    new_nets = 0
    skipped = 0
    new_tags = 0
    
    print("\n📝 Добавление новых нейросетей...")
    print("-" * 50)
    
    for net in neural_nets:
        name = net.get('name')
        
        # Пропускаем существующие
        if name in existing_names:
            skipped += 1
            continue
        
        # Вставляем нейросеть
        cursor.execute('''
            INSERT INTO neural_nets (
                name, description, url, price_type, price_details,
                platforms, has_api, complexity, languages, sanctions,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ''', (
            name,
            net.get('description', ''),
            net.get('url', ''),
            net.get('price_type', 'free'),
            net.get('price_details', ''),
            json.dumps(net.get('platforms', [])),
            1 if net.get('has_api', False) else 0,
            net.get('complexity', 'low'),
            json.dumps(net.get('languages', [])),
            1 if net.get('sanctions', False) else 0
        ))
        
        net_id = cursor.lastrowid
        new_nets += 1
        
        # Обрабатываем теги
        for tag_name in net.get('tags', []):
            if tag_name not in tags_cache:
                cursor.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
                tag_id = cursor.lastrowid
                tags_cache[tag_name] = tag_id
                new_tags += 1
            else:
                tag_id = tags_cache[tag_name]
            
            cursor.execute('''
                INSERT OR IGNORE INTO neural_net_tags (neural_net_id, tag_id)
                VALUES (?, ?)
            ''', (net_id, tag_id))
        
        print(f"   ✅ {name}")
    
    conn.commit()
    
    # Итоги
    print("-" * 50)
    print("\n📊 ИТОГИ ОБНОВЛЕНИЯ")
    print("=" * 50)
    print(f"✅ Добавлено новых нейросетей: {new_nets}")
    print(f"⏭️  Пропущено (уже есть): {skipped}")
    print(f"🏷️  Создано новых тегов: {new_tags}")
    
    cursor.execute("SELECT COUNT(*) FROM neural_nets")
    total_nets = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM tags")
    total_tags = cursor.fetchone()[0]
    
    print(f"\n📈 Всего в БД:")
    print(f"   Нейросетей: {total_nets}")
    print(f"   Тегов: {total_tags}")
    
    conn.close()
    print("\n🎉 База данных успешно обновлена!")
    return True

if __name__ == "__main__":
    update_neural_nets()