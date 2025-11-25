import React from "react";

const page = ({ searchParams }: { searchParams: { error?: string } }) => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600">
          Your email is not authorized to access this system.
          <br />
          Please contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default page;
