import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import HeaderSection from './components/HeaderSection';
import HomeContent from './components/HomeContent';
import Footer from './components/Footer';
import SignUp from './components/SignUp/Signup';
import SignIn from './components/SignIn';
import Profile from './components/Profile';
import UserProfile from './components/UserProfile';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider, useModal } from './context/ModalContext';
import PrivateRoute from './components/PrivateRoute';
import Projects from './components/Projects';
import CreateProject from './components/CreateProject';
import ProjectDetail from './components/ProjectDetail';
import AdminPanel from './components/Admins/AdminPanel';
import AccessDenied from './components/AccessDenied';
import Contact from './components/Contact';
import Modal from './components/Modal';
import PartnershipHome from './components/Partnership/PartnershipHome';
import SchoolRegistration from './components/Partnership/SchoolRegistration';
import SchoolLogin from './components/Partnership/SchoolLogin';
import PartnershipSchoolDashboard from './components/Partnership/SchoolDashboard';
import StudentRegistration from './components/Partnership/StudentRegistration';

const AppContent = () => {
    const {
        isSignInModalOpen,
        isSignUpModalOpen,
        openSignInModal,
        openSignUpModal,
        closeModals
    } = useModal();

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
                            <Route path="/connexion" element={<SignIn onSuccessfulLogin={closeModals} />} />
                            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                            <Route path="/users/profile/:userId" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
                            <Route path="/projets" element={<Projects />} />
                            <Route path="/contact" element={<Contact />} />
                            
                            {/* Routes de l'espace partenariat écoles */}
                            <Route path="/partenariat-ecole" element={<PartnershipHome />} />
                            <Route path="/partenariat-ecole/inscription" element={<SchoolRegistration />} />
                            <Route path="/partenariat-ecole/connexion" element={<SchoolLogin />} />
                            <Route path="/partenariat-ecole/dashboard" element={<PartnershipSchoolDashboard />} />
                            <Route path="/partenariat-ecole/inscription-etudiant" element={<StudentRegistration />} />
                            
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

                {/* Modaux pour la connexion et l'inscription */}
                <Modal isOpen={isSignInModalOpen} onClose={closeModals} width="max-w-xl">
                    <SignIn 
                        onSuccessfulLogin={closeModals} 
                        openSignUpModal={openSignUpModal}
                    />
                </Modal>

                <Modal isOpen={isSignUpModalOpen} onClose={closeModals} width="max-w-4xl">
                    <SignUp />
                </Modal>
            </AuthProvider>
        </Router>
    );
};

const App = () => {
    return (
        <ModalProvider>
            <AppContent />
        </ModalProvider>
    );
};

export default App;