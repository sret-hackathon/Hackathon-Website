import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, loading, allowedRoles, children }) => {
  if (loading) {
    return <div className="p-8 text-center text-white">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Redirect if wrong role
  }

  return children;
};

export default ProtectedRoute;
