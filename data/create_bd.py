# create_bd.py
import sqlite3
import os

# Путь к БД (в текущей папке)
DB_PATH = 'neurohelper.db'

print(f"🔍 Работа с БД: {DB_PATH}")
print(f"📁 Текущая папка: {os.getcwd()}")

# Подключаемся к БД
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Удаляем временные таблицы если есть
cursor.execute("DROP TABLE IF EXISTS chats_new")
cursor.execute("DROP TABLE IF EXISTS chats_old")

# Проверяем, существует ли таблица chats
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='chats'")
table_exists = cursor.fetchone()

if table_exists:
    print("📋 Таблица chats существует, пересоздаем...")
    
    # Переименовываем старую таблицу
    cursor.execute("ALTER TABLE chats RENAME TO chats_old")
    print("   Старая таблица переименована в chats_old")
else:
    print("📋 Таблица chats не существует, создаем новую")

# Создаем новую таблицу с правильным CHECK constraint
cursor.execute('''
    CREATE TABLE chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        mode VARCHAR(20) NOT NULL,
        query_text TEXT NOT NULL,
        filters JSON,
        results JSON,
        created_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        CHECK (mode IN ('search', 'recommend', 'compare', 'fast', 'smart'))
    )
''')
print("✅ Новая таблица chats создана")
print("   Разрешенные mode: 'search', 'recommend', 'compare', 'fast', 'smart'")

# Если была старая таблица с данными, копируем данные
if table_exists:
    # Проверяем, есть ли данные в старой таблице
    cursor.execute("SELECT COUNT(*) FROM chats_old")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"🔄 Копируем {count} записей из старой таблицы...")
        try:
            # Копируем данные, преобразуя mode если нужно
            cursor.execute('''
                INSERT INTO chats (id, user_id, mode, query_text, filters, results, created_at)
                SELECT id, user_id, 
                    CASE 
                        WHEN mode = 'fast' THEN 'fast'
                        WHEN mode = 'smart' THEN 'smart'
                        ELSE mode
                    END,
                    query_text, filters, results, created_at
                FROM chats_old
            ''')
            print(f"   Скопировано {count} записей")
        except Exception as e:
            print(f"   ⚠️ Ошибка копирования: {e}")
            print("   Продолжаем с пустой таблицей")
    
    # Удаляем старую таблицу
    cursor.execute("DROP TABLE chats_old")
    print("   Старая таблица удалена")

conn.commit()
conn.close()

print("\n🎉 Таблица chats успешно обновлена!")
print("\n📝 Теперь можно использовать mode='fast' и mode='smart'")