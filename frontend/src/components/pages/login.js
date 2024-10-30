import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import getUserInfo from "../../utilities/decodeJwt";

const Login = () => {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
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
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: res } = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/users/login`, data,
        { withCredentials: true }
      );
      const { accessToken } = res;
      localStorage.setItem("accessToken", accessToken);
      setUser(getUserInfo(accessToken));
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
    <section className="min-h-screen bg-gray-900 flex justify-center items-center">
      <div className=" mx-auto p-2 shadow-2xl rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-gray-950 rounded-lg">
          <h2 className="text-3xl font-bold text-blue-50 text-center">Log in to DogMeet</h2>

          <div>
            <label className="block text-blue-50 font-semibold mb-2">Username</label>
            <input
              type="text"
              name="username"
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full px-4 py-2 border border-blue-300 rounded-md bg-transparent text-blue-50 placeholder-gray-300"
              required
            />
          </div>

          <div>
            <label className="block text-blue-50 font-semibold mb-2">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-blue-300 rounded-md bg-transparent text-blue-50 placeholder-gray-300"
              required
            />
          </div>

          {error && <div className="text-red-500 mt-4 text-center">{error}</div>}

          <button
            type="submit"
            className="w-full py-3 bg-gray-400 text-gray-950 rounded-md shadow-lg hover:bg-gray-600 transition-colors duration-300 transform font-bold"
          >
            LOGIN
          </button>

          <div className="flex justify-center items-center">
            <small className="text-gray-400">
              Don't have an account?
              <Link to="/signup" className="text-blue-50 hover:text-gray-600 font-semibold ml-1">
                Sign up for DogMeet
              </Link>
            </small>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Login;
