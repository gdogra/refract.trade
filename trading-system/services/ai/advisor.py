"""
AI Advisory Service - Strictly Advisory Only.

CRITICAL CONSTRAINTS:
- Cannot execute trades or access broker APIs
- Cannot generate executable TradeSignals without user approval
- Provides TradeIdeas that require human approval
- Focuses on analysis, suggestions, and risk assessment
"""

import os
import logging
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime
from decimal import Decimal

try:
    import openai
    from openai import AsyncOpenAI
except ImportError:
    raise ImportError("openai required for AI service. Install with: pip install openai")

from domain.models import (
    TradeIdea, PositionSnapshot, AccountSnapshot, VolatilitySnapshot, 
    OptionChainSummary, SignalSource, Side, create_trade_idea, create_trade_signal
)
from domain.simple_events import DomainEvent, create_trade_idea_generated_event


class AIAdvisorService:
    """
    AI Trading Advisor - Advisory Only Service.
    
    STRICT LIMITATIONS:
    - NO access to broker APIs
    - NO direct trade execution
    - NO automatic signal generation
    - ONLY provides suggestions requiring human approval
    
    Capabilities:
    - Portfolio analysis and risk assessment
    - Market commentary and insights
    - Trade idea generation (requires approval)
    - Options strategy suggestions
    - Risk management advice
    """
    
    def __init__(self, event_publisher: Callable[[DomainEvent], None]):
        self.event_publisher = event_publisher
        self.logger = logging.getLogger(__name__)
        
        # OpenAI configuration (optional)
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            self.client = AsyncOpenAI(api_key=api_key)
            self.ai_enabled = True
        else:
            self.client = None
            self.ai_enabled = False
            self.logger.warning("OPENAI_API_KEY not set - AI features disabled")
        self.model = "gpt-3.5-turbo"  # Use GPT-3.5-turbo instead of GPT-4
        self.max_tokens = 2000
        self.temperature = 0.3  # Conservative for financial advice
        
        # System prompt for AI safety
        self.system_prompt = """
        You are a risk-aware trading analyst assistant. You provide cautious, 
        well-researched trade ideas and portfolio analysis.
        
        CRITICAL RULES:
        - You do NOT guarantee returns or outcomes
        - You emphasize risks in all suggestions
        - You recommend position sizing appropriate for risk tolerance
        - You suggest diversification and risk management
        - You remind users that all trading involves risk of loss
        - You encourage users to do their own research
        
        Focus on education, risk awareness, and conservative strategies.
        """
    
    async def analyze_portfolio_risk(
        self,
        account: AccountSnapshot,
        positions: List[PositionSnapshot],
        market_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze portfolio for risk and opportunities.
        
        Provides risk assessment without execution capabilities.
        """
        try:
            if not self.ai_enabled:
                return {
                    "analysis": "AI features disabled. Please set OPENAI_API_KEY to enable AI analysis.",
                    "risk_score": 50,
                    "diversification_score": 50,
                    "recommendations": ["Set up OpenAI API key for AI analysis"],
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            self.logger.info("Generating AI portfolio risk analysis")
            
            # Prepare portfolio summary
            total_exposure = sum(abs(pos.exposure_pct) for pos in positions)
            largest_position = max(positions, key=lambda p: abs(p.exposure_pct)) if positions else None
            
            portfolio_summary = {
                "total_equity": float(account.equity),
                "buying_power": float(account.buying_power),
                "cash_pct": float(account.cash / account.equity) * 100 if account.equity > 0 else 0,
                "total_exposure": total_exposure,
                "position_count": len(positions),
                "largest_position": {
                    "symbol": largest_position.symbol,
                    "exposure_pct": largest_position.exposure_pct
                } if largest_position else None,
                "positions": [
                    {
                        "symbol": pos.symbol,
                        "qty": pos.qty,
                        "exposure_pct": pos.exposure_pct,
                        "unrealized_pl": float(pos.unrealized_pl)
                    }
                    for pos in positions
                ]
            }
            
            prompt = f"""
            Analyze this portfolio for risk and provide specific insights:
            
            Portfolio: {portfolio_summary}
            Market Context: {market_context}
            
            Provide analysis focusing on:
            1. Concentration risk assessment
            2. Diversification opportunities
            3. Risk/reward balance
            4. Potential vulnerabilities
            5. Conservative improvement suggestions
            
            Format as structured analysis with specific, actionable insights.
            Emphasize risk management and conservative approaches.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            analysis = response.choices[0].message.content
            
            return {
                "analysis": analysis,
                "risk_score": self._calculate_risk_score(positions, account),
                "diversification_score": self._calculate_diversification_score(positions),
                "recommendations": self._extract_recommendations(analysis),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error in portfolio risk analysis: {e}")
            return {
                "analysis": "AI analysis temporarily unavailable. Please review portfolio manually.",
                "risk_score": 50,  # Neutral default
                "diversification_score": 50,
                "recommendations": ["Consult financial advisor for portfolio review"],
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }
    
    async def generate_trade_ideas(
        self,
        account: AccountSnapshot,
        positions: List[PositionSnapshot],
        market_context: Dict[str, Any],
        max_ideas: int = 3
    ) -> List[TradeIdea]:
        """
        Generate trade ideas that require user approval.
        
        Ideas are SUGGESTIONS ONLY - no automatic execution.
        """
        try:
            if not self.ai_enabled:
                return []
            
            self.logger.info(f"Generating {max_ideas} AI trade ideas")
            
            # Prepare context for AI
            context = {
                "account_size": float(account.equity),
                "available_cash": float(account.buying_power),
                "current_positions": [pos.symbol for pos in positions],
                "market_context": market_context
            }
            
            prompt = f"""
            Given this portfolio and market context, suggest {max_ideas} conservative trade ideas:
            
            Context: {context}
            
            For each idea, provide:
            1. Clear description of the trade
            2. Detailed rationale based on current market conditions
            3. Specific risks to consider
            4. Appropriate position sizing for risk management
            5. Confidence level (low/medium/high)
            
            Focus on:
            - Risk-appropriate position sizes
            - Diversification benefits
            - Conservative entry/exit strategies
            - Risk management considerations
            
            Format each idea clearly with risk warnings.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            ideas_text = response.choices[0].message.content
            trade_ideas = self._parse_trade_ideas(ideas_text, market_context)
            
            # Publish trade idea events
            for idea in trade_ideas:
                idea_event = create_trade_idea_generated_event(idea)
                self.event_publisher(idea_event)
            
            self.logger.info(f"Generated {len(trade_ideas)} trade ideas")
            return trade_ideas
            
        except Exception as e:
            self.logger.error(f"Error generating trade ideas: {e}")
            return []
    
    async def analyze_options_strategies(
        self,
        account: AccountSnapshot,
        positions: List[PositionSnapshot],
        volatility_data: VolatilitySnapshot,
        options_data: OptionChainSummary
    ) -> Dict[str, Any]:
        """
        Suggest options strategies based on current portfolio and market conditions.
        
        Provides educational analysis of options strategies.
        """
        try:
            if not self.ai_enabled:
                return {
                    "analysis": "AI features disabled. Please set OPENAI_API_KEY to enable options analysis.",
                    "volatility_regime": "unknown",
                    "recommended_strategies": [],
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            self.logger.info("Analyzing options strategies")
            
            vol_regime = "high" if volatility_data.vix_level > 25 else "low" if volatility_data.vix_level < 15 else "normal"
            
            context = {
                "portfolio_size": float(account.equity),
                "current_positions": [pos.symbol for pos in positions],
                "volatility_regime": vol_regime,
                "vix_level": volatility_data.vix_level,
                "options_summary": {
                    "symbol": options_data.symbol,
                    "put_call_ratio": options_data.put_call_ratio,
                    "total_volume": options_data.total_volume
                }
            }
            
            prompt = f"""
            Analyze options strategies appropriate for current conditions:
            
            Context: {context}
            
            Suggest 2-3 conservative options strategies considering:
            1. Current volatility regime ({vol_regime})
            2. Portfolio protection needs
            3. Income generation opportunities
            4. Risk management applications
            
            For each strategy, explain:
            - Strategy mechanics
            - Market outlook required
            - Risk/reward profile
            - Position sizing guidelines
            - Exit criteria
            
            Emphasize education and risk management.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            return {
                "analysis": response.choices[0].message.content,
                "volatility_regime": vol_regime,
                "recommended_strategies": self._extract_options_strategies(response.choices[0].message.content),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing options strategies: {e}")
            return {
                "analysis": "Options analysis temporarily unavailable.",
                "volatility_regime": "unknown",
                "recommended_strategies": [],
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }
    
    async def answer_trading_question(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Answer trading-related questions with educational focus.
        
        Provides information and education, not trade recommendations.
        """
        try:
            if not self.ai_enabled:
                return "AI features disabled. Please set OPENAI_API_KEY to enable AI Q&A."
            
            context_str = f"\nCurrent Context: {context}" if context else ""
            
            prompt = f"""
            Question: {question}{context_str}
            
            Provide an educational response that:
            1. Answers the question clearly
            2. Explains relevant concepts
            3. Emphasizes risks and considerations
            4. Suggests further research if appropriate
            5. Does not provide specific trade recommendations
            
            Focus on education and risk awareness.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=self.temperature
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            self.logger.error(f"Error answering trading question: {e}")
            return "I'm unable to process your question right now. Please consult financial resources or advisors."
    
    def _calculate_risk_score(self, positions: List[PositionSnapshot], account: AccountSnapshot) -> float:
        """Calculate portfolio risk score (0-100)."""
        if not positions:
            return 20  # Low risk for cash-only portfolio
        
        # Factor 1: Concentration risk
        max_position_pct = max(abs(pos.exposure_pct) for pos in positions)
        concentration_risk = min(max_position_pct * 2, 50)  # 0-50 based on largest position
        
        # Factor 2: Total exposure
        total_exposure = sum(abs(pos.exposure_pct) for pos in positions)
        exposure_risk = min(total_exposure / 2, 30)  # 0-30 based on total exposure
        
        # Factor 3: Number of positions (diversification)
        diversification_risk = max(20 - len(positions) * 2, 0)  # Less risk with more positions
        
        risk_score = concentration_risk + exposure_risk + diversification_risk
        return min(max(risk_score, 0), 100)
    
    def _calculate_diversification_score(self, positions: List[PositionSnapshot]) -> float:
        """Calculate diversification score (0-100)."""
        if not positions:
            return 0
        
        # Simple diversification based on number of positions and concentration
        num_positions = len(positions)
        max_position_pct = max(abs(pos.exposure_pct) for pos in positions)
        
        # Higher score for more positions and lower concentration
        position_score = min(num_positions * 10, 60)  # 0-60 based on count
        concentration_score = max(40 - max_position_pct, 0)  # 0-40 based on concentration
        
        return min(position_score + concentration_score, 100)
    
    def _extract_recommendations(self, analysis_text: str) -> List[str]:
        """Extract actionable recommendations from AI analysis."""
        # Simple extraction - in production, use more sophisticated parsing
        recommendations = []
        lines = analysis_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if any(keyword in line.lower() for keyword in ['recommend', 'consider', 'suggest']):
                if len(line) > 20:  # Filter out short/incomplete lines
                    recommendations.append(line)
        
        return recommendations[:5]  # Limit to top 5
    
    def _parse_trade_ideas(self, ideas_text: str, market_context: Dict[str, Any]) -> List[TradeIdea]:
        """Parse AI-generated trade ideas into TradeIdea objects."""
        ideas = []
        
        # Simple parsing - in production, use structured AI output
        idea_sections = ideas_text.split('\n\n')
        
        for i, section in enumerate(idea_sections):
            if len(section) > 100:  # Filter short sections
                idea = create_trade_idea(
                    description=f"AI Trade Idea #{i+1}",
                    rationale=section[:500],  # Limit length
                    risk_notes="All trades involve risk of loss. Past performance does not guarantee future results.",
                    confidence=0.7,  # Default medium confidence
                    market_context=market_context
                )
                ideas.append(idea)
        
        return ideas[:3]  # Limit to 3 ideas
    
    def _extract_options_strategies(self, analysis_text: str) -> List[str]:
        """Extract options strategy names from analysis."""
        strategies = []
        strategy_keywords = [
            'covered call', 'protective put', 'iron condor', 'butterfly spread',
            'straddle', 'strangle', 'collar', 'credit spread', 'debit spread'
        ]
        
        text_lower = analysis_text.lower()
        for keyword in strategy_keywords:
            if keyword in text_lower:
                strategies.append(keyword.title())
        
        return list(set(strategies))  # Remove duplicates
    
    async def approve_trade_idea(self, idea_id: str, user_notes: Optional[str] = None) -> Optional[TradeIdea]:
        """
        Mark trade idea as approved by user.
        
        This is where the human approval happens in the workflow.
        """
        # In a full implementation, this would:
        # 1. Retrieve the trade idea from storage
        # 2. Mark it as approved
        # 3. Generate a TradeSignal if the idea contains one
        # 4. Return the updated idea
        
        self.logger.info(f"Trade idea {idea_id} approved by user")
        # Placeholder implementation
        return None
    
    async def reject_trade_idea(self, idea_id: str, reason: str) -> bool:
        """Mark trade idea as rejected by user."""
        self.logger.info(f"Trade idea {idea_id} rejected by user: {reason}")
        return True