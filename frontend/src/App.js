import Toggler from "./components/Toggler";
import Calendar from "./components/Calendar";
import Home from "./components/Home";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Project from "./components/Project";
import Focus from "./components/Focus";
import Dashboard from "./components/Dashboard";
import Report from "./components/Report";
import ForgotPass from "./components/ForgotPass";
import TimeTable from "./components/TimeTable";
import ResetPass from "./components/ResetPass";
import { useState, useEffect } from "react";

function App() {
  // Quản lý works và completedWorks
  const [works, setWorks] = useState(() => {
    const savedWorks = localStorage.getItem("works");
    return savedWorks
      ? JSON.parse(savedWorks)
      : {
          doNow: [],
          schedule: [],
          delegate: [],
          drop: [],
        };
  });

  const [completedWorks, setCompletedWorks] = useState(() => {
    const savedCompletedWorks = localStorage.getItem("worksdone");
    return savedCompletedWorks ? JSON.parse(savedCompletedWorks) : [];
  });

  const [recycledWorks, setRecycledWorks] = useState(() => {
    const savedRecycledWorks = localStorage.getItem("recycledWorks");
    return savedRecycledWorks ? JSON.parse(savedRecycledWorks) : [];
  });

  const [taskCompletionStatus, setTaskCompletionStatus] = useState(() => {
    const savedTaskCompletionStatus = localStorage.getItem("taskCompletionStatus");
    return savedTaskCompletionStatus ? JSON.parse(savedTaskCompletionStatus) : {};
  });

  useEffect(() => {
    localStorage.setItem("works", JSON.stringify(works));
    localStorage.setItem("worksdone", JSON.stringify(completedWorks));
    localStorage.setItem("recycledWorks", JSON.stringify(recycledWorks));
    localStorage.setItem("taskCompletionStatus", JSON.stringify(taskCompletionStatus));
  }, [works, completedWorks, recycledWorks, taskCompletionStatus]);
  const [tasks] = useState({ 
    doNow: [],
    schedule: [],
    delegate: [],
    drop: [],
  });

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-center"
        autoClose={800}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/" element={<Toggler toast={toast} />} />
        <Route path="/ForgotPass" element={<ForgotPass toast={toast} />} />
        <Route path="/ResetPass/:id/:token" element={<ResetPass toast={toast} />} />
        <Route path="/Home" element={<Home tasks={tasks} />}>
          <Route
            path="/Home"
            element={
              <Dashboard
                works={works}
                setWorks={setWorks}
                completedWorks={completedWorks}
                setCompletedWorks={setCompletedWorks}
                recycledWorks={recycledWorks}
                setRecycledWorks={setRecycledWorks}
                taskCompletionStatus={taskCompletionStatus}
                setTaskCompletionStatus={setTaskCompletionStatus}
              />
            }
          />
          <Route
            path="/Home/projects"
            element={
              <Project
                works={works}
                setWorks={setWorks}
                completedWorks={completedWorks}
                setCompletedWorks={setCompletedWorks}
                recycledWorks={recycledWorks}
                setRecycledWorks={setRecycledWorks}
                taskCompletionStatus={taskCompletionStatus}
                setTaskCompletionStatus={setTaskCompletionStatus}
              />
            }
          />
          <Route
            path="/Home/focus"
            element={<Focus toast={toast} works={works} tasks={tasks} />}
          />
          <Route
            path="/Home/timetable"
            element={
              <TimeTable
                toast={toast}
                works={works}
                setWorks={setWorks}
                completedWorks={completedWorks}
                setCompletedWorks={setCompletedWorks}
                recycledWorks={recycledWorks}
                setRecycledWorks={setRecycledWorks}
                taskCompletionStatus={taskCompletionStatus}
                setTaskCompletionStatus={setTaskCompletionStatus}
              />
            }
          />
          
          <Route
            path="/Home/calendar"
            element={<Calendar works={Object.values(works)} />}
          />
          
                    <Route
                      path="/Home/report"
                      element={<Report toast={toast} tasks={tasks} />}
                    />
                  </Route>
                </Routes>
              </BrowserRouter>
            );
          }

export default App;
