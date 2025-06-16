import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Folder, Category } from '../types';
import { FolderOpen, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CategorySelectorProps {
  onSelect: (categoryId: string) => void;
}

export default function CategorySelector({ onSelect }: CategorySelectorProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      fetchCategories(selectedFolder);
    }
  }, [selectedFolder]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('is_enabled', true) // Filter enabled folders
        .order('created_at');

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      toast.error('Error loading folders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async (folderId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('folder_id', folderId)
        .eq('is_enabled', true) // Filter enabled categories
        .order('created_at');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast.error('Error loading categories');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {!selectedFolder ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select a Folder
            </h3>
            <div className="space-y-2">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FolderOpen className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium text-gray-900">
                      {folder.name}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              ))}
              {folders.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No folders available
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setSelectedFolder(null)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to Folders
              </button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select a Category
            </h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onSelect(category.id)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">
                    {category.name}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              ))}
              {categories.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No categories available in this folder
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
