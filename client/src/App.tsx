import "./App.css";
import ChatManager from "./components/ChatManager/ChatManager";
import FileUpload from "./components/FileUpload/FileUpload";
import { useState } from "react";

export interface OwnersManual {
  file: File | null;
  documentId: string;
  vehicleDetails: Vehicle;
}

export interface Vehicle {
  make: string;
  model: string;
  year: string;
}

function App() {
  const [ownersManual, setOwnersManual] = useState<OwnersManual>({
    file: null,
    documentId: "",
    vehicleDetails: {
      make: "",
      model: "",
      year: "",
    },
  });

  return (
    <>
      <h1>Vehicle Maintenance 🔧</h1>
      <FileUpload fileUpload={setOwnersManual} />
      <ChatManager ownersManual={ownersManual} />
    </>
  );
}

export default App;
