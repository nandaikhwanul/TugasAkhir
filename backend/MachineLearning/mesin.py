import sys
import json
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class RekomendasiLowongan:
    def __init__(self, alumni_list, lowongan_list, similarity_threshold=0.3):
        """
        alumni_list: list of dict, each dict contains alumni data (including 'program_studi')
        lowongan_list: list of dict, each dict contains lowongan data (including 'kualifikasi')
        similarity_threshold: float, only recommend jobs with similarity above this threshold
        """
        self.alumni_df = pd.DataFrame(alumni_list)
        self.lowongan_df = pd.DataFrame(lowongan_list)
        self.similarity_threshold = similarity_threshold
        self.vectorizer = TfidfVectorizer()
        # Gabungkan semua kualifikasi lowongan untuk fit vectorizer
        self.lowongan_df['kualifikasi_str'] = self.lowongan_df['kualifikasi'].apply(
            lambda x: ' '.join(x) if isinstance(x, list) else str(x)
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(self.lowongan_df['kualifikasi_str'])

    def rekomendasi_untuk_alumni(self, alumni_id, top_n=5):
        """
        alumni_id: id alumni yang ingin direkomendasikan
        top_n: jumlah rekomendasi teratas
        return: list of lowongan dict yang direkomendasikan
        """
        alumni = self.alumni_df[self.alumni_df['_id'] == alumni_id]
        if alumni.empty:
            return []
        program_studi = alumni.iloc[0]['program_studi']
        # Transform program_studi alumni ke vektor tfidf
        alumni_vec = self.vectorizer.transform([str(program_studi)])
        # Hitung similarity antara alumni_vec dan semua lowongan
        similarities = cosine_similarity(alumni_vec, self.tfidf_matrix).flatten()
        # Filter lowongan dengan similarity di atas threshold
        filtered_idx = [i for i, sim in enumerate(similarities) if sim >= self.similarity_threshold]
        if not filtered_idx:
            return []
        # Urutkan berdasarkan similarity tertinggi
        sorted_idx = sorted(filtered_idx, key=lambda i: similarities[i], reverse=True)
        top_idx = sorted_idx[:top_n]
        rekomendasi = self.lowongan_df.iloc[top_idx].to_dict(orient='records')
        return rekomendasi

def main():
    try:
        # Baca input JSON dari stdin
        input_str = sys.stdin.read()
        if not input_str.strip():
            print(json.dumps({"error": "No input received"}))
            sys.exit(1)
        data = json.loads(input_str)
        alumni_list = data.get("alumni_list", [])
        lowongan_list = data.get("lowongan_list", [])
        alumni_id = data.get("alumni_id")
        top_n = data.get("top_n", 5)
        similarity_threshold = data.get("similarity_threshold", 0.3)

        if not alumni_list or not lowongan_list or not alumni_id:
            print(json.dumps({"error": "Missing required input data"}))
            sys.exit(1)

        mesin = RekomendasiLowongan(alumni_list, lowongan_list, similarity_threshold)
        rekomendasi = mesin.rekomendasi_untuk_alumni(alumni_id, top_n=top_n)
        print(json.dumps(rekomendasi, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
