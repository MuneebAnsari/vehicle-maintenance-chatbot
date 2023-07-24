import io
from pypdf import PdfReader
from langchain.schema import Document
import hashlib


class PDFLoader:
    def __init__(self, stream):
        self.stream = stream
        self.reader = PdfReader(io.BytesIO(self.stream))
        self.docId = hashlib.md5(self.stream).hexdigest()

    def load(self):
        documents = [Document(page_content=page.extract_text(), metadata={'docId': self.docId, 'page': idx})
                     for idx, page in enumerate(self.reader.pages)]
        return documents
