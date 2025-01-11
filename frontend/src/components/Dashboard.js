import React, { useState, useEffect } from "react";
import Aos from "aos";
import "./styles/dashboard.css";
import { AiFillDelete, AiFillEdit, AiOutlinePlus } from "react-icons/ai";

const Dashboard = ({
  works,
  setWorks,
  completedWorks,
  setCompletedWorks,
  recycledWorks,
  setRecycledWorks,
  taskCompletionStatus,
  setTaskCompletionStatus,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    type: "",
    startDate: "",
    endDate: "",
    describe: "",
    tag: "",
  });

  const [taskFormData, setTaskFormData] = useState({
    workId: null,
    taskName: "",
    taskDescription: "",
    startTime: "",
    endTime: "",
    repeatOption: "Không lặp lại",
    customRepeat: {
      repeatEvery: 1,
      repeatUnit: "ngày",
      repeatDays: [],
    },
  });

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    Aos.init({ duration: 1000 });
  }, []);

  useEffect(() => {
    if (isModalOpen || isTaskModalOpen) {
      document.body.classList.add("disable-hover");
    } else {
      document.body.classList.remove("disable-hover");
    }
  }, [isModalOpen, isTaskModalOpen]);

  const handleAddNewWork = () => {
    setIsModalOpen(true);
    setEditMode(false);
    setFormData({
      id: null,
      name: "",
      type: "",
      startDate: "",
      endDate: "",
      describe: "",
      tag: "",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;

    setTaskFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "customRepeat.repeatUnit" && value === "ngày") {
        updated.customRepeat.repeatDays = [];
      }

      return updated;
    });
  };

  const handleAddTask = (workId) => {
    const work = Object.values(works).flat().find((work) => work.id === workId);
    setIsTaskModalOpen(true);
    setTaskFormData({ ...taskFormData, workId, workName: work ? work.name : "" });
  };

  const handleDone = () => {
    const { name, type, startDate, endDate } = formData;

    if (!name || !type || !startDate || !endDate || !formData.tag) {
      alert("Please fill in all fields.");
      return;
    }

    setWorks((prevWorks) => {
      const updatedWorks = { ...prevWorks };

      if (editMode) {
        Object.keys(updatedWorks).forEach((type) => {
          updatedWorks[type] = updatedWorks[type].filter(
            (work) => work.id !== formData.id
          );
        });
      }

      updatedWorks[type] = [
        ...updatedWorks[type],
        {
          ...formData,
          id: formData.id || Date.now(),
          subWorks: formData.subWorks || [],
        },
      ];

      return updatedWorks;
    });

    setIsModalOpen(false);
  };

  const handleDoneTask = () => {
    const { startTime, endTime, taskName, repeatOption, customRepeat } = taskFormData;
  
    if (!taskName || !startTime || !endTime) {
      alert("Please fill in all fields.");
      return;
    }
  
    if (repeatOption === "Tùy chỉnh" && !customRepeat.startDate) {
      alert("Please select a start date for custom repeat.");
      return;
    }
  
    let [startHour, startMinute] = startTime.split(":").map(Number);
    let [endHour, endMinute] = endTime.split(":").map(Number);
  
    if (endHour === 0 && endMinute === 0) {
      endHour = 24;
    }
  
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
  
    if (endTotalMinutes < startTotalMinutes) {
      alert("End time must be equal to or after start time.");
      return;
    }
  
    const updatedCustomRepeat = { ...customRepeat };
    if (updatedCustomRepeat.repeatUnit === "ngày") {
      delete updatedCustomRepeat.repeatDays;
    }
  
    setWorks((prevWorks) => {
      const updatedWorks = { ...prevWorks };
      const workType = Object.keys(updatedWorks).find((type) =>
        updatedWorks[type].some((work) => work.id === taskFormData.workId)
      );
  
      if (!workType) {
        alert("Work not found. Please try again.");
        return prevWorks;
      }
  
      const workIndex = updatedWorks[workType].findIndex(
        (work) => work.id === taskFormData.workId
      );
  
      if (workIndex === -1) {
        alert("Work not found. Please try again.");
        return prevWorks;
      }
  
      const work = updatedWorks[workType][workIndex];
      if (!work.subWorks) {
        work.subWorks = [];
      }
  
      const isDuplicateTask = work.subWorks.some(
        (subWork) => subWork.name === taskFormData.taskName
      );
  
      if (!isDuplicateTask) {
        work.subWorks.push({
          name: taskFormData.taskName,
          description: taskFormData.taskDescription,
          startTime: taskFormData.startTime,
          endTime: taskFormData.endTime,
          repeatOption: taskFormData.repeatOption,
          customRepeat: taskFormData.customRepeat,
        });
      }
  
      return updatedWorks;
    });
  
    // Reset form
    setTaskFormData({
      workId: null,
      taskName: "",
      taskDescription: "",
      startTime: "",
      endTime: "",
      repeatOption: "Không lặp lại",
      customRepeat: {
        repeatEvery: 1,
        repeatUnit: "ngày",
        repeatDays: [],
      },
    });
  
    setIsTaskModalOpen(false);
  };
  

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsTaskModalOpen(false);
  };

  const handleDeleteWork = (type, workId) => {
    setWorks((prevWorks) => {
      const updatedWorks = { ...prevWorks };
  
      // Tìm và lưu lại work cần xóa
      const deletedWorkIndex = updatedWorks[type].findIndex((work) => work.id === workId);
      if (deletedWorkIndex !== -1) {
        const deletedWork = updatedWorks[type][deletedWorkIndex];
  
        // Gắn trạng thái task từ taskCompletionStatus vào work trước khi thêm vào recycle
        const updatedSubWorks = (deletedWork.subWorks || []).map((task, index) => ({
          ...task,
          isCompleted: !!taskCompletionStatus[`${workId}-${index}`], // Lấy trạng thái task
        }));
  
        // Thêm work vào RecycledWorks với trạng thái task đã cập nhật
        setRecycledWorks((prevRecycledWorks) => {
          const newRecycledWork = {
            ...deletedWork,
            subWorks: updatedSubWorks,
            isCompleted: completedWorks.some((work) => work.id === workId),
          };
          return [...prevRecycledWorks, newRecycledWork];
        });
  
        // Xóa work khỏi works
        updatedWorks[type].splice(deletedWorkIndex, 1);
      }
  
      return updatedWorks;
    });
  
    // Cập nhật trạng thái của các task liên quan trong taskCompletionStatus
    setTaskCompletionStatus((prevStatus) => {
      const updatedStatus = { ...prevStatus };
  
      const relatedTasks = Object.keys(updatedStatus).filter((key) =>
        key.startsWith(`${workId}-`)
      );
  
      relatedTasks.forEach((key) => {
        delete updatedStatus[key];
      });
  
      return updatedStatus;
    });
  };
  

  
  const handleEditTask = (work) => {
    setEditMode(true);
    setFormData(work);
    setIsModalOpen(true);
  };

  const handleWorkCheckbox = (type, workId) => {
    setWorks((prevWorks) => {
      const updatedWorks = { ...prevWorks };
      const workIndex = updatedWorks[type].findIndex((work) => work.id === workId);

      if (workIndex !== -1) {
        const work = { ...updatedWorks[type][workIndex] };

        // Kiểm tra trạng thái hiện tại và thay đổi
        if (!completedWorks.some((w) => w.id === workId)) {
          // Nếu chưa trong completedWorks, thêm vào
          setCompletedWorks((prevCompleted) => [...prevCompleted, { ...work, isCompleted: true }]);

          // Đánh dấu tất cả các task con của work là hoàn thành
          setTaskCompletionStatus((prevStatus) => {
            const updatedStatus = { ...prevStatus };
            work.subWorks.forEach((_, index) => {
              updatedStatus[`${work.id}-${index}`] = true;
            });
            return updatedStatus;
          });

          // Xóa work khỏi works
          updatedWorks[type] = updatedWorks[type].filter((w) => w.id !== workId);
        } else {
          // Nếu đã trong completedWorks, xóa khỏi đó và thêm lại vào works
          setCompletedWorks((prevCompleted) => prevCompleted.filter((w) => w.id !== workId));

          // Đánh dấu tất cả các task con của work là chưa hoàn thành
          setTaskCompletionStatus((prevStatus) => {
            const updatedStatus = { ...prevStatus };
            work.subWorks.forEach((_, index) => {
              updatedStatus[`${work.id}-${index}`] = false;
            });
            return updatedStatus;
          });

          // Đưa work trở lại works
          updatedWorks[type].push({ ...work, isCompleted: false });
        }
      }

      return updatedWorks;
    });
  };

  const handleDragStart = (e, work, type) => {
    e.dataTransfer.setData("work", JSON.stringify({ ...work, type }));
  };

  const handleDrop = (e, newType) => {
    const data = JSON.parse(e.dataTransfer.getData("work"));

    if (data.type === newType) return;

    setWorks((prevWorks) => {
      const updatedSourceWorks = prevWorks[data.type].filter(
        (work) => work.id !== data.id
      );
      const updatedTargetWorks = [
        ...prevWorks[newType],
        { ...data, type: newType },
      ];
      return {
        ...prevWorks,
        [data.type]: updatedSourceWorks,
        [newType]: updatedTargetWorks,
      };
    });
  };

  const allowDrop = (e) => e.preventDefault();

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="home-body-conatiner" data-aos="zoom-in">
      <header id="dash-header" className="menu-bar">
        <h1>Dashboard</h1>
      </header>
      <button className="add-work-btn" onClick={handleAddNewWork}>
        Add new work
      </button>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editMode ? "Edit Work" : "Add New Work"}</h2>
            <input
              type="text"
              placeholder="Enter work name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
            />
            <div className="form-row">
              <select
                name="type"
                value={formData.type}
                onChange={handleFormChange}
              >
                <option value="">Select type</option>
                <option value="doNow">Do now</option>
                <option value="schedule">Schedule</option>
                <option value="delegate">Delegate</option>
                <option value="drop">Drop</option>
              </select>
              <select
                name="tag"
                value={formData.tag}
                onChange={(e) => {
                  handleFormChange(e);
                  if (e.target.value === "Other") {
                    setFormData((prev) => ({ ...prev, customTag: "" }));
                  } else {
                    setFormData((prev) => ({ ...prev, customTag: null }));
                  }
                }}
              >
                <option value="">Select tag</option>
                <option value="Học tập">Học tập</option>
                <option value="Làm việc">Làm việc</option>
                <option value="Nghỉ ngơi">Nghỉ ngơi</option>
                <option value="Giải trí">Giải trí</option>
                <option value="Other">Other</option>
              </select>
              {formData.tag === "Other" && (
                <input
                  type="text"
                  placeholder="Enter here"
                  name="customTag"
                  value={formData.customTag || ""}
                  onChange={handleFormChange}
                />
              )}
            </div>
            <div className="form-row">
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleFormChange}
              />
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleFormChange}
              />
            </div>
            <textarea
              placeholder="Describe work (use # for hashtags)"
              name="describe"
              value={formData.describe}
              onChange={handleFormChange}
              rows="4"
            ></textarea>
            <div className="modal-buttons">
              <button onClick={handleDone}>Done</button>
              <button onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div className="modal modal-task">
          <div className="modal-content modal-task-content">
            <div className="modal-left">
              <h2>Add Task for {taskFormData.workName}</h2>
              <input
                type="text"
                placeholder="Enter task name"
                name="taskName"
                value={taskFormData.taskName}
                onChange={handleTaskFormChange}
              />
              <textarea
                placeholder="Task description"
                name="taskDescription"
                value={taskFormData.taskDescription}
                onChange={handleTaskFormChange}
                rows="4"
              ></textarea>
              <div className="form-row-inline">
  <div>
    <label>Start Time</label>
    <input
      type="time"
      name="startTime"
      value={taskFormData.startTime}
      onChange={handleTaskFormChange}
    />
  </div>
  <div>
    <label>End Time</label>
    <input
      type="time"
      name="endTime"
      value={taskFormData.endTime}
      onChange={handleTaskFormChange}
    />
  </div>
  <div>
    <label>Repeat</label>
    <select
      name="repeatOption"
      value={taskFormData.repeatOption}
      onChange={(e) => {
        handleTaskFormChange(e);
        if (e.target.value === "Tùy chỉnh") {
          setTaskFormData((prev) => ({
            ...prev,
            customRepeat: {
              ...prev.customRepeat,
              isCustomizing: true,
            },
          }));
        }
      }}
    >
      <option value="Không lặp lại">Không lặp lại</option>
      <option value="Hàng ngày">Hàng ngày</option>
      <option value="Tùy chỉnh">Tùy chỉnh</option>
    </select>
  </div>
</div>

              {taskFormData.repeatOption === "Tùy chỉnh" && taskFormData.customRepeat.isCustomizing && (
  <div className="custom-repeat-form">
    <div className="form-row-inline-2">
  <label>
    Lặp lại mỗi:
    <input
      type="number"
      min="1"
      name="repeatEvery"
      value={taskFormData.customRepeat.repeatEvery}
      onChange={(e) =>
        setTaskFormData((prev) => ({
          ...prev,
          customRepeat: {
            ...prev.customRepeat,
            repeatEvery: Math.max(1, Number(e.target.value)),
          },
        }))
      }
    />
  </label>
  
  <div>
    <select
      name="repeatUnit"
      value={taskFormData.customRepeat.repeatUnit}
      onChange={(e) =>
        setTaskFormData((prev) => {
          const isDay = e.target.value === "ngày";
          return {
            ...prev,
            customRepeat: {
              ...prev.customRepeat,
              repeatUnit: e.target.value,
              repeatDays: isDay || e.target.value === "năm" ? [] : prev.customRepeat.repeatDays,
              repeatMonthOption: e.target.value === "tháng" ? "specificDay" : undefined,
            },
          };
        })
      }
    >
      <option value="ngày">Ngày</option>
      <option value="tuần">Tuần</option>
      <option value="tháng">Tháng</option>
      <option value="năm">Năm</option>
    </select>
  </div>
</div>


    {/* Ngày bắt đầu */}
    <div className="form-row">
      <label>
        Ngày bắt đầu:
        <input
          type="date"
          name="startDate"
          value={taskFormData.customRepeat.startDate || ""}
          onChange={(e) =>
            setTaskFormData((prev) => ({
              ...prev,
              customRepeat: {
                ...prev.customRepeat,
                startDate: e.target.value,
              },
            }))
          }
        />
      </label>
    </div>

    {/* Các trường tùy chỉnh theo đơn vị lặp */}
    {taskFormData.customRepeat.repeatUnit === "tuần" && (
      <div className="form-row">
        <label>Lặp lại vào:</label>
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
          <label key={day} className="repeat-day-option">
            <input
              type="checkbox"
              checked={taskFormData.customRepeat.repeatDays.includes(day)}
              onChange={(e) => {
                setTaskFormData((prev) => {
                  const updatedDays = e.target.checked
                    ? [...prev.customRepeat.repeatDays, day]
                    : prev.customRepeat.repeatDays.filter((d) => d !== day);
                  return {
                    ...prev,
                    customRepeat: {
                      ...prev.customRepeat,
                      repeatDays: updatedDays,
                    },
                  };
                });
              }}
            />
            {day}
          </label>
        ))}
      </div>
    )}

{taskFormData.customRepeat.repeatUnit === "tháng" &&
  taskFormData.customRepeat.startDate && (
    <div className="form-row">
      <label>Chọn kiểu lặp:</label>
      <select
        name="repeatMonthOption"
        value={taskFormData.customRepeat.repeatMonthOption || "specificDay"}
        onChange={(e) =>
          setTaskFormData((prev) => ({
            ...prev,
            customRepeat: {
              ...prev.customRepeat,
              repeatMonthOption: e.target.value,
            },
          }))
        }
      >
        <option value="specificDay">
          Lặp lại vào ngày {new Date(taskFormData.customRepeat.startDate).getDate()} mỗi {taskFormData.customRepeat.repeatEvery} tháng
        </option>
        <option value="weekdayInMonth">
          Lặp lại vào {new Date(taskFormData.customRepeat.startDate).toLocaleDateString("en-US", { weekday: "long" })} -{" "}
          {["First", "Second", "Third", "Fourth", "Fifth"][
            Math.ceil(new Date(taskFormData.customRepeat.startDate).getDate() / 7) - 1
          ]} mỗi {taskFormData.customRepeat.repeatEvery} tháng
        </option>
      </select>
    </div>
  )}
  </div>
)}
              <div className="modal-buttons">
                <button onClick={handleDoneTask}>Add Task</button>
                <button onClick={handleCancel}>Cancel</button>
              </div>
            </div>
            <div className="modal-right">
              <h2>Existing Tasks</h2>
              {(() => {
                const workType = Object.keys(works).find((type) =>
                  works[type].some((work) => work.id === taskFormData.workId)
                );
                if (!workType) return <p>No tasks available.</p>;
              
                const work = works[workType].find((work) => work.id === taskFormData.workId);
              
                return work && work.subWorks && work.subWorks.length > 0 ? (
                  <ul>
                    {work.subWorks.map((subWork, index) => (
                      <li key={index}>
                        <h4>{subWork.name}</h4>
                        <p>{subWork.description}</p>
                        <p>
                          {subWork.startTime} - {subWork.endTime}
                        </p>
                        <p>
                        {subWork.repeatOption === "Tùy chỉnh"
                         ? subWork.customRepeat.repeatUnit === "ngày"
                           ? `Lặp lại ${subWork.customRepeat.repeatEvery} ngày một lần từ ${new Date(
                               subWork.customRepeat.startDate
                             ).toLocaleDateString("vi-VN")}`
                           : subWork.customRepeat.repeatUnit === "tuần"
                           ? `Lặp lại ${subWork.customRepeat.repeatEvery} tuần một lần vào các ngày ${subWork.customRepeat.repeatDays.join(", ")}`
                           : subWork.customRepeat.repeatUnit === "tháng"
                           ? subWork.customRepeat.repeatMonthOption === "specificDay"
                             ? `Lặp lại vào ngày ${new Date(subWork.customRepeat.startDate).getDate()} mỗi ${subWork.customRepeat.repeatEvery} tháng`
                             : `Lặp lại vào ${new Date(subWork.customRepeat.startDate).toLocaleDateString("en-US", {
                                 weekday: "long",
                               })} - ${["First", "Second", "Third", "Fourth", "Fifth"][
                                 Math.ceil(new Date(subWork.customRepeat.startDate).getDate() / 7) - 1
                               ]} mỗi ${subWork.customRepeat.repeatEvery} tháng`
                           : subWork.customRepeat.repeatUnit === "năm"
                           ? `Lặp lại ${subWork.customRepeat.repeatEvery} năm một lần vào ${new Date(
                               subWork.customRepeat.startDate
                             ).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`
                           : ""
                         : subWork.repeatOption}
                       

                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No tasks available.</p>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <main className="body-content">
        {["doNow", "schedule", "delegate", "drop"].map((type) => (
          <div
            className="work-box"
            key={type}
            onDrop={(e) => handleDrop(e, type)}
            onDragOver={allowDrop}
          >
            <h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
            <div className="work-list">
              {works[type].map((work) => (
                <div
                  key={work.id}
                  className="work"
                  draggable
                  onDragStart={(e) => handleDragStart(e, work, type)}
                >
                  <div className="work-info">
                    <input
                      type="checkbox"
                      onChange={() => handleWorkCheckbox(type, work.id, -1)}
                    />
                    <span>{work.name}</span>
                    <p>
                      {formatDate(work.startDate)} - {formatDate(work.endDate)}
                    </p>
                    <p>
                      {work.describe
                        ? work.describe.split(" ").map((word, i) =>
                            word.startsWith("#") ? (
                              <span key={i} style={{ color: "blue" }}>
                                {word}{" "}
                              </span>
                            ) : (
                              `${word} `
                            )
                          )
                        : "No description"}
                    </p>
                    <p>Tasks: {work.subWorks ? work.subWorks.length : 0}</p>
                  </div>
                  <div className="work-buttons">
                    <AiOutlinePlus
                      className="add-work-icon"
                      onClick={() => handleAddTask(work.id)}
                    />
                    <AiFillEdit
                      className="edit-icon"
                      onClick={() => handleEditTask(work)}
                    />
                    <AiFillDelete
                      className="delete-icon"
                      onClick={() => handleDeleteWork(type, work.id)}
                    />

                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default Dashboard;
