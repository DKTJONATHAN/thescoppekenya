import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from writer_core import run_writer

if __name__ == "__main__":
    run_writer({
        "author_name": "Amara Ndlovu",
        "category": "Entertainment",
        "source_url": "https://www.okayafrica.com/",
        "source_domain": "okayafrica.com",
        "memory_file": ".github/memory_amara.json",
        "role": "pan-African entertainment correspondent",
        "audience": "Kenyan and East African readers following continental culture and entertainment",
        "path_hints": ["article", "news", "story", "post", "/20", "culture"],
    })
