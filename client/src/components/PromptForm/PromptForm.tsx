import "./PromptForm.css";
import { TextField, Button, InputAdornment, InputProps } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { Dispatch, SetStateAction, KeyboardEvent } from "react";

interface PromptFormProps {
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  submit: {
    submitUserPrompt: () => void;
    handleEnter: (event: KeyboardEvent<HTMLInputElement>) => void;
  };
  disabled: boolean;
}
const PromptForm = (props: PromptFormProps) => {
  const promptFormInputProps: InputProps = {
    style: {
      fontSize: "clamp(0.8rem, 2vw, 1.2rem)",
      color: "#fff",
      backgroundColor: "#3a3b3c",
    },
    endAdornment: (
      <InputAdornment position="end">
        <Button
          disableElevation
          disableRipple
          disableFocusRipple
          disableTouchRipple
          className="prompt-form-submit-btn"
          style={{ background: "transparent" }}
          onClick={props.submit.submitUserPrompt}
          disabled={props.disabled}
        >
          <SendIcon
            style={props.disabled ? { color: "gray" } : { color: "#fff" }}
          />
        </Button>
      </InputAdornment>
    ),
  };

  return (
    <div className="prompt-form-container">
      <div className="prompt-form-input">
        <TextField
          className="prompt-form-input"
          variant="outlined"
          placeholder={"Ask a question about your vehicle..."}
          InputProps={promptFormInputProps}
          onChange={(e) => props.setPrompt(e.target.value)}
          onKeyDown={props.submit.handleEnter}
          value={props.prompt}
          disabled={props.disabled}
        ></TextField>
      </div>
    </div>
  );
};

export default PromptForm;
