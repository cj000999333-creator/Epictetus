#!/usr/bin/env python3
"""
prep_corpus.py

Reads raw Stoic + Socratic corpus files, strips boilerplate, splits into semantic
chunks of 200-500 words (max 800), tags each chunk with source metadata, and writes
a single corpus-chunks.json ready for embedding.

Input:  /home/claude/corpus-raw/*.txt
Output: /home/claude/corpus-chunks.json
"""

import json
import re
from pathlib import Path

CORPUS_DIR = Path("/home/claude/corpus-raw")
OUTPUT_FILE = Path("/home/claude/corpus-chunks.json")

TARGET_MIN = 200
TARGET_MAX = 500
HARD_MAX = 800


# ============================================================================
# UTILITY
# ============================================================================

def normalize_whitespace(text: str) -> str:
    """Collapse runs of whitespace, normalize line endings, trim."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def strip_gutenberg_shell(text: str) -> str:
    """Remove Project Gutenberg header (everything up to *** START ***) and
    footer (everything from *** END *** onwards)."""
    start_match = re.search(r"\*\*\* ?START OF (THE |THIS )?PROJECT GUTENBERG.*?\*\*\*", text, re.IGNORECASE)
    if start_match:
        text = text[start_match.end():]
    end_match = re.search(r"\*\*\* ?END OF (THE |THIS )?PROJECT GUTENBERG.*?\*\*\*", text, re.IGNORECASE)
    if end_match:
        text = text[:end_match.start()]
    return text


def strip_standard_ebooks_shell(text: str) -> str:
    """Standard Ebooks files start with a copyright/CC0 blurb and end with an
    Uncopyright section. Remove both."""
    lines = text.split("\n")
    body_start = 0
    for i, line in enumerate(lines):
        if line.strip() == "Introduction" or line.strip().startswith("Discourses"):
            body_start = i
            break
    text = "\n".join(lines[body_start:])
    uncopy_match = re.search(r"\n\s*Uncopyright\s*\n", text)
    if uncopy_match:
        text = text[:uncopy_match.start()]
    return text


def count_words(text: str) -> int:
    return len(text.split())


def paragraphs(text: str):
    """Yield non-empty paragraphs (blank-line separated)."""
    for para in text.split("\n\n"):
        para = para.strip()
        if para:
            yield para


def chunk_paragraphs(paragraphs_list, source: str, work: str, section_ref: str, chunks_out: list):
    """Group paragraphs into 200-500 word chunks (max 800). Keep paragraph boundaries."""
    buffer = []
    buffer_words = 0

    def flush():
        nonlocal buffer, buffer_words
        if not buffer:
            return
        text = "\n\n".join(buffer).strip()
        if text and count_words(text) >= 30:  # skip tiny scraps
            chunks_out.append({
                "source": source,
                "work": work,
                "reference": section_ref,
                "text": text,
                "word_count": count_words(text),
            })
        buffer = []
        buffer_words = 0

    for para in paragraphs_list:
        p_words = count_words(para)

        # If a single paragraph is longer than HARD_MAX, split by sentences
        if p_words > HARD_MAX:
            sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z])", para)
            sub = []
            sub_words = 0
            for sent in sentences:
                s_words = count_words(sent)
                if sub_words + s_words > TARGET_MAX and sub:
                    if buffer:
                        flush()
                    text = " ".join(sub).strip()
                    if text and count_words(text) >= 30:
                        chunks_out.append({
                            "source": source,
                            "work": work,
                            "reference": section_ref,
                            "text": text,
                            "word_count": count_words(text),
                        })
                    sub = [sent]
                    sub_words = s_words
                else:
                    sub.append(sent)
                    sub_words += s_words
            if sub:
                text = " ".join(sub).strip()
                if text and count_words(text) >= 30:
                    chunks_out.append({
                        "source": source,
                        "work": work,
                        "reference": section_ref,
                        "text": text,
                        "word_count": count_words(text),
                    })
            continue

        # Normal case: accumulate paragraphs until we hit target
        if buffer_words + p_words > TARGET_MAX and buffer_words >= TARGET_MIN:
            flush()
        buffer.append(para)
        buffer_words += p_words

        if buffer_words >= TARGET_MAX:
            flush()

    flush()


# ============================================================================
# PARSERS - one per source file
# ============================================================================

def parse_epictetus_discourses(chunks: list):
    """Standard Ebooks Long Discourses.
    Structure: Book I..IV, each with Roman-numeral chapters and titled sections."""
    path = CORPUS_DIR / "epictetus-discourses.txt"
    text = normalize_whitespace(path.read_text(encoding="utf-8"))
    text = strip_standard_ebooks_shell(text)

    # Truncate at Endnotes/Uncopyright — everything after is Long's/Carter's footnotes
    for stop in ["\nEndnotes ", "\nColophon\n", "\nUncopyright\n"]:
        idx = text.find(stop)
        if idx > 5000:
            text = text[:idx]
            break

    # Skip introduction — find the "Discourses" heading start
    discourses_start = re.search(r"\nDiscourses\n", text)
    if discourses_start:
        text = text[discourses_start.end():]

    # Split into books
    book_pattern = re.compile(r"\n\s*Book\s+(I{1,4}|IV|V|VI|VII|VIII)\s*\n", re.MULTILINE)
    book_splits = list(book_pattern.finditer(text))

    if not book_splits:
        # Fallback: chunk the whole thing as "Discourses"
        paras = list(paragraphs(text))
        chunk_paragraphs(paras, "Epictetus", "Discourses", "book unknown", chunks)
        return

    for i, m in enumerate(book_splits):
        book_num = m.group(1)
        start = m.end()
        end = book_splits[i+1].start() if i+1 < len(book_splits) else len(text)
        book_text = text[start:end]

        # Within a book, chapters are lone Roman numerals on their own line
        # followed (after 1 or 2 blank lines) by a title line then body.
        # Allow chapter marker at start-of-string as well as after \n.
        chapter_pattern = re.compile(r"(?:^|\n)\s*([IVX]+)\s*\n+\s*([A-Z][^\n]{5,})\n", re.MULTILINE)
        chapter_splits = list(chapter_pattern.finditer(book_text))

        if not chapter_splits:
            paras = list(paragraphs(book_text))
            chunk_paragraphs(paras, "Epictetus", "Discourses", f"Book {book_num}", chunks)
            continue

        for j, cm in enumerate(chapter_splits):
            chapter_num = cm.group(1)
            chapter_title = cm.group(2).strip()
            ch_start = cm.end()
            ch_end = chapter_splits[j+1].start() if j+1 < len(chapter_splits) else len(book_text)
            ch_text = book_text[ch_start:ch_end].strip()
            ref = f"Discourses {book_num}.{chapter_num} — {chapter_title}"
            paras = list(paragraphs(ch_text))
            chunk_paragraphs(paras, "Epictetus", "Discourses", ref, chunks)


def parse_enchiridion(chunks: list):
    """Extract only the Encheiridion portion from the abridged Gutenberg file."""
    path = CORPUS_DIR / "epictetus-enchiridion.txt"
    text = normalize_whitespace(path.read_text(encoding="utf-8"))
    text = strip_gutenberg_shell(text)

    # Find where "THE ENCHEIRIDION, OR MANUAL." section starts (not the earlier
    # table-of-contents mention)
    match = re.search(r"\n\s*THE ENCHEIRIDION,?\s*OR MANUAL\.?\s*\n", text)
    if match:
        # We want the LAST occurrence (there are two: TOC and actual start)
        matches = list(re.finditer(r"\n\s*THE ENCHEIRIDION,?\s*OR MANUAL\.?\s*\n", text))
        text = text[matches[-1].end():]

    # Cut off Cleanthes Hymn or fragments if present at the end
    for stop in ["FRAGMENTS", "HYMN OF CLEANTHES", "END OF"]:
        idx = text.find(stop)
        if idx > 5000:
            text = text[:idx]

    # Enchiridion has numbered chapters like "I.", "II.", "III." etc.
    ch_pattern = re.compile(r"\n\s*(L?X{0,3}(?:IX|IV|V?I{0,3}))\.\s*\n", re.MULTILINE)
    ch_splits = list(ch_pattern.finditer(text))

    if not ch_splits:
        paras = list(paragraphs(text))
        chunk_paragraphs(paras, "Epictetus", "Enchiridion", "full manual", chunks)
        return

    for i, m in enumerate(ch_splits):
        num = m.group(1)
        start = m.end()
        end = ch_splits[i+1].start() if i+1 < len(ch_splits) else len(text)
        section_text = text[start:end].strip()
        ref = f"Enchiridion {num}"
        paras = list(paragraphs(section_text))
        if paras:
            chunk_paragraphs(paras, "Epictetus", "Enchiridion", ref, chunks)


def parse_marcus_meditations(chunks: list):
    """Marcus Aurelius Meditations, Casaubon translation, Project Gutenberg 2680.
    Structure: 'THE FIRST BOOK' .. 'THE TWELFTH BOOK', each with I. II. III. sections.
    File also contains: TOC at top, per-book synopses ('HIS FIRST BOOK'), then real
    body ('THE FIRST BOOK'). After Book XII, the file has Appendix + Glossary +
    biographical notes — all must be excluded.
    """
    path = CORPUS_DIR / "marcus-meditations.txt"
    text = normalize_whitespace(path.read_text(encoding="utf-8"))
    text = strip_gutenberg_shell(text)

    book_names = ["FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH",
                  "SEVENTH", "EIGHTH", "NINTH", "TENTH", "ELEVENTH", "TWELFTH"]

    # Truncate everything from the top-level APPENDIX onward
    # We look for "APPENDIX" appearing on its own line AFTER "TWELFTH BOOK" has appeared
    twelfth_matches = list(re.finditer(r"\n\s*THE\s+TWELFTH\s+BOOK\s*\n", text, re.IGNORECASE))
    if twelfth_matches:
        after_twelfth = twelfth_matches[-1].end()
        appendix_match = re.search(r"\n\s*APPENDIX\s*\n", text[after_twelfth:])
        if appendix_match:
            text = text[:after_twelfth + appendix_match.start()]

    # Find each book's REAL body start ("THE X BOOK") — the synopses use "HIS X BOOK"
    body_starts = {}
    for name in book_names:
        # Prefer "THE X BOOK" over "HIS X BOOK"
        pattern = re.compile(rf"\n\s*THE\s+{name}\s+BOOK\s*\n", re.IGNORECASE)
        matches = list(pattern.finditer(text))
        if matches:
            body_starts[name] = matches[-1].start()

    sorted_starts = sorted(body_starts.items(), key=lambda x: x[1])
    for i, (name, start) in enumerate(sorted_starts):
        end = sorted_starts[i+1][1] if i+1 < len(sorted_starts) else len(text)
        book_text = text[start:end]
        # Strip the book heading line itself
        book_text = re.sub(rf"^\s*THE\s+{name}\s+BOOK\s*\n", "", book_text, flags=re.IGNORECASE)

        book_num = book_names.index(name) + 1

        # Section markers are Roman numerals followed by "." at start of paragraph
        sec_pattern = re.compile(r"(?:^|\n\n)\s*(L?X{0,3}(?:IX|IV|V?I{0,3}))\.\s+", re.MULTILINE)
        sec_splits = list(sec_pattern.finditer(book_text))

        if len(sec_splits) < 2:
            paras = list(paragraphs(book_text))
            chunk_paragraphs(paras, "Marcus Aurelius", "Meditations", f"Book {book_num}", chunks)
            continue

        for j, sm in enumerate(sec_splits):
            sec_num = sm.group(1)
            s_start = sm.end()
            s_end = sec_splits[j+1].start() if j+1 < len(sec_splits) else len(book_text)
            sec_text = book_text[s_start:s_end].strip()
            ref = f"Meditations {book_num}.{sec_num}"
            paras = list(paragraphs(sec_text))
            if paras:
                chunk_paragraphs(paras, "Marcus Aurelius", "Meditations", ref, chunks)


def parse_seneca_letters(chunks: list):
    """Seneca Letters, Gummere translation, from onemorelibrary EPUB.
    File structure:
      - Copyright / title
      - Table of Contents ("Letter 1. On saving time" ... "Letter 124. ...")
      - Introduction essay
      - Actual bodies: "I. On Saving Time" ... "CXXIV. On the true good..."
      - Appendix + Index at end
    We want the actual letter bodies, which use Roman numeral headers.
    """
    path = CORPUS_DIR / "seneca-letters.txt"
    text = normalize_whitespace(path.read_text(encoding="utf-8"))

    # Find where the letter bodies begin: "I. On Saving Time"
    # This must NOT be inside the TOC (which uses "Letter 1. On saving time")
    body_start_match = re.search(r"\n\s*I\.\s+On\s+Saving\s+Time\s*\n", text)
    if not body_start_match:
        return
    text = text[body_start_match.start():]

    # Cut off Appendix / Index at the end
    for stop in ["\nAppendix\n", "\nIndex of proper names\n", "\nAPPENDIX\n"]:
        idx = text.find(stop)
        if idx > 10000:
            text = text[:idx]
            break

    # Find each letter header: "<Roman>. <Title>"
    # Roman numerals I..CXXIV
    letter_pattern = re.compile(
        r"(?:^|\n)([CDLMVXI]+)\.\s+([A-Z][^\n]{5,120})\n",
        re.MULTILINE
    )
    matches = list(letter_pattern.finditer(text))

    def roman_to_int(r):
        vals = {"I":1, "V":5, "X":10, "L":50, "C":100, "D":500, "M":1000}
        total, prev = 0, 0
        for ch in reversed(r):
            v = vals.get(ch, 0)
            if v < prev:
                total -= v
            else:
                total += v
            prev = v
        return total

    for i, m in enumerate(matches):
        roman = m.group(1)
        num = roman_to_int(roman)
        # Sanity: letters are numbered 1-124
        if num < 1 or num > 130:
            continue
        title = m.group(2).strip()
        start = m.end()
        end = matches[i+1].start() if i+1 < len(matches) else len(text)
        letter_text = text[start:end].strip()

        ref = f"Seneca, Letter {num}: {title}"
        paras = list(paragraphs(letter_text))
        if paras:
            chunk_paragraphs(paras, "Seneca", "Letters to Lucilius", ref, chunks)


def parse_diogenes_book_vii(chunks: list):
    """Extract only Book VII (Stoics) from Diogenes Laertius."""
    path = CORPUS_DIR / "diogenes-laertius.txt"
    text = normalize_whitespace(path.read_text(encoding="utf-8"))
    text = strip_gutenberg_shell(text)

    # Find Book VII start (the body, not TOC)
    book_vii_matches = list(re.finditer(r"\n\s*BOOK\s+VII\.?\s*\n", text))
    book_viii_matches = list(re.finditer(r"\n\s*BOOK\s+VIII\.?\s*\n", text))

    if not book_vii_matches or not book_viii_matches:
        return  # can't isolate

    # Use last VII start (body) and first VIII start after it (body of next book)
    vii_start = book_vii_matches[-1].end()
    viii_starts_after = [m for m in book_viii_matches if m.start() > vii_start]
    if not viii_starts_after:
        return
    vii_end = viii_starts_after[0].start()

    book_vii_text = text[vii_start:vii_end]

    # Book VII is organized by philosopher: Zeno, Ariston, Herillus, Dionysius,
    # Cleanthes, Sphaerus, Chrysippus. Section headers are "LIFE OF <NAME>" with
    # optional trailing period. Names may contain unicode (Æ etc).
    sec_pattern = re.compile(r"\n\s*LIFE\s+OF\s+([A-ZÆŒ]+)\.?\s*\n", re.MULTILINE)
    sections = list(sec_pattern.finditer(book_vii_text))

    # If Zeno isn't matched because his "LIFE OF ZENO." is at the very start of
    # book_vii_text (already stripped by the outer split), we may need to prepend it.
    # We just check: if the first section is not Zeno, add it manually.
    if sections and "ZENO" not in sections[0].group(1):
        # Insert a synthetic Zeno start at position 0
        pass  # We'll handle Zeno as the content before first named section

    if len(sections) < 3:
        # Fallback: chunk the whole Book VII
        paras = list(paragraphs(book_vii_text))
        chunk_paragraphs(paras, "Diogenes Laertius", "Lives, Book VII", "Book VII (Stoics)", chunks)
        return

    # If Zeno (the first Stoic and founder) isn't the first section, treat everything
    # before the first section marker as Zeno's Life. Book VII always starts with him.
    first_name = sections[0].group(1).upper()
    if "ZENO" not in first_name:
        pre_text = book_vii_text[:sections[0].start()].strip()
        # Strip a leading "LIFE OF ZENO." if present
        pre_text = re.sub(r"^\s*LIFE\s+OF\s+ZENO\.?\s*\n", "", pre_text)
        if len(pre_text) > 500:
            ref = "Diogenes Laertius, Life of Zeno"
            paras = list(paragraphs(pre_text))
            if paras:
                chunk_paragraphs(paras, "Diogenes Laertius", "Lives, Book VII", ref, chunks)

    for i, m in enumerate(sections):
        name = m.group(1).title()
        start = m.end()
        end = sections[i+1].start() if i+1 < len(sections) else len(book_vii_text)
        sec_text = book_vii_text[start:end].strip()
        ref = f"Diogenes Laertius, Life of {name}"
        paras = list(paragraphs(sec_text))
        if paras:
            chunk_paragraphs(paras, "Diogenes Laertius", "Lives, Book VII", ref, chunks)


def parse_cicero(chunks: list):
    """Cicero: extract De Finibus + Tusculan Disputations only.
    Skip Academic Questions (not primarily Stoic)."""
    path = CORPUS_DIR / "cicero-works.txt"
    text = normalize_whitespace(path.read_text(encoding="utf-8"))
    text = strip_gutenberg_shell(text)

    # Find De Finibus start ("A TREATISE ON THE CHIEF GOOD AND EVIL")
    de_fin_match = re.search(r"\n\s*A\s+TREATISE\s+ON\s+THE\s+CHIEF\s+GOOD\s+AND\s+EVIL", text)
    tusc_match = re.search(r"\n\s*THE\s+TUSCULAN\s+DISPUTATIONS\.?\s*\n", text)

    if not de_fin_match or not tusc_match:
        return

    # De Finibus body
    de_fin_body = text[de_fin_match.end():tusc_match.start()]

    # Split into books: "FIRST BOOK OF THE TREATISE...", "SECOND BOOK...", ...
    book_pattern = re.compile(r"\n\s*(FIRST|SECOND|THIRD|FOURTH|FIFTH)\s+BOOK\s+OF\s+THE\s+TREATISE\s+ON\s+THE\s+CHIEF\s+GOOD\s+AND\s+EVIL", re.IGNORECASE)
    books = list(book_pattern.finditer(de_fin_body))

    book_num_map = {"FIRST": 1, "SECOND": 2, "THIRD": 3, "FOURTH": 4, "FIFTH": 5}

    for i, m in enumerate(books):
        name = m.group(1).upper()
        num = book_num_map[name]
        start = m.end()
        end = books[i+1].start() if i+1 < len(books) else len(de_fin_body)
        book_text = de_fin_body[start:end].strip()
        ref = f"De Finibus, Book {num}"
        paras = list(paragraphs(book_text))
        if paras:
            chunk_paragraphs(paras, "Cicero", "De Finibus", ref, chunks)

    # Tusculan Disputations body
    # Find where Tusculans end (either the *** END *** or the next major boundary)
    tusc_body = text[tusc_match.end():]

    tusc_book_pattern = re.compile(r"\n\s*BOOK\s+(I{1,3}V?|IV|V)\.\s*\n", re.MULTILINE)
    tusc_books = list(tusc_book_pattern.finditer(tusc_body))

    roman_to_int = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}

    if not tusc_books:
        paras = list(paragraphs(tusc_body))
        chunk_paragraphs(paras, "Cicero", "Tusculan Disputations", "Tusculan Disputations", chunks)
        return

    for i, m in enumerate(tusc_books):
        roman = m.group(1)
        num = roman_to_int.get(roman, 0)
        start = m.end()
        end = tusc_books[i+1].start() if i+1 < len(tusc_books) else len(tusc_body)
        book_text = tusc_body[start:end].strip()
        ref = f"Tusculan Disputations, Book {num}"
        paras = list(paragraphs(book_text))
        if paras:
            chunk_paragraphs(paras, "Cicero", "Tusculan Disputations", ref, chunks)


def parse_plato_dialogue(chunks: list, filename: str, work_name: str):
    """Plato dialogues (Apology, Crito, Phaedo) — Jowett translation, Gutenberg.
    These are single continuous texts, no chapter divisions we care about."""
    path = CORPUS_DIR / filename
    text = normalize_whitespace(path.read_text(encoding="utf-8"))
    text = strip_gutenberg_shell(text)

    # Jowett provides introductions before the actual dialogue. For our purposes
    # (voice/argument retrieval), we want the dialogue text itself.
    # Look for the actual dialogue start marker.

    # Simple approach: skip everything up to a marker like "APOLOGY" or "PHAEDO"
    # appearing after position 5000 (past the Gutenberg header + Jowett intro)
    marker = work_name.upper()
    for start_pos in range(5000, len(text) - 1000, 100):
        remaining = text[start_pos:]
        idx = remaining.find(marker)
        if idx > -1 and idx < 5000:
            candidate = start_pos + idx + len(marker)
            # Check the character after — should be end of line or space
            if candidate < len(text) and text[candidate] in "\n .":
                text = text[candidate:].strip()
                break

    paras = list(paragraphs(text))
    chunk_paragraphs(paras, "Plato", work_name, work_name, chunks)


# ============================================================================
# MAIN
# ============================================================================

def main():
    chunks = []

    print("Parsing Epictetus, Discourses...")
    parse_epictetus_discourses(chunks)
    n1 = len(chunks)
    print(f"  {n1} chunks so far")

    print("Parsing Epictetus, Enchiridion...")
    parse_enchiridion(chunks)
    n2 = len(chunks)
    print(f"  +{n2-n1} = {n2} chunks so far")

    print("Parsing Marcus Aurelius, Meditations...")
    parse_marcus_meditations(chunks)
    n3 = len(chunks)
    print(f"  +{n3-n2} = {n3} chunks so far")

    print("Parsing Seneca, Letters...")
    parse_seneca_letters(chunks)
    n4 = len(chunks)
    print(f"  +{n4-n3} = {n4} chunks so far")

    print("Parsing Diogenes Laertius, Book VII (Stoics)...")
    parse_diogenes_book_vii(chunks)
    n5 = len(chunks)
    print(f"  +{n5-n4} = {n5} chunks so far")

    print("Parsing Cicero (De Finibus + Tusculan Disputations)...")
    parse_cicero(chunks)
    n6 = len(chunks)
    print(f"  +{n6-n5} = {n6} chunks so far")

    print("Parsing Plato, Apology...")
    parse_plato_dialogue(chunks, "plato-apology.txt", "Apology")
    n7 = len(chunks)
    print(f"  +{n7-n6} = {n7} chunks so far")

    print("Parsing Plato, Crito...")
    parse_plato_dialogue(chunks, "plato-crito.txt", "Crito")
    n8 = len(chunks)
    print(f"  +{n8-n7} = {n8} chunks so far")

    print("Parsing Plato, Phaedo...")
    parse_plato_dialogue(chunks, "plato-phaedo.txt", "Phaedo")
    n9 = len(chunks)
    print(f"  +{n9-n8} = {n9} chunks so far")

    # Add stable IDs
    for i, chunk in enumerate(chunks):
        chunk["id"] = f"chunk_{i:05d}"

    # Statistics
    print("\n=== STATS ===")
    total_words = sum(c["word_count"] for c in chunks)
    print(f"Total chunks: {len(chunks)}")
    print(f"Total words: {total_words:,}")
    print(f"Average chunk size: {total_words / len(chunks):.0f} words")

    by_source = {}
    for c in chunks:
        by_source[c["source"]] = by_source.get(c["source"], 0) + 1
    print("\nChunks per source:")
    for src, cnt in sorted(by_source.items(), key=lambda x: -x[1]):
        print(f"  {src}: {cnt}")

    # Size histogram
    buckets = {"<100": 0, "100-200": 0, "200-500": 0, "500-800": 0, ">800": 0}
    for c in chunks:
        w = c["word_count"]
        if w < 100: buckets["<100"] += 1
        elif w < 200: buckets["100-200"] += 1
        elif w <= 500: buckets["200-500"] += 1
        elif w <= 800: buckets["500-800"] += 1
        else: buckets[">800"] += 1
    print("\nChunk size distribution:")
    for b, cnt in buckets.items():
        print(f"  {b} words: {cnt}")

    # Write output
    OUTPUT_FILE.write_text(json.dumps(chunks, indent=2, ensure_ascii=False))
    print(f"\nWrote {OUTPUT_FILE} ({OUTPUT_FILE.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
