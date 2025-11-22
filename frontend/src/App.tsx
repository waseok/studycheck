import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import SetPin from './pages/SetPin'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Trainings from './pages/Trainings'
import TrainingCollection from './pages/TrainingCollection'
import MyTrainings from './pages/MyTrainings'
import Stats from './pages/Stats'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
          path="/dashboard/stats"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TRAINING_ADMIN']}>
              <Stats />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
