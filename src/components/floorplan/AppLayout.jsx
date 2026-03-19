const AppLayout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {children}
    </div>
  );
};

export default AppLayout;
