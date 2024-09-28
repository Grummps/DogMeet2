import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PRIMARY_COLOR = "#cc5c99";
const SECONDARY_COLOR = "#0c0c1f";

const Register = () => {
  const [data, setData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [light, setLight] = useState(false);
  const [bgColor, setBgColor] = useState(SECONDARY_COLOR);
  const [bgText, setBgText] = useState("Light Mode");

  const handleChange = ({ currentTarget: input }) => {
    setData({ ...data, [input.name]: input.value });
  };

  useEffect(() => {
    if (light) {
      setBgColor("white");
      setBgText("Dark mode");
    } else {
      setBgColor(SECONDARY_COLOR);
      setBgText("Light mode");
    }
  }, [light]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: response } = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/users/signup`, data);
      navigate("/login");
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
    <>
      <section className="min-h-screen flex justify-center items-center" style={{ backgroundColor: bgColor }}>
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: PRIMARY_COLOR }}>
            Register
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2" style={{ color: PRIMARY_COLOR }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={data.username}
                onChange={handleChange}
                placeholder="Enter username"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-indigo-500"
                required
              />
              <p className="text-sm text-gray-500 mt-2">We just might sell your data</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2" style={{ color: PRIMARY_COLOR }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-indigo-500"
                required
              />
              <p className="text-sm text-gray-500 mt-2">We just might sell your data</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2" style={{ color: PRIMARY_COLOR }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={data.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-indigo-500"
                required
              />
            </div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                className="form-checkbox text-indigo-600"
                id="flexSwitchCheckDefault"
                onChange={() => setLight(!light)}
              />
              <label htmlFor="flexSwitchCheckDefault" className="ml-2 text-gray-600">
                {bgText}
              </label>
            </div>
            {error && (
              <div className="text-red-500 text-sm mb-4">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 text-white rounded-lg"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Register
            </button>
          </form>
        </div>
      </section>
    </>
  );
};

export default Register;
