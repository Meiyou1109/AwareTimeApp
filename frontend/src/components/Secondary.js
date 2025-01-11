import React, { useState } from "react";
import DarkMode from "./DarkMode/Darkmode";
import Notification from "./Notification/Notification";
import { IoMdNotifications } from "react-icons/io";

const Secondary = ({ upcomingTasks = [], onOpenNotifi, onCloseNotifi }) => {
  const [dialog, setDialog] = useState({ isLoading: false });

  function openNotifi() {
    setDialog({ isLoading: true });
    if(onOpenNotifi) onOpenNotifi();
  }

  function closeNotifi() {
    setDialog({ isLoading: false });
    if(onCloseNotifi) onCloseNotifi();
  }

  return (
    <div className="secondary-actions">
      <DarkMode />
      <button
        className={`${upcomingTasks.length ? "bell" : ""}`}
        onClick={openNotifi}
      >
        <span id="noti-count">{upcomingTasks.length}</span>
        <IoMdNotifications size={25} color="#3081D0" />
      </button>
      {dialog.isLoading && (
        <Notification
          closeNotifi={closeNotifi}
          upcomingTasks={upcomingTasks}
        />
      )}
    </div>
  );
};

export default Secondary;
