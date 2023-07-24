from dotenv import load_dotenv
import googleapiclient.discovery
from youtube_transcript_api import YouTubeTranscriptApi as YTA
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Pinecone
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from pdfloader import PDFLoader
from flask_cors import CORS
from flask import Flask, jsonify, request
import pinecone
import os
import utils
import logging

load_dotenv()

logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger(__name__)


OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')
PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
PINECONE_ENV = os.environ.get('PINECONE_ENV')
PINECONE_INDEX_NAME = os.environ.get('PINECONE_INDEX_NAME')

TRANSCRIPT_NOT_FOUND_EXCEPTION = "Could not retrieve a transcript for the video"
OPENAI_EMBEDDING_DIMENSION = 1536


app = Flask(__name__)
CORS(app)


pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENV)
if PINECONE_INDEX_NAME not in pinecone.list_indexes():
    pinecone.create_index(
        name=PINECONE_INDEX_NAME,
        metric='cosine',
        dimension=OPENAI_EMBEDDING_DIMENSION
    )


@app.errorhandler(404)
def not_found(e):
    return jsonify({"message": "Not Found"}), 404


@app.route('/')
def index():
    return jsonify({"message": "vehicle maintenance api"}), 200


@app.route('/api/v1/video-procedure/<video_id>', methods=['POST'])
def get_procedure_from_video(video_id):
    try:
        body = request.json
        query = body['query']
        if not query or len(query) == 0:
            return jsonify({"message": "Bad Request, provide query"}), 400

        video_transcript = YTA.get_transcript(video_id)
        transcript = utils.format_transcript(video_transcript)
        procedure = utils.get_procedure(transcript, query)
        if len(procedure) > 11:
            raise Exception("Could not summarize procedure from video")
        response_data = {
            "procedure": procedure
        }

        return response_data, 200
    except Exception as e:
        if TRANSCRIPT_NOT_FOUND_EXCEPTION in str(e.args):
            log.warn("Transcript not found")
            return jsonify({"message": "Transcript not found"}), 404

        log.error(str(e.args))
        return jsonify({"message": f"Internal Server Error"}), 500


@app.route('/api/v1/embed', methods=["POST", "DELETE"])
def embed():
    if request.method == 'POST':
        try:
            file = request.files['file']
            if not request.files or not file:
                return jsonify({"message": "Bad Request 'file' not provided in request form-data"}), 400
            pdf = file.read()
            loader = PDFLoader(pdf)
            documents = loader.load()
            documentId = loader.docId

            embeddings = OpenAIEmbeddings(
                model='text-embedding-ada-002',
            )

            pinecone_index = pinecone.GRPCIndex(index_name=PINECONE_INDEX_NAME)

            query_response = pinecone_index.query(
                vector=embeddings.embed_query(" "),
                filter={"docId": {"$eq": documentId}},
                namespace=documentId,
                top_k=1,
                include_metadata=True
            )

            if query_response and len(query_response['matches']) > 0:
                log.info("FOUND EXISTING EMBEDDINGS")
                existing = query_response['matches'][0]
                return jsonify({
                    "documentId": existing['metadata']['docId'],
                    "vehicleDetails": {
                        "make": existing['metadata']['vehicle_make'],
                        "model": existing['metadata']['vehicle_model'],
                        "year": existing['metadata']['vehicle_year'],
                    }
                }), 200

            documents_text = "".join(
                [document.page_content for document in documents[0:5]])

            vehicle_details = utils.get_vehicle_details(
                owners_manual=documents_text)

            for document in documents:
                document.metadata["vehicle_make"] = vehicle_details['make']
                document.metadata["vehicle_model"] = vehicle_details['model']
                document.metadata["vehicle_year"] = vehicle_details['year']

            text_splitter = CharacterTextSplitter(
                separator="\n",
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
            )
            chunks = text_splitter.split_documents(documents)

            Pinecone.from_texts(
                texts=[chunk.page_content for chunk in chunks],
                metadatas=[chunk.metadata for chunk in chunks],
                embedding=embeddings,
                index_name=PINECONE_INDEX_NAME,
                namespace=documentId
            )
            log.info(pinecone_index.describe_index_stats())
            return jsonify({"documentId": documentId}), 200

        except Exception as e:
            log.error(e)
            return jsonify({"message": "Internal Server Error"}), 500

    if request.method == 'DELETE':
        try:
            body = request.json
            documentId = body["id"]
            pinecone_index = pinecone.GRPCIndex(index_name=PINECONE_INDEX_NAME)
            pinecone_stats = pinecone_index.describe_index_stats()
            if documentId not in pinecone_stats['namespaces']:
                log.error("Failed to delete, document not found")
                return jsonify({"message": "Document not found"}), 404
            pinecone_index.delete(
                delete_all=True, namespace=documentId)
            return jsonify({"message": documentId}), 200
        except Exception as e:
            log.error(e)
            return jsonify({"message": "Internal Server Error"}), 500


@app.route('/api/v1/qa', methods=['POST'])
def qa():
    try:
        body = request.json
        documentId = body['id']
        query = body['query']
        if not documentId or len(documentId) == 0:
            return jsonify({"message": "Bad Request, provide document id"}), 400

        if not query or len(query) == 0:
            return jsonify({"message": "Bad Request, provide query"}), 400

        pinecone_index = pinecone.GRPCIndex(index_name=PINECONE_INDEX_NAME)
        pinecone_stats = pinecone_index.describe_index_stats()
        if documentId not in pinecone_stats['namespaces']:
            return jsonify({"message": "Document not found"}), 404

        embeddings = OpenAIEmbeddings(model='text-embedding-ada-002')

        vectorstore = Pinecone(
            index=pinecone.Index(index_name=PINECONE_INDEX_NAME),
            embedding_function=embeddings.embed_query,
            namespace=documentId,
            text_key="text"
        )

        llm = ChatOpenAI(
            model_name='gpt-3.5-turbo',
            temperature=0.0,
            max_retries=3,
        )

        qa = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vectorstore.as_retriever()
        )

        answer = qa.run(query)
        return jsonify({"answer": answer}), 200
    except Exception as e:
        log.error(e)
        return jsonify({"message": "Internal Server Error"}), 500


@app.route("/api/v1/video", methods=["GET"])
def get_video_from_user_prompt():
    try:
        query_param = request.args.get("prompt", type=str)
        if not query_param:
            log.error("No query param provided 'prompt'")
            return jsonify({"message": "provide query param 'prompt'"}), 400

        prompt = query_param
        youtube_client = googleapiclient.discovery.build(
            "youtube", "v3", developerKey=YOUTUBE_API_KEY)
        response = youtube_client.search().list(
            part="snippet",
            maxResults="3",
            q=prompt
        ).execute()

        videos = response.get('items', [])
        return jsonify(videos), 200
    except Exception as e:
        log.error(e)
        return jsonify({"message": "Internal Server Error"}), 500


if __name__ == "__main__":
    app.run()
