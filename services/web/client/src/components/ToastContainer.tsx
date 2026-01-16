"use client";

import { ToastContainer } from "react-toastify";
import "@/app/[locale]/globals.css";

const CustomToastContainer = () => {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={2000}
      hideProgressBar
      closeButton={false}
    />
  );
};

export default CustomToastContainer;
