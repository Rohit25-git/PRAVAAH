from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database.session import get_db
from backend.app.models.transaction import Transaction
from backend.app.schemas.transaction import TransactionOut, TransactionListResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=TransactionListResponse)
def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    transaction_type: Optional[str] = None,
    district: Optional[str] = None,
    bank: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    min_risk: Optional[float] = None,
    sort_by: str = "timestamp",
    sort_order: str = "desc",
    db: Session = Depends(get_db)
):
    q = db.query(Transaction)

    if search:
        s = f"%{search}%"
        q = q.filter(
            (Transaction.transaction_reference.ilike(s)) |
            (Transaction.account_id.ilike(s)) |
            (Transaction.atm_id.ilike(s)) |
            (Transaction.district.ilike(s))
        )

    if transaction_type:
        q = q.filter(Transaction.transaction_type == transaction_type)
    if district:
        q = q.filter(Transaction.district == district)
    if bank:
        q = q.filter(Transaction.bank == bank)
    if min_amount is not None:
        q = q.filter(Transaction.amount >= min_amount)
    if max_amount is not None:
        q = q.filter(Transaction.amount <= max_amount)
    if min_risk is not None:
        q = q.filter(Transaction.risk_indicator >= min_risk)

    # Sorting
    sort_col = getattr(Transaction, sort_by, Transaction.timestamp)
    q = q.order_by(sort_col.desc() if sort_order.lower() == "desc" else sort_col.asc())

    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()

    return TransactionListResponse(
        items=[TransactionOut.from_orm(t) for t in items],
        total=total,
        page=page,
        limit=limit
    )

@router.get("/{id}", response_model=TransactionOut)
def get_transaction_by_id(id: int, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return t
