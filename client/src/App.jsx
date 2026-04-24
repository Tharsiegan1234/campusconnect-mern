import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profiles from './pages/Profiles';
import ProfileView from './pages/ProfileView';
import QA from './pages/QA';
import Skills from './pages/Skills';
import CreateSkill from './pages/CreateSkill';
import SkillDetails from './pages/SkillDetails';
import StudyGroups from './pages/StudyGroups';
import Clubs from './pages/Clubs';
import Sports from './pages/Sports';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/adminDashboard/studentProfiles/ManageUsers';
import QADashboard from './pages/adminDashboard/qa/qaDashboard';
import ManageQuestions from './pages/adminDashboard/qa/ManageQuestions';
import QuestionDetail from './pages/adminDashboard/qa/QuestionDetail';
import ManageAnswers from './pages/adminDashboard/qa/ManageAnswers';
import ManageGroups from './pages/adminDashboard/qa/ManageGroups';
import GroupMembers from './pages/adminDashboard/qa/GroupMembers';
import SkillList from './pages/adminDashboard/skillsEvents/SkillList';
import SkillForm from './pages/adminDashboard/skillsEvents/SkillForm';
import StudyGroupList from './pages/adminDashboard/studyGroupsWorkshops/StudyGroupList';
import ClubList from './pages/adminDashboard/clubs/ClubList';
import SportsTeamList from './pages/adminDashboard/sports/SportsTeamList';
// import CreateSkill from './pages/CreateSkill';
import AdminLayout from './components/admin/AdminLayout';
import ClientLayout from './components/ClientLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="qa-dashboard" element={<QADashboard />} />
          <Route path="qa/questions" element={<ManageQuestions />} />
          <Route path="qa/questions/:id" element={<QuestionDetail />} />
          <Route path="qa/answers" element={<ManageAnswers />} />
          <Route path="qa/groups" element={<ManageGroups />} />
          <Route path="qa/groups/:id" element={<GroupMembers />} />
          <Route path="skills-events" element={<SkillList />} />
          <Route path="skills-events/new" element={<SkillForm />} />
          <Route path="skills-events/edit/:id" element={<SkillForm />} />
          <Route path="study-groups" element={<StudyGroupList />} />
          <Route path="clubs" element={<ClubList />} />
          <Route path="sports" element={<SportsTeamList />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="moderation" element={<div className="text-center py-20 text-text-secondary">Moderation Module Coming Soon</div>} />
          <Route path="settings" element={<div className="text-center py-20 text-text-secondary">System Settings Coming Soon</div>} />
        </Route>

        {/* User Routes */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/profile/:id" element={<ProfileView />} />
          <Route path="/qa" element={<QA />} />
          <Route path="/skills" element={<Skills />} />
<<<<<<< HEAD
          <Route path="/skills/create" element={<CreateSkill />} />
          <Route path="/skills/:id" element={<SkillDetails />} />
          <Route path="/skills/edit/:id" element={<CreateSkill />} />
=======
          <Route path="/create-skill" element={<CreateSkill />} />
          <Route path="/edit-skill/:id" element={<CreateSkill />} />
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
          <Route path="/groups" element={<StudyGroups />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/sports" element={<Sports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
