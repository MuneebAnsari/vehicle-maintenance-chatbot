import "./ChatBox.css";
import { ReactElement, RefObject } from "react";
import LinearProgress from "@mui/material/LinearProgress";

interface ChatBoxProps {
  chatHistory: ReactElement[];
  bottomRef: RefObject<HTMLDivElement>;
  isLoading: boolean;
}
const ChatBox = (props: ChatBoxProps) => {
  const chatMessages = props.chatHistory.map(
    (item: ReactElement, idx: number) => <li key={idx}>{item}</li>
  );

  return (
    <div className="chat-box">
      {props.isLoading && (
        <div className="chatbox-loading-bar">
          <LinearProgress color="success" />
        </div>
      )}
      <ul>
        {chatMessages}
        <div style={{ padding: "60px" }} ref={props.bottomRef} />
      </ul>
    </div>
  );
};

export default ChatBox;
