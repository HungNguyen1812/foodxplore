import html
import os
import re
from datetime import datetime, timezone

import requests
from langdetect import DetectorFactory, detect
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


DetectorFactory.seed = 0

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

MODEL_NAME = "VietAI/envit5-translation"
BATCH_SIZE = 4
ARTICLE_LIMIT = 100


if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")


HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def clean_text(value):
    if not value:
        return ""

    value = html.unescape(str(value))
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def is_english(title, summary):
    text = clean_text(f"{title or ''} {summary or ''}")

    if len(text) < 12:
        return False

    try:
        return detect(text[:2000]) == "en"
    except Exception:
        common_words = re.findall(
            r"\b(the|and|of|to|in|for|with|food|from|on|is|are)\b",
            text.lower(),
        )
        return len(common_words) >= 2


def fetch_international_articles():
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/articles"
    params = {
        "select": (
            "id,title,summary,source_name,"
            "source_country,language,updated_at"
        ),
        "source_country": "eq.intl",
        "is_archived": "eq.false",
        "order": "updated_at.desc",
        "limit": str(ARTICLE_LIMIT),
    }

    response = requests.get(endpoint, headers=HEADERS, params=params, timeout=60)
    response.raise_for_status()
    return response.json()


def translate_texts(tokenizer, model, texts):
    translated = []

    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        inputs = [f"en: {clean_text(text)}" for text in batch]

        encoded = tokenizer(
            inputs,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512,
        )

        generated = model.generate(
            **encoded,
            max_new_tokens=256,
            num_beams=4,
            early_stopping=True,
        )

        results = tokenizer.batch_decode(generated, skip_special_tokens=True)

        for result in results:
            result = re.sub(r"^\s*vi\s*:\s*", "", result, flags=re.IGNORECASE)
            translated.append(clean_text(result))

        completed = min(start + BATCH_SIZE, len(texts))
        print(f"Translated {completed}/{len(texts)} text segments")

    return translated


def update_article(article_id, title, summary):
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/articles?id=eq.{article_id}"
    payload = {
        "title": title,
        "summary": summary or None,
        "language": "vi",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    response = requests.patch(
        endpoint,
        headers=HEADERS,
        json=payload,
        timeout=60,
    )
    response.raise_for_status()


def main():
    articles = fetch_international_articles()
    articles_to_translate = [
        article
        for article in articles
        if is_english(article.get("title"), article.get("summary"))
    ]

    print(f"Found {len(articles_to_translate)} English articles to translate")

    if not articles_to_translate:
        print("No new English articles need translation")
        return

    print(f"Loading translation model: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    model.eval()

    texts = []
    references = []

    for article in articles_to_translate:
        article_id = article["id"]
        title = clean_text(article.get("title"))
        summary = clean_text(article.get("summary"))

        if title:
            texts.append(title)
            references.append((article_id, "title"))

        if summary:
            texts.append(summary)
            references.append((article_id, "summary"))

    translated_texts = translate_texts(tokenizer, model, texts)
    translated_by_article = {}

    for reference, translated_text in zip(references, translated_texts):
        article_id, field = reference
        translated_by_article.setdefault(article_id, {})[field] = translated_text

    updated_count = 0

    for article in articles_to_translate:
        article_id = article["id"]
        translated = translated_by_article.get(article_id, {})
        translated_title = translated.get("title")
        translated_summary = translated.get("summary")

        if not translated_title:
            print(f"Skipping article {article_id}: title translation is empty")
            continue

        update_article(article_id, translated_title, translated_summary)
        updated_count += 1
        print(f"Updated article: {translated_title}")

    print(f"Finished: translated {updated_count} articles into Vietnamese")


if __name__ == "__main__":
    main()
