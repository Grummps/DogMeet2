import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

const PRIMARY_COLOR = "bg-pink-600";  // Use Tailwind CSS color classes
const SECONDARY_COLOR = 'bg-gray-900';  // For dark background color
const LIGHT_COLOR = 'bg-white';  // For light background color
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
      setBgText('Dark mode');
    } else {
      setBgColor(SECONDARY_COLOR);
      setBgText('Light mode');
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
      const { data: res } = await axios.post(url, data);
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
    <section className={`vh-100 ${bgColor} flex justify-center items-center`}>
      <div className="container max-w-md p-8">
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-100 p-6 rounded-lg shadow-lg">
          <div>
            <label className="block text-pink-600 font-bold mb-2">Username</label>
            <input
              type="text"
              name="username"
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <small className="text-gray-500">We just might sell your data</small>
          </div>

          <div>
            <label className="block text-pink-600 font-bold mb-2">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex justify-between items-center">
            <small className="text-gray-500">
              Don't have an account?
              <Link to="/signup" className="text-pink-600 font-bold ml-1">Sign up</Link>
            </small>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="flexSwitchCheckDefault"
                onChange={() => setLight(!light)}
                className="form-check-input h-5 w-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
              />
              <label className="ml-2 text-gray-600" htmlFor="flexSwitchCheckDefault">
                {bgText}
              </label>
            </div>
          </div>

          {error && <div className="text-red-500 mt-4">{error}</div>}

          <button
            type="submit"
            className={`w-full py-2 text-white ${PRIMARY_COLOR} hover:bg-pink-700 rounded-md`}
          >
            Log In
          </button>
        </form>
      </div>
    </section>
  );
};

export default Login;
