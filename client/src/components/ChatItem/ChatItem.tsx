import "./ChatItem.css";
import system_avatar from "../../assets/system_avatar.png";
import user_avatar from "../../assets/user_avatar.png";
import VideoProcedure from "../VideoProcedure/VideoProcedure";
import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "../Accordion/Accordion";

interface ChatItemProps {
  query?: string;
  message: string;
  sender: string;
  queryResponse?: boolean;
}

const ChatItem = (props: ChatItemProps) => {
  const [procedure, setProcedure] = useState([]);
  const [videoId, setVideoId] = useState<string | undefined>();
  const [procedureLoading, setProcedureLoading] = useState(false);
  const [procedureError, setProcedureError] = useState(false);

  const [expanded, setExpanded] = useState<string | false>("panel1");
  const handleExpandedChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  useEffect(() => {
    const getVideoByUserQuery = async () => {
      if (!props.query) {
        return;
      }
      try {
        const searchParams = new URLSearchParams(`prompt=${props.query}`);
        const response = await fetch(
          `${
            import.meta.env.VITE_VEHICLE_MAINT_API_URL_PREFIX
          }/video?${searchParams}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
        if (response.ok) {
          const data = await response.json();
          await getProcedure(data);
        }
      } catch (err: any) {
        return;
      }
    };
    getVideoByUserQuery();
  }, []);

  const getProcedure = async (videos: any) => {
    setProcedureLoading(true);
    let procedureVideoId = null;
    for (const video of videos) {
      let id = video.id.videoId;
      procedureVideoId = await getProcedureFromVideo(id);
      if (procedureVideoId) {
        setVideoId(procedureVideoId);
        break;
      }
    }
    if (!procedureVideoId) {
      setProcedureError(true);
    }
    setProcedureLoading(false);
  };

  const getProcedureFromVideo = async (id: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_VEHICLE_MAINT_API_URL_PREFIX
        }/video-procedure/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: props.query,
          }),
        }
      );
      if (response.ok) {
        const res = await response.json();
        setProcedure(res.procedure);
        return id;
      }
    } catch (err: any) {
      setProcedureError(true);
      return;
    }
  };

  return (
    <div>
      {props.sender === "human" ? (
        <div className="chat-item row-reverse">
          <div className="icon">
            <img src={user_avatar} width="32px" height="32px"></img>
          </div>
          <p className="chat-message">{props.message}</p>
        </div>
      ) : (
        <div className="chat-item">
          <div className="icon">
            <img src={system_avatar} width="32px" height="32px"></img>
          </div>

          {props.queryResponse ? (
            <div className="chat-query-response-message">
              <Accordion
                key={1}
                expanded={expanded === `panel1`}
                onChange={handleExpandedChange(`panel1`)}
                TransitionProps={{ unmountOnExit: true }}
              >
                <AccordionSummary
                  aria-controls="panel1d-content"
                  id="panel1d-header"
                >
                  From Owner's Manual
                </AccordionSummary>
                <AccordionDetails>
                  <div className="col-response-message">{props.message}</div>
                </AccordionDetails>
              </Accordion>

              <Accordion
                key={2}
                expanded={expanded === `panel2`}
                onChange={handleExpandedChange(`panel2`)}
                TransitionProps={{ unmountOnExit: true }}
              >
                <AccordionSummary
                  aria-controls="panel2d-content"
                  id="panel2d-header"
                >
                  Video Guide
                </AccordionSummary>
                <AccordionDetails>
                  <div className="col-video-procedure">
                    <div className="video-procedure-container">
                      <VideoProcedure
                        videoId={videoId}
                        procedure={procedure}
                        isLoadingState={procedureLoading}
                        isErrorState={procedureError}
                      />
                    </div>
                  </div>
                </AccordionDetails>
              </Accordion>
            </div>
          ) : (
            <div>
              <div className="chat-message">{props.message}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatItem;
