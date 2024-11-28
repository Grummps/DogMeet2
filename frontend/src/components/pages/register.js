import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // Import Heroicons

const Register = () => {
  // Updated state to include confirmPassword and password visibility
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  // State to manage loading spinner
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // State to manage password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle input changes for all fields, including confirmPassword
  const handleChange = ({ currentTarget: input }) => {
    setData({ ...data, [input.name]: input.value });
  };

  // Validate passwords and submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError("");

    // Check if password and confirmPassword match
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true); // Start loading

    try {
      // Prepare data to send (exclude confirmPassword)
      const { username, email, password } = data;
      await axios.post(`${process.env.REACT_APP_BACKEND_URI}/users/signup`, {
        username,
        email,
        password,
      });
      navigate("/login");
    } catch (error) {
      if (
        error.response &&
        error.response.status >= 400 &&
        error.response.status <= 500
      ) {
        setError(error.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
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
            Sign up for DogMeet
          </h2>

          <div>
            <label className="block text-blue-50 font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={data.username}
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full px-4 py-2 border border-blue-300 rounded-md bg-transparent text-blue-50 placeholder-gray-300"
              required
            />
          </div>

          <div>
            <label className="block text-blue-50 font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-blue-300 rounded-md bg-transparent text-blue-50 placeholder-gray-300"
              required
            />
          </div>

          {/* Password Field with Toggle */}
          <div className="relative">
            <label className="block text-blue-50 font-semibold mb-2">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={data.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-2 pr-10 border border-blue-300 rounded-md bg-transparent text-blue-50 placeholder-gray-300"
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

          {/* Confirm Password Field with Toggle */}
          <div className="relative">
            <label className="block text-blue-50 font-semibold mb-2">
              Confirm password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={data.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="w-full px-4 py-2 pr-10 border border-blue-300 rounded-md bg-transparent text-blue-50 placeholder-gray-300"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 top-8 flex items-center pr-3"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={
                showConfirmPassword ? "Hide confirm password" : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>

          {error && <div className="text-red-500 mt-4 text-center">{error}</div>}

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
            {isLoading ? "Registering..." : "REGISTER"}
          </button>

          <div className="flex justify-center items-center">
            <small className="text-gray-400">
              Already have an account?
              <Link
                to="/login"
                className="text-blue-50 hover:text-gray-600 font-semibold ml-1"
              >
                Log in to DogMeet
              </Link>
            </small>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Register;
