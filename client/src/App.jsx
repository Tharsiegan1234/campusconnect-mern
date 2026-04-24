import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profiles from './pages/Profiles';
import ProfileView from './pages/ProfileView';
import QA from './pages/QA';
import Skills from './pages/Skills';
import StudyGroups from './pages/StudyGroups';
import Clubs from './pages/Clubs';
import Sports from './pages/Sports';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/adminDashboard/studentProfiles/ManageUsers';
import StudentList from './pages/adminDashboard/studentProfiles/StudentList';
import SkillList from './pages/adminDashboard/skillsEvents/SkillList';
import StudyGroupList from './pages/adminDashboard/studyGroupsWorkshops/StudyGroupList';
import ClubList from './pages/adminDashboard/clubs/ClubList';
import SportsTeamList from './pages/adminDashboard/sports/SportsTeamList';
import AllMembers from './pages/adminDashboard/AllMembers';
import AdminLayout from './components/admin/AdminLayout';
import ClientLayout from './components/ClientLayout';

import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="skills-events" element={<SkillList />} />
          <Route path="study-groups" element={<StudyGroupList />} />
          <Route path="clubs" element={<ClubList />} />
          <Route path="sports" element={<SportsTeamList />} />
          <Route path="all-members" element={<AllMembers />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="moderation" element={<div className="text-center py-20 text-text-secondary">Moderation Module Coming Soon</div>} />
          <Route path="settings" element={<div className="text-center py-20 text-text-secondary">System Settings Coming Soon</div>} />
        </Route>

        {/* User Routes 1*/}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/profile/:id" element={<ProfileView />} />
          <Route path="/qa" element={<QA />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/groups" element={<StudyGroups />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/sports" element={<Sports />} />
        </Route>
      </Routes>
      </Router>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
