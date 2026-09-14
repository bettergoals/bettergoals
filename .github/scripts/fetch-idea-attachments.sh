#!/usr/bin/env bash
# Download the files attached to an idea's issue so the build can read them.
#
# GitHub stores issue attachments on github.com/user-attachments and does not
# put them in the API payload — only their URLs appear, inside the issue body.
# An unattended build has no way to fetch them, so before this existed a card
# carrying a spec or a screenshot was built from the card's prose alone.
#
# Writes into $OUT_DIR (default .idea-attachments/):
#   <name>.<ext>       the file as attached
#   <name>.<ext>.txt   extracted text, for formats Claude's Read tool cannot open
#   INDEX.md           what was found, and which files carry the readable text
#
# Office files are ZIP containers of XML; the text is pulled out with unzip and
# sed rather than by installing a converter, so this adds no dependencies.
#
# Usage: REPO=owner/name NUMBER=123 .github/scripts/fetch-idea-attachments.sh
set -uo pipefail

OUT_DIR="${OUT_DIR:-.idea-attachments}"
MAX_BYTES="${MAX_BYTES:-26214400}"   # 25 MiB — skip anything larger
MAX_TEXT_CHARS="${MAX_TEXT_CHARS:-200000}"

if [ -z "${REPO:-}" ] || [ -z "${NUMBER:-}" ]; then
  echo "fetch-idea-attachments: REPO and NUMBER are required" >&2
  exit 2
fi

mkdir -p "$OUT_DIR"
INDEX="$OUT_DIR/INDEX.md"

# OOXML is XML with no line structure: </w:p> (Word), </a:p> (PowerPoint) and
# </si> (Excel) end a run of text, so they become newlines before tags are
# dropped — otherwise everything collapses onto one unreadable line.
strip_xml() {
  sed -e 's#</w:p>#\n#g' -e 's#</a:p>#\n#g' -e 's#</si>#\n#g' \
    | sed -e 's/<[^>]*>//g' \
    | sed -e 's/&lt;/</g; s/&gt;/>/g; s/&quot;/"/g' \
          -e 's/&apos;/'"'"'/g; s/&#39;/'"'"'/g' \
          -e 's/&amp;/\&/g' \
    | sed -e 's/^[[:space:]]*//; s/[[:space:]]*$//' \
    | grep -v '^$'
}

# The issue body plus every comment: people attach specs in follow-ups as often
# as in the original card.
sources=$(
  {
    gh issue view "$NUMBER" --repo "$REPO" --json body --jq '.body // ""'
    gh issue view "$NUMBER" --repo "$REPO" --json comments --jq '.comments[].body // ""'
  } 2>/dev/null
)

# Markdown wraps these as [label](url) or <img src="url">, so stop at the first
# character that cannot be part of the URL.
urls=$(printf '%s' "$sources" \
  | grep -oE 'https://github\.com/user-attachments/(files|assets)/[^])[:space:]"'"'"'<>]+' \
  | sed 's/[.,;:]*$//' \
  | sort -u)

if [ -z "$urls" ]; then
  echo "No attachments found on $REPO#$NUMBER."
  rm -rf "$OUT_DIR"
  exit 0
fi

{
  echo "# Attachments on $REPO#$NUMBER"
  echo
  echo "Downloaded by \`.github/scripts/fetch-idea-attachments.sh\`. Read these"
  echo "before building — they are part of the idea, not background."
  echo
} > "$INDEX"

count=0
while IFS= read -r url; do
  [ -n "$url" ] || continue
  # Percent-decode the trailing path segment for a readable local name.
  name=$(basename "$url" | sed 's/%20/ /g; s/%28/(/g; s/%29/)/g')
  name=$(printf '%s' "$name" | tr -cd 'A-Za-z0-9._ ()+-' | tr ' ' '_')
  [ -n "$name" ] || name="attachment-$count"
  dest="$OUT_DIR/$name"

  if ! curl -fsSL --max-time 120 -o "$dest" "$url"; then
    echo "  ! could not download $url" >&2
    echo "- \`$name\` — **download failed**: $url" >> "$INDEX"
    continue
  fi

  size=$(wc -c < "$dest" | tr -d ' ')
  if [ "$size" -gt "$MAX_BYTES" ]; then
    echo "  ! $name is ${size}B, over the ${MAX_BYTES}B cap — removed" >&2
    rm -f "$dest"
    echo "- \`$name\` — skipped, larger than the size cap: $url" >> "$INDEX"
    continue
  fi

  count=$((count + 1))
  note=""
  lower=$(printf '%s' "$name" | tr 'A-Z' 'a-z')

  case "$lower" in
    *.docx|*.pptx|*.xlsx)
      # unzip exits 11 when a pattern matches nothing, so each type gets only
      # its own entries and the result is judged by whether text came out, not
      # by an exit code.
      : > "$dest.txt"
      case "$lower" in
        *.docx)
          unzip -p "$dest" 'word/document.xml' 2>/dev/null | strip_xml >> "$dest.txt"
          ;;
        *.xlsx)
          unzip -p "$dest" 'xl/sharedStrings.xml' 2>/dev/null | strip_xml >> "$dest.txt"
          ;;
        *.pptx)
          # One slide at a time in numeric order: a glob returns archive order,
          # and cards cite the deck by slide number, so the order is the point.
          slides=$(unzip -Z1 "$dest" 'ppt/slides/slide*.xml' 2>/dev/null \
                     | sed 's#.*/slide\([0-9][0-9]*\)\.xml#\1#' | sort -n)
          for n in $slides; do
            printf '\n## Slide %s\n\n' "$n" >> "$dest.txt"
            unzip -p "$dest" "ppt/slides/slide$n.xml" 2>/dev/null | strip_xml >> "$dest.txt"
            notes=$(unzip -p "$dest" "ppt/notesSlides/notesSlide$n.xml" 2>/dev/null | strip_xml)
            if [ -n "$notes" ]; then
              printf '\n### Speaker notes, slide %s\n\n%s\n' "$n" "$notes" >> "$dest.txt"
            fi
          done
          ;;
      esac

      if [ -s "$dest.txt" ]; then
        # Keep a runaway document from swallowing the build's context.
        if [ "$(wc -c < "$dest.txt" | tr -d ' ')" -gt "$MAX_TEXT_CHARS" ]; then
          head -c "$MAX_TEXT_CHARS" "$dest.txt" > "$dest.txt.cut" && mv "$dest.txt.cut" "$dest.txt"
          printf '\n\n[truncated at %s characters]\n' "$MAX_TEXT_CHARS" >> "$dest.txt"
        fi
        note=" — text extracted to \`$name.txt\` (read that; the original is a ZIP the Read tool cannot open)"
      else
        rm -f "$dest.txt"
        note=" — **could not extract text**; ask the author to re-attach as PDF, an image, or plain text"
      fi
      ;;
    *.pdf|*.png|*.jpg|*.jpeg|*.gif|*.webp)
      note=" — read this file directly"
      ;;
    *.md|*.txt|*.csv|*.json|*.yml|*.yaml)
      note=" — plain text, read directly"
      ;;
    *)
      note=" — unrecognised type; try reading it, and say so in the PR if you cannot"
      ;;
  esac

  echo "- \`$name\` (${size} bytes)$note" >> "$INDEX"
  echo "  + $name ($size bytes)"
done <<< "$urls"

{
  echo
  echo "Source: <https://github.com/$REPO/issues/$NUMBER>"
  echo
  echo "These belong to whoever attached them. Credit the source if you build on"
  echo "them, and do not commit them into the repo unless the idea asks for it —"
  echo "see principle 8 in PRINCIPLES.md."
} >> "$INDEX"

echo "Fetched $count attachment(s) into $OUT_DIR/."
