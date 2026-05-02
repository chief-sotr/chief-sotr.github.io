from datetime import date

# Bump VERSION_NUMBER by 1 on every edit; reset to 1 (and update VERSION_DATE) on the first edit of a new day.
VERSION_DATE = "2026-05-02"
VERSION_NUMBER = 1

print(f"Hello! Today is {date.today():%A, %B %d, %Y} — version {VERSION_NUMBER}.")
