import "./FileUpload.css";

import { useState, useRef, ChangeEvent, Dispatch, SetStateAction } from "react";
import Button from "@mui/material/Button";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import { OwnersManual } from "../../App";

interface FileUploadProps {
  fileUpload: Dispatch<SetStateAction<OwnersManual>>;
}

const FileUpload = ({ fileUpload }: FileUploadProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setfile] = useState<File>();

  const [fileEmbedLoading, setFileEmbedLoading] = useState(false);
  const [fileEmbederror, setFileEmbedError] = useState(false);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    setFileEmbedError(false);
    const upload = event.currentTarget?.files?.[0];

    if (!upload) {
      return;
    }

    const { documentId, vehicleDetails } = await createFileEmbeddings(upload);
    if (documentId) {
      localStorage.setItem("documentId", documentId);
      setfile(upload);

      const newFileUploadState = {
        file: upload,
        documentId,
        vehicleDetails,
      };
      fileUpload((prevState: OwnersManual) => {
        return { ...prevState, ...newFileUploadState };
      });
    }
  };

  const createFileEmbeddings = async (upload: Blob) => {
    setFileEmbedLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", upload);
      const response = await fetch(
        `${import.meta.env.VITE_VEHICLE_MAINT_API_URL_PREFIX}/embed`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      setFileEmbedError(true);
      return;
    } finally {
      setFileEmbedLoading(false);
    }
  };

  const deleteFileEmbeddings = async () => {
    setFileEmbedLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_VEHICLE_MAINT_API_URL_PREFIX}/embed`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: localStorage.getItem("documentId") }),
        }
      );
      if (response.ok) {
        localStorage.setItem("documentId", "");
      }
    } catch (err: any) {
      setFileEmbedError(err.toString());
      return;
    } finally {
      setFileEmbedLoading(false);
    }
  };

  const handleFileClear = async () => {
    if (!fileRef.current) {
      return;
    }
    fileRef.current.value = "";
    await deleteFileEmbeddings();
    setfile(undefined);
    const newFileUploadState = { file: null, documentId: "" };
    fileUpload((prevState: any) => {
      return { ...prevState, ...newFileUploadState };
    });
  };

  return (
    <>
      <div className="file-upload-container">
        <h2 className="file-upload-label">Upload Owner's Manual</h2>
        <div className="file-upload-action">
          <input
            ref={fileRef}
            hidden
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
          />
          <Button
            className="file-upload-btn"
            variant="outlined"
            color="inherit"
            style={{
              textTransform: "none",
              fontSize: "clamp(10px, 2vw, 1rem)",
            }}
            onClick={() => fileRef.current?.click()}
          >
            Browse
          </Button>
        </div>
      </div>

      <div>
        {fileEmbedLoading ? (
          <LinearProgress color="success" />
        ) : fileEmbederror ? (
          <Alert variant="filled" severity="error">
            Oops! Something went wrong!
          </Alert>
        ) : (
          file?.name && (
            <div className="file-upload-result-container">
              <div className="file-upload-result-details">
                <div className="file-upload-result-icon">
                  <InsertDriveFileOutlinedIcon
                    sx={{
                      verticalAlign: "middle",
                      fontSize: { xs: 19, sm: 22, md: 25, lg: 25 },
                    }}
                  />
                </div>
                <div className="file-upload-result-name">{file?.name}</div>
              </div>
              <div className="file-upload-result-clear">
                <span
                  className="file-upload-result-clear-btn"
                  onClick={handleFileClear}
                >
                  <CloseIcon
                    sx={{
                      verticalAlign: "middle",
                      fontSize: { xs: 19, sm: 22, md: 25, lg: 25 },
                    }}
                  />
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default FileUpload;
