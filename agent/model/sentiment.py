from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class SentimentAnalysis(BaseModel):
    """Model for sentiment analysis results"""
    headline: str
    source: str
    timestamp: datetime
    sentiment_score: float  # -1.0 to 1.0 (negative to positive)
    confidence: float  # 0.0 to 1.0
    entities: List[str]
    summary: str
    
    
class TradingSignal(BaseModel):
    """Model for trading signals based on sentiment"""
    cryptocurrency: str
    signal_type: str  # "buy", "sell", "hold"
    confidence: float  # 0.0 to 1.0
    sentiment_score: float
    reasoning: str
    timestamp: datetime
    sources: List[str]
    image_url: Optional[str] = None 