import React, { useState } from "react";
import "../App.css";
import { FaFacebook } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";

export default function Mainpage({ toast }) {
  const [users, setUsers] = useState({ userName: "", email: "", password: "" });
  const [userLogin, setUserLogin] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (userLogin.email === "" || userLogin.password === "") {
      toast.error("Please enter all details");
      return;
    }

    // Mock login logic
    if (userLogin.email === "test@test.com" && userLogin.password === "123456") {
      toast.success("Login successful");
      navigate("/Home");
    } else {
      toast.error("Invalid email or password");
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (users.userName === "" || users.email === "" || users.password === "") {
      toast.error("Please enter all details");
      return;
    }

    // Mock register logic
    toast.success("Registered successfully");
    setUsers({ userName: "", email: "", password: "" });
  };

  const googleAuth = () => {
    toast.success("Logged in with Google");
    navigate("/Home");
  };

  return (
    <>
      <div className="form-container sign-up">
        <form method="POST" onSubmit={handleRegister}>
          <h1>Create Account</h1>
          <div className="social-icons">
            <button type="button" onClick={googleAuth} className="icon">
              <FcGoogle size={22} />
            </button>
            <button type="button" className="icon">
              <FaFacebook size={22} />
            </button>
          </div>
          <span>or use your email for registration</span>
          <input
            type="text"
            placeholder="Username"
            name="userName"
            value={users.userName}
            onChange={(e) => setUsers({ ...users, userName: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={users.email}
            onChange={(e) => setUsers({ ...users, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={users.password}
            onChange={(e) => setUsers({ ...users, password: e.target.value })}
          />
          <button className="bt" type="submit">
            Sign Up
          </button>
        </form>
      </div>

      <div className="form-container sign-in">
        <form method="POST" onSubmit={handleLogin}>
          <h1>Sign In</h1>
          <div className="social-icons">
            <button type="button" onClick={googleAuth} className="icon">
              <FcGoogle size={22} />
            </button>
            <button type="button" className="icon">
              <FaFacebook size={22} />
            </button>
          </div>
          <span>or use your email and password</span>
          <input
            type="email"
            name="email"
            value={userLogin.email}
            onChange={(e) => setUserLogin({ ...userLogin, email: e.target.value })}
            placeholder="Email"
          />
          <input
            type="password"
            name="password"
            value={userLogin.password}
            onChange={(e) => setUserLogin({ ...userLogin, password: e.target.value })}
            placeholder="Password"
          />
          <button className="bt" type="submit">
            Sign In
          </button>
        </form>
      </div>
    </>
  );
}
