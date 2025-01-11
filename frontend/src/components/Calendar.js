import React, { useEffect, useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import "./styles/calendar.css";

const localizer = momentLocalizer(moment);

const colorPalette = ["red", "#0099FF	", "#33FF00", "orange", "yellow", "pink", "purple", "cyan"];

const Calendar = ({ works }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const mappedEvents = works.flatMap(workType => 
      workType.map(work => ({
        title: work.name,
        start: new Date(work.startDate),
        end: new Date(work.endDate),
        description: work.describe,
        color: getColor(work.name)
      }))
    );
    setEvents(mappedEvents);
  }, [works]);

  function getColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colorPalette.length;
    return colorPalette[colorIndex];
  }

  return (
    <div className="main-form" data-aos="zoom-in">
      <header className="menu-bar">
        <h1>Calendar</h1>
      </header>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '600px', width: '100%' }}
        eventPropGetter={(event) => ({
          className: 'custom-event',
          style: {
            backgroundColor: event.color,
            marginTop: '2px',
            marginBottom: '2px'
          }
        })}
        
      />
    </div>
  );
};

export default Calendar;
