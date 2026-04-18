# import_neural_nets.py
import sqlite3
import json
import os

# Получаем путь к папке, где находится СКРИПТ
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Файлы находятся в той же папке, что и скрипт
DB_PATH = os.path.join(SCRIPT_DIR, 'neurohelper.db')
JSON_PATH = os.path.join(SCRIPT_DIR, 'seed.json')

print("=" * 50)
print("🚀 ИМПОРТ НЕЙРОСЕТЕЙ В БАЗУ ДАННЫХ")
print("=" * 50)
print(f"📁 Папка скрипта: {SCRIPT_DIR}")
print(f"📄 База данных: {DB_PATH}")
print(f"📄 JSON файл: {JSON_PATH}")
print()

def create_tables(cursor):
    """Создает все необходимые таблицы"""
    print("📋 Создание таблиц...")
    
    # Таблица users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255),
            google_id VARCHAR(255) UNIQUE,
            avatar_url VARCHAR(500),
            is_admin BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME,
            last_login DATETIME
        )
    ''')
    
    # Таблица neural_nets
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS neural_nets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            url VARCHAR(500) NOT NULL,
            price_type VARCHAR(50),
            price_details VARCHAR(500),
            platforms JSON,
            has_api BOOLEAN DEFAULT 0,
            complexity VARCHAR(20),
            languages JSON,
            sanctions BOOLEAN DEFAULT 0,
            created_at DATETIME,
            updated_at DATETIME
        )
    ''')
    
    # Таблица tags
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) UNIQUE NOT NULL,
            category VARCHAR(50)
        )
    ''')
    
    # Таблица neural_net_tags
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS neural_net_tags (
            neural_net_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (neural_net_id, tag_id),
            FOREIGN KEY (neural_net_id) REFERENCES neural_nets(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
    ''')
    
    # Таблица favorites
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS favorites (
            user_id INTEGER,
            neural_net_id INTEGER,
            created_at DATETIME,
            PRIMARY KEY (user_id, neural_net_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (neural_net_id) REFERENCES neural_nets(id) ON DELETE CASCADE
        )
    ''')
    
    # Таблица chats
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            mode VARCHAR(20) NOT NULL,
            query_text TEXT NOT NULL,
            filters JSON,
            results JSON,
            created_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CHECK (mode IN ('search', 'recommend', 'compare', 'fast', 'smart'))
        )
    ''')
    
    print("   ✅ Все таблицы созданы")

def import_neural_nets():
    # Проверяем существование файлов
    if not os.path.exists(DB_PATH):
        print(f"❌ База данных не найдена: {DB_PATH}")
        print(f"   Создаю новую базу данных...")
    
    if not os.path.exists(JSON_PATH):
        print(f"❌ JSON файл не найден: {JSON_PATH}")
        print(f"   Файлы в папке: {os.listdir(SCRIPT_DIR)}")
        return False
    
    print(f"✅ JSON файл найден")
    
    # Читаем JSON
    print("\n📖 Чтение JSON файла...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    neural_nets = data.get('neural_nets', [])
    print(f"   Найдено нейросетей: {len(neural_nets)}")
    
    # Подключаемся к БД
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Создаем таблицы
        create_tables(cursor)
        
        # Очищаем существующие данные
        print("\n🗑️  Очистка существующих данных...")
        cursor.execute("DELETE FROM neural_net_tags")
        cursor.execute("DELETE FROM neural_nets")
        cursor.execute("DELETE FROM tags")
        print("   Таблицы очищены")
        
        # Словарь для хранения тегов
        tags_cache = {}
        
        # Счетчики
        nets_created = 0
        tags_created = 0
        
        print("\n📝 Импорт нейросетей...")
        print("-" * 50)
        
        for idx, net in enumerate(neural_nets, 1):
            name = net.get('name', '')
            description = net.get('description', '')
            url = net.get('url', '')
            price_type = net.get('price_type', 'free')
            price_details = net.get('price_details', '')
            platforms = json.dumps(net.get('platforms', []))
            has_api = 1 if net.get('has_api', False) else 0
            complexity = net.get('complexity', 'low')
            languages = json.dumps(net.get('languages', []))
            sanctions = 1 if net.get('sanctions', False) else 0
            
            # Вставляем нейросеть
            cursor.execute('''
                INSERT INTO neural_nets (
                    name, description, url, price_type, price_details,
                    platforms, has_api, complexity, languages, sanctions,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            ''', (name, description, url, price_type, price_details, 
                  platforms, has_api, complexity, languages, sanctions))
            
            net_id = cursor.lastrowid
            nets_created += 1
            
            # Обрабатываем теги
            tags = net.get('tags', [])
            for tag_name in tags:
                # Проверяем кэш
                if tag_name not in tags_cache:
                    # Проверяем в БД
                    cursor.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
                    existing = cursor.fetchone()
                    
                    if existing:
                        tag_id = existing[0]
                        tags_cache[tag_name] = tag_id
                    else:
                        # Создаем новый тег
                        cursor.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
                        tag_id = cursor.lastrowid
                        tags_cache[tag_name] = tag_id
                        tags_created += 1
                
                # Связываем нейросеть с тегом
                cursor.execute('''
                    INSERT OR IGNORE INTO neural_net_tags (neural_net_id, tag_id)
                    VALUES (?, ?)
                ''', (net_id, tags_cache[tag_name]))
            
            # Прогресс
            print(f"   {idx}. ✅ {name} (теги: {len(tags)})")
        
        # Сохраняем изменения
        conn.commit()
        
        print("-" * 50)
        print("\n📊 ИТОГИ ИМПОРТА")
        print("=" * 50)
        print(f"✅ Импортировано нейросетей: {nets_created}")
        print(f"🏷️  Создано новых тегов: {tags_created}")
        
        # Получаем статистику
        cursor.execute("SELECT COUNT(*) FROM neural_nets")
        total_nets = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tags")
        total_tags = cursor.fetchone()[0]
        
        print(f"\n📈 Всего в БД:")
        print(f"   Нейросетей: {total_nets}")
        print(f"   Тегов: {total_tags}")
        
        print("\n🎉 Импорт успешно завершен!")
        return True
        
    except Exception as e:
        print(f"\n❌ Ошибка при импорте: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return False
    
    finally:
        conn.close()

if __name__ == "__main__":
    import_neural_nets()