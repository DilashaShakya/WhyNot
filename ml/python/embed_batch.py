#!/usr/bin/env python3
"""Batch embedding worker: stdin JSON -> stdout JSON (sentence-transformers)."""
from __future__ import annotations

import json
import sys
from typing import Any


def main() -> None:
    try:
        payload: dict[str, Any] = json.load(sys.stdin)
        texts: list[str] = payload.get("texts") or []
        model_name: str = payload.get("model") or "sentence-transformers/all-MiniLM-L6-v2"
        if not isinstance(texts, list) or not all(isinstance(t, str) for t in texts):
            raise ValueError("texts must be a list of strings")
        if not texts:
            json.dump({"vectors": [], "dim": 0, "error": None}, sys.stdout)
            return

        import torch
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer(model_name)
        ctx = torch.inference_mode if hasattr(torch, "inference_mode") else torch.no_grad
        with ctx():
            mat = model.encode(
                texts,
                normalize_embeddings=True,
                show_progress_bar=False,
                convert_to_numpy=True,
            )
        out = {
            "vectors": mat.tolist(),
            "dim": int(mat.shape[1]),
            "error": None,
        }
        json.dump(out, sys.stdout)
    except Exception as e:  # noqa: BLE001 - return error payload to Ruby
        json.dump({"vectors": None, "dim": None, "error": str(e)}, sys.stdout)


if __name__ == "__main__":
    main()
