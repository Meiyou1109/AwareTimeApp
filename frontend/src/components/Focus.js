import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import "./styles/focus.css";

const Focus = ({ works = {}, toast }) => {
  const [mode, setMode] = useState("auto");
  const [selectedWork, setSelectedWork] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentTaskManual, setCurrentTaskManual] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempWork, setTempWork] = useState(null);
  const [tempTask, setTempTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [isFocusPhase, setIsFocusPhase] = useState(true);
  const [tasksForToday, setTasksForToday] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const timelineRef = useRef(null);
  const [selectedTaskName, setSelectedTaskName] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [freeModeTime, setFreeModeTime] = useState(0); // Thời gian đếm giờ tự do
  const [currentMode, setCurrentMode] = useState("pomodoro"); // Lưu chế độ hiện tại
  const [countdownTimeTask, setCountdownTimeTask] = useState(0);
  const [isTaskSelected, setIsTaskSelected] = useState(false);
  const [todayDataTimeCount, setTodayDataTimeCount] = useState([]);
  const [isTodayDataVisible, setIsTodayDataVisible] = useState(false);
  const [lastTaskStartTime, setLastTaskStartTime] = useState(null);
  const intervalRef = useRef(null);
  const [viewMode, setViewMode] = useState("byTime");
  const [isAutoSelectEnabled, setIsAutoSelectEnabled] = useState(false);
  const [selectedTasksManual, setSelectedTasksManual] = useState([]);
  
  const [currentRecord, setCurrentRecord] = useState(null);
  const [records, setRecords] = useState([]); // Danh sách tất cả các record
  const [recordCounter, setRecordCounter] = useState(0);

  const [recordNameInput, setRecordNameInput] = useState("");
  const totalFreeTime = useMemo(() => {
    return records.reduce((total, record) => total + record.time, 0);
  }, [records]);

  const toggleFreeMode = () => {
    if (isFreeMode) {
      // Chuyển về chế độ Pomodoro
      setIsFreeMode(false);
      setFreeModeTime(0);
      setTimeLeft(isFocusPhase ? 1500 : timeLeft);
    } else {
      // Chuyển sang chế độ tự do
      setIsFreeMode(true);
      setFreeModeTime(0);
      setIsRunning(false);
    }
  };
  
  useEffect(() => {
    if (timeLeft === 0) {
      if (currentMode === "pomodoro") {
        setPomodoroCount((prevCount) => {
          const newCount = prevCount + 1;
          if (newCount % 4 === 0) {
            setCurrentMode("long-break");
            setTimeLeft(900); // Long Break - 15 phút
          } else {
            setCurrentMode("short-break");
            setTimeLeft(300); // Short Break - 5 phút
          }
          return newCount;
        });
      } else if (currentMode === "short-break" || currentMode === "long-break") {
        setCurrentMode("pomodoro");
        setTimeLeft(1500); // Pomodoro - 25 phút
      }
    }
  }, [timeLeft, currentMode]);
  

  // Chu kỳ Pomodoro
  const handlePomodoroComplete = useCallback(() => {
    setIsRunning(false);
    if (isFocusPhase) {
      setIsFocusPhase(false);
      setCycle((prev) => prev + 1);
      if ((cycle + 1) % 4 === 0) {
        setTimeLeft(900);
        toast.info("Long Break! Take a 15-minute rest.");
      } else {
        setTimeLeft(300);
        toast.info("Short Break! Take a 5-minute rest.");
      }
    } else {
      setIsFocusPhase(true);
      setTimeLeft(1500);
      toast.success("Back to Focus! 25 minutes.");
    }
  }, [cycle, isFocusPhase, toast]);


// Quản lý realTimeTaskCount khi đồng hồ chạy
useEffect(() => {
  if (!isRunning || !selectedTaskName || currentMode !== "pomodoro") {
    clearInterval(intervalRef.current);
    return;
  }

  clearInterval(intervalRef.current);

  intervalRef.current = setInterval(() => {
    setTodayDataTimeCount((prev) =>
      prev.map((task) => {
        if (task.name === selectedTaskName) {
          const updatedRealTime = task.realTimeTaskCount + 1;
          const percentCompleted = Math.floor(
            (updatedRealTime / task.totalTimeSlotInSeconds) * 100
          );
          return {
            ...task,
            realTimeTaskCount: updatedRealTime,
            status: `${percentCompleted}%`,
          };
        }
        return task;
      })
    );
  }, 1000);

  return () => clearInterval(intervalRef.current);
}, [isRunning, selectedTaskName, currentMode]);

//realtime của manual
useEffect(() => {
  if (!isRunning || mode !== "manual" || !currentTaskManual) return;

  const timer = setInterval(() => {
    setSelectedTasksManual((prev) => {
      const existingTask = prev.find((task) => task.name === currentTaskManual.name);
      if (existingTask) {
        return prev.map((task) =>
          task.name === currentTaskManual.name
            ? { ...task, time: task.time + 1 }
            : task
        );
      } else {
        return [
          ...prev,
          {
            name: currentTaskManual.name,
            time: 1,
          },
        ];
      }
    });
  }, 1000);

  return () => clearInterval(timer);
}, [isRunning, mode, currentTaskManual]);


const totalRealTime = useMemo(() => {
  return todayDataTimeCount.reduce((total, task) => total + task.realTimeTaskCount, 0);
}, [todayDataTimeCount]);

const completedTaskCount = useMemo(() => {
  return todayDataTimeCount.filter((task) => parseInt(task.status.replace('%', ''), 10) >= 100).length;
}, [todayDataTimeCount]);

const totalTasks = todayDataTimeCount.length;

const handleStartPause = () => {
  if (isRunning) {
    clearInterval(intervalRef.current);
    setIsRunning(false);
  } else {
    if (!isTaskSelected && !currentRecord) {
      toast.error("Please choose a task or record");
      return;
    }

    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      if (isTaskSelected) {
        setTodayDataTimeCount((prev) =>
          prev.map((task) =>
            task.name === selectedTaskName
              ? { ...task, realTimeTaskCount: task.realTimeTaskCount + 1 }
              : task
          )
        );
      } else if (currentRecord) {
        setRecords((prev) =>
          prev.map((record) =>
            record.name === currentRecord.name
              ? { ...record, time: record.time + 1 }
              : record
          )
        );
      }
    }, 1000);
  }
};

  useEffect(() => {
    setTodayDataTimeCount(
      tasksForToday.map((task) => {
        const taskTimeSlot = calculateTimeSlot(task.startTime, task.endTime);
        const [hours, minutes] = taskTimeSlot.split(":").map(Number);
        const totalTimeSlotInSeconds = hours * 3600 + minutes * 60;
  
        return {
          name: task.name,
          date: new Date().toDateString(),
          realTimeTaskCount: 0,
          timeSlot: `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:00`,
          totalTimeSlotInSeconds,
          status: "0%",
        };
      })
    );
  }, [tasksForToday]);
  
  
  const [pomodoroCount, setPomodoroCount] = useState(0);
  console.log(pomodoroCount);
  const handleSkip = () => {
    if (currentMode === "pomodoro") {
      setPomodoroCount((prevCount) => {
        const newCount = prevCount + 1;
        if (newCount % 4 === 0) {
          // Sau 3 lần nghỉ ngắn, nghỉ dài
          setCurrentMode("long-break");
          setTimeLeft(900); // Long Break - 15 phút
        } else {
          setCurrentMode("short-break");
          setTimeLeft(300); // Short Break - 5 phút
        }
        return newCount;
      });
    } else if (currentMode === "short-break" || currentMode === "long-break") {
      setCurrentMode("pomodoro");
      setTimeLeft(1500); // Pomodoro - 25 phút
    }
  };

  // THỜI GIAN CHO COUNTDOWN TIME
  useEffect(() => {
    let countdownTimer;
    if (isTaskSelected && isRunning && (currentMode === "pomodoro" || isFreeMode)) {
      countdownTimer = setInterval(() => {
        setCountdownTimeTask((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(countdownTimer);
  }, [isRunning, isTaskSelected, currentMode, isFreeMode]);
  
    useEffect(() => {
      let timer;
      if (isRunning && timeLeft > 0) {
        timer = setInterval(() => {
          setTimeLeft((prev) => prev - 1);
    
          if (currentRecord) {
            setRecords((prev) =>
              prev.map((record) =>
                record.name === currentRecord.name
                  ? { ...record, time: record.time + 1 }
                  : record
              )
            );
          }
        }, 1000);
      } else if (timeLeft === 0) {
        handlePomodoroComplete();
      }
      return () => clearInterval(timer);
    }, [isRunning, timeLeft, currentRecord]);
    

  // Freemode count time
  useEffect(() => {
    let freeModeTimer;
    if (isFreeMode && isRunning && currentRecord) {
      freeModeTimer = setInterval(() => {
        setFreeModeTime((prev) => prev + 1);
  
        // Cập nhật thời gian của Record
        setRecords((prev) =>
          prev.map((record) =>
            record.name === currentRecord.name
              ? { ...record, time: record.time + 1 }
              : record
          )
        );
      }, 1000);
    }
    return () => clearInterval(freeModeTimer);
  }, [isFreeMode, isRunning, currentRecord]);
  
  // Chọn và bỏ chọn task
  const handleSelectTaskBlock = (taskName) => {
    if (mode !== "auto") {
      toast.error("This feature is only available in Auto mode.");
      return;
    }
    // Nếu AutoSelect đang bật và người dùng thao tác chọn task, tắt AutoSelect
    if (isAutoSelectEnabled) {
      setIsAutoSelectEnabled(false);
    }
  
    if (selectedTaskName === taskName) {
      if (isRunning) {
        clearInterval(intervalRef.current);
      }
      setSelectedTaskName(null);
      setIsTaskSelected(false);
      setCountdownTimeTask(0);
      setLastTaskStartTime(null);
      setIsRunning(false);
      return;
    }
  
    // Chuyển sang task mới
    const selectedTask = tasksForToday.find((task) => task.name === taskName);
    setSelectedTaskName(taskName);
    
  
    if (selectedTask) {
      const taskTimeSlotInSeconds = taskTimeSlotToSeconds(
        calculateTimeSlot(selectedTask.startTime, selectedTask.endTime)
      );
      const taskData = todayDataTimeCount.find((task) => task.name === taskName);
      const taskWorkedTime = taskData ? taskData.realTimeTaskCount : 0;
  
      const remainingTime = Math.max(taskTimeSlotInSeconds - taskWorkedTime, 0);
      console.log(lastTaskStartTime);
      setCountdownTimeTask(remainingTime);
      setIsTaskSelected(true);
      setLastTaskStartTime(null);
    } else {
      setCountdownTimeTask(0);
      setIsTaskSelected(false);
    }
  };

  const handleSelectRecord = (recordName) => {
    if (currentRecord?.name === recordName) {
      setCurrentRecord(null);
      setIsRunning(false);
    } else {
      const selectedRecord = records.find((record) => record.name === recordName);
      if (selectedRecord) {
        setCurrentRecord(selectedRecord); // Chọn record mới
      }
    }
  };
  
  const handleDeleteRecord = (recordName) => {
    if (currentRecord?.name === recordName) {
      setCurrentRecord(null);
      setIsRunning(false);
    }
    setRecords((prev) => prev.filter((record) => record.name !== recordName));
  };
  
  
  //Mode Free - create new record
  const handleCreateRecord = () => {
    const newName =
      recordNameInput.trim() || `Unknow Record ${recordCounter + 1}`;
    const newRecord = {
      name: newName,
      time: 0,
    };
    setRecords([...records, newRecord]);
    setCurrentRecord(newRecord); 
    setRecordNameInput("");
    setRecordCounter((prev) => prev + 1);
  };
  
  useEffect(() => {
    if (isFreeMode && isRunning && currentRecord) {
      const timer = setInterval(() => {
        setRecords((prevRecords) =>
          prevRecords.map((record) =>
            record.name === currentRecord.name
              ? { ...record, time: record.time + 1 }
              : record
          )
        );
      }, 1000);
  
      return () => clearInterval(timer);
    }
  }, [isFreeMode, isRunning, currentRecord]);
  
  
  
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentMode === "short-break" || currentMode === "long-break") {
      setIsRunning(false);
    }
  }, [currentMode]);
  

  // Tự động cuộn đến current-time-line khi mở trang
  useEffect(() => {
  if (timelineRef.current) {
    const currentTimePosition = currentTime.getHours() * 60 + currentTime.getMinutes();
    timelineRef.current.scrollTo({
      top: currentTimePosition - 50,
      behavior: "smooth",
    });
  }
}, [currentTime]);

  // Calculate tasks for today
  const calculateTasksForToday = useCallback(() => {
    const today = new Date();
    const tasks = [];

    Object.values(works).flat().forEach((work) => {
      const workStartDate = new Date(work.startDate);
      const workEndDate = new Date(work.endDate);

      work.subWorks.forEach((task) => {
        const { startTime, endTime, repeatOption, customRepeat = {} } = task;
        const [startHour, startMinute] = startTime.split(":").map(Number);
        const [endHour, endMinute] = endTime.split(":").map(Number);

        let validDates = [];
        if (repeatOption === "Không lặp lại") {
          validDates = [workStartDate];
        } else if (repeatOption === "Hàng ngày") {
          let currentDate = new Date(workStartDate);
          while (currentDate <= workEndDate) {
            validDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else if (repeatOption === "Tùy chỉnh") {
          const { repeatEvery = 1, repeatUnit = "ngày", startDate, repeatDays = [] } = customRepeat;
          const taskStartDate = startDate ? new Date(startDate) : workStartDate;
          let currentDate = new Date(taskStartDate);

          if (repeatUnit === "ngày") {
            while (currentDate <= workEndDate) {
              validDates.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + repeatEvery);
            }
          } else if (repeatUnit === "tuần") {
            const dayMapping = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
            while (currentDate <= workEndDate) {
              const dayOfWeek = dayMapping[currentDate.getDay()];
              if (repeatDays.includes(dayOfWeek)) {
                validDates.push(new Date(currentDate));
              }
              currentDate.setDate(currentDate.getDate() + 1);
            }
          }
        }

        validDates.forEach((date) => {
          if (date.toDateString() === today.toDateString()) {
            tasks.push({
              ...task,
              workName: work.name,
              startTime: new Date(today.setHours(startHour, startMinute)),
              endTime: new Date(today.setHours(endHour, endMinute)),
            });
          }
        });
      });
    });

    const sortedTasks = tasks.sort((a, b) => a.startTime - b.startTime);
    setTasksForToday(sortedTasks);
  }, [works]);

  const autoSelectTask = useCallback(() => {
    if (!isAutoSelectEnabled) {
      setIsAutoSelectEnabled(true);
    }
  
    const availableTasks = todayDataTimeCount.filter(
      (task) => parseInt(task.status.replace("%", ""), 10) < 100
    );
  
    if (availableTasks.length === 0) return;
  
    let selectedTask = null;
  
    // Ưu tiên chọn task theo chế độ xem
    if (viewMode === "byPercent") {
      availableTasks.sort((a, b) => {
        const percentA = parseInt(a.status.replace("%", ""), 10);
        const percentB = parseInt(b.status.replace("%", ""), 10);
        if (percentA !== percentB) return percentB - percentA;
        return a.totalTimeSlotInSeconds - b.totalTimeSlotInSeconds;
      });
    } else if (viewMode === "byTime") {
      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      availableTasks.sort((a, b) => {
        const taskAStartMinutes =
          tasksForToday.find((task) => task.name === a.name)?.startTime?.getHours() * 60 +
          tasksForToday.find((task) => task.name === a.name)?.startTime?.getMinutes() || Infinity;
  
        const taskBStartMinutes =
          tasksForToday.find((task) => task.name === b.name)?.startTime?.getHours() * 60 +
          tasksForToday.find((task) => task.name === b.name)?.startTime?.getMinutes() || Infinity;
  
        const diffA = Math.abs(taskAStartMinutes - currentMinutes);
        const diffB = Math.abs(taskBStartMinutes - currentMinutes);
  
        if (diffA !== diffB) return diffA - diffB;
        return a.totalTimeSlotInSeconds - b.totalTimeSlotInSeconds;
      });
    }
  
    selectedTask = availableTasks[0];
  
    // Nếu task hiện tại đã là ưu tiên, không thay đổi
    if (selectedTaskName === selectedTask.name) return;
  
    // Nếu task hiện tại không phải ưu tiên, chọn lại
    handleSelectTaskBlock(selectedTask.name);
  }, [isAutoSelectEnabled, todayDataTimeCount, viewMode, tasksForToday, currentTime, selectedTaskName]);
  
  // cập nhật danh sách taskFortoday
  useEffect(() => {
    if (mode === "auto") {
      calculateTasksForToday();
    }
  }, [mode, calculateTasksForToday]);


  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        calculateTasksForToday();
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [calculateTasksForToday]);

  const toggleAutoSelect = () => {
    if (mode !== "auto") {
        toast.error("This feature is only available in Auto mode.");
        return;
    }
    setIsAutoSelectEnabled(prev => !prev);
    if (!isAutoSelectEnabled) {
        autoSelectTask();
    }
};

  const renderTaskOnTimeline = (task) => {
    const taskStart = task.startTime;
    const taskEnd = task.endTime;
    const startMinutes = taskStart.getHours() * 60 + taskStart.getMinutes();
    const endMinutes = taskEnd.getHours() * 60 + taskEnd.getMinutes();
  
    // Kiểm tra trạng thái của task
    const isSelected = selectedTaskName === task.name;
    const isDimmed = selectedTaskName && selectedTaskName !== task.name;
  
    return (
      <div
        className={`task-block ${isSelected ? "selected" : ""} ${
          isDimmed ? "dimmed" : ""
        }`}
        style={{
          top: `${startMinutes}px`,
          height: `${endMinutes - startMinutes}px`,
        }}
        key={task.name}
        onClick={() => handleSelectTaskBlock(task.name)} 
      >
        <div className="task-name">{task.name}</div>
        <button className="select-task-button">
          {isSelected ? "Deselect" : "Select"}
        </button>
      </div>
    );
  };
  
  const calculateTimeSlot = (startTime, endTime) => {
    const diff = new Date(endTime - startTime);
    const hours = diff.getUTCHours();
    const minutes = diff.getUTCMinutes();
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };
  
  
  const getPomodoroBackground = () => {
    if (isFreeMode) return "#d4b3e9";
    switch (currentMode) {
      case "pomodoro":
        return "#56daeb";
      case "short-break":
        return "#a8d5ba";
      case "long-break":
        return "#f6e58d";
      default:
        return "#f9f9f9";
    }
  };

  const taskTimeSlotToSeconds = (timeSlot) => {
    const [hours, minutes] = timeSlot.split(":").map(Number);
    return hours * 3600 + minutes * 60;
  };
  
  const handleModeChange = (newMode) => {
    // Nếu chỉ thay đổi giữa pomodoro, short-break, long-break
    if (["pomodoro", "short-break", "long-break"].includes(newMode)) {
      setCurrentMode(newMode);
      if (newMode === "pomodoro") {
        setTimeLeft(1500);
      } else if (newMode === "short-break") {
        setTimeLeft(300);
      } else if (newMode === "long-break") {
        setTimeLeft(900);
      }
      return;
    }
  
    // Nếu thay đổi giữa các chế độ auto, manual, free
    setIsRunning(false);
    setLastTaskStartTime(null);
    setTimeLeft(1500);
    setFreeModeTime(0);
  
    // Bỏ chọn task và record
    setSelectedTaskName(null);
    setIsTaskSelected(false);
    setCurrentTaskManual(null);
    setSelectedWork(null);
    setSelectedTask(null);
    setTempWork(null);
    setTempTask(null);
    setCurrentRecord(null);
  
    // Cập nhật chế độ
    setMode(newMode);
  };

  const openManualSelectModal = () => {
    setTempWork(selectedWork);
    setTempTask(selectedTask);
    setIsModalOpen(true);
  };
  
  const handleManualSelectWork = (work) => {
    setTempWork((prev) => (prev?.id === work.id ? null : work));
    setTempTask(null);
  };

  const handleManualSelectTask = (task) => {
    setTempTask((prev) => (prev?.name === task.name ? null : task));
  };

  const handleManualSelectionDone = () => {
    setSelectedWork(tempWork);
    setSelectedTask(tempTask);
  
    setCurrentTaskManual(
      tempTask
        ? {
            ...tempTask,
            workName: tempWork.name,
            workStartDate: tempWork.startDate,
            workEndDate: tempWork.endDate,
            startTime: new Date(`1970-01-01T${tempTask.startTime}:00`),
            endTime: new Date(`1970-01-01T${tempTask.endTime}:00`),
          }
        : null
    );
    if (tempTask) {
      const taskTimeSlot = calculateTimeSlot(
        new Date(`1970-01-01T${tempTask.startTime}:00`),
        new Date(`1970-01-01T${tempTask.endTime}:00`)
      );
      setCountdownTimeTask(taskTimeSlotToSeconds(taskTimeSlot));
      setIsTaskSelected(true);
    } else {
      setCountdownTimeTask(0);
      setIsTaskSelected(false);
    }
    
    setIsModalOpen(false);
  };
  

  const closeModal = () => {
    setTempWork(selectedWork);
    setTempTask(selectedTask);
    setIsModalOpen(false);
  };

  const selectedTaskData = todayDataTimeCount.find(
    (task) => task.name === selectedTaskName
  );
  
  const percentCompleted = selectedTaskData
    ? parseInt(selectedTaskData.status.replace('%', ''), 10)
    : 0;
    const sortedTodayDataTimeCount = useMemo(() => {
      if (viewMode === "byPercent") {
        return [...todayDataTimeCount].sort((a, b) => {
          const percentA = parseInt(a.status.replace("%", ""), 10);
          const percentB = parseInt(b.status.replace("%", ""), 10);
    
          if (percentA !== percentB) {
            return percentB - percentA; // Sắp xếp theo phần trăm giảm dần
          }
    
          if (a.totalTimeSlotInSeconds !== b.totalTimeSlotInSeconds) {
            return b.totalTimeSlotInSeconds - a.totalTimeSlotInSeconds; // Sắp xếp theo timeslot giảm dần
          }
    
          return a.name.localeCompare(b.name); // Sắp xếp theo thứ tự chữ cái
        });
      }
      return todayDataTimeCount;
    }, [todayDataTimeCount, viewMode]);

  return (
    <div className="main-form" data-aos="zoom-in">
      <header className="menu-bar">
        <h1>Focus</h1>
      </header>

      <div className="container-row">
      <div className="today-data-container">
    <button
      className="today-data-toggle"
      onClick={() => setIsTodayDataVisible((prev) => !prev)}
    >
      TODAY-DataTimeCount ▼
    </button>
    {isTodayDataVisible && (
      <div className="today-data-content">
        <div className="today-data-header">
          <p>Today: {new Date().toDateString()}</p>
          <select
            className="view-mode-selector"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="byTime">By Time</option>
            <option value="byPercent">By Percent</option>
          </select>
        </div>
        <ul>
          {sortedTodayDataTimeCount.map((task, index) => (
            <li key={index}>
              {task.name}{" "}
              <strong>
                {formatTime(task.realTimeTaskCount)} / {task.timeSlot}
              </strong>{" "}
              <span>{task.status}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>

      <div className="countdown-task">
        <div className="progress-bar-todaytask-container">
          <div
            className="progress-bar-todaytask"
            style={{ width: `${Math.min(percentCompleted, 100)}%` }}
          ></div>
        </div>
        {isTaskSelected ? (
          <p className="countdown-text">{formatTime(countdownTimeTask)}</p>
        ) : (
          <p className="countdown-text">Select task!</p>
        )}
      </div>



  <div className="focus-modes">
  <button
    className={`focus-mode ${mode === "auto" ? "active" : ""}`}
    onClick={() => handleModeChange("auto")}
  >
    Tự động
  </button>
  <button
    className={`focus-mode ${mode === "manual" ? "active" : ""}`}
    onClick={() => {handleModeChange("manual");
    openManualSelectModal();
  }}
  >
    Tự chọn
  </button>
  <button
    className={`focus-mode ${mode === "free" ? "active" : ""}`}
    onClick={() => handleModeChange("free")}
  >
    Tự do
  </button>
</div>

</div>


<div className="focus-content">
  <div className="autoselect-container">

    <div className="autoselect-stats">
      <div className="autoselect-stat">
        <span className="stat-label">Total Time:</span>
        <span className="stat-value">{formatTime(totalRealTime)}</span>
      </div>
      <div className="autoselect-stat">
        <span className="stat-label">Completed:</span>
        <span className="stat-value">{`${completedTaskCount}/${totalTasks}`}</span>
    </div>
    <div className="autoselect-stat">
    <button
      className={`autoselect-button ${isAutoSelectEnabled ? "on" : "off"}`}
      onClick={toggleAutoSelect}
      >
          {isAutoSelectEnabled ? "ON" : "OFF"}
    </button>

    </div>
  </div>

    
</div> {/* code for autoSelect end */}

<div className="timeline-container" ref={timelineRef}>
  <div className="timeline">
    <div
      className="current-time-line"
      style={{
        "--time-position": `${currentTime.getHours() * 60 + currentTime.getMinutes()}px`,
        top: `${currentTime.getHours() * 60 + currentTime.getMinutes() + 6.5}px`,
      }}
    ></div>
    {Array.from({ length: 25 }).map((_, hour) => (
      <div key={hour} className="hour-block" style={{ top: `${hour * 60}px` }}>
        <div className="hour-marker">
          {hour < 10 ? `0${hour}:00` : `${hour}:00`}
        </div>
        <div className="hour-divider"></div>
      </div>
    ))}
    {tasksForToday.map((task) => renderTaskOnTimeline(task))}
  </div>
</div> {/* code for timeline-container end */}


{mode === "auto" && (
  <div className="task-list">
          <h2>Today Task</h2>
          <p>
            Tổng số task: <strong>{tasksForToday.length}</strong>
          </p>
          {tasksForToday.length > 0 ? (
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Work</th>
                  <th>Time</th>
                  <th>TimeSlot</th>
                </tr>
              </thead>
              <tbody>
                {tasksForToday.map((task, index) => {
                  const timeSlot = calculateTimeSlot(task.startTime, task.endTime);
                  return (
                    <tr
                      key={index}
                      className={`task-list-item ${
                        selectedTaskName === task.name ? "selected" : ""
                      }`}
                      onClick={() => handleSelectTaskBlock(task.name)}
                    >
                      <td>{task.name}</td>
                      <td>{task.workName || "N/A"}</td>
                      <td>
                        {task.startTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}{" "}
                        -{" "}
                        {task.endTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </td>
                      <td>{timeSlot}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>Empty Task Today</p>
          )}
        </div> 
        
)} {/* code for task-list of AUTO MODE end */}

{mode === "manual"  && (
        <div className="manual-mode-container">
    {/* Danh sách các task đã chọn */}
    <div className="manual-selected-tasks">
      <h2>Selected Tasks</h2>
      <ul>
        {selectedTasksManual.map((task, index) => (
          <li key={index}>
            {task.name}: <strong>{formatTime(task.time)}</strong>
          </li>
        ))}
      </ul>
    </div>
    <div className="task-select">
      <h2>Task hiện tại</h2>
      <p>
        <strong>Work:</strong> {currentTaskManual?.workName || "N/A"}
      </p>
      <p>
        <strong>Task:</strong> {currentTaskManual?.name || "N/A"}
      </p>
      <p>
        <strong>Thời gian:</strong>{" "}
        {currentTaskManual?.startTime?.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) || "N/A"}{" "}
        -{" "}
        {currentTaskManual?.endTime?.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) || "N/A"}
      </p>
      <p>
        <strong>Timeslot:</strong>{" "}
        {currentTaskManual
          ? calculateTimeSlot(
              new Date(currentTaskManual.startTime),
              new Date(currentTaskManual.endTime)
            )
          : "N/A"}
      </p>
    </div>
  </div>
)} {/* code for manualModecontainer Manual Mode end */}
{mode === "free" && (
  <div className="free-mode-container">
    <div className="free-mode-left">
      <h2>New Record</h2>
      <div className="record-creation">
        <input
          type="text"
          placeholder="Enter record name"
          value={recordNameInput}
          onChange={(e) => setRecordNameInput(e.target.value)}
        />
        <button onClick={handleCreateRecord}>Create</button>
      </div>
      {currentRecord && (
        <div className="current-record">
          <p>
            <strong>Current Record:</strong> {currentRecord.name}
          </p>
        </div>
      )}

    </div>
      
    <div className="free-mode-right">
      <h2>Records</h2>
      <p>Total Time: {formatTime(totalFreeTime)}</p>
      <ul>
        {records.map((record, index) => (
          <li
            key={index}
            className={record.name === currentRecord?.name ? "active" : ""}
            onClick={() => handleSelectRecord(record.name)}
          >
            <span>
              {record.name}: {formatTime(record.time)}
            </span>
            <button
              className="delete-record-button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteRecord(record.name);
              }}
            >
              X
            </button>
          </li>
        
        ))}
      </ul>

    </div>
  </div>
)}



<div className="note-container">
          <div className="note-header">
            <button
              className="note-button"
              onClick={() => alert("Daily form is not implemented yet.")}
            >
              Daily
            </button>
            <button className="note-button" onClick={() => setNoteContent("")}>
              Clear
            </button>
          </div>
          <div className="note-body">
            <label htmlFor="note-input" className="note-label">Note</label>
            <textarea
              id="note-input"
              className="note-input"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your notes here..."
            ></textarea>
          </div>
</div> {/* code for Note-container end */}



 {/* code for pomodoro and stopwatch start */}
 <div className="pomodoro-timer" style={{ backgroundColor: getPomodoroBackground() }}>  
  <div className="pomodoro-header">
    <span className="swap-icon" onClick={toggleFreeMode}>
      🔄
    </span>
    <div className="pomodoro-modes">
  {!isFreeMode ? (
    <>
      <span
        className={`pomodoro-mode ${currentMode === "pomodoro" ? "active" : ""}`}
        onClick={() => {
          setCurrentMode("pomodoro");
          handleModeChange("pomodoro");
        }}
      >
        Pomodoro
      </span>
      <span
        className={`pomodoro-mode ${currentMode === "short-break" ? "active" : ""}`}
        onClick={() => {
          setCurrentMode("short-break");
          handleModeChange("short-break");
        }}
      >
        Short-break
      </span>
      <span
        className={`pomodoro-mode ${currentMode === "long-break" ? "active" : ""}`}
        onClick={() => {
          setCurrentMode("long-break");
          handleModeChange("long-break");
        }}
      >
        Long-break
      </span>
    </>
  ) : (
    <span
  className={`pomodoro-mode ${isFreeMode ? "active" : ""}`}
  onClick={() => {
    if (!isFreeMode) {
      toggleFreeMode();
    } else {
      setFreeModeTime(0);
    }
  }}
>
  Stopwatch
</span>

  )}
</div>



  </div>
  <p>{formatTime(isFreeMode ? freeModeTime : timeLeft)}</p>
  <div className="timer-controls">
  <button
  onClick={
    isTaskSelected || currentRecord
      ? handleStartPause
      : () => toast.error("Please choose a task or record")
  }
  disabled={!isTaskSelected && !currentRecord}
>
  {isRunning ? "Tạm dừng" : "Bắt đầu"}
</button>


    {isFreeMode && (
      <button onClick={() => setFreeModeTime(0)}>Kết thúc</button>
    )}
    {!isFreeMode && <button onClick={handleSkip}>Bỏ qua</button>}
  </div>
</div>

</div> 

      {isModalOpen && (
        <div className="modal">
          <div className="modal-task-content">
            <div className="modal-left">
              <h2>Danh sách Work</h2>
              {Object.values(works).flat().map((work) => (
                <div
                  key={work.id}
                  className={`work-item-focus ${
                    tempWork?.id === work.id ? "active" : ""
                  }`}
                  onClick={() => handleManualSelectWork(work)}
                >
                  <h4>{work.name}</h4>
                  <p>
                    Ngày: {work.startDate} - {work.endDate}
                  </p>
                </div>
              ))}
            </div>
            <div className="divider"></div>
            <div className="modal-right">
              <div className="modal-buttons">
                <button className="focus-button" onClick={handleManualSelectionDone}>
                  Done
                </button>
                <button className="modal-close" onClick={closeModal}>
                  &times;
                </button>
              </div>
              <h2>Danh sách Task</h2>
              {tempWork && tempWork.subWorks ? (
                <>
                  {tempWork.subWorks.map((task, index) => (
                    <div
                      key={index}
                      className={`task-item-focus ${
                        tempTask?.name === task.name ? "active" : ""
                      }`}
                      onClick={() => handleManualSelectTask(task)}
                    >
                      <h4>{task.name}</h4>
                      <p>
                        Thời gian: {task.startTime} - {task.endTime}
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                <p>Chọn một Work để xem Task.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Focus;

