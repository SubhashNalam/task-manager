import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

const getCurrentDate = () => new Date().toISOString().split("T")[0];
const getCurrentTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/1055/1055687.png";
const BACKGROUND_IMAGE = process.env.PUBLIC_URL + "/black-stars-bg.png";

const App = () => {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("activeUser"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(() => localStorage.getItem("activeUser") || "");
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : {};
  });
  const [tasks, setTasks] = useState({});
  const [comment, setComment] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [exportRange, setExportRange] = useState("week");

  useEffect(() => {
    if (user) {
      const userTasks = localStorage.getItem(`tasks_${user}`);
      setTasks(userTasks ? JSON.parse(userTasks) : {});
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`tasks_${user}`, JSON.stringify(tasks));
    }
  }, [tasks, user]);

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  const changeDate = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split("T")[0]);
  };

  const handleLogin = () => {
    if (users[username] && users[username] === password) {
      setLoggedIn(true);
      setUser(username);
      localStorage.setItem("activeUser", username);
    } else {
      alert("Invalid username or password!");
    }
  };

  const handleRegister = () => {
    if (username in users) {
      alert("User already exists!");
    } else {
      setUsers((prev) => ({ ...prev, [username]: password }));
      alert("User registered successfully!");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUser("");
    setUsername("");
    setPassword("");
    localStorage.removeItem("activeUser");
  };

  const handleCount = (delta) => {
    setTasks((prev) => {
      const current = prev[date] || { count: 0, comments: [] };
      return {
        ...prev,
        [date]: { ...current, count: Math.max(0, current.count + delta) },
      };
    });
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    const newComment = {
      text: comment.trim(),
      time: getCurrentTime(),
    };
    setTasks((prev) => {
      const current = prev[date] || { count: 0, comments: [] };
      return {
        ...prev,
        [date]: {
          ...current,
          comments: [...(current.comments || []), newComment],
        },
      };
    });
    setComment("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleComment();
  };

  const handleEditComment = (index) => {
    const current = tasks[date];
    const edited = prompt("Edit your comment:", current.comments[index].text);
    if (edited !== null) {
      const updated = [...current.comments];
      updated[index].text = edited;
      setTasks((prev) => ({ ...prev, [date]: { ...prev[date], comments: updated } }));
    }
  };

  const handleDeleteComment = (index) => {
    if (window.confirm("Delete this comment?")) {
      const current = tasks[date];
      const updated = [...current.comments];
      updated.splice(index, 1);
      setTasks((prev) => ({ ...prev, [date]: { ...prev[date], comments: updated } }));
    }
  };

  const handleCopyComment = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  };

  const exportExcel = () => {
    const rows = [["Date", "Count", "Comments"]];
    for (const [key, val] of Object.entries(tasks)) {
      const d = new Date(key);
      const now = new Date(date);
      if (
        (exportRange === "week" && getWeek(d) === getWeek(now)) ||
        (exportRange === "month" && d.getMonth() === now.getMonth()) ||
        (exportRange === "year" && d.getFullYear() === now.getFullYear())
      ) {
        const commentsArray = Array.isArray(val.comments)
          ? val.comments.map((c) => `${c.text} (${c.time})`)
          : [];
        rows.push([key, val.count, commentsArray.join("; ")]);
      }
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    XLSX.writeFile(wb, `tasks-${exportRange}-${user}.xlsx`);
  };

  const getWeek = (date) => {
    const onejan = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  };

  const current = tasks[date] || { count: 0, comments: [] };

  return (
    <div className="text-black min-h-screen p-6" style={{
      backgroundImage: `url('${BACKGROUND_IMAGE}')`,
      backgroundRepeat: 'repeat',
      backgroundSize: 'auto'
    }}>
      {!loggedIn ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded shadow-lg w-96">
            <img src={LOGO_URL} alt="Logo" className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Task Manager</h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mb-2 p-2 w-full border rounded text-black"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4 p-2 w-full border rounded text-black"
            />
            <div className="flex gap-2 justify-center">
              <button onClick={handleLogin} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Login</button>
              <button onClick={handleRegister} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Register</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-6 rounded-lg shadow-lg bg-white bg-opacity-90">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Logo" className="w-10 h-10" />
              <h1 className="text-xl font-bold">{user}'s Task Manager</h1>
            </div>
            <button onClick={handleLogout} className="bg-gray-400 hover:bg-red-500 text-white px-3 py-1 rounded text-sm">Logout</button>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <button onClick={() => changeDate(-1)} className="px-2">⬅️</button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border p-1 rounded text-black text-center w-40"
            />
            <button onClick={() => changeDate(1)} className="px-2">➡️</button>
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">Total Intakes: {current.count}</span>
            <div className="flex gap-2">
              <button onClick={() => handleCount(1)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full">+</button>
              <button onClick={() => handleCount(-1)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full">-</button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter comment"
              className="flex-1 border p-2 rounded text-black"
            />
            <button onClick={handleComment} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-full">💾</button>
          </div>

          <div className="space-y-2">
            {current.comments.map((c, i) => (
              <div
                key={i}
                className="bg-white text-black p-3 rounded shadow flex flex-col sm:flex-row sm:items-start sm:justify-between overflow-hidden"
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word', width: '100%' }}
              >
                <div className="flex-1 break-words w-full">
                  <p className="whitespace-pre-wrap break-words w-full overflow-hidden break-all">{c.text}</p>
                  <p className="text-xs text-gray-500 mt-1">⏰ {c.time}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 sm:ml-4 justify-end">
                  <button onClick={() => handleEditComment(i)} className="text-blue-500 hover:underline text-sm">Edit</button>
                  <button onClick={() => handleDeleteComment(i)} className="text-red-500 hover:underline text-sm">Delete</button>
                  <button onClick={() => handleCopyComment(c.text)} className="text-green-500 hover:underline text-sm">Copy</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <select value={exportRange} onChange={(e) => setExportRange(e.target.value)} className="border p-2 rounded text-black">
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button onClick={exportExcel} className="bg-yellow-500 hover:bg-green-600 text-white py-2 px-4 rounded shadow">📤 Export</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
