import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any

def clean_and_order_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans, deduplicates, and temporally orders transaction records.
    Ensures lat/lon bounds within India (approx lat: 8-37, lon: 68-98).
    """
    if df.empty:
        return df

    df = df.copy()
    df = df.drop_duplicates(subset=["transaction_reference"])
    
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"])

    df = df.sort_values(by="timestamp").reset_index(drop=True)
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    
    # Clip coordinates within geographic bounds of India
    df["latitude"] = df["latitude"].clip(lower=8.0, upper=37.5)
    df["longitude"] = df["longitude"].clip(lower=68.0, upper=97.5)
    
    return df

def clean_and_order_complaints(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans, deduplicates, and temporally orders cybercrime complaint records.
    """
    if df.empty:
        return df

    df = df.copy()
    df = df.drop_duplicates(subset=["complaint_reference"])
    
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"])

    df = df.sort_values(by="timestamp").reset_index(drop=True)
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    df["category"] = df["category"].fillna("Financial Cyber Fraud")
    
    return df
