import "./VideoProcedure.css";
import { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "../Accordion/Accordion";
import LinearProgress from "@mui/material/LinearProgress";

interface VideoProcedureProps {
  procedure: any;
  videoId: string | undefined;
  isLoadingState: any;
  isErrorState: any;
}

const VideoProcedure = ({
  procedure,
  videoId,
  isLoadingState,
  isErrorState,
}: VideoProcedureProps) => {
  const [expanded, setExpanded] = useState<string | false>("panel1");
  const handleExpandedChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  const procedureSteps = procedure.map((item: any, idx: number) => (
    <Accordion
      key={idx}
      expanded={expanded === `panel${idx + 1}`}
      onChange={handleExpandedChange(`panel${idx + 1}`)}
      TransitionProps={{ unmountOnExit: true }}
    >
      <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
        {`Step ${idx + 1}`}
      </AccordionSummary>
      <AccordionDetails>
        <div className="procedure-item-details">
          <div className="procedure-item-details-message">{item.content}</div>
          <div className="procedure-item-details-video">
            <iframe
              width="100%"
              height="250"
              allow="fullscreen;"
              src={`https://www.youtube.com/embed/${videoId}?&autoplay=0&cc_load_policy=1&fs=1&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&start=${parseInt(
                item.start
              )}&end=${parseInt(item.end)}`}
            ></iframe>
          </div>
        </div>
      </AccordionDetails>
    </Accordion>
  ));

  return (
    <>
      {isLoadingState ? (
        <div>
          Loading Procedure...
          <LinearProgress color="success" />
        </div>
      ) : isErrorState ? (
        <></>
      ) : (
        <div>{procedureSteps}</div>
      )}
    </>
  );
};

export default VideoProcedure;
