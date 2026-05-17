import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PublicShell } from '@/components/layout/PublicShell'
import { AnalysisPage } from '@/pages/dashboard/AnalysisPage'
import { DashboardHomePage } from '@/pages/dashboard/DashboardHomePage'
import { JobComparisonPage } from '@/pages/dashboard/JobComparisonPage'
import { JobDescriptionPage } from '@/pages/dashboard/JobDescriptionPage'
import { ResumeDetailPage } from '@/pages/dashboard/ResumeDetailPage'
import { ResumeOptimizationStudioPage } from '@/pages/dashboard/ResumeOptimizationStudioPage'
import { ResumePage } from '@/pages/dashboard/ResumePage'
import { ResumeReviewPage } from '@/pages/dashboard/ResumeReviewPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route index element={<LandingPage />} />
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardHomePage />} />
          <Route path="resume" element={<ResumePage />} />
          <Route path="resume/:resumeId" element={<ResumeDetailPage />} />
          <Route path="job" element={<JobDescriptionPage />} />
          <Route path="job/:jobApplicationId" element={<JobComparisonPage />} />
          <Route path="review" element={<ResumeReviewPage />} />
          <Route path="studio" element={<ResumeOptimizationStudioPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
