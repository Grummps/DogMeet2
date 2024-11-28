import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../contexts/userContext"; // Adjust the import path
import getUserInfo from "../../utilities/decodeJwt"; // Ensure this utility decodes the JWT correctly
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // Import Heroicons

const Login = () => {
  const { setUser } = useContext(UserContext); // Access setUser from UserContext
  const [data, setData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  // State to manage password visibility
  const [showPassword, setShowPassword] = useState(false);

  // State to manage loading spinner
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Handle input changes
  const handleChange = ({ currentTarget: input }) => {
    setData({ ...data, [input.name]: input.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loading
    setError(""); // Reset error state
    try {
      // Send login request to the backend
      const { data: res } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URI}/users/login`, data);

      const { accessToken, refreshToken } = res;

      // Store the access token in localStorage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Decode the access token to get user information
      const decodedUser = getUserInfo(accessToken);

      // Update the global user state in UserContext
      setUser(decodedUser);
      console.log("User state updated with new token:", decodedUser);

      // Navigate to the profile page after successful login
      navigate("/profile");
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
    } finally {
      setIsLoading(false); // Stop loading
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

          <div className="relative">
            <label className="block text-blue-50 font-semibold mb-2">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter password"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-blue-300 rounded-md bg-transparent text-blue-50 placeholder-gray-300"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 top-8 flex items-center pr-3"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>

          {error && (
            <div className="text-red-500 mt-4 text-center">{error}</div>
          )}

          <button
            type="submit"
            className={`w-full py-3 bg-gray-400 text-gray-950 rounded-md shadow-lg hover:bg-gray-600 transition-colors duration-300 transform font-bold flex items-center justify-center ${isLoading ? "cursor-not-allowed opacity-50" : ""
              }`}
            disabled={isLoading}
          >
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 mr-3 text-gray-950"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            )}
            {isLoading ? "Logging in..." : "LOGIN"}
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
