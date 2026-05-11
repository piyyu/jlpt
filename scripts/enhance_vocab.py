#!/usr/bin/env python3
import sqlite3
import csv
import re
import os

DB_PATH = os.path.join(os.getcwd(), 'jlpt.db')
CSV_PATH = os.path.join(os.getcwd(), 'data', 'n5.csv')



def get_category(meaning, vocab_type, japanese, reading):
    m = meaning.lower()


    # Strictly for colors
    if japanese in ['青', '赤', '白', '黒', '色', '黄色', '茶色', '緑', '青い', '赤い', '白い', '黒い', '黄色い', '茶色い']:
        return 'Colors'



    # Strictly for colors
    if japanese in ['青', '赤', '白', '黒', '色', '黄色', '茶色', '緑', '青い', '赤い', '白い', '黒い', '黄色い', '茶色い']:
        return 'Colors'


    if vocab_type == 'verb':
        return 'Verbs'
    if vocab_type == 'adjective':
        return 'Adjectives'

    # 1. Greetings & Expressions (High priority to avoid catching 'me' in 'excuse me')
    greet_words = ['hello', 'goodbye', 'bye', 'yes', 'no', 'thank', 'thanks', 'please', 'excuse', 'sorry', 'pardon', 'welcome', 'congratulations']
    if vocab_type == 'expression' or any(re.search(rf'\b{w}\b', m) for w in greet_words):
        return 'Greetings & Expressions'

    # 2. Numbers & Counters
    num_words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'ten thousand', 'zero', 'half', 'counter', 'yen', 'dollars', 'money']
    if any(re.search(rf'\b{w}\b', m) for w in num_words):
        if len(japanese) <= 3 and any(x in japanese for x in ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '万', '半', '零', '円']):
            return 'Numbers & Counters'
        if 'counter' in m:
            return 'Numbers & Counters'

    # 3. Time & Dates
    time_words = [
        'today', 'tomorrow', 'yesterday', 'day', 'month', 'year', 'morning', 'night', 'evening', 
        'afternoon', 'noon', 'tonight', 'last night', 'next week', 'last week', 'next month', 'last month',
        'week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 
        'time', 'now', 'always', 'often', 'sometimes', 'usually', 'after', 'before', 'o\'clock', 'p.m.', 'a.m.', 'minute', 'hour'
    ]
    if any(re.search(rf'\b{w}\b', m) for w in time_words):
        return 'Time & Dates'

    # 4. People & Family
    family_words = [
        'mother', 'father', 'brother', 'sister', 'family', 'uncle', 'aunt', 'grandfather', 'grandmother', 
        'parents', 'child', 'children', 'boy', 'girl', 'man', 'woman', 'person', 'people', 
        'friend', 'teacher', 'doctor', 'student', 'pupil', 'someone', 'everyone'
    ]
    if any(re.search(rf'\b{w}\b', m) for w in family_words):
        return 'People & Family'
    
    # Strictly check for pronouns
    if re.search(rf'\b(i|me|you|he|she|we|they|who|him|her|us|them)\b', m) or m == 'i':
        return 'People & Family'

    # 5. Food & Drink
    food_words = ['eat', 'drink', 'water', 'meat', 'bread', 'sake', 'tea', 'coffee', 'meal', 'rice', 'candy', 'sugar', 'salt', 'breakfast', 'lunch', 'dinner', 'fish', 'vegetable', 'fruit', 'apple', 'juice', 'pork', 'beef', 'chicken', 'cake', 'egg', 'milk']
    if any(re.search(rf'\b{w}\b', m) for w in food_words):
        return 'Food & Drink'

    # 6. Places & Directions
    place_words = [
        'station', 'park', 'house', 'home', 'room', 'apartment', 'town', 'city', 'country', 'store', 'shop', 
        'bank', 'hospital', 'river', 'mountain', 'sea', 'north', 'south', 'east', 'west', 'right', 'left', 
        'inside', 'outside', 'top', 'bottom', 'front', 'back', 'next to', 'near', 'far', 'where', 'here', 'there', 
        'door', 'window', 'exit', 'entrance', 'bathroom', 'toilet', 'hotel', 'restaurant', 'map', 'building'
    ]
    if any(re.search(rf'\b{w}\b', m) for w in place_words):
        return 'Places & Directions'

    # 7. School & Work
    school_words = ['school', 'student', 'teacher', 'class', 'study', 'book', 'pencil', 'desk', 'dictionary', 'newspaper', 'magazine', 'paper', 'homework', 'question', 'answer', 'test', 'library', 'college', 'university', 'company', 'office', 'job', 'work', 'pen', 'notebook']
    if any(re.search(rf'\b{w}\b', m) for w in school_words):
        return 'School & Work'

    # 8. Body Parts
    body_words = ['head', 'hair', 'eye', 'ear', 'nose', 'mouth', 'tooth', 'face', 'neck', 'shoulder', 'arm', 'hand', 'finger', 'leg', 'foot', 'stomach', 'back', 'body', 'heart', 'voice']
    if any(re.search(rf'\b{w}\b', m) for w in body_words):
        return 'Body Parts'

    # 9. Clothing
    clothes_words = ['clothes', 'shirt', 'pants', 'skirt', 'dress', 'coat', 'jacket', 'hat', 'cap', 'shoe', 'shoes', 'sock', 'socks', 'glasses', 'bag', 'umbrella']
    if any(re.search(rf'\b{w}\b', m) for w in clothes_words):
        return 'Clothing'

    # 10. Nature & Animals
    nature_words = ['sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'snow', 'wind', 'weather', 'mountain', 'river', 'sea', 'ocean', 'tree', 'flower', 'plant', 'animal', 'dog', 'cat', 'bird', 'fish', 'bug', 'insect', 'water', 'fire', 'earth', 'stone', 'sand']
    if any(re.search(rf'\b{w}\b', m) for w in nature_words):
        return 'Nature & Animals'

    return 'Things & Objects'

def get_sort_order(meaning, japanese, category):
    m = meaning.lower()
    
    # 1. Numbers (100-199)
    if category == 'Numbers & Counters':
        num_map = {
            'zero': 100, 'one': 101, 'two': 102, 'three': 103, 'four': 104, 
            'five': 105, 'six': 106, 'seven': 107, 'eight': 108, 'nine': 109, 
            'ten': 110, 'hundred': 120, 'thousand': 130, 'ten thousand': 140
        }
        for word, val in num_map.items():
            if re.search(rf'\b{word}\b', m):
                return val
        if 'counter' in m:
            return 150
        return 199

    # 2. People & Family (200-299)
    if category == 'People & Family':
        if 'father' in m: return 210
        if 'mother' in m: return 211
        if 'grandfather' in m: return 208
        if 'grandmother' in m: return 209
        if 'brother' in m: return 212
        if 'sister' in m: return 213
        if 'parents' in m: return 207
        if 'family' in m: return 206
        if 'friend' in m: return 220
        if 'teacher' in m: return 230
        if 'student' in m or 'pupil' in m: return 231
        if 'doctor' in m: return 240
        if 'i' in m or 'me' in m: return 201
        if 'you' in m: return 202
        return 299

    # 3. Time & Dates (300-399)
    if category == 'Time & Dates':
        if 'yesterday' in m: return 310
        if 'today' in m: return 311
        if 'tomorrow' in m: return 312
        if 'morning' in m: return 320
        if 'noon' in m or 'afternoon' in m: return 321
        if 'evening' in m or 'night' in m: return 322
        if 'monday' in m: return 341
        if 'tuesday' in m: return 342
        if 'wednesday' in m: return 343
        if 'thursday' in m: return 344
        if 'friday' in m: return 345
        if 'saturday' in m: return 346
        if 'sunday' in m: return 347
        return 399

    # 4. School & Work (400-499)
    if category == 'School & Work':
        if 'school' in m: return 410
        if 'test' in m or 'exam' in m: return 420
        if 'homework' in m: return 421
        if 'book' in m or 'dictionary' in m: return 430
        if 'pen' in m or 'pencil' in m: return 431
        if 'notebook' in m: return 432
        return 499

    return 1000

def to_romaji(text):
    if not text: return ""
    # Very basic mapping for N5 vocab readings (Hiragana only)
    kana_map = {
        'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
        'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
        'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
        'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
        'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
        'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
        'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
        'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
        'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
        'わ': 'wa', 'を': 'wo', 'ん': 'n',
        'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
        'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
        'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
        'ば': 'ba', 'び': 'bi', 'ぶ':'bu', 'べ': 'be', 'ぼ': 'bo',
        'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
        'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
        'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
        'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
        'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
        'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
        'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
        'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
        'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
        'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
        'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
        'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
        'っ': '', # handle small tsu separately
    }
    
    res = []
    i = 0
    while i < len(text):
        if text[i] == 'っ':
            i += 1
            if i < len(text):
                next_kana = text[i:i+2] if i+2 <= len(text) and text[i:i+2] in kana_map else text[i]
                next_romaji = kana_map.get(next_kana, kana_map.get(text[i], ""))
                if next_romaji: res.append(next_romaji[0])
            continue
        
        # Try 2-char combo
        if i + 1 < len(text) and text[i:i+2] in kana_map:
            res.append(kana_map[text[i:i+2]])
            i += 2
        elif text[i] in kana_map:
            res.append(kana_map[text[i]])
            i += 1
        else:
            if text[i] not in '・ /': res.append(text[i])
            i += 1
    return "".join(res)

def get_importance(tags):
    match = re.search(r'Genki_Ln\.(\d+)', tags)
    if match:
        return int(match.group(1))
    if 'JLPT_5' in tags or 'JLPT_N5' in tags:
        return 30
    return 100

def get_example(reading, english, category, vocab_type, japanese):
    en_clean = english.split(',')[0].split(';')[0].replace('"', '').replace("'", "").strip()
    en_noun = f"the {en_clean}" if not en_clean.startswith(('a ', 'an ', 'the ', 'my ', 'your ', 'his ', 'her ', 'our ', 'their ', 'to ')) else en_clean
    if en_clean.startswith('to '):
        en_verb = en_clean
    else:
        en_verb = f"to {en_clean}"
    
    if category == 'Greetings & Expressions' or vocab_type == 'expression' or japanese in ['よろしく おねがいします', 'ありがとう ございます', 'おはよう ございます', 'ごめん なさい', 'どうも ありがとう ございます', 'おやすみ なさい']:
        return f'{japanese}', f'{en_clean.capitalize()}'
    elif category == 'Places & Directions':
        return f'明日、{japanese}に行きます。', f'Tomorrow, I will go to {en_noun}.'
    elif category == 'Food & Drink':
        return f'私は{japanese}が大好きです。', f'I really like {en_clean}.'
    elif category == 'People & Family':
        if japanese in ['私', 'わたし', 'ぼく', 'あなた']:
            return f'{japanese}は学生です。', f'{en_clean.capitalize()} am/are a student.'
        return f'私の{japanese}は優しいです。', f'My {en_clean} is kind.'
    elif category == 'Time & Dates':
        return f'いつも{japanese}に勉強します。', f"I usually study {en_clean}."
    elif category in ('Adjectives', 'Colors'):
        return f'これはとても{japanese}ですね。', f'This is very {en_clean}.'
    elif category == 'Verbs' or vocab_type == 'verb':
        return f'私は{japanese}ことができます。', f'I am able {en_verb}.'
    elif category == 'Body Parts':
        return f'{japanese}が少し痛いです。', f'My {en_clean} hurts a little.'
    elif category == 'Clothing':
        return f'新しい{japanese}が欲しいです。', f'I want new {en_clean}.'
    elif category == 'School & Work':
        return f'私は{japanese}を持っています。', f'I have {en_noun}.'
    else:
        return f'そこに{japanese}があります。', f'There is {en_noun} over there.'


    # Add 'the' or 'a' for english if it's a noun
    en_noun = f"the {en_clean}" if not en_clean.startswith(('a ', 'an ', 'the ', 'my ', 'your ', 'his ', 'her ', 'our ', 'their ')) else en_clean
    
    if category == 'Places & Directions':
        return f'{japanese}に行きます。', f'I will go to {en_noun}.'
    elif category == 'Food & Drink':
        return f'{japanese}が好きです。', f'I like {en_clean}.'
    elif category == 'People & Family':
        return f'あの人は{japanese}です。', f'That person is {en_noun}.'
    elif category == 'Time & Dates':
        return f'{japanese}に会いましょう。', f"Let's meet {en_clean}."
    elif category in ('Adjectives', 'Weather', 'Nature & Animals', 'Colors'):
        return f'それは{japanese}ですね。', f'That is {en_clean}.'
    elif category == 'Verbs':
        return f'毎日{japanese}。', f'I {en_clean} every day.'
    elif category == 'Body Parts':
        return f'{japanese}が痛いです。', f'My {en_clean} hurts.'
    elif category == 'Clothing':
        return f'新しい{japanese}を買いました。', f'I bought new {en_clean}.'
    elif category == 'School & Work':
        return f'これはわたしの{japanese}です。', f'This is my {en_clean}.'
    else:
        return f'これは{japanese}です。', f'This is {en_noun}.'

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
        sort_order = get_sort_order(english, japanese, category)
        romaji = to_romaji(reading)

        # Specifically prioritize 'Watashi' and other key words
        if japanese == '私':
            importance = 0
            category = 'People & Family'
            sort_order = 201
        if japanese in ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']:
            category = 'Numbers & Counters'
        
        # force replace old kana examples with new better kanji ones
        # Fix greetings gaps
        gaps = {
            'よろしくおねがいします': 'よろしく おねがいします',
            'ありがとうございます': 'ありがとう ございます',
            'おはようございます': 'おはよう ございます',
            'ごめんなさい': 'ごめん なさい',
            'どうもありがとうございます': 'どうも ありがとう ございます',
            'おやすみなさい': 'おやすみ なさい'
        }
        if japanese in gaps:
            japanese = gaps[japanese]
            reading = gaps.get(reading, reading) # though reading might be same, just in case

        first_meaning = english.split(',')[0].split(';')[0].strip()

        # Fix "repeating words" by disambiguating based on type
        if japanese in ['青', '赤', '白', '黒', '黄色', '茶色']:
            english = english + ' (noun)'
        elif japanese in ['青い', '赤い', '白い', '黒い', '黄色い', '茶色い']:
            english = english + ' (adj)'
        elif japanese == '小さな':
            english = english + ' (na-adj/pre-noun)'
        elif japanese == '小さい':
            english = english + ' (i-adj)'
        elif japanese in ['どなた', 'あちら', 'そちら', 'どちら']:
            english = english + ' (polite)'
        
        ex_jp, ex_en = get_example(reading, first_meaning, category, vocab_type, japanese)

        c.execute("UPDATE vocabulary SET japanese = ?, reading = ?, english = ?, category = ?, importance = ?, example_jp = ?, example_en = ?, sort_order = ?, romaji = ? WHERE id = ?",
                    (japanese, reading, english, category, importance, ex_jp, ex_en, sort_order, romaji, vid))

    conn.commit()
    conn.close()
    print("Vocabulary enhanced successfully with categories, importance, and examples.")

if __name__ == '__main__':
    main()
