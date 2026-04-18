# update_users_table.py
import sqlite3
import os

# Путь к БД (настройте под свой путь)
DB_PATH = r'C:\Users\Комп\Desktop\Важное\проги\НейроПомощники\NEURO-HELPER V1\NeuroHelper\data\neurohelper.db'

def update_users_table():
    print("=" * 50)
    print("🔄 ОБНОВЛЕНИЕ ТАБЛИЦЫ users")
    print("=" * 50)
    print(f"📁 База данных: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print(f"❌ База данных не найдена: {DB_PATH}")
        return False
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Проверяем, есть ли колонка updated_at
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]
    
    print(f"\n📋 Существующие колонки: {columns}")
    
    if 'updated_at' not in columns:
        print("\n➕ Добавляем колонку updated_at...")
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME")
            print("   ✅ Колонка updated_at добавлена")
        except Exception as e:
            print(f"   ❌ Ошибка: {e}")
            return False
    else:
        print("\n✅ Колонка updated_at уже существует")
    
    # Обновляем существующие записи
    print("\n🔄 Обновляем существующие записи...")
    cursor.execute("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL")
    updated = cursor.rowcount
    print(f"   ✅ Обновлено записей: {updated}")
    
    conn.commit()
    conn.close()
    
    print("\n🎉 Таблица users успешно обновлена!")
    return True

if __name__ == "__main__":
    update_users_table()