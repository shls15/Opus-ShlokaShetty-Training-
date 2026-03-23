import streamlit as st
import numpy as np
import pickle

def recommend_for_user_content_only(user_id: str, artifacts, N=10, exclude_seen=True):
    item_content   = artifacts["item_content"]
    items_meta     = artifacts["items_meta"]
    user_index     = artifacts["user_index"]
    item_index     = artifacts["item_index"]
    ui             = artifacts["ui"]
    user_profiles  = artifacts["user_profiles"]
    popularity     = artifacts["popularity"]

    if user_id not in user_index.index:
        vals = popularity.to_numpy()
        idx  = np.argsort(-vals)[:N]
        codes = item_index.index[idx]
        return (items_meta.loc[codes]
                .assign(StockCode=codes, reason="cold-start")
                .reset_index(drop=True))

    u = int(user_index[user_id])
    uvec = user_profiles[u]
    if uvec.nnz == 0:
        vals = popularity.to_numpy()
        idx  = np.argsort(-vals)[:N]
        codes = item_index.index[idx]
        return (items_meta.loc[codes]
                .assign(StockCode=codes, reason="empty-profile")
                .reset_index(drop=True))

    scores = (uvec @ item_content.T).A1  # cosine similarity (vectors already normalized)
    if exclude_seen:
        seen = set(ui[u].indices)
        if seen:
            scores[list(seen)] = -np.inf

    top_idx = np.argpartition(-scores, range(min(N, len(scores))))[:N]
    top_idx = top_idx[np.argsort(-scores[top_idx])]
    codes   = item_index.index[top_idx]
    out = (items_meta.loc[codes]
           .assign(StockCode=codes, score=scores[top_idx])
           .reset_index(drop=True))
    return out

st.set_page_config(page_title="Basic Recommender", layout="centered")
st.title("Product Reccomendation System")

@st.cache_resource(show_spinner=True)
def load_artifacts(path="artifacts/content_recommender.pkl"):
    with open(path, "rb") as f:
        return pickle.load(f)

artifacts = load_artifacts()

user_id = st.text_input("Enter CustomerID (exact as in data)", value="")
topN = st.number_input("Top-N", min_value=1, max_value=50, value=10, step=1)
exclude_seen = st.checkbox("Exclude items already purchased", value=True)

if st.button("Predict"):
    if not user_id.strip():
        st.warning("Please enter a valid CustomerID.")
    else:
        recs = recommend_for_user_content_only(
            user_id=user_id.strip(),
            artifacts=artifacts,
            N=int(topN),
            exclude_seen=exclude_seen
        )
        st.success(f"Top {len(recs)} recommendations")
        cols = ['StockCode', 'Description']
        if 'score' in recs.columns: cols.append('score')
        st.dataframe(recs[cols], use_container_width=True)

        