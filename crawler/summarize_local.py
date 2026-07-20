import html
import os
import re
import unicodedata
from datetime import datetime, timezone
from difflib import SequenceMatcher

import requests
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

MODEL_NAME = "VietAI/vit5-base-vietnews-summarization"
MODEL_VERSION = f"{MODEL_NAME}@v1"
BATCH_SIZE = 2
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


def normalize_text(value):
    value = unicodedata.normalize("NFD", clean_text(value).lower())
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def similarity(left, right):
    left_normalized = normalize_text(left)
    right_normalized = normalize_text(right)

    if not left_normalized or not right_normalized:
        return 0.0

    return SequenceMatcher(None, left_normalized, right_normalized).ratio()


def is_distinct_takeaway(takeaway, title, summary):
    takeaway = clean_text(takeaway)

    if len(takeaway) < 45 or len(takeaway) > 500:
        return False

    normalized_takeaway = normalize_text(takeaway)
    normalized_summary = normalize_text(summary)

    if normalized_summary and (
        normalized_takeaway in normalized_summary
        or normalized_summary in normalized_takeaway
        or similarity(takeaway, summary) >= 0.84
    ):
        return False

    # A title-only output is not an editorial takeaway either.
    if similarity(takeaway, title) >= 0.9:
        return False

    return True


def fetch_articles():
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/articles"
    params = {
        "select": (
            "id,title,summary,content_preview,original_summary,language,"
            "key_takeaway,takeaway_model,updated_at"
        ),
        "is_archived": "eq.false",
        "order": "updated_at.desc",
        "limit": str(ARTICLE_LIMIT),
    }

    response = requests.get(endpoint, headers=HEADERS, params=params, timeout=60)
    response.raise_for_status()
    return response.json()


def build_source_text(article):
    title = clean_text(article.get("title"))
    summary = clean_text(article.get("summary") or article.get("content_preview"))

    if not title or not summary:
        return title, summary, ""

    if normalize_text(title) in normalize_text(summary):
        source_text = summary
    else:
        source_text = f"{title}. {summary}"

    # The model card specifies no task prefix; append EOS as in its official example.
    return title, summary, f"{source_text}</s>"


def generate_takeaways(tokenizer, model, source_texts):
    results = []

    for start in range(0, len(source_texts), BATCH_SIZE):
        batch = source_texts[start : start + BATCH_SIZE]
        encoded = tokenizer(
            batch,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512,
        )

        generated = model.generate(
            **encoded,
            max_length=120,
            min_length=18,
            num_beams=4,
            no_repeat_ngram_size=3,
            repetition_penalty=1.15,
            length_penalty=0.85,
            early_stopping=True,
        )

        results.extend(
            clean_text(value)
            for value in tokenizer.batch_decode(generated, skip_special_tokens=True)
        )
        print(f"Summarized {min(start + BATCH_SIZE, len(source_texts))}/{len(source_texts)}")

    return results


def update_article(article_id, takeaway):
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/articles?id=eq.{article_id}"
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "key_takeaway": takeaway,
        "takeaway_model": MODEL_VERSION,
        "takeaway_generated_at": now,
        "updated_at": now,
    }

    response = requests.patch(endpoint, headers=HEADERS, json=payload, timeout=60)
    response.raise_for_status()


def main():
    articles = fetch_articles()
    candidates = []
    source_texts = []

    for article in articles:
        if article.get("takeaway_model") == MODEL_VERSION and article.get("key_takeaway"):
            continue

        title, summary, source_text = build_source_text(article)

        if len(source_text) < 90:
            print(f"Skipping {article.get('id')}: source excerpt is too short")
            continue

        article["takeaway_title"] = title
        article["takeaway_summary"] = summary
        candidates.append(article)
        source_texts.append(source_text)

    print(f"Found {len(candidates)} articles that need an independent takeaway")

    if not candidates:
        return

    print(f"Loading summarization model: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    model.eval()

    generated_takeaways = generate_takeaways(tokenizer, model, source_texts)
    updated_count = 0
    rejected_count = 0

    for article, takeaway in zip(candidates, generated_takeaways):
        if not is_distinct_takeaway(
            takeaway,
            article["takeaway_title"],
            article["takeaway_summary"],
        ):
            rejected_count += 1
            print(f"Rejected duplicate/low-value takeaway for {article['id']}")
            continue

        update_article(article["id"], takeaway)
        updated_count += 1
        print(f"Updated takeaway: {takeaway}")

    print(f"Finished: {updated_count} takeaways saved, {rejected_count} rejected")


if __name__ == "__main__":
    main()
