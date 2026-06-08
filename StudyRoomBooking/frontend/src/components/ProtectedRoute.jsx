import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, requiredRole }) {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/rooms" replace />;
    }

    return children;
}

export default ProtectedRoute;
