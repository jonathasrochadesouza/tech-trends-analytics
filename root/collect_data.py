import requests
import json
import time

# Configuration
YEARS = range(2020, 2026)
TOPICS = ["Blockchain", "Tokenization", "Smart contract"]
OUTPUT_FILE = "data.json"
MAILTO = "researcher@example.com" # OpenAlex asks for an email to get faster/polite pool

def reconstruct_abstract(inverted_index):
    """
    Reconstructs abstract from OpenAlex inverted index.
    """
    if not inverted_index:
        return "No abstract available."
    
    word_index = []
    for k, v in inverted_index.items():
        for index in v:
            word_index.append([k, index])
    
    word_index = sorted(word_index, key=lambda x: x[1])
    return " ".join([x[0] for x in word_index])

def fetch_openalex_data():
    data = {}
    
    for topic in TOPICS:
        data[topic] = {
            "yearly_stats": []
        }
        print(f"--- Processing {topic} ---")
        
        for year in YEARS:
            print(f"  Fetching data for {year}...")
            
            # 1. Get Count
            # https://api.openalex.org/works?filter=publication_year:2020,default.search:Blockchain
            url = f"https://api.openalex.org/works?filter=publication_year:{year},default.search:{topic}&mailto={MAILTO}"
            
            try:
                # We only need the metadata for the count, so per_page=1 is enough
                response = requests.get(url + "&per_page=1")
                response.raise_for_status()
                res_json = response.json()
                count = res_json['meta']['count']
                
                # 2. Get Top 5 Articles (sorted by relevance or citation)
                # Let's sort by cited_by_count to get "relevant" papers
                top_url = url + "&sort=cited_by_count:desc&per_page=5"
                top_res = requests.get(top_url)
                top_res.raise_for_status()
                top_json = top_res.json()
                
                articles = []
                for work in top_json['results']:
                    # Extract keywords (concepts)
                    keywords = [c['display_name'] for c in work.get('concepts', [])]
                    # Limit to top 5 keywords
                    keywords = keywords[:5]
                    
                    # Reconstruct abstract
                    abstract = reconstruct_abstract(work.get('abstract_inverted_index'))
                    # Truncate abstract if too long
                    if len(abstract) > 300:
                        abstract = abstract[:297] + "..."
                        
                    articles.append({
                        "title": work.get('display_name', 'No Title'),
                        "author": [a['author']['display_name'] for a in work.get('authorships', [])],
                        "abstract": abstract,
                        "pub_year": work.get('publication_year'),
                        "url": work.get('doi') or work.get('id'),
                        "keywords": keywords
                    })
                
                data[topic]["yearly_stats"].append({
                    "year": year,
                    "count": count,
                    "top_articles": articles
                })
                
            except Exception as e:
                print(f"    Error fetching {topic} {year}: {e}")
                # Fallback for error
                data[topic]["yearly_stats"].append({
                    "year": year,
                    "count": 0,
                    "top_articles": []
                })
            
            # Be polite
            time.sleep(0.2)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print(f"Done! Data saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    fetch_openalex_data()
