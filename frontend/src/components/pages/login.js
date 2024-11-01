import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../contexts/userContext"; // Adjust the import path
import getUserInfo from "../../utilities/decodeJwt"; // Ensure this utility decodes the JWT correctly

const Login = () => {
  const { setUser } = useContext(UserContext); // Access setUser from UserContext
  const [data, setData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = ({ currentTarget: input }) => {
    setData({ ...data, [input.name]: input.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send login request to the backend
      const { data: res } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URI}/users/login`,
        data,
        { withCredentials: true } // Ensure cookies are sent
      );

      const { accessToken } = res;

      // Store the access token in localStorage
      localStorage.setItem("accessToken", accessToken);

      // Decode the access token to get user information
      const decodedUser = getUserInfo(accessToken);

      // Update the global user state in UserContext
      setUser(decodedUser);
      console.log("User state updated with new token:", decodedUser);

      // Navigate to the home page after successful login
      navigate("/home");
    } catch (error) {
      if (
        error.response &&
        error.response.status >= 400 &&
        error.response.status <= 500
      ) {
        setError(error.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <section className="min-h-screen bg-gray-900 flex justify-center items-center">
      <div className="mx-auto p-2 shadow-2xl rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-8 bg-gray-950 rounded-lg"
        >
          <h2 className="text-3xl font-bold text-blue-50 text-center">
            Log in to DogMeet
          </h2>

          <div>
            <label className="block text-blue-50 font-semibold mb-2">
              Username
            </label>
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
            <label className="block text-blue-50 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-blue-300 rounded-md bg-transparent text-blue-50 placeholder-gray-300"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 mt-4 text-center">{error}</div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gray-400 text-gray-950 rounded-md shadow-lg hover:bg-gray-600 transition-colors duration-300 transform font-bold"
          >
            LOGIN
          </button>

          <div className="flex justify-center items-center">
            <small className="text-gray-400">
              Don't have an account?
              <Link
                to="/signup"
                className="text-blue-50 hover:text-gray-600 font-semibold ml-1"
              >
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
