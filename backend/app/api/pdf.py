"""
PDF API Endpoints
Handles PDF upload, analysis, and summarization
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
import PyPDF2
import io
from app.core.pdf_analyzer import PDFAnalyzerAgent
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/pdf", tags=["PDF"])

# Initialize PDF analyzer
pdf_analyzer = PDFAnalyzerAgent()


class PDFAnalysisRequest(BaseModel):
    text: str
    filename: str
    page_count: int
    summary_length: str = "medium"  # short, medium, long


@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and parse PDF file
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Read PDF content
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        
        # Extract text using PyPDF2
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        page_count = len(pdf_reader.pages)
        
        # Extract text from all pages
        full_text = ""
        pages_text = []
        
        for page_num in range(page_count):
            page = pdf_reader.pages[page_num]
            page_text = page.extract_text()
            pages_text.append(page_text)
            full_text += page_text + "\n\n"
        
        # Get metadata
        metadata = {
            "title": pdf_reader.metadata.get('/Title', 'Unknown'),
            "author": pdf_reader.metadata.get('/Author', 'Unknown'),
            "pages": page_count
        }
        
        return {
            "filename": file.filename,
            "page_count": page_count,
            "full_text": full_text,
            "pages": pages_text,
            "metadata": metadata,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@router.post("/analyze")
async def analyze_pdf(
    request: PDFAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Comprehensive PDF analysis
    """
    try:
        analysis = await pdf_analyzer.analyze_document(
            text=request.text,
            filename=request.filename,
            page_count=request.page_count
        )
        
        return {
            "analysis": analysis,
            "filename": request.filename,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_pdf(
    request: PDFAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate document summary
    """
    try:
        summary = await pdf_analyzer.generate_summary(
            text=request.text,
            length=request.summary_length
        )
        
        return {
            "summary": summary,
            "length": request.summary_length,
            "filename": request.filename,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/key-points")
async def extract_key_points(
    text: str,
    num_points: int = 10,
    current_user: User = Depends(get_current_user)
):
    """
    Extract key points from document
    """
    try:
        key_points = await pdf_analyzer.extract_key_points(
            text=text,
            num_points=num_points
        )
        
        return {
            "key_points": key_points,
            "count": len(key_points),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sections")
async def identify_sections(
    text: str,
    current_user: User = Depends(get_current_user)
):
    """
    Identify document sections
    """
    try:
        sections = await pdf_analyzer.identify_sections(text=text)
        
        return {
            "sections": sections,
            "count": len(sections),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/citations")
async def extract_citations(
    text: str,
    current_user: User = Depends(get_current_user)
):
    """
    Extract citations from document
    """
    try:
        citations = await pdf_analyzer.extract_citations(text=text)
        
        return {
            "citations": citations,
            "count": len(citations),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/data-insights")
async def analyze_data_insights(
    text: str,
    current_user: User = Depends(get_current_user)
):
    """
    Extract and analyze data insights
    """
    try:
        insights = await pdf_analyzer.analyze_data_insights(text=text)
        
        return {
            "insights": insights,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/page-summaries")
async def generate_page_summaries(
    pages: List[str],
    current_user: User = Depends(get_current_user)
):
    """
    Generate summary for each page
    """
    try:
        summaries = await pdf_analyzer.page_by_page_summary(pages=pages)
        
        return {
            "summaries": summaries,
            "total_pages": len(pages),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare")
async def compare_pdfs(
    doc1_text: str,
    doc2_text: str,
    doc1_name: str,
    doc2_name: str,
    current_user: User = Depends(get_current_user)
):
    """
    Compare two documents
    """
    try:
        comparison = await pdf_analyzer.compare_documents(
            doc1_text=doc1_text,
            doc2_text=doc2_text,
            doc1_name=doc1_name,
            doc2_name=doc2_name
        )
        
        return {
            "comparison": comparison,
            "documents": [doc1_name, doc2_name],
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/full-analysis")
async def full_pdf_analysis(
    file: UploadFile = File(...),
    summary_length: str = "medium",
    current_user: User = Depends(get_current_user)
):
    """
    Complete PDF analysis pipeline
    Upload, parse, analyze, summarize, extract insights - all in one
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # 1. Extract text
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        page_count = len(pdf_reader.pages)
        
        full_text = ""
        pages_text = []
        
        for page_num in range(page_count):
            page = pdf_reader.pages[page_num]
            page_text = page.extract_text()
            pages_text.append(page_text)
            full_text += page_text + "\n\n"
        
        metadata = {
            "title": pdf_reader.metadata.get('/Title', 'Unknown'),
            "author": pdf_reader.metadata.get('/Author', 'Unknown'),
            "pages": page_count
        }
        
        # 2. Comprehensive analysis
        analysis = await pdf_analyzer.analyze_document(
            text=full_text,
            filename=file.filename,
            page_count=page_count,
            metadata=metadata
        )
        
        # 3. Generate summary
        summary = await pdf_analyzer.generate_summary(
            text=full_text,
            length=summary_length
        )
        
        # 4. Extract key points
        key_points = await pdf_analyzer.extract_key_points(
            text=full_text,
            num_points=10
        )
        
        # 5. Identify sections
        sections = await pdf_analyzer.identify_sections(text=full_text)
        
        # 6. Extract citations
        citations = await pdf_analyzer.extract_citations(text=full_text)
        
        # 7. Data insights
        insights = await pdf_analyzer.analyze_data_insights(text=full_text)
        
        return {
            "filename": file.filename,
            "metadata": metadata,
            "page_count": page_count,
            "analysis": analysis,
            "summary": summary,
            "key_points": key_points,
            "sections": sections,
            "citations": citations,
            "insights": insights,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in full analysis: {str(e)}")
