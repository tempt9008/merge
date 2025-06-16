import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Pencil, Plus, Trash2, FolderOpen, Power } from 'lucide-react'; // Added Power icon
import { supabase } from '../lib/supabase';
import { Category, Question } from '../types';
import { CreateCategoryDialog } from './CreateCategoryDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import QuestionList from './QuestionList';
import PDFDownloadButton from './PDFDownloadButton';
import toast from 'react-hot-toast';

export default function CategoryList() {
  const { folderId } = useParams<{ folderId: string }>();
  const [folderName, setFolderName] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [categoryQuestions, setCategoryQuestions] = useState<{ [key: string]: Question[] }>({});

  useEffect(() => {
    if (folderId) {
      fetchFolderName();
      fetchCategories();
    }
  }, [folderId]);

  useEffect(() => {
    categories.forEach(category => {
      fetchCategoryQuestions(category.id);
    });
  }, [categories]);

  const fetchFolderName = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('name')
        .eq('id', folderId)
        .single();

      if (error) throw error;
      setFolderName(data.name);
    } catch (error) {
      toast.error('Error loading folder information');
      console.error('Error:', error);
    }
  };

  const fetchCategories = async () => {
    if (!folderId) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast.error('Error loading categories');
      console.error('Error:', error);
    }
  };

  const fetchCategoryQuestions = async (categoryId: string) => {
    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true);

      if (error) throw error;
      setCategoryQuestions(prev => ({
        ...prev,
        [categoryId]: questions || []
      }));
    } catch (error) {
      console.error('Error fetching category questions:', error);
      setCategoryQuestions(prev => ({
        ...prev,
        [categoryId]: []
      }));
    }
  };

  const handleCreateCategory = async (name: string) => {
    if (!folderId) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, folder_id: folderId }])
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      toast.success('Category created successfully');
    } catch (error) {
      toast.error('Error creating category');
      console.error('Error:', error);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id);

      if (error) throw error;

      setCategories(categories.filter((c) => c.id !== selectedCategory.id));
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Error deleting category');
      console.error('Error:', error);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingName(category.name);
  };

  const handleUpdateCategoryName = async (categoryId: string) => {
    if (!editingName.trim()) {
      setEditingCategoryId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editingName.trim() })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(categories.map(c => 
        c.id === categoryId ? { ...c, name: editingName.trim() } : c
      ));
      toast.success('Category updated successfully');
    } catch (error) {
      toast.error('Error updating category');
      console.error('Error:', error);
    } finally {
      setEditingCategoryId(null);
    }
  };

  const handleToggleCategoryEnabled = async (category: Category) => {
    const newEnabledState = !category.is_enabled;
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_enabled: newEnabledState })
        .eq('id', category.id);

      if (error) throw error;

      setCategories(categories.map(c =>
        c.id === category.id ? { ...c, is_enabled: newEnabledState } : c
      ));
      toast.success(`Category ${newEnabledState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error(`Error ${newEnabledState ? 'enabling' : 'disabling'} category`);
      console.error('Error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleUpdateCategoryName(id);
    } else if (e.key === 'Escape') {
      setEditingCategoryId(null);
    }
  };

  if (!folderId) {
    return <div>No folder selected</div>;
  }

  return (
    <div>
      {/* Folder Name Header */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <FolderOpen className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">{folderName}</h1>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </button>
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`group bg-white rounded-lg shadow-sm border border-gray-200 ${!category.is_enabled ? 'opacity-60 bg-gray-50' : ''}`} // Added conditional styling
          >
            <div
              className="p-6 cursor-pointer"
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )
              }
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <Layout className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    {editingCategoryId === category.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleUpdateCategoryName(category.id)}
                        onKeyDown={(e) => handleKeyPress(e, category.id)}
                        className="text-lg font-medium text-gray-900 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h3 className={`text-lg font-medium ${category.is_enabled ? 'text-gray-900' : 'text-gray-500'}`}> {/* Conditional text color */}
                        {category.name}
                      </h3>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(category.created_at).toLocaleDateString()} {category.is_enabled ? '' : '(Disabled)'} {/* Added disabled indicator */}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(category);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {/* Conditionally render PDF button only if category is enabled and has questions */}
                  {category.is_enabled && categoryQuestions[category.id]?.length > 0 && (
                    <PDFDownloadButton
                      title={`${category.name} Questions`}
                      questions={categoryQuestions[category.id]}
                    />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(category);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  {/* Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCategoryEnabled(category);
                    }}
                    className={`p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full transition-opacity ${category.is_enabled ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`}
                    title={category.is_enabled ? 'Disable Category' : 'Enable Category'}
                  >
                    <Power className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            {expandedCategory === category.id && (
              <div className="border-t border-gray-200 p-6">
                <QuestionList categoryId={category.id} />
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No categories found. Click "New Category" to create one.
          </div>
        )}
      </div>

      <CreateCategoryDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateCategory={handleCreateCategory}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message="Are you sure you want to delete this category? All questions within this category will be permanently removed. This action cannot be undone."
      />
    </div>
  );
}
