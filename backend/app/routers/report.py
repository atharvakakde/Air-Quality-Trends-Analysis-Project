from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json

from ..db import get_db
from ..schemas import ReportIn
from ..services.reporter import make_report
from ..services.llama_client import generate_llm_report, generate_llm_forecast_report


router = APIRouter()


@router.post("/report/generate")
def generate_report(payload: ReportIn, db: Session = Depends(get_db)):
    pdf_bytes = make_report(payload)
    filename = f"{payload.report_type}_report.pdf"
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.post("/llm-comparison-note")
def generate_llm_comparison_report(report_data: Dict[str, Any]):
    """
    Generate LLM-powered comparison report using Gemma3:4b
    """
    try:
        # Extract data from the request
        comparison_data = report_data.get("comparisonData", {})
        chart_data = report_data.get("chartData", {})
        cities = report_data.get("cities", [])
        period_days = report_data.get("periodDays", 7)
        show_combined = report_data.get("showCombined", False)
        
        # Generate the LLM report
        llm_response = generate_llm_report(comparison_data, chart_data, cities, period_days, show_combined)
        
        return llm_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate LLM report: {str(e)}")


@router.post("/llm-forecast-note")
def generate_llm_forecast_report_endpoint(report_data: Dict[str, Any]):
    """
    Generate LLM-powered forecast report using Gemma3:4b
    """
    try:
        # Extract data from the request
        forecast_data = report_data.get("forecastData", {})
        chart_data = report_data.get("chartData", {})
        cities = report_data.get("cities", [])
        horizon_days = report_data.get("horizonDays", 7)
        train_days = report_data.get("trainDays", 30)
        show_ci = report_data.get("showCI", False)
        show_combined = report_data.get("showCombined", False)
        selected_model = report_data.get("selectedModel", "sarimax")
        
        # Generate the LLM forecast report
        llm_response = generate_llm_forecast_report(forecast_data, chart_data, cities, horizon_days, train_days, show_ci, show_combined, selected_model)
        
        return llm_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate LLM forecast report: {str(e)}")


