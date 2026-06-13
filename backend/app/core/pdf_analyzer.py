"""
PDF Analyzer Agent
Specialized in analyzing, summarizing, and extracting insights from PDF documents
"""
from typing import Dict, List, Any, Optional
from app.core.agents import BaseAgent
from app.config import settings
import re

class PDFAnalyzerAgent(BaseAgent):
    """Agent specialized in PDF document analysis and summarization"""
    
    def __init__(self):
        super().__init__(
            name="PDF Analyzer Agent",
            model=settings.REASONER_MODEL,  # Using reasoner model for analysis
            description="Analyzes PDF documents, extracts key information, and generates structured summaries"
        )
    
    def _default_system_prompt(self) -> str:
        return """You are a PDF analysis agent specialized in document processing. Your role is to:
1. Analyze PDF document structure and content
2. Extract key information and main points
3. Generate executive summaries
4. Identify sections, subsections, and important data
5. Extract citations, references, and metadata
6. Provide page-by-page breakdown when needed
7. Identify tables, figures, and their significance
8. Generate actionable insights

Always provide structured, well-organized analysis with clear sections."""
    
    async def analyze_document(
        self,
        text: str,
        filename: str,
        page_count: int,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive PDF analysis
        """
        analysis_prompt = f"""
Analyze this document comprehensively:

Filename: {filename}
Pages: {page_count}
{f"Metadata: {metadata}" if metadata else ""}

Document Content:
{text}

Provide a structured analysis with:
1. Executive Summary (200-300 words)
2. Key Findings (bulleted list of 5-10 main points)
3. Document Structure (sections and their page ranges)
4. Important Data/Statistics mentioned
5. Conclusions/Recommendations
6. Citations/References (if any)

Format your response as structured JSON."""

        result = await self.generate(analysis_prompt)
        return self._parse_analysis_result(result)
    
    async def generate_summary(
        self,
        text: str,
        length: str = "medium"
    ) -> str:
        """
        Generate document summary
        
        Args:
            text: Full document text
            length: "short" (100 words), "medium" (300 words), "long" (500 words)
        """
        word_counts = {
            "short": 100,
            "medium": 300,
            "long": 500
        }
        target_words = word_counts.get(length, 300)
        
        summary_prompt = f"""
Summarize the following document in approximately {target_words} words.
Focus on the main arguments, key findings, and important conclusions.

Document:
{text}

Summary:"""

        result = await self.generate(summary_prompt)
        return result.get('response', '') if isinstance(result, dict) else str(result)
    
    async def extract_key_points(
        self,
        text: str,
        num_points: int = 10
    ) -> List[str]:
        """
        Extract key points from document
        """
        extraction_prompt = f"""
Extract the {num_points} most important key points from this document.
Each point should be a single, clear sentence.

Document:
{text}

Return ONLY a numbered list of key points, one per line."""

        result = await self.generate(extraction_prompt)
        response_text = result.get('response', '') if isinstance(result, dict) else str(result)
        
        # Parse numbered list
        points = []
        for line in response_text.strip().split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                # Remove numbering/bullets
                clean_point = re.sub(r'^[\d\.\-•\)]+\s*', '', line)
                if clean_point:
                    points.append(clean_point)
        
        return points[:num_points]
    
    async def identify_sections(
        self,
        text: str
    ) -> List[Dict[str, Any]]:
        """
        Identify document sections and structure
        """
        section_prompt = f"""
Analyze this document and identify its main sections.
For each section, provide:
- Section title/heading
- Brief description (1 sentence)
- Estimated page range or position

Document:
{text}

Format as JSON array of sections."""

        result = await self.generate(section_prompt)
        return self._parse_sections(result)
    
    async def extract_citations(
        self,
        text: str
    ) -> List[str]:
        """
        Extract citations and references from document
        """
        citation_prompt = f"""
Extract all citations, references, and sources mentioned in this document.
List them in a clean, organized format.

Document:
{text}

Citations:"""

        result = await self.generate(citation_prompt)
        response_text = result.get('response', '') if isinstance(result, dict) else str(result)
        
        # Parse citations
        citations = []
        for line in response_text.strip().split('\n'):
            line = line.strip()
            if line and len(line) > 10:  # Filter out empty/short lines
                citations.append(line)
        
        return citations
    
    async def analyze_data_insights(
        self,
        text: str
    ) -> Dict[str, Any]:
        """
        Extract and analyze data insights, statistics, and figures
        """
        insights_prompt = f"""
Analyze all data, statistics, figures, and quantitative information in this document.
Extract:
1. Key statistics and numbers
2. Trends mentioned
3. Comparisons made
4. Data sources
5. Significance of findings

Document:
{text}

Provide structured analysis of data insights."""

        result = await self.generate(insights_prompt)
        return self._parse_data_insights(result)
    
    async def page_by_page_summary(
        self,
        pages: List[str]
    ) -> List[Dict[str, str]]:
        """
        Generate summary for each page
        """
        summaries = []
        
        for i, page_text in enumerate(pages, 1):
            if len(page_text.strip()) < 50:  # Skip nearly empty pages
                continue
                
            page_prompt = f"""
Summarize the content of this page in 2-3 sentences.
Focus on the main points discussed.

Page {i}:
{page_text}

Summary:"""

            result = await self.generate(page_prompt)
            summary_text = result.get('response', '') if isinstance(result, dict) else str(result)
            
            summaries.append({
                "page": i,
                "summary": summary_text.strip()
            })
        
        return summaries
    
    async def compare_documents(
        self,
        doc1_text: str,
        doc2_text: str,
        doc1_name: str,
        doc2_name: str
    ) -> Dict[str, Any]:
        """
        Compare two documents and identify similarities/differences
        """
        comparison_prompt = f"""
Compare these two documents and provide:
1. Main similarities
2. Key differences
3. Unique points in each document
4. Overall assessment

Document 1 ({doc1_name}):
{doc1_text}

Document 2 ({doc2_name}):
{doc2_text}

Comparison Analysis:"""

        result = await self.generate(comparison_prompt)
        return self._parse_comparison(result)
    
    def _parse_analysis_result(self, result: Any) -> Dict[str, Any]:
        """Parse analysis result into structured format"""
        response_text = result.get('response', '') if isinstance(result, dict) else str(result)
        
        # Try to extract structured data
        return {
            "full_analysis": response_text,
            "parsed": self._extract_sections_from_text(response_text)
        }
    
    def _parse_sections(self, result: Any) -> List[Dict[str, Any]]:
        """Parse sections from result"""
        response_text = result.get('response', '') if isinstance(result, dict) else str(result)
        
        sections = []
        # Simple parsing - can be enhanced with more sophisticated logic
        lines = response_text.strip().split('\n')
        
        current_section = {}
        for line in lines:
            line = line.strip()
            if line.startswith(('Section', 'Chapter', '#')):
                if current_section:
                    sections.append(current_section)
                current_section = {"title": line, "description": ""}
            elif current_section and line:
                current_section["description"] += line + " "
        
        if current_section:
            sections.append(current_section)
        
        return sections
    
    def _parse_data_insights(self, result: Any) -> Dict[str, Any]:
        """Parse data insights from result"""
        response_text = result.get('response', '') if isinstance(result, dict) else str(result)
        
        return {
            "full_insights": response_text,
            "structured": self._extract_data_points(response_text)
        }
    
    def _parse_comparison(self, result: Any) -> Dict[str, Any]:
        """Parse comparison result"""
        response_text = result.get('response', '') if isinstance(result, dict) else str(result)
        
        return {
            "comparison": response_text,
            "structured": self._extract_comparison_points(response_text)
        }
    
    def _extract_sections_from_text(self, text: str) -> Dict[str, str]:
        """Extract sections from analysis text"""
        sections = {}
        current_section = None
        current_content = []
        
        for line in text.split('\n'):
            line = line.strip()
            if line.endswith(':') or line.startswith(('1.', '2.', '3.', '4.', '5.')):
                if current_section:
                    sections[current_section] = '\n'.join(current_content)
                current_section = line.rstrip(':')
                current_content = []
            elif line and current_section:
                current_content.append(line)
        
        if current_section:
            sections[current_section] = '\n'.join(current_content)
        
        return sections
    
    def _extract_data_points(self, text: str) -> List[str]:
        """Extract data points from text"""
        data_points = []
        
        # Look for lines with numbers, percentages, statistics
        for line in text.split('\n'):
            line = line.strip()
            if any(char.isdigit() for char in line) and len(line) > 10:
                data_points.append(line)
        
        return data_points
    
    def _extract_comparison_points(self, text: str) -> Dict[str, List[str]]:
        """Extract comparison points"""
        points = {
            "similarities": [],
            "differences": [],
            "unique_doc1": [],
            "unique_doc2": []
        }
        
        current_category = None
        
        for line in text.split('\n'):
            line = line.strip()
            if 'similar' in line.lower():
                current_category = "similarities"
            elif 'differ' in line.lower():
                current_category = "differences"
            elif 'unique' in line.lower() and '1' in line:
                current_category = "unique_doc1"
            elif 'unique' in line.lower() and '2' in line:
                current_category = "unique_doc2"
            elif current_category and line and (line[0].isdigit() or line.startswith(('-', '•'))):
                clean_line = re.sub(r'^[\d\.\-•\)]+\s*', '', line)
                points[current_category].append(clean_line)
        
        return points
