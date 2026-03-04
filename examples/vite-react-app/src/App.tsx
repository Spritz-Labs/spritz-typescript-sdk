import { Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./Login";
import { Chat } from "./Chat";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  );
}
