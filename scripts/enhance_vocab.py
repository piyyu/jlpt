#!/usr/bin/env python3
import sqlite3
import csv
import re
import os

DB_PATH = os.path.join(os.getcwd(), 'jlpt.db')
CSV_PATH = os.path.join(os.getcwd(), 'data', 'n5.csv')

def get_category(meaning, vocab_type, japanese, reading):
    m = meaning.lower()
    
    if vocab_type == 'verb':
        return 'Verbs'
    if vocab_type == 'adjective':
        return 'Adjectives'

    num_words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'zero', 'half', 'counter']
    if any(re.search(rf'\b{w}\b', m) for w in num_words):
        if len(japanese) <= 2 and (japanese in ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '万', '半', '零']):
            return 'Numbers & Counters'
        if 'counter' in m:
            return 'Numbers & Counters'

    time_words = ['today', 'tomorrow', 'yesterday', 'day', 'month', 'year', 'morning', 'night', 'evening', 'week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'time', 'now', 'always', 'often', 'sometimes', 'usually', 'after', 'before']
    if any(re.search(rf'\b{w}\b', m) for w in time_words):
        return 'Time & Dates'

    family_words = ['mother', 'father', 'brother', 'sister', 'family', 'uncle', 'aunt', 'grandfather', 'grandmother', 'parents', 'child', 'boy', 'girl', 'man', 'woman', 'person', 'i', 'you', 'who', 'friend', 'teacher', 'doctor', 'student']
    if any(re.search(rf'\b{w}\b', m) for w in family_words):
        return 'People & Family'
    
    # special case for "I, myself"
    if 'i, ' in m or ', i' in m or m == 'i':
        return 'People & Family'

    food_words = ['eat', 'drink', 'water', 'meat', 'bread', 'sake', 'tea', 'coffee', 'meal', 'rice', 'candy', 'sugar', 'salt', 'breakfast', 'lunch', 'dinner', 'fish', 'vegetable', 'fruit', 'apple', 'juice', 'pork', 'beef', 'chicken', 'cake']
    if any(re.search(rf'\b{w}\b', m) for w in food_words):
        return 'Food & Drink'

    school_words = ['school', 'student', 'teacher', 'class', 'study', 'book', 'pencil', 'desk', 'dictionary', 'newspaper', 'magazine', 'paper', 'homework', 'question', 'answer', 'test', 'library', 'college', 'university']
    if any(re.search(rf'\b{w}\b', m) for w in school_words):
        return 'School & Work'

    place_words = ['station', 'park', 'house', 'home', 'room', 'apartment', 'town', 'city', 'country', 'store', 'shop', 'bank', 'hospital', 'river', 'mountain', 'sea', 'north', 'south', 'east', 'west', 'right', 'left', 'inside', 'outside', 'top', 'bottom', 'front', 'back', 'next to', 'near', 'far', 'where', 'here', 'there', 'door', 'window', 'exit', 'entrance', 'bathroom', 'toilet', 'hotel', 'restaurant']
    if any(re.search(rf'\b{w}\b', m) for w in place_words):
        return 'Places & Directions'

    if vocab_type == 'expression' or 'hello' in m or 'yes' in m or 'no' in m or 'thank' in m or 'please' in m or 'excuse' in m:
        return 'Greetings & Expressions'

    return 'Things & Objects'

def get_importance(tags):
    match = re.search(r'Genki_Ln\.(\d+)', tags)
    if match:
        return int(match.group(1))
    if 'JLPT_5' in tags or 'JLPT_N5' in tags:
        return 30
    return 100

def get_example(reading, english, category, vocab_type, japanese):
    # Very simple sentences based on reading (kana only) to be beginner friendly
    noun_kana = reading
    en_clean = english.replace('"', '').replace("'", "")
    
    if category == 'Places & Directions':
        return f'{noun_kana}に いきます。', f'I will go to {en_clean}.'
    elif category == 'Food & Drink':
        return f'{noun_kana}が すき です。', f'I like {en_clean}.'
    elif category == 'People & Family':
        return f'あの ひとは {noun_kana} です。', f'That person is a {en_clean}.'
    elif category == 'Time & Dates':
        return f'{noun_kana}に きます。', f'I will come at/on {en_clean}.'
    elif category == 'Adjectives':
        return f'それは {noun_kana} です。', f'That is {en_clean}.'
    elif category == 'Verbs':
        return f'{noun_kana} ことが すき です。', f'I like to {en_clean}.'
    elif category == 'School & Work':
        return f'わたしの {noun_kana} です。', f'It is my {en_clean}.'
    else:
        return f'これは {noun_kana} です。', f'This is a {en_clean}.'

def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    vocab_map = {}
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            expr = row['expression'].strip()
            reading = row['reading'].strip()
            vocab_map[(expr, reading)] = row

    c.execute("SELECT id, japanese, reading, english, type, example_jp FROM vocabulary")
    rows = c.fetchall()

    for row in rows:
        vid, japanese, reading, english, vocab_type, example_jp = row
        
        tags = ''
        key = (japanese, reading)
        if key in vocab_map:
            tags = vocab_map[key]['tags']
        else:
            for k, v in vocab_map.items():
                if k[0] == japanese:
                    tags = v['tags']
                    break
                    
        category = get_category(english, vocab_type, japanese, reading)
        importance = get_importance(tags)

        # Specifically prioritize 'Watashi' and other key words
        if japanese == '私':
            importance = 0
            category = 'People & Family'
        if japanese in ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']:
            category = 'Numbers & Counters'
        
        ex_jp, ex_en = None, None
        if not example_jp:
            first_meaning = english.split(',')[0].split(';')[0].strip()
            ex_jp, ex_en = get_example(reading, first_meaning, category, vocab_type, japanese)

        if ex_jp:
            c.execute("UPDATE vocabulary SET category = ?, importance = ?, example_jp = ?, example_en = ? WHERE id = ?",
                      (category, importance, ex_jp, ex_en, vid))
        else:
            c.execute("UPDATE vocabulary SET category = ?, importance = ? WHERE id = ?",
                      (category, importance, vid))

    conn.commit()
    conn.close()
    print("Vocabulary enhanced successfully with categories, importance, and examples.")

if __name__ == '__main__':
    main()
