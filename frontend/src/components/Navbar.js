import React, { useEffect } from "react";
import { LuListTodo } from "react-icons/lu";
import { IoCalendarNumber } from "react-icons/io5";
import { BiLogOut, BiSolidDashboard } from "react-icons/bi";
import { MdOutlineWatchLater } from "react-icons/md";
import { AiOutlineSchedule, AiOutlineBarChart } from "react-icons/ai";
import { useNavigate, useLocation } from "react-router-dom";
import icon from "../utils/icon.PNG";
import Aos from "aos";
import "aos/dist/aos.css";
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    Aos.init({ duration: 800 });
  }, []);

  function logOut() {
    toast.success("Logged out successfully");
    navigate("/");
  }

  const navItems = [
    { path: "/Home", label: "Dashboard", icon: <BiSolidDashboard size={22} color="white" /> },
    { path: "/Home/projects", label: "Project", icon: <LuListTodo size={20} color="white" /> },
    { path: "/Home/focus", label: "Focus", icon: <MdOutlineWatchLater size={20} color="white" /> },
    { path: "/Home/timetable", label: "TimeTable", icon: <AiOutlineSchedule size={20} color="white" /> },
    { path: "/Home/calendar", label: "Calendar", icon: <IoCalendarNumber size={20} color="white" /> },
    { path: "/Home/report", label: "Report", icon: <AiOutlineBarChart size={20} color="white" /> },
  ];

  return (
    <nav className="nav-left" data-aos="fade-right">
      <button className="awaretime-theme">
        <img src={icon} alt="" />
      </button>
      {/* User Avatar Button */}
      <button
        className="nav-icon skull"
        onClick={() => navigate("/profile")}
        style={{ marginTop: '-20px' }}
      >
        <img src="path_to_user_avatar.jpg" alt="User Avatar" style={{ borderRadius: '50%', width: '22px', height: '22px' }} />
      </button>

      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`nav-icon skull ${location.pathname === item.path ? "active" : ""}`}
        >
          {item.icon}
        </button>
      ))}
      <button className="nav-icon skull" onClick={logOut}>
        <BiLogOut size={22} color="white" />
      </button>
    </nav>
  );
};

export default Navbar;
