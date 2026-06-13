import pytest
import io
from httpx import AsyncClient
from unittest.mock import MagicMock, patch

@pytest.mark.asyncio
async def test_pdf_upload_parsing(client: AsyncClient):
    """Test uploading a PDF file with mocked PyPDF2 extraction."""
    # Register and login
    register_payload = {
        "email": "pdf_test@example.com",
        "username": "pdf_test",
        "password": "securepassword123"
    }
    await client.post("/api/auth/register", json=register_payload)
    login_response = await client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": register_payload["password"]
    })
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Try to upload a non-PDF file -> should fail with 400
    files = {"file": ("test.txt", b"hello txt file", "text/plain")}
    response = await client.post("/api/pdf/upload", files=files, headers=headers)
    assert response.status_code == 400
    assert "Only PDF files are supported" in response.json()["detail"]

    # 2. Upload a valid PDF file (Mocking PyPDF2)
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "Mocked PDF page text content."
    
    mock_reader = MagicMock()
    mock_reader.pages = [mock_page, mock_page]  # 2 pages
    mock_reader.metadata = {
        "/Title": "Test Document Title",
        "/Author": "Mock Author"
    }
    
    with patch("app.api.pdf.PyPDF2.PdfReader", return_value=mock_reader) as mock_pdf_reader:
        pdf_content = b"%PDF-1.4 mock pdf bytes"
        files = {"file": ("test.pdf", pdf_content, "application/pdf")}
        
        response = await client.post("/api/pdf/upload", files=files, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "success"
        assert data["filename"] == "test.pdf"
        assert data["page_count"] == 2
        assert "Mocked PDF page text content" in data["full_text"]
        assert data["metadata"]["title"] == "Test Document Title"
        assert data["metadata"]["author"] == "Mock Author"
        
        mock_pdf_reader.assert_called_once()
