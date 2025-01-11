import React, { useState, useEffect, useMemo } from "react";
import { AiFillDelete, AiOutlineUndo } from "react-icons/ai";
import { BiSearchAlt2 } from "react-icons/bi";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import "aos/dist/aos.css";
import "./styles/project.css";


const Project = ({
  works,
  setWorks,
  completedWorks,
  setCompletedWorks,
  recycledWorks,
  setRecycledWorks,
  taskCompletionStatus,
  setTaskCompletionStatus,
}) => {
  const [viewMode, setViewMode] = useState("ongoing");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedWorkIds, setExpandedWorkIds] = useState([]);

  useEffect(() => {
    localStorage.setItem("taskCompletionStatus", JSON.stringify(taskCompletionStatus));
  }, [taskCompletionStatus]);

  const filteredWorks = useMemo(() => {
    const allOngoingWorks = Object.values(works).flat();
  
    let result = [];
    if (viewMode === "ongoing") {
      result = allOngoingWorks.filter(
        (work) => !completedWorks.some((completedWork) => completedWork.id === work.id)
      );
    } else if (viewMode === "completed") {
      result = completedWorks.filter(
        (completedWork, index, self) => self.findIndex((work) => work.id === completedWork.id) === index
      );
    } else if (viewMode === "recycle") {
      result = recycledWorks;
    }
  
    if (searchQuery) {
      result = result.filter(work =>
        work.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.subWorks.some(task =>
          task.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  
    return result;
  }, [viewMode, works, completedWorks, recycledWorks, searchQuery]);
  

  const toggleExpand = (workId) => {
    setExpandedWorkIds((prevExpandedWorkIds) =>
      prevExpandedWorkIds.includes(workId)
        ? prevExpandedWorkIds.filter((id) => id !== workId)
        : [...prevExpandedWorkIds, workId]
    );
  };

  const handleExpandAll = () => {
    setExpandedWorkIds(filteredWorks.map((work) => work.id));
  };

  const handleCollapseAll = () => {
    setExpandedWorkIds([]);
  };

  const handleToggleComplete = (work, isManual = true) => {
    const updatedWork = { ...work, isCompleted: !work.isCompleted };

    if (isManual) {
      setTaskCompletionStatus((prevStatus) => {
        const updatedStatus = { ...prevStatus };
        if (updatedWork.isCompleted) {
          updatedWork.subWorks.forEach((_, index) => {
            updatedStatus[`${work.id}-${index}`] = true;
          });
        } else {
          updatedWork.subWorks.forEach((_, index) => {
            updatedStatus[`${work.id}-${index}`] = false;
          });
        }
        return updatedStatus;
      });
    }

    if (viewMode === "ongoing" || viewMode === "completed") {
      if (updatedWork.isCompleted) {
        setCompletedWorks((prev) => [...prev, updatedWork]);
        setWorks((prevWorks) => {
          const updatedWorks = { ...prevWorks };
          Object.keys(updatedWorks).forEach((key) => {
            updatedWorks[key] = updatedWorks[key].filter((w) => w.id !== work.id);
          });
          return updatedWorks;
        });
      } else {
        setWorks((prevWorks) => {
          const updatedWorks = { ...prevWorks };
          const type = work.type || "doNow";
          if (!updatedWorks[type].some((w) => w.id === work.id)) {
            updatedWorks[type] = [...updatedWorks[type], updatedWork];
          }
          return updatedWorks;
        });
        setCompletedWorks((prev) => prev.filter((w) => w.id !== work.id));
      }
    } else if (viewMode === "recycle") {
      setRecycledWorks((prevRecycledWorks) =>
        prevRecycledWorks.map((w) => {
          if (w.id === work.id) {
            if (isManual) {
              setTaskCompletionStatus((prevStatus) => {
                const updatedStatus = { ...prevStatus };
                if (updatedWork.isCompleted) {
                  updatedWork.subWorks.forEach((_, index) => {
                    updatedStatus[`${work.id}-${index}`] = true;
                  });
                } else {
                  updatedWork.subWorks.forEach((_, index) => {
                    updatedStatus[`${work.id}-${index}`] = false;
                  });
                }
                return updatedStatus;
              });
            }
            return updatedWork;
          }
          return w;
        })
      );
    }
  };

  const toggleTaskCompletion = (workId, taskIndex) => {
    setTaskCompletionStatus((prevStatus) => {
      const updatedStatus = { ...prevStatus };
      const taskKey = `${workId}-${taskIndex}`;
      updatedStatus[taskKey] = !updatedStatus[taskKey];

      const work = filteredWorks.find((w) => w.id === workId);
      if (work) {
        const totalTasks = work.subWorks.length;
        const completedTasks = work.subWorks.filter((_, index) => updatedStatus[`${workId}-${index}`]).length;

        if (completedTasks === totalTasks) {
          handleToggleComplete(work, false);
        } else if (work.isCompleted) {
          handleToggleComplete(work, false);
        }
      }

      return updatedStatus;
    });
  };

  const handleDeleteWork = (workId) => {
    const deletedWork = filteredWorks.find((work) => work.id === workId);

    if (deletedWork) {
      setRecycledWorks((prevRecycledWorks) => [...prevRecycledWorks, deletedWork]);
    }

    setWorks((prevWorks) => {
      const updatedWorks = { ...prevWorks };
      Object.keys(updatedWorks).forEach((key) => {
        updatedWorks[key] = updatedWorks[key].filter((w) => w.id !== workId);
      });
      return updatedWorks;
    });

    setCompletedWorks((prevCompletedWorks) =>
      prevCompletedWorks.filter((work) => work.id !== workId)
    );
  };

  const handleRestoreWork = (workId) => {
    const restoredWork = recycledWorks.find((work) => work.id === workId);

    if (restoredWork) {
      if (restoredWork.isCompleted) {
        setCompletedWorks((prev) => {
          if (!prev.some((w) => w.id === restoredWork.id)) {
            return [...prev, restoredWork];
          }
          return prev;
        });
      } else {
        setWorks((prevWorks) => {
          const updatedWorks = { ...prevWorks };
          const type = restoredWork.type || "doNow";
          if (!updatedWorks[type].some((w) => w.id === workId)) {
            updatedWorks[type] = [...updatedWorks[type], restoredWork];
          }
          return updatedWorks;
        });
      }

      setRecycledWorks((prevRecycledWorks) =>
        prevRecycledWorks.filter((work) => work.id !== workId)
      );
    }
  };

  const handleDeleteTask = (workId, taskIndex) => {
    const isCompletedWork = completedWorks.some((work) => work.id === workId);

    if (isCompletedWork) {
      setCompletedWorks((prevCompletedWorks) => {
        return prevCompletedWorks.map((work) => {
          if (work.id === workId) {
            const updatedWork = {
              ...work,
              subWorks: work.subWorks.filter((_, index) => index !== taskIndex),
            };
            return updatedWork;
          }
          return work;
        });
      });
    } else {
      setWorks((prevWorks) => {
        const updatedWorks = { ...prevWorks };
        Object.keys(updatedWorks).forEach((type) => {
          const workIndex = updatedWorks[type].findIndex((work) => work.id === workId);
          if (workIndex !== -1) {
            const updatedWork = { ...updatedWorks[type][workIndex] };
            updatedWork.subWorks = updatedWork.subWorks.filter(
              (_, index) => index !== taskIndex
            );
            updatedWorks[type] = [
              ...updatedWorks[type].slice(0, workIndex),
              updatedWork,
              ...updatedWorks[type].slice(workIndex + 1),
            ];
          }
        });
        return updatedWorks;
      });
    }

    setTaskCompletionStatus((prevStatus) => {
      const updatedStatus = { ...prevStatus };
      delete updatedStatus[`${workId}-${taskIndex}`];
      return updatedStatus;
    });
  };

  const calculateProgress = (work) => {
    if (!work.subWorks || work.subWorks.length === 0) {
      if (viewMode === "recycle") {
        return work.isCompleted ? 100 : 0;
      }
      return completedWorks.some((completedWork) => completedWork.id === work.id)
        ? 100
        : 0;
    }

    const totalTasks = work.subWorks.length;
    const completedTasks = work.subWorks.filter((_, index) => {
      const taskKey = `${work.id}-${index}`;
      return taskCompletionStatus[taskKey];
    }).length;

    return Math.round((completedTasks / totalTasks) * 100);
  };

  return (
    <div className="main-form" data-aos="zoom-in">
      <div className="menu-bar">
        <h1>Projects</h1>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          type="search"
          placeholder={`Search ${
            viewMode === "ongoing" ? "ongoing" : viewMode === "completed" ? "completed" : "recycled"
          } works`}
        />
        <button id="search-bt">
          <BiSearchAlt2 size={22} />
        </button>
      </div>
      <div className="view-toggle">
        <button
          className={viewMode === "ongoing" ? "active" : ""}
          onClick={() => setViewMode("ongoing")}
        >
          On Going Works
        </button>
        <button
          className={viewMode === "completed" ? "active" : ""}
          onClick={() => setViewMode("completed")}
        >
          Completed Works
        </button>
        <button
          className={viewMode === "recycle" ? "active" : ""}
          onClick={() => setViewMode("recycle")}
        >
          Recycle Bin
        </button>
      </div>
      <div className="expand-collapse-buttons">
        <button className="expand-btn" onClick={handleExpandAll}>
          Expand All
        </button>
        <button className="collapse-btn" onClick={handleCollapseAll}>
          Collapse All
        </button>
      </div>

      <div className="item-list">
        {filteredWorks.length === 0 ? (
          <h3 id="no-todo">
            {viewMode === "ongoing"
              ? "No ongoing works"
              : viewMode === "completed"
              ? "No completed works"
              : "No recycled works"}
          </h3>
        ) : (
          <ul>
            {filteredWorks.flatMap((work) => {
              const progress = calculateProgress(work);
              const workElements = [
                <li key={work.id} className="work-item">
                  <div className="work-header">
                    <label htmlFor="" className="item-name">
                      <input
                        type="checkbox"
                        checked={viewMode === "completed" || work.isCompleted}
                        onChange={() => handleToggleComplete(work)}
                      />
                      {work.name}
                    </label>
                    <div className="work-actions">
                      {viewMode === "recycle" && (
                        <button
                          id="restore-bt"
                          style={{ border: "2px solid #007bff", padding: "4px 6px" }}
                          onClick={() => handleRestoreWork(work.id)}
                        >
                          <AiOutlineUndo size={20} color="#007bff" />
                        </button>
                      )}
                      <button
                        id="del-bt"
                        onClick={() => handleDeleteWork(work.id)}
                      >
                        <AiFillDelete size={20} color="#FF6969" />
                      </button>
                      <button
                        className="expand-bt"
                        onClick={() => toggleExpand(work.id)}
                      >
                        {expandedWorkIds.includes(work.id) ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="progress-container progress-container-full">
                    <div className="progress-bar">
                      <div
                        className="progress"
                        style={{
                          width: `${progress}%`,
                        }}
                      ></div>
                    </div>
                    <span className="progress-percentage">{progress}%</span>
                  </div>
                </li>,
              ];

              if (
                expandedWorkIds.includes(work.id) &&
                work.subWorks &&
                work.subWorks.length > 0
              ) {
                work.subWorks.forEach((task, index) => {
                  const taskKey = `${work.id}-${index}`;
                  const isTaskCompleted = taskCompletionStatus[taskKey];

                  workElements.push(
                    <li key={taskKey} className="task-item">
                      <div className="task-details">
                        <input
                          type="checkbox"
                          checked={!!isTaskCompleted}
                          onChange={() => toggleTaskCompletion(work.id, index)}
                        />
                        <span
                          style={{
                            textDecoration: isTaskCompleted
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {task.name} - Description: {task.description}, Time: {task.startTime} - {task.endTime}, Repeat: {task.repeatOption === "Tùy chỉnh"
                            ? task.customRepeat.repeatUnit === "ngày"
                              ? `Lặp lại ${task.customRepeat.repeatEvery} ngày một lần từ ${new Date(
                                  task.customRepeat.startDate
                                ).toLocaleDateString("vi-VN")}`
                              : task.customRepeat.repeatUnit === "tuần"
                              ? `Lặp lại ${task.customRepeat.repeatEvery} tuần một lần vào các ngày ${task.customRepeat.repeatDays.join(", ")}`
                              : task.customRepeat.repeatUnit === "tháng"
                              ? task.customRepeat.repeatMonthOption === "specificDay"
                                ? `Lặp lại vào ngày ${new Date(task.customRepeat.startDate).getDate()} mỗi ${task.customRepeat.repeatEvery} tháng`
                                : `Lặp lại vào ${new Date(task.customRepeat.startDate).toLocaleDateString("en-US", {
                                    weekday: "long",
                                  })} - ${["First", "Second", "Third", "Fourth", "Fifth"][
                                    Math.ceil(new Date(task.customRepeat.startDate).getDate() / 7) - 1
                                  ]} mỗi ${task.customRepeat.repeatEvery} tháng`
                              : task.customRepeat.repeatUnit === "năm"
                              ? `Lặp lại ${task.customRepeat.repeatEvery} năm một lần vào ${new Date(
                                  task.customRepeat.startDate
                                ).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`
                              : ""
                            : task.repeatOption}

                        </span>
                        <button
                          className="task-delete-icon"
                          onClick={() => handleDeleteTask(work.id, index)}
                        >
                          <AiFillDelete size={14} className="task-delete-icon-style" />
                        </button>
                      </div>
                    </li>
                  );
                });
              }

              return workElements;
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Project;
