import { useState, useEffect, useCallback } from 'react'; // Removed Fragment
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Trash2, Pencil, Power, Folder as FolderIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Folder, Question } from '../types';
import { CreateFolderDialog } from './CreateFolderDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import PDFDownloadButton from './PDFDownloadButton';
import toast from 'react-hot-toast';

export default function FolderList() {
  const navigate = useNavigate();
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [parentFolderIdForCreate, setParentFolderIdForCreate] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [folderQuestions, setFolderQuestions] = useState<{ [key: string]: Question[] }>({});
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const fetchFolders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setAllFolders(data || []);
    } catch (error) {
      toast.error('Error loading folders');
      console.error("Fetch folders error:", error);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const fetchFolderQuestions = useCallback(async (folderId: string) => {
    try {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('folder_id', folderId)
        .eq('is_enabled', true);
      if (categoriesError) throw categoriesError;
      const categoryIds = categories?.map(cat => cat.id) || [];
      if (categoryIds.length === 0) {
        setFolderQuestions(prev => ({ ...prev, [folderId]: [] })); return;
      }
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('category_id', categoryIds)
        .eq('is_active', true);
      if (questionsError) throw questionsError;
      setFolderQuestions(prev => ({ ...prev, [folderId]: questions || [] }));
    } catch (error) {
      console.error(`Error fetching questions for folder ${folderId}:`, error);
      setFolderQuestions(prev => ({ ...prev, [folderId]: [] }));
    }
  }, []);

  useEffect(() => {
    allFolders.forEach(folder => {
      if (!folderQuestions[folder.id]) { fetchFolderQuestions(folder.id); }
    });
  }, [allFolders, fetchFolderQuestions, folderQuestions]);

  const handleCreateFolder = async (name: string, parentFolderId?: string | null) => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name, parent_folder_id: parentFolderId, is_enabled: true }])
        .select().single();
      if (error) throw error;
      setAllFolders([...allFolders, data]);
      fetchFolderQuestions(data.id);
      if (parentFolderId) { setExpandedFolders(prev => new Set(prev).add(parentFolderId)); }
      toast.success('Folder created successfully');
    } catch (error) {
      toast.error('Error creating folder'); console.error("Create folder error:", error);
    }
  };

  const handleDeleteFolder = async () => {
    if (!selectedFolder) return;
    try {
      const children = allFolders.filter(f => f.parent_folder_id === selectedFolder.id);
      if (children.length > 0) {
        toast.error("Cannot delete folder with subfolders."); setIsDeleteDialogOpen(false); setSelectedFolder(null); return;
      }
      const { data: categories, error: catError } = await supabase.from('categories').select('id', { count: 'exact' }).eq('folder_id', selectedFolder.id);
      if (catError) throw catError;
      if (categories && categories.length > 0) {
        toast.error("Cannot delete folder with categories."); setIsDeleteDialogOpen(false); setSelectedFolder(null); return;
      }
      const { error } = await supabase.from('folders').delete().eq('id', selectedFolder.id);
      if (error) throw error;
      setAllFolders(allFolders.filter((f) => f.id !== selectedFolder.id));
      setExpandedFolders(prev => { const newSet = new Set(prev); newSet.delete(selectedFolder.id); return newSet; });
      setIsDeleteDialogOpen(false); setSelectedFolder(null); toast.success('Folder deleted successfully');
    } catch (error) {
      toast.error('Error deleting folder'); console.error("Delete folder error:", error);
    }
  };

  const startEditing = (folder: Folder) => { setEditingFolderId(folder.id); setEditingName(folder.name); };

  const handleUpdateFolderName = async (folderId: string) => {
    if (!editingName.trim()) { setEditingFolderId(null); return; }
    try {
      const { error } = await supabase.from('folders').update({ name: editingName.trim() }).eq('id', folderId);
      if (error) throw error;
      setAllFolders(allFolders.map(f => f.id === folderId ? { ...f, name: editingName.trim() } : f));
      toast.success('Folder name updated');
    } catch (error) { toast.error('Error updating folder name'); }
    finally { setEditingFolderId(null); }
  };

  const handleToggleFolderEnabled = async (folder: Folder) => {
    const newEnabledState = !folder.is_enabled;
    try {
      const { error } = await supabase.from('folders').update({ is_enabled: newEnabledState }).eq('id', folder.id);
      if (error) throw error;
      setAllFolders(allFolders.map(f => f.id === folder.id ? { ...f, is_enabled: newEnabledState } : f));
      toast.success(`Folder ${newEnabledState ? 'enabled' : 'disabled'}`);
    } catch (error) { toast.error(`Error toggling folder state`); }
  };

  const handleKeyPress = (e: React.KeyboardEvent, folderId: string) => {
    if (e.key === 'Enter') { handleUpdateFolderName(folderId); }
    else if (e.key === 'Escape') { setEditingFolderId(null); }
  };

  const openCreateDialog = (parentId: string | null = null) => {
    setParentFolderIdForCreate(parentId);
    setIsCreateDialogOpen(true);
  };

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) { newSet.delete(folderId); }
      else { newSet.add(folderId); }
      return newSet;
    });
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const children = allFolders.filter(f => f.parent_folder_id === folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const hasQuestions = folderQuestions[folder.id]?.length > 0;

    // Use div as the main wrapper for each folder entry
    return (
      <div key={folder.id}>
        {/* This div represents the visible folder item */}
        <div
          className={`relative group bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${!folder.is_enabled ? 'opacity-60 bg-gray-50' : ''}`}
          style={{ marginLeft: `${level * 2}rem` }}
        >
          <div className="flex justify-between items-start">
            {/* Folder Info & Navigation & Toggle */}
            <div className="flex items-start space-x-2 flex-1 min-w-0">
              {/* Expansion Toggle Button */}
              <div className="flex-shrink-0 mt-1" style={{ width: '1.25rem' }}>
                {hasChildren && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFolderExpansion(folder.id); }}
                    className="p-0.5 rounded hover:bg-gray-200"
                    aria-expanded={isExpanded}
                    aria-controls={`folder-children-${folder.id}`}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                  </button>
                )}
              </div>
              {/* Folder Icon and Name */}
              <div
                className="flex items-start space-x-2 flex-1 cursor-pointer min-w-0"
                onClick={() => editingFolderId !== folder.id && navigate(`/admin/folders/${folder.id}`)}
              >
                <FolderIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                <div className="min-w-0 flex-1">
                  {editingFolderId === folder.id ? (
                    <input
                      type="text" value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleUpdateFolderName(folder.id)}
                      onKeyDown={(e) => handleKeyPress(e, folder.id)}
                      className="w-full px-2 py-1 text-base font-medium text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className={`text-base font-medium truncate ${folder.is_enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                      {folder.name}
                    </h3>
                  )}
                  <p className="text-sm text-gray-500">
                    {new Date(folder.created_at).toLocaleDateString()} {folder.is_enabled ? '' : '(Disabled)'}
                  </p>
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); openCreateDialog(folder.id); }} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full transition-opacity" title="Add Subfolder">
                <FolderPlus className="h-4 w-4 text-gray-500 hover:text-green-600" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); startEditing(folder); }} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full transition-opacity" title="Rename Folder">
                <Pencil className="h-4 w-4 text-gray-500 hover:text-blue-600" />
              </button>
              {hasQuestions && (
                <PDFDownloadButton title={`${folder.name} Questions`} questions={folderQuestions[folder.id]} />
              )}
              <button onClick={(e) => { e.stopPropagation(); setSelectedFolder(folder); setIsDeleteDialogOpen(true); }} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full transition-opacity" title="Delete Folder">
                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleToggleFolderEnabled(folder); }} className={`p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full transition-opacity ${folder.is_enabled ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`} title={folder.is_enabled ? 'Disable Folder' : 'Enable Folder'}>
                <Power className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div> {/* Closing tag for the visible folder item div */}

        {/* Render Children Conditionally */}
        {hasChildren && isExpanded && (
          <div className="mt-2" id={`folder-children-${folder.id}`}>
            {children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div> // Closing tag for the main wrapper div
    );
  }; // End of renderFolder function

  const topLevelFolders = allFolders.filter(folder => !folder.parent_folder_id);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Folders</h2>
        <button
          onClick={() => openCreateDialog(null)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </button>
      </div>

      <div className="space-y-4">
        {topLevelFolders.length > 0 ? (
           topLevelFolders.map(folder => renderFolder(folder))
        ) : (
          <div className="text-center py-12 text-gray-500">
            No top-level folders found. Click "New Folder" to create one.
          </div>
        )}
      </div>

      <CreateFolderDialog
        isOpen={isCreateDialogOpen}
        onClose={() => { setIsCreateDialogOpen(false); setParentFolderIdForCreate(null); }}
        onCreateFolder={handleCreateFolder}
        parentFolderId={parentFolderIdForCreate}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => { setIsDeleteDialogOpen(false); setSelectedFolder(null); }}
        onConfirm={handleDeleteFolder}
        title="Delete Folder"
        message={`Are you sure you want to delete the folder "${selectedFolder?.name}"? This action cannot be undone. Ensure the folder is empty (no subfolders or categories) before deleting.`}
      />
    </div>
  );
}
