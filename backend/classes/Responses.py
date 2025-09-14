from pydantic import BaseModel

class ErrorResponse(BaseModel):
    code: int
    message: str
    details: str | None

class WeightsResponse(BaseModel):
    portfolio_weights: dict
    model_coef: dict
    sector_weights: dict