"use client";

import { ToastContainer } from "react-toastify";
import "@/app/globals.css";

const CustomToastContainer = () => {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={2000}
      hideProgressBar
    />
  );
};

export default CustomToastContainer;
