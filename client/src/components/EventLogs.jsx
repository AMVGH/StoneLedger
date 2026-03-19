import React, { useState } from "react";
import styles from "./EventLogs.module.css";
import logo from "../assets/StoneLedgerLogo-removebg-preview (1).png";
import { useNavigate } from "react-router-dom";

const mockUser = {
  username: "admin01",
  name: "John Doe",
  role: "Admin",
  profilePicture:
    "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png",
};

export default function EventLogs() {
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
     {/* Empty content area */}
        <section className={styles.content}></section>
      
    </div>
  );
}
