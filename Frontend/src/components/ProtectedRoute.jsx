import {Navigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";

//wrapper for protected routes, redirects to login if user is not authenticated
//if user logged in, show the page
//if not logged in, redictrrect to/auth
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();

    if (!user) {
        return  <Navigate to="/auth" />;
    }

    return children;
};

export default ProtectedRoute;
