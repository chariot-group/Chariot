import React from "react";

interface Props {
  size?: number;
  color?: string;
}

const Loading = ({ size = 16, color = "gray-500" }: Props) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`size-${size} border-4 border-t-transparent border-${color} border-solid rounded-full animate-spin`}
        role="status"
        aria-label="Chargement en cours"
      />
    </div>
  );
};

export default Loading;
