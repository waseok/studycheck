import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const SetPin = lazy(() => import('./pages/SetPin'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Users = lazy(() => import('./pages/Users'))
const Trainings = lazy(() => import('./pages/Trainings'))
const TrainingCollection = lazy(() => import('./pages/TrainingCollection'))
const MyTrainings = lazy(() => import('./pages/MyTrainings'))
const Stats = lazy(() => import('./pages/Stats'))
const Profile = lazy(() => import('./pages/Profile'))
const SignatureBook = lazy(() => import('./pages/SignatureBook'))
const SignatureBookDetail = lazy(() => import('./pages/SignatureBookDetail'))
const TrainingNotice = lazy(() => import('./pages/TrainingNotice'))
const MeetingList = lazy(() => import('./pages/MeetingList'))
const MeetingDetail = lazy(() => import('./pages/MeetingDetail'))
const PublicTrainingSignature = lazy(() => import('./pages/PublicTrainingSignature'))
const PublicMeetingSignature = lazy(() => import('./pages/PublicMeetingSignature'))

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">페이지를 불러오는 중...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/set-pin"
            element={
              <ProtectedRoute>
                <SetPin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/users"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/trainings"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TRAINING_ADMIN']}>
                <Trainings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/trainings/:id"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TRAINING_ADMIN', 'USER']}>
                <TrainingCollection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/my-trainings"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TRAINING_ADMIN', 'USER']}>
                <MyTrainings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TRAINING_ADMIN', 'USER']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/stats"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TRAINING_ADMIN']}>
                <Stats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/signature-book"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TRAINING_ADMIN', 'USER']}>
                <SignatureBook />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/signature-book/:trainingId"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TRAINING_ADMIN', 'USER']}>
                <SignatureBookDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/training-notice"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TRAINING_ADMIN', 'USER']}>
                <TrainingNotice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/meetings"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TRAINING_ADMIN', 'USER']}>
                <MeetingList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/meetings/:meetingId"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TRAINING_ADMIN', 'USER']}>
                <MeetingDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/sign/training/:trainingId" element={<PublicTrainingSignature />} />
          <Route path="/sign/meeting/:meetingId" element={<PublicMeetingSignature />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
