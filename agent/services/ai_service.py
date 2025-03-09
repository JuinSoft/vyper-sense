import json
import logging
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from openai import OpenAI
import requests

from agent.model.sentiment import SentimentAnalysis, TradingSignal

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def analyze_sentiment(self, articles: List[Dict[str, Any]]) -> List[SentimentAnalysis]:
        """
        Analyze the sentiment of cryptocurrency news articles
        
        Args:
            articles: List of article dictionaries
            
        Returns:
            List of SentimentAnalysis objects
        """
        try:
            if not articles:
                return []
                
            functions = [
                {
                    "name": "analyze_crypto_sentiment",
                    "description": "Analyze sentiment of cryptocurrency news articles",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "analyses": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "headline": {
                                            "type": "string",
                                            "description": "The news headline",
                                        },
                                        "source": {
                                            "type": "string",
                                            "description": "Source of the article",
                                        },
                                        "sentiment_score": {
                                            "type": "number",
                                            "description": "Sentiment score from -1.0 (negative) to 1.0 (positive)",
                                        },
                                        "confidence": {
                                            "type": "number",
                                            "description": "Confidence in the sentiment analysis from 0.0 to 1.0",
                                        },
                                        "entities": {
                                            "type": "array",
                                            "items": {"type": "string"},
                                            "description": "Cryptocurrency entities mentioned in the article",
                                        },
                                        "summary": {
                                            "type": "string",
                                            "description": "Brief summary of the sentiment analysis",
                                        },
                                    },
                                    "required": ["headline", "source", "sentiment_score", "confidence", "entities", "summary"],
                                },
                            }
                        },
                        "required": ["analyses"],
                    },
                }
            ]

            # Prepare articles for analysis
            article_data = []
            for article in articles:
                article_data.append({
                    "title": article["title"],
                    "summary": article["summary"],
                    "source": article["source"],
                    "link": article["link"],
                    "published": article["published"].isoformat() if isinstance(article["published"], datetime) else article["published"]
                })

            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert cryptocurrency analyst with deep knowledge of market sentiment.
                        Analyze each news article for sentiment regarding cryptocurrencies.
                        For each article:
                        1. Determine the overall sentiment (positive, negative, or neutral)
                        2. Assign a sentiment score from -1.0 (very negative) to 1.0 (very positive)
                        3. Identify which cryptocurrencies are mentioned
                        4. Provide a brief summary of the sentiment analysis
                        5. Assign a confidence score from 0.0 to 1.0 based on how clear the sentiment is
                        
                        Be precise and objective in your analysis. Focus on market implications rather than
                        technological achievements unless they have clear market impact.""",
                    },
                    {
                        "role": "user",
                        "content": f"Analyze the sentiment of these cryptocurrency news articles: {json.dumps(article_data)}",
                    },
                ],
                functions=functions,
                function_call={"name": "analyze_crypto_sentiment"},
            )

            result = json.loads(response.choices[0].message.function_call.arguments)
            
            # Convert to SentimentAnalysis objects
            sentiment_analyses = []
            for analysis in result["analyses"]:
                sentiment_analyses.append(
                    SentimentAnalysis(
                        headline=analysis["headline"],
                        source=analysis["source"],
                        timestamp=datetime.now(),
                        sentiment_score=analysis["sentiment_score"],
                        confidence=analysis["confidence"],
                        entities=analysis["entities"],
                        summary=analysis["summary"]
                    )
                )
            
            return sentiment_analyses

        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return []

    def generate_trading_signals(self, sentiment_analyses: List[SentimentAnalysis], 
                                top_cryptocurrencies: List[str]) -> List[TradingSignal]:
        """
        Generate trading signals based on sentiment analyses
        
        Args:
            sentiment_analyses: List of SentimentAnalysis objects
            top_cryptocurrencies: List of top cryptocurrencies to focus on
            
        Returns:
            List of TradingSignal objects
        """
        try:
            if not sentiment_analyses:
                return []
                
            functions = [
                {
                    "name": "generate_trading_signals",
                    "description": "Generate trading signals based on sentiment analyses",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "signals": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "cryptocurrency": {
                                            "type": "string",
                                            "description": "Name of the cryptocurrency",
                                        },
                                        "signal_type": {
                                            "type": "string",
                                            "description": "Type of trading signal: buy, sell, or hold",
                                            "enum": ["buy", "sell", "hold"]
                                        },
                                        "confidence": {
                                            "type": "number",
                                            "description": "Confidence in the trading signal from 0.0 to 1.0",
                                        },
                                        "sentiment_score": {
                                            "type": "number",
                                            "description": "Overall sentiment score from -1.0 to 1.0",
                                        },
                                        "reasoning": {
                                            "type": "string",
                                            "description": "Reasoning behind the trading signal",
                                        },
                                        "sources": {
                                            "type": "array",
                                            "items": {"type": "string"},
                                            "description": "Sources supporting this trading signal",
                                        },
                                    },
                                    "required": ["cryptocurrency", "signal_type", "confidence", "sentiment_score", "reasoning", "sources"],
                                },
                            }
                        },
                        "required": ["signals"],
                    },
                }
            ]

            # Prepare sentiment analyses for signal generation
            sentiment_data = []
            for analysis in sentiment_analyses:
                sentiment_data.append({
                    "headline": analysis.headline,
                    "source": analysis.source,
                    "sentiment_score": analysis.sentiment_score,
                    "confidence": analysis.confidence,
                    "entities": analysis.entities,
                    "summary": analysis.summary,
                    "timestamp": analysis.timestamp.isoformat()
                })

            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are an expert cryptocurrency trader who generates trading signals based on news sentiment.
                        Focus on these top cryptocurrencies: {', '.join(top_cryptocurrencies)}.
                        For each cryptocurrency that has significant sentiment data:
                        1. Determine if the overall sentiment suggests a buy, sell, or hold signal
                        2. Assign a confidence score from 0.0 to 1.0 based on the strength of the signal
                        3. Calculate an overall sentiment score from -1.0 to 1.0
                        4. Provide clear reasoning for the trading signal
                        5. List the sources supporting this signal
                        
                        Be conservative with your signals - only suggest buy or sell when there is strong evidence.
                        Otherwise, suggest hold. Consider both the sentiment score and confidence in your analysis.""",
                    },
                    {
                        "role": "user",
                        "content": f"Generate trading signals based on these sentiment analyses: {json.dumps(sentiment_data)}",
                    },
                ],
                functions=functions,
                function_call={"name": "generate_trading_signals"},
            )

            result = json.loads(response.choices[0].message.function_call.arguments)
            
            # Convert to TradingSignal objects
            trading_signals = []
            for signal in result["signals"]:
                trading_signals.append(
                    TradingSignal(
                        cryptocurrency=signal["cryptocurrency"],
                        signal_type=signal["signal_type"],
                        confidence=signal["confidence"],
                        sentiment_score=signal["sentiment_score"],
                        reasoning=signal["reasoning"],
                        timestamp=datetime.now(),
                        sources=signal["sources"]
                    )
                )
            
            return trading_signals

        except Exception as e:
            logger.error(f"Error generating trading signals: {str(e)}")
            return []
            
    def generate_visualization(self, trading_signal: TradingSignal) -> Optional[str]:
        """
        Generate a visualization image for a trading signal
        
        Args:
            trading_signal: TradingSignal object
            
        Returns:
            URL of the generated image, or None if generation failed
        """
        try:
            # Determine color based on signal type
            color = "green" if trading_signal.signal_type == "buy" else "red" if trading_signal.signal_type == "sell" else "yellow"
            
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=f"""Create a professional cryptocurrency trading signal visualization for {trading_signal.cryptocurrency}.
                Signal type: {trading_signal.signal_type.upper()} (use {color} color theme)
                Sentiment score: {trading_signal.sentiment_score:.2f}
                Confidence: {trading_signal.confidence:.2f}
                
                The image should:
                - Have a clean, professional financial/trading appearance
                - Include the cryptocurrency name and logo
                - Prominently display the {trading_signal.signal_type.upper()} signal
                - Use a {color} color scheme to indicate the signal type
                - Include visual indicators of sentiment and confidence
                - Have a modern, digital aesthetic suitable for crypto trading
                
                Do NOT include any text explaining the reasoning - just the key metrics and signal.
                Make it visually appealing and suitable for sharing on social media.""",
                size="1024x1024",
                quality="standard",
                n=1,
            )

            image_url = response.data[0].url

            # Save the image under visualization/{time}/
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            directory = f"visualization/{timestamp}/"
            os.makedirs(directory, exist_ok=True)
            image_path = os.path.join(directory, f"{trading_signal.cryptocurrency}_{trading_signal.signal_type}.png")

            # Download the image from the URL and save it
            image_content = requests.get(image_url).content
            with open(image_path, "wb") as image_file:
                image_file.write(image_content)

            return image_url

        except Exception as e:
            logger.error(f"Error generating visualization: {str(e)}")
            return None 