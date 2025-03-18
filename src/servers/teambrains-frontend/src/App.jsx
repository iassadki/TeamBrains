import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import HeaderSection from './components/HeaderSection';
import HomeContent from './components/HomeContent';
import Footer from './components/Footer';
import SignUp from './components/SignUp/Signup';
import SignIn from './components/SignIn';
import Profile from './components/Profile';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Projects from './components/Projects';
import CreateProject from './components/CreateProject';
import ProjectDetail from './components/ProjectDetail';
import AdminPanel from './components/Admins/AdminPanel';
import AccessDenied from './components/AccessDenied';
import Contact from './components/Contact';

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <div className="flex flex-col min-h-screen">
                    <NavBar />
                    <main className="flex-grow mt-[5rem]" style={{ minHeight: `calc(100vh - 80px)` }}>
                        <Routes>
                            <Route path="/" element={
                                <div>
                                    <HeaderSection />
                                    <HomeContent />
                                </div>
                            } />
                            <Route path="/inscription" element={<SignUp />} />
                            <Route path="/connexion" element={<SignIn />} />
                            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                            <Route path="/projets" element={<Projects />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/projets/:slug" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
                            <Route path="/projets/nouveau-projet" element={<PrivateRoute><CreateProject /></PrivateRoute>} />
                            <Route path="/admin/*" element={
                                <PrivateRoute roles={['admin']}>
                                    <AdminPanel />
                                </PrivateRoute>
                            } />
                            <Route path="/access-denied" element={<AccessDenied />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </AuthProvider>
        </Router>
    );
};

export default App;
