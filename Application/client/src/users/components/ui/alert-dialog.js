import React from "react";

export const AlertDialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        {children}
        <button
          className="mt-4 w-full bg-gray-200 p-2 rounded-lg"
          onClick={() => onOpenChange(false)}
        >
          ปิด
        </button>
      </div>
    </div>
  );
};

export const AlertDialogContent = ({ children }) => (
  <div className="p-4">{children}</div>
);

export const AlertDialogHeader = ({ children }) => (
  <div className="text-lg font-semibold mb-2">{children}</div>
);

export const AlertDialogTitle = ({ children }) => (
  <h2 className="text-xl font-bold text-center">{children}</h2>
);

export const AlertDialogFooter = ({ children }) => (
  <div className="flex justify-end space-x-2 mt-4">{children}</div>
);

export const AlertDialogAction = ({ onClick, children }) => (
  <button
    className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
    onClick={onClick}
  >
    {children}
  </button>
);
