import React, { useState, useEffect } from "react";
import BeatLoader from "react-spinners/BeatLoader";
import "./styles/Home.css";
import Navbar from "./Navbar";
import Profile from "./Profile";
import Secondary from "./Secondary";
import { Outlet, useLocation } from "react-router-dom";
import Aos from "aos";
import "aos/dist/aos.css";

const Home = ({ tasks }) => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1200);
  }, []);

  useEffect(() => {
    Aos.init({ duration: 1000 });
  }, []);

  const showProfile = location.pathname === "/Home/calendar";

  // Hàm xử lý mở thông báo
  const handleOpenNotification = () => {
    console.log("Notification panel opened");
  };

  // Hàm xử lý đóng thông báo
  const handleCloseNotification = () => {
    console.log("Notification panel closed");
  };

  return (
    <>
      {loading ? (
        <BeatLoader
          color={"#39A7FF"}
          loading={loading}
          size={50}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      ) : (
        <div className="main-home-container" data-aos="zoom-out">
          <Navbar />
          <Secondary onOpenNotifi={handleOpenNotification} onCloseNotifi={handleCloseNotification} />
          <Outlet />
          {showProfile && <Profile tasks={tasks} />}
        </div>
      )}
    </>
  );
};

export default Home;
