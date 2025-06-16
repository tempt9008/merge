import { Routes, Route, Link } from 'react-router-dom';
import { Folders, LogOut, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import FolderList from '../components/FolderList';
import CategoryList from '../components/CategoryList';

export default function Dashboard() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="flex items-center px-2 py-2 text-gray-900 hover:text-gray-600"
              >
                <Folders className="h-6 w-6 mr-2" />
                <span className="font-semibold">Quiz Admin</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" /> {/* Vertical divider */}
              <Link
                to="/"
                className="flex items-center px-2 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="h-5 w-5 mr-2" />
                <span>Home</span>
              </Link>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Routes>
            <Route index element={<FolderList />} />
            <Route path="folders/:folderId" element={<CategoryList />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}