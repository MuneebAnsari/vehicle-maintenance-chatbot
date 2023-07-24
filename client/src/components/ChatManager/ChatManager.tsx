import "./ChatManager.css";
import ChatBox from "../ChatBox/ChatBox";
import PromptForm from "../PromptForm/PromptForm";
import ChatItem from "../ChatItem/ChatItem";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { OwnersManual } from "../../App";

interface ChatManagerProps {
  ownersManual: OwnersManual;
}
const ChatManager = ({ ownersManual }: ChatManagerProps) => {
  const chat = [
    <ChatItem
      message="Please upload your vehicle's owner's manual"
      sender="ai"
    />,
  ];

  const [chatItems, setChatItems] = useState(chat);
  const [prompt, setPrompt] = useState<string>("");
  const startChat = [...chat];
  const [startState, setStartState] = useState<boolean>(true);

  const [qaLoading, setQaLoading] = useState<boolean>(false);
  const [qaError, setQaError] = useState(false);

  useEffect(() => {
    setChatItems(startChat);
    setStartState(true);

    if (ownersManual.file && startState) {
      const message = `Uploaded ${ownersManual.file?.name} ${
        ownersManual.vehicleDetails?.make && ownersManual.vehicleDetails?.model
          ? `for ${ownersManual.vehicleDetails.make} ${ownersManual.vehicleDetails.model}`
          : ""
      }`;
      setChatItems((prev) => [
        ...prev,
        <ChatItem message={message} sender="human" />,
        <ChatItem
          message="Please ask me questions about your vehicle"
          sender="ai"
        />,
      ]);
    }
  }, [ownersManual]);

  const submitUserPrompt = async () => {
    if (!prompt || prompt.trim().length === 0) {
      return;
    }
    setChatItems((prev) => [
      ...prev,
      <ChatItem message={prompt} sender="human" />,
    ]);
    scrollToBottom();

    const documentId = localStorage.getItem("documentId");
    if (documentId && documentId.length > 0) {
      setQaLoading(true);
      try {
        const query = prompt;
        setPrompt("");
        const response = await fetch(
          `${import.meta.env.VITE_VEHICLE_MAINT_API_URL_PREFIX}/qa`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: localStorage.getItem("documentId"),
              query: query,
            }),
          }
        );
        if (response.ok) {
          setPrompt("");
          const qaResponse = await response.json();
          setChatItems((prev) => [
            ...prev,
            <ChatItem
              query={`${prompt} in ${ownersManual.vehicleDetails.make} ${ownersManual.vehicleDetails.model}`}
              message={qaResponse.answer}
              sender="ai"
              queryResponse
            />,
          ]);
          scrollToBottom();
        }
      } catch (err: any) {
        setQaError(err.toString());
        return;
      } finally {
        setQaLoading(false);
      }
    }
  };

  const handleEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      submitUserPrompt();
    }
  };

  const chatBottom = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    chatBottom?.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <ChatBox
        chatHistory={chatItems}
        bottomRef={chatBottom}
        isLoading={qaLoading}
      />

      <PromptForm
        prompt={prompt}
        setPrompt={setPrompt}
        submit={{ submitUserPrompt, handleEnter }}
        disabled={!ownersManual.file}
      />
    </>
  );
};

export default ChatManager;
