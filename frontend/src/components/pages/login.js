import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid"; // Optional: Icons for light/dark mode toggle
import apiClient from "../../utilities/apiClient";

const PRIMARY_COLOR = "bg-pink-600";  // Tailwind CSS color classes
const SECONDARY_COLOR = "bg-gray-900";  // For dark background color
const LIGHT_COLOR = "bg-white";  // For light background color
const url = `${process.env.REACT_APP_BACKEND_URI}/users/login`;  // Use environment variable

const Login = () => {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [light, setLight] = useState(false);
  const [bgColor, setBgColor] = useState(SECONDARY_COLOR);
  const [bgText, setBgText] = useState('Light Mode');
  const navigate = useNavigate();

  const handleChange = ({ currentTarget: input }) => {
    setData({ ...data, [input.name]: input.value });
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const obj = getUserInfo(token);
      setUser(obj);
    }

    if (light) {
      setBgColor(LIGHT_COLOR);
      setBgText("Dark Mode");
    } else {
      setBgColor(SECONDARY_COLOR);
      setBgText("Light Mode");
    }
  }, [light]);

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: res } = await apiClient.post(url, data);
      const { accessToken } = res;
      localStorage.setItem("accessToken", accessToken); // Store token in localStorage
      setUser(getUserInfo(accessToken));  // Set user state after login
    } catch (error) {
      if (
        error.response &&
        error.response.status >= 400 &&
        error.response.status <= 500
      ) {
        setError(error.response.data.message);
      }
    }
  };

  return (
    <section
      className={`min-h-screen ${bgColor} flex justify-center items-center transition-colors duration-500`}
    >
      <div className="container max-w-md p-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white/30 backdrop-blur-md p-8 rounded-lg shadow-lg border border-white/20"
        >
          <h2 className="text-2xl font-bold text-pink-600 text-center">Login</h2>
          
          <div>
            <label className="block text-pink-600 font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full px-4 py-2 border border-pink-600 rounded-md bg-transparent text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
            <small className="text-gray-300">
              We just might sell your data
            </small>
          </div>

          <div>
            <label className="block text-pink-600 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-pink-600 rounded-md bg-transparent text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          <div className="flex justify-between items-center">
            <small className="text-gray-300">
              Don't have an account?
              <Link to="/signup" className="text-pink-600 font-semibold ml-1">Sign up</Link>
            </small>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setLight(!light)}
                className="focus:outline-none"
                aria-label="Toggle Light/Dark Mode"
              >
                {light ? (
                  <SunIcon className="h-6 w-6 text-yellow-400" />
                ) : (
                  <MoonIcon className="h-6 w-6 text-gray-200" />
                )}
              </button>
              <span className="ml-2 text-gray-300">{bgText}</span>
            </div>
          </div>

          {error && <div className="text-red-500 mt-4">{error}</div>}

          <button
            type="submit"
            className={`w-full py-2 text-white ${PRIMARY_COLOR} hover:bg-pink-700 rounded-md transition-colors duration-300`}
          >
            Log In
          </button>
        </form>
      </div>
    </section>
  );
};

export default Login;
