import numpy as np
import pandas as pd
from typing import Dict, List, Any
from datetime import datetime, timedelta

def extract_transaction_features(df_tx: pd.DataFrame) -> pd.DataFrame:
    """Extracts row-level transaction features for Isolation Forest"""
    if df_tx.empty:
        return pd.DataFrame(columns=["amount", "hour", "day_of_week", "is_atm", "velocity"])

    df = df_tx.copy()
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"])

    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_atm"] = (df["transaction_type"] == "ATM_WITHDRAWAL").astype(int)
    
    mean_amt = df["amount"].mean() if len(df) > 0 else 1.0
    df["velocity"] = df["amount"] / (mean_amt if mean_amt > 0 else 1.0)
    return df

def generate_spatial_temporal_features(
    district: str,
    state: str,
    cutoff_time: datetime,
    historical_days: int,
    transactions: List[Any],
    complaints: List[Any],
    atms: List[Any],
    graph_metrics: Dict[str, Any]
) -> Dict[str, float]:
    """
    Constructs complaint-driven and transaction-driven features strictly from 
    the observation window [cutoff_time - historical_days, cutoff_time] 
    to guarantee ZERO TEMPORAL LEAKAGE.
    """
    window_start = cutoff_time - timedelta(days=historical_days)
    t_24h = cutoff_time - timedelta(hours=24)
    t_7d = cutoff_time - timedelta(days=7)

    # Filter to observation window
    obs_tx = [
        t for t in transactions 
        if t.district == district and window_start <= t.timestamp <= cutoff_time
    ]
    obs_cp = [
        c for c in complaints 
        if c.district == district and window_start <= c.timestamp <= cutoff_time
    ]
    dist_atms = [a for a in atms if a.district == district]

    # --- 1. Transaction & Withdrawal Features ---
    tx_count = len(obs_tx)
    withdrawals = [t for t in obs_tx if t.transaction_type == "ATM_WITHDRAWAL"]
    withdrawal_count = len(withdrawals)
    amounts = [t.amount for t in obs_tx]
    total_amount = sum(amounts)
    avg_amount = total_amount / tx_count if tx_count > 0 else 0.0
    max_amount = max(amounts) if amounts else 0.0
    
    # Velocity: ratio of last 24h count to daily baseline
    recent_24h_tx = sum(1 for t in obs_tx if t.timestamp >= t_24h)
    daily_baseline = (tx_count / max(1, historical_days))
    amount_velocity = (recent_24h_tx / daily_baseline) if daily_baseline > 0 else 1.0
    withdrawal_frequency = (withdrawal_count / tx_count) if tx_count > 0 else 0.0

    # --- 2. Temporal Features ---
    hour_val = cutoff_time.hour
    day_of_week = cutoff_time.weekday()
    weekend_indicator = 1.0 if day_of_week in [5, 6] else 0.0
    activity_change_rate = amount_velocity

    # --- 3. Complaint Features (Primary Predictive Input) ---
    complaint_count = len(obs_cp)
    recent_24h_cp = sum(1 for c in obs_cp if c.timestamp >= t_24h)
    recent_7d_cp = sum(1 for c in obs_cp if c.timestamp >= t_7d)
    
    # Complaint Recency (hours since most recent complaint)
    if obs_cp:
        most_recent_cp_time = max(c.timestamp for c in obs_cp)
        complaint_recency = max(0.0, (cutoff_time - most_recent_cp_time).total_seconds() / 3600.0)
    else:
        complaint_recency = 168.0  # 1 week default

    # Complaint Growth Rate
    cp_baseline = (recent_7d_cp / 7.0) if recent_7d_cp > 0 else 1.0
    complaint_growth_rate = (recent_24h_cp / cp_baseline) if cp_baseline > 0 else 1.0

    # Complaint Category Frequency (Financial fraud dominance)
    fin_fraud_cp = sum(1 for c in obs_cp if "fraud" in c.category.lower() or "upi" in c.category.lower())
    crime_category_frequency = (fin_fraud_cp / complaint_count) if complaint_count > 0 else 0.0

    # Spatial & Temporal Density
    complaint_density = float(complaint_count) / max(1.0, len(dist_atms))
    complaint_to_withdrawal_relationship = (float(complaint_count) / float(withdrawal_count)) if withdrawal_count > 0 else float(complaint_count)

    # --- 4. Geospatial Features ---
    nearby_complaints = float(complaint_count)
    nearby_transactions = float(tx_count)
    nearby_atms = float(len(dist_atms))
    local_transaction_density = nearby_transactions / max(1.0, nearby_atms)
    local_complaint_density = complaint_density
    distance_to_nearest_atm = 450.0  # meters approx average

    # --- 5. Network Features ---
    degree = float(graph_metrics.get("degree", 6))
    pagerank = float(graph_metrics.get("pagerank", 0.55))
    betweenness = float(graph_metrics.get("betweenness", 0.12))
    linked_accounts = float(graph_metrics.get("linked_accounts", 4))
    shared_phone_count = float(graph_metrics.get("shared_phone_count", 2))

    return {
        "transaction_count": float(tx_count),
        "withdrawal_count": float(withdrawal_count),
        "total_amount": float(total_amount),
        "average_amount": float(avg_amount),
        "maximum_amount": float(max_amount),
        "amount_velocity": float(amount_velocity),
        "withdrawal_frequency": float(withdrawal_frequency),
        "hour": float(hour_val),
        "day_of_week": float(day_of_week),
        "weekend_indicator": float(weekend_indicator),
        "activity_change_rate": float(activity_change_rate),
        "complaint_count": float(complaint_count),
        "complaint_recency": float(complaint_recency),
        "complaint_growth_rate": float(complaint_growth_rate),
        "crime_category_frequency": float(crime_category_frequency),
        "complaint_density": float(complaint_density),
        "complaint_to_withdrawal_relationship": float(complaint_to_withdrawal_relationship),
        "nearby_complaints": nearby_complaints,
        "nearby_transactions": nearby_transactions,
        "nearby_atms": nearby_atms,
        "local_transaction_density": local_transaction_density,
        "local_complaint_density": local_complaint_density,
        "distance_to_nearest_atm": distance_to_nearest_atm,
        "degree": degree,
        "pagerank": pagerank,
        "betweenness": betweenness,
        "linked_accounts": linked_accounts,
        "shared_phone_count": shared_phone_count
    }
