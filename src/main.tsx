import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupAutoSync } from './lib/offline-sync';

// Initialize offline sync
setupAutoSync();

createRoot(document.getElementById("root")!).render(<App />);
