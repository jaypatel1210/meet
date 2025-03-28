import { useEffect, useState } from "react";

const RoomClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-4 left-4 bg-gray-800/70 rounded-lg px-4 py-2 text-white">
      <p className="text-sm">Meeting • {currentTime.toLocaleTimeString()}</p>
    </div>
  );
};

export default RoomClock;
