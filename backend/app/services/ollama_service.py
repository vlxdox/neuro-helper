"""
Сервис для работы с Ollama (локальная LLM)
Извлекает теги с весами из текста задачи пользователя
"""

import json
import re
from typing import List, Dict
import httpx

# Конфигурация
OLLAMA_HOST = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2:3b"
OLLAMA_TIMEOUT = 30

# Список всех доступных тегов
AVAILABLE_TAGS = [
    "генерация текста",
    "написание кода",
    "анализ данных",
    "генерация изображений",
    "генерация видео",
    "создание презентаций",
    "генерация музыки",
    "озвучка текста",
    "3d моделирование",
    "обучение",
    "математика",
]

# Соответствие английских тегов русским
TAG_MAPPING = {
    "text generation": "генерация текста",
    "code generation": "написание кода",
    "data analysis": "анализ данных",
    "image generation": "генерация изображений",
    "video generation": "генерация видео",
    "presentation creation": "создание презентаций",
    "music generation": "генерация музыки",
    "voice generation": "озвучка текста",
    "3d modeling": "3d моделирование",
    "learning": "обучение",
    "mathematics": "математика",
}


class OllamaService:
    def __init__(self):
        self.host = OLLAMA_HOST
        self.model = OLLAMA_MODEL
        self._available = None

    def is_available(self) -> bool:
        """Проверяет, запущен ли Ollama и доступна ли модель"""
        try:
            response = httpx.get(f"{self.host}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                for m in models:
                    if m.get("name", "").startswith(self.model):
                        self._available = True
                        return True
            self._available = False
            return False
        except Exception:
            self._available = False
            return False

    def extract_tags_with_weights(self, user_query: str) -> Dict[str, float]:
        """
        Извлекает теги с весами из текста задачи пользователя
        """
        if not user_query or len(user_query.strip()) < 3:
            return {}
        
        # Проверка на осмысленность запроса
        if not self._is_meaningful_query(user_query):
            print(f"⚠️ Запрос '{user_query}' не является осмысленной задачей, игнорируем")
            return {}
        
        # Сначала проверяем по ключевым словам
        keyword_tags = self._extract_by_keywords(user_query)
        if keyword_tags:
            print(f"✅ Теги по ключевым словам: {keyword_tags}")
            return keyword_tags
        
        # Если не нашли, вызываем Ollama
        result = self._call_llm_for_weighted_tags(user_query)
        if result:
            print(f"🤖 LLM вернул теги с весами: {result}")
            return result
        
        return {}
    
    def _is_meaningful_query(self, query: str) -> bool:
        """
        Проверяет, является ли запрос осмысленной задачей
        """
        import re
        
        query_lower = query.lower().strip()
        
        if len(query_lower) < 5:
            return False
        
        has_cyrillic = bool(re.search('[а-яё]', query_lower))
        has_latin = bool(re.search('[a-z]', query_lower))
        
        if not has_cyrillic and not has_latin:
            return False
        
        vowels = set('аеёиоуыэюяaeiou')
        consonants = set('бвгджзйклмнпрстфхцчшщъьbcdfghjklmnpqrstvwxyz')
        
        vowel_count = sum(1 for char in query_lower if char in vowels)
        consonant_count = sum(1 for char in query_lower if char in consonants)
        
        if vowel_count + consonant_count > 0:
            if consonant_count > 0 and vowel_count / (vowel_count + consonant_count) < 0.2:
                return False
        
        meaningful_words = [
            "создать", "сделать", "написать", "разработать", "помоги", "нужно", "хочу",
            "проанализировать", "проверить", "нарисовать", "сгенерировать", "смоделировать",
            "объяснить", "научить", "решить", "посчитать", "сверстать", "подключить",
            "настроить", "собрать", "построить", "составить", "подготовить", "обработать",
            "придумать", "сочинить", "сценарий", "поздравление", "тост", "рассказ",
            "историю", "план", "идею", "название", "слоган", "контент", "описание"
        ]
        
        for word in meaningful_words:
            if word in query_lower:
                return True
        
        if ' ' not in query_lower and len(query_lower) > 10:
            unique_chars = len(set(query_lower))
            if unique_chars < 5:
                return False
        
        return True

    def _extract_by_keywords(self, query: str) -> Dict[str, float]:
        """Быстрое извлечение тегов по ключевым словам (может вернуть несколько)"""
        query_lower = query.lower()
        
        keywords_map = {
            "написание кода": [
                "телеграм-бота", "бот", "телеграм", "приложени", "скрипт", "код", 
                "программирова", "разработк", "web", "app", "code", "разработай",
                "базу данных", "бд", "database", "сверстай", "лендинг", "форму",
                "crm", "ревью", "unit-тесты", "лендинг с анимацией", "сайт", "создать сайт",
                "сделать сайт", "написать сайт", "веб-приложение", "мобильное приложение",
                "автоматизация", "парсинг", "бот для", "telegram", "backend", "frontend",
                "api", "интеграция", "скрипт на", "программа", "софт", "приложение на",
                "веб-сервис", "интернет-магазин", "корпоративный сайт", "лендинг пейдж",
                "воркфлоу", "автотесты", "деплой", "сервер", "база данных"
            ],
            "анализ данных": [
                "google analytics", "аналитика", "отчёты", "отчет", "анализ", 
                "данные", "аналитику", "excel", "csv", "таблица", "статистик", 
                "data", "продажи", "seo", "выгрузку", "ежедневные отчёты",
                "big data", "дата-сайенс", "визуализация", "дашборд", "power bi",
                "tableau", "прогнозирование", "метрики", "kpi", "бизнес-анализ",
                "маркетинговая аналитика", "анализ поведения", "юнит-экономика",
                "когортный анализ", "автоворонка", "конверсия", "retention",
                "дата-инжиниринг", "etl", "обработка данных", "сбор данных"
            ],
            "генерация изображений": [
                "инфографику", "баннер", "логотип", "визитки", "дизайн", "инфографик", 
                "картинк", "изображени", "рисунок", "фото", "иллюстраци", "арт", 
                "диаграмма", "нарисуй", "создай дизайн", "текстуры",
                "нейроарт", "генерация картинок", "ai art", "midjourney", "dalle",
                "stable diffusion", "рендеринг", "композиция", "коллаж",
                "обложка", "превью", "thumbnail", "аватарка", "иконка",
                "персонаж", "концепт-арт", "фэнтези", "реализм", "пейзаж",
                "портрет", "карикатура", "стикер", "мем", "интерьер", "экстерьер"
            ],
            "генерация текста": [
                "краткое резюме", "readme", "документаци", "написать текст", "статья", 
                "пост", "письмо", "текст", "unit-тесты", "придумать", "сценарий",
                "поздравление", "тост", "рассказ", "историю", "план", "идею",
                "название", "слоган", "сочинить", "стих", "контент", "описание",
                "эссе", "реферат", "курсовая", "диплом", "доклад", "пресс-релиз",
                "новость", "заметка", "блог", "telegram пост", "linkedin пост",
                "twitter пост", "instagram пост", "facebook пост", "vk пост",
                "рассылка", "email письмо", "коммерческое предложение", "продающий текст",
                "лендинг текст", "seo текст", "rewriting", "копирайтинг", "нейминг"
            ],
            "генерация видео": [
                "анимацию ходьбы", "анимацию", "видео", "ролик", "клип", "анимаци", 
                "мультфильм", "video", "movie", "смонтировать", "экспортируй",
                "видеокурс", "сценарий для видео", "тикток", "reels", "shorts",
                "ютуб", "youtube", "видео-ролик", "интро", "аутро", "заставка",
                "видео-открытка", "видео-презентация", "скринкаст", "туториал",
                "обучающее видео", "промо-ролик", "трейлер", "музыкальный клип",
                "мультипликация", "стоп-моушн", "2d анимация", "3d анимация"
            ],
            "3d моделирование": [
                "3d-персонажа", "3d-анимацию", "3d модель", "3d", "модел", "3д", 
                "персонаж", "рендер", "машины", "логотипа", "смоделируй",
                "3d-моделирование", "3d-объект", "3d-сцена", "текстурирование",
                "3d-печать", "3d-визуализация", "интерьер 3d", "экстерьер 3d",
                "архитектурная визуализация", "3d-мебель", "3d-прототип",
                "3d-скульптинг", "3d-ассет", "3d-персонаж для игры", "3d-окружение",
                "blender", "3ds max", "maya", "cinema 4d", "zbrush"
            ],
            "обучение": [
                "объясни", "новичку", "обучени", "урок", "курс", "научи", 
                "понять", "learn", "study", "обучающий", "домашку", "домашка",
                "задание", "уроки", "школа", "учеба", "учебой", "заданием",
                "предмет", "тема", "разобраться", "не понимаю", "сложно", "трудно",
                "помоги с учебой", "домашнее задание", "домашняя работа", "дз",
                "математика", "физика", "химия", "биология", "история", "география",
                "литература", "русский язык", "английский язык", "информатика",
                "программирование обучение", "вебинар", "мастер-класс", "тренинг",
                "самообразование", "репетитор", "тьютор", "подготовка к экзамену",
                "егэ", "огэ", "экзамен", "зачет", "контрольная", "самостоятельная"
            ],
            "озвучка текста": [
                "звуковой эффект", "озву", "голос", "диктор", "озвучить", 
                "voice", "speech", "голосовые подсказки", "text-to-speech",
                "tts", "синтез речи", "генерация голоса", "voiceover",
                "аудиокнига", "подкаст озвучка", "рекламный голос",
                "ivr голос", "автоответчик", "голос для видео",
                "аудио-поздравление", "голосовой ассистент"
            ],
            "создание презентаций": [
                "презентаци", "слайд", "powerpoint", "presentation", "для руководства",
                "презентацию", "слайды", "презентация проекта", "питч-дек",
                "инвестиционная презентация", "продающая презентация",
                "отчетная презентация", "учебная презентация", "вебинар презентация",
                "keynote", "google slides", "canva презентация", "beautiful.ai"
            ],
            "генерация музыки": [
                "музык", "песн", "трек", "саундтрек", "music", "мелодия",
                "бит", "инструментал", "минусовка", "аранжировка",
                "композиция", "саунд-дизайн", "звукорежиссура", "сведение",
                "мастеринг", "джингл", "рингтон", "фоновую музыку",
                "музыка для видео", "саундтрек к фильму", "песня на заказ"
            ],
        }
        
        result = {}
        
        for tag, keywords in keywords_map.items():
            for keyword in keywords:
                if keyword in query_lower:
                    if tag not in result:
                        # Определяем вес по приоритету
                        if tag == "написание кода":
                            result[tag] = 1.0
                        elif tag == "генерация видео":
                            result[tag] = 0.95
                        elif tag == "генерация текста":
                            result[tag] = 0.9
                        elif tag in ["анализ данных", "3d моделирование", "генерация изображений"]:
                            result[tag] = 0.85
                        elif tag in ["обучение", "создание презентаций", "озвучка текста"]:
                            result[tag] = 0.8
                        else:
                            result[tag] = 0.7
                    break
        
        return result

    def _call_llm_for_weighted_tags(self, user_query: str) -> Dict[str, float]:
        """Вызывает Ollama для получения тегов с весами"""
        if not self.is_available():
            print("⚠️ Ollama недоступен")
            return {}
        
        prompt = f"""You are a relevance analyzer. Analyze user request and return ALL relevant tags with DIFFERENT weights based on importance.

Available tags: text generation, code generation, data analysis, image generation, video generation, presentation creation, music generation, voice generation, 3d modeling, learning, mathematics

WEIGHT RULES:
- Weight 1.0 = MAIN task (the primary request, what user MOSTLY wants)
- Weight 0.7-0.9 = IMPORTANT secondary task (also explicitly requested)
- Weight 0.4-0.6 = SUPPORTING task (related, might be useful)
- Weight 0.1-0.3 = MINOR task (barely mentioned)
- NEVER give same weight to all tags

CRITICAL: You MUST assign DIFFERENT weights. Only ONE tag can have weight 1.0 (the main task). Others should be lower.

CRITICAL MAPPING RULES:
- "website", "site", "app", "programming", "code", "create site", "make website", "build app" → code generation
- "logo", "design", "draw", "illustration", "image", "picture" → image generation
- "analyze data", "excel", "csv", "statistics", "competitors", "data" → data analysis
- "explain", "teach", "learn", "study", "course", "beginner" → learning
- "video", "animation", "youtube", "movie", "reel" → video generation
- "music", "soundtrack", "song", "background music" → music generation
- "voice", "speech", "text-to-speech", "voiceover" → voice generation
- "subtitles", "text", "article", "post", "write", "script", "story", "plan", "idea", "name", "slogan" → text generation
- "presentation", "slides", "powerpoint" → presentation creation
- "3d model", "character", "3d", "modeling" → 3d modeling
- "math", "equation", "regression", "solve", "calculate" → mathematics
- "grammar", "proofreading", "fix errors", "check document" → data analysis

EXAMPLES:
- "create app, make presentation, analyze competitors" → {{"code generation": 1.0, "presentation creation": 0.8, "data analysis": 0.7}}
- "make video course, add music, voiceover, subtitles" → {{"video generation": 1.0, "music generation": 0.8, "voice generation": 0.8, "text generation": 0.7}}
- "create 3d model, generate textures, explain to beginner" → {{"3d modeling": 1.0, "image generation": 0.8, "learning": 0.7}}
- "check grammar, solve regression, write visualization script" → {{"data analysis": 1.0, "mathematics": 0.85, "code generation": 0.8}}
- "make ad video, generate cover image, write ad text, add voiceover and music" → {{"video generation": 1.0, "image generation": 0.85, "text generation": 0.8, "voice generation": 0.8, "music generation": 0.75}}
- "come up with a script for video" → {{"text generation": 1.0, "video generation": 0.8}}

User request: "{user_query}"

Return ONLY JSON object with tags as keys and DIFFERENT weights as numbers.
Do not add any explanation. Do not add any text before or after JSON."""

        try:
            with httpx.Client(timeout=OLLAMA_TIMEOUT) as client:
                response = client.post(
                    f"{self.host}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.2,
                            "num_predict": 350,
                        }
                    }
                )
                
                if response.status_code != 200:
                    print(f"❌ Ollama вернул статус: {response.status_code}")
                    return {}
                
                result = response.json()
                answer = result.get("response", "").strip()
                print(f"📝 Ollama ответ: {answer}")
                
                return self._parse_weighted_tags_response(answer)
                
        except Exception as e:
            print(f"❌ Ошибка вызова Ollama: {e}")
            return {}

    def _parse_weighted_tags_response(self, response_text: str) -> Dict[str, float]:
        """Парсит JSON ответ Ollama и извлекает теги с весами"""
        json_match = re.search(r'\{[^{}]*\}', response_text)
        if not json_match:
            return {}
        
        try:
            json_obj = json.loads(json_match.group())
            
            if not json_obj:
                return {}
            
            result = {}
            for eng_tag, weight in json_obj.items():
                if eng_tag in TAG_MAPPING and isinstance(weight, (int, float)):
                    weight = max(0.0, min(1.0, float(weight)))
                    if weight > 0:
                        result[TAG_MAPPING[eng_tag]] = weight
            
            if result:
                max_weight = max(result.values())
                if max_weight > 0 and max_weight != 1.0:
                    for tag in result:
                        result[tag] = round(result[tag] / max_weight, 2)
            
            return result
        except json.JSONDecodeError as e:
            print(f"❌ Ошибка парсинга JSON: {e}")
            return {}
    
    def get_available_tags(self) -> List[str]:
        """Возвращает список всех доступных тегов"""
        return AVAILABLE_TAGS.copy()


# Синглтон
ollama_service = OllamaService()


def extract_tags_from_query(user_query: str) -> Dict[str, float]:
    """Удобная функция для извлечения тегов с весами из запроса"""
    return ollama_service.extract_tags_with_weights(user_query)