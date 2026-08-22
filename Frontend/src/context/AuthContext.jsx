import {createContext, useState, useContext} from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Initialize user from localStorage so login persists across page refreshes
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem('user')) || null
    );

    //after successful login, store user data and token in localStorage and update state
    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };


    //clear user data and token from localStorage and update state to null on logout
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}; 

//usage: const { user, login, logout } = useAuth();
export const useAuth = () => {
    return useContext(AuthContext);
}