# Vehicle Maintenance Chatbot App

The Vehicle Maintenance Chatbot App is an application that allows users to upload their vehicle's owner/service manual in PDF format and ask questions related to their vehicle's maintenane, operation and health. The app leverages OpenAI Language Model (LLM), OpenAI embeddings and K-Nearest Neighbor (KNN) algorithm to predict accurate and relevant responses to the user's queries from the uploaded manual. Additionally, the app finds a relevant instructional video based on the user's query using Youtube Data API and extracts important procedure steps from the video's transcript, displaying each instructional step along with the video segment for reference.

## Features

- **Upload PDF Manual:** Users can upload their vehicle's owner/service manual in PDF format

- **Ask Questions:** Users can ask various questions related to their vehicle, such as how to change a tire, how to perform maintenance tasks, troubleshooting tips, and more.

- **Retrieve Answers from Manual:** The app understands the user queries and finds relevant answers within the manual.

- **Displays a Video Guide For Mainetenance Tasks:** In addition to the answers from the service manual, an instructional video guide is provided for the user to follow along. The app extracts essential instructional steps from the video's transcript, ensuring that users receieve detailed and step-by-step instructions.
  All the extracted steps are displayed to the user along with the corresponding video segment, allowing users to follow the instructions more effectively.

## Usage

1. Once the app is running, the user can start by uploading their vehicle's owner/service manual in PDF format.

2. After uploading the manual, the user can ask questions related to their vehicle in the provided chatbox.

3. The app will find relevant answers from the uploaded manual and display them to the user.

4. Additionally, the app will search for a relevant instructional video based on the user's query.

5. The app will extract important procedure steps from the video's transcript and display them along with the corresponding video segment.

6. Users can follow the instructions provided in the app for various tasks related to their vehicle, or ask more questions.
