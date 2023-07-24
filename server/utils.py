import json
import openai
import os
import logging
log = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
openai.api_key = OPENAI_API_KEY


def swag():
    log.info("HELLLO FROM UTILS")


def format_transcript(transcript):
    transcript = [{
        "start": str(item["start"]),
        "end": str(item["start"] + item["duration"]),
        "text":item["text"]
    } for item in transcript[:]]
    transcript = json.dumps(transcript)
    return transcript


def get_vehicle_details(owners_manual):
    chat_messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": f'Return the make, model and year of a vehicle from its service manual "{owners_manual}"'},
    ]

    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0613",
        messages=chat_messages,
        functions=[
            {
                "name": "get_vehicle_details",
                "description": "Return the make, model and year of a vehicle from its service manual",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "vehicle": {
                            "type": "object",
                            "properties": {
                                "make": {
                                    "type": "string",
                                    "description": "The make of the vehicle"
                                },
                                "model": {
                                    "type": "string",
                                    "description": "The model of the vehicle"
                                },
                                "year": {
                                    "type": "string",
                                    "description": "The year of the vehicle"
                                }
                            },

                            "description": "A object containing the vehicle make, model and year from its service manual"
                        },
                    },
                    "required": ["vehicle"],
                }
            }
        ],
        function_call={"name": "get_vehicle_details"},
    )

    reply = completion['choices'][0]['message']
    log.debug(f"REPLY CONTENTS: {reply}")
    funcs = reply.to_dict()['function_call']['arguments']
    funcs = json.loads(funcs)
    log.debug(f"USAGE: {completion['usage']}")
    vehicle_details = funcs['vehicle']
    return vehicle_details


def get_procedure(transcript, query):
    chat_messages = [
        {"role": "system", "content": "You are a helpful assistant that will return a procedure of steps from a video transcript."},
        {"role": "user", "content": f'Return a list of 10 procedure steps "{query}" from the video transcript json "{transcript}"'},
    ]

    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0613",
        messages=chat_messages,
    )

    reply = completion['choices'][0]['message']['content']
    log.debug(f"USAGE: {completion['usage']}")
    chat_messages.append({"role": "assistant", "content": reply})
    chat_messages.append(
        {"role": "user", "content": f'could you also include the start time for each step in the procedure you provided in the last message'})

    log.debug(f"CHAT MESSAGES: {chat_messages}")
    log.debug(completion['choices'][0]['message'])

    completion2 = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0613",
        messages=chat_messages,
        functions=[
            {
                "name": "get_procedure",
                "description": "Return a list of procedure steps",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "procedure": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                    "properties": {
                                        "start": {
                                            "type": "string",
                                            "description": "The start time of this procedure step"
                                        },
                                        "end": {
                                            "type": "string",
                                            "description": "The end time of this procedure step"
                                        },
                                        "content": {
                                            "type": "string",
                                            "description": "A procedure step"
                                        }
                                    }
                            },
                            "description": "A list of procedure steps"
                        },
                    },
                    "required": ["procedure"],
                }
            }
        ],
        function_call={"name": "get_procedure"},
    )

    reply = completion2['choices'][0]['message']
    log.debug(f"REPLY CONTENTS: {reply}")
    funcs = reply.to_dict()['function_call']['arguments']
    funcs = json.loads(funcs)
    log.debug(f"USAGE: {completion2['usage']}")
    procedure = funcs['procedure']
    return procedure
