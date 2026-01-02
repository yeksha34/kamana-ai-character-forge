import React from "react";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <div className="aura-blob bg-rose-900 top-[-10%] left-[-10%]" />
      <div
        className="aura-blob bg-rose-950 bottom-[-10%] right-[-10%]"
        style={{ animationDelay: "-15s" }}
      />
      {children}
    </div>
  );
};
