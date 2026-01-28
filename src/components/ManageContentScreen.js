import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Icons
const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const GripIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="1" fill="currentColor" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="19" r="1" fill="currentColor" />
    <circle cx="15" cy="5" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="19" r="1" fill="currentColor" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Sortable Category Item - filters items by selected org
const SortableCategoryItem = ({ category, isExpanded, onToggle, onEdit, onDelete, onAddContent, onEditContent, onDeleteContent, onReorderItems, selectedOrgId, orgAssignments }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  // Filter items by selected org using assignments
  const filteredItems = category.items.filter(item =>
    orgAssignments.some(a =>
      a.content_item_id === item.id &&
      a.organization_id === selectedOrgId &&
      a.category_id === category.id
    )
  );

  return (
    <div ref={setNodeRef} style={{ ...styles.categoryCard, ...style }}>
      <div style={styles.categoryHeader}>
        <div {...attributes} {...listeners} style={styles.dragHandle}>
          <GripIcon />
        </div>
        <div style={styles.categoryInfo} onClick={onToggle}>
          <h3 style={styles.categoryName}>{category.title}</h3>
          <span style={styles.categoryCount}>
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={styles.categoryActions}>
          <button style={styles.iconBtn} onClick={onEdit}>
            <EditIcon />
          </button>
          <button style={styles.iconBtn} onClick={onDelete}>
            <TrashIcon />
          </button>
          <div style={{ ...styles.expandIcon, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} onClick={onToggle}>
            <ChevronDownIcon />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div style={styles.categoryContent}>
          <button style={styles.addContentBtn} onClick={onAddContent}>
            <PlusIcon />
            <span>Add Content</span>
          </button>

          {filteredItems.length > 0 ? (
            <SortableContentList
              items={filteredItems}
              categoryId={category.id}
              onEditContent={onEditContent}
              onDeleteContent={onDeleteContent}
              onReorderItems={onReorderItems}
            />
          ) : (
            <p style={styles.noItems}>No content items yet</p>
          )}
        </div>
      )}
    </div>
  );
};

// Sortable Content Item
const SortableContentItem = ({ item, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={{ ...styles.itemCard, ...style }}>
      <div {...attributes} {...listeners} style={styles.dragHandleSmall}>
        <GripIcon />
      </div>
      <div style={styles.itemThumbnail}>
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt="" style={styles.itemThumbImage} />
        ) : (
          <div style={styles.itemThumbPlaceholder}>
            <ImageIcon />
          </div>
        )}
      </div>
      <div style={styles.itemInfo}>
        <p style={styles.itemTitle}>{item.title}</p>
        {item.description && (
          <p style={styles.itemDesc}>{item.description}</p>
        )}
      </div>
      <div style={styles.itemActions}>
        <button style={styles.iconBtn} onClick={onEdit}>
          <EditIcon />
        </button>
        <button style={styles.iconBtn} onClick={onDelete}>
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

// Sortable Content List (nested DndContext for items)
const SortableContentList = ({ items, categoryId, onEditContent, onDeleteContent, onReorderItems }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);
      onReorderItems(categoryId, newOrder.map(i => i.id));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div style={styles.itemsList}>
          {items.map(item => (
            <SortableContentItem
              key={item.id}
              item={item}
              onEdit={() => onEditContent(item)}
              onDelete={() => onDeleteContent(item)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

// Category Modal
const CategoryModal = ({ isOpen, onClose, onSave, category, title }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(category?.title || '');
      setDescription(category?.description || '');
    }
  }, [isOpen, category]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ title: name.trim(), description: description.trim() });
      onClose();
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          <CloseIcon />
        </button>
        <h2 style={styles.modalTitle}>{title}</h2>

        <div style={styles.formGroup}>
          <label style={styles.label}>Category Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={styles.input}
            placeholder="Enter category name"
            autoFocus
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={styles.textarea}
            placeholder="Brief description"
            rows={3}
          />
        </div>

        <button
          style={{ ...styles.saveBtn, opacity: !name.trim() || saving ? 0.5 : 1 }}
          onClick={handleSave}
          disabled={!name.trim() || saving}
        >
          {saving ? 'Saving...' : (category ? 'Update Category' : 'Add Category')}
        </button>
      </div>
    </div>
  );
};

// Folder/Category Icon
const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

// Content Item Modal (single category + current org)
const ContentItemModal = ({ isOpen, onClose, onSave, onCategoryChange, item, title, type, categoryId, selectedOrgId, categories = [], itemCategories = [] }) => {
  const modalRef = React.useRef(null);
  const scrollYRef = React.useRef(0);
  const [formData, setFormData] = useState({
    title: '', description: '', thumbnail_url: '', file_url: '', file_name: '',
    external_link: '', external_link_label: '', quiz_link: '', quiz_link_label: '',
    is_downloadable: true, use_company_logo: false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([categoryId].filter(Boolean));
  const [categoryError, setCategoryError] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.width = '100%';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollYRef.current);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: item?.title || '',
        description: item?.description || '',
        thumbnail_url: item?.thumbnail_url || '',
        file_url: item?.file_url || '',
        file_name: item?.file_name || '',
        external_link: item?.external_link || '',
        external_link_label: item?.external_link_label || '',
        quiz_link: item?.quiz_link || '',
        quiz_link_label: item?.quiz_link_label || '',
        is_downloadable: item?.is_downloadable !== false,
        use_company_logo: item?.use_company_logo || false,
      });
      // Initialize selected categories from itemCategories, or just the current category
      const initialCats = itemCategories.length > 0 ? itemCategories : [categoryId].filter(Boolean);
      setSelectedCategories(initialCats);
      setCategoryError('');
    }
  }, [isOpen, item, categoryId, itemCategories]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      handleChange('thumbnail_url', data.publicUrl);
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      handleChange('file_url', data.publicUrl);
      handleChange('file_name', file.name);
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;

    // Validate at least one category is selected
    if (item && selectedCategories.length === 0) {
      setCategoryError('At least one category must be selected');
      // Scroll to top of modal
      modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setCategoryError('');
    try {
      const categoriesToSave = selectedCategories.length > 0 ? selectedCategories : [categoryId];
      console.log('[ContentItemModal] Saving with categories:', { selectedCategories, itemId: item?.id });
      await onSave(formData, categoriesToSave[0], selectedOrgId, item?.id, categoriesToSave);
      onClose();
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (catId) => {
    setCategoryError(''); // Clear error when user interacts
    setSelectedCategories(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div ref={modalRef} style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          <CloseIcon />
        </button>
        <h2 style={styles.modalTitle}>{title}</h2>

        {/* Category Management - only show when editing existing item */}
        {item && categories.length > 0 && (
          <div style={styles.categorySection}>
            <div style={styles.categorySectionHeader}>
              <FolderIcon />
              <span style={styles.categorySectionTitle}>Show in Categories</span>
            </div>

            {/* Error message */}
            {categoryError && (
              <div style={styles.categoryError}>
                {categoryError}
              </div>
            )}

            {/* All Categories as clickable chips */}
            <div style={styles.categoryChips}>
              {categories.map(cat => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    style={{
                      ...styles.categoryChip,
                      ...(isSelected ? styles.categoryChipSelected : {}),
                    }}
                    onClick={() => toggleCategory(cat.id)}
                    type="button"
                  >
                    {isSelected && <span style={styles.checkMark}>+</span>}
                    {cat.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Title *</label>
          <input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} style={styles.input} placeholder="Content title" />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <textarea value={formData.description} onChange={e => handleChange('description', e.target.value)} style={styles.textarea} placeholder="Content description" rows={3} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Thumbnail (Square Image)</label>
          {formData.thumbnail_url ? (
            <div style={styles.thumbnailPreview}>
              <img src={formData.thumbnail_url} alt="Thumbnail" style={styles.previewImage} />
              <button style={styles.removeBtn} onClick={() => handleChange('thumbnail_url', '')}>Remove</button>
            </div>
          ) : (
            <label style={styles.uploadBtn}>
              <ImageIcon />
              <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
              <input type="file" accept="image/*" onChange={handleThumbnailUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>File Attachment</label>
          {formData.file_url ? (
            <div style={styles.filePreview}>
              <span>{formData.file_name || 'File uploaded'}</span>
              <button style={styles.removeBtn} onClick={() => { handleChange('file_url', ''); handleChange('file_name', ''); }}>Remove</button>
            </div>
          ) : (
            <label style={styles.uploadBtn}>
              <PlusIcon />
              <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
              <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>External Link</label>
          <input type="url" value={formData.external_link} onChange={e => handleChange('external_link', e.target.value)} style={styles.input} placeholder="https://..." />
        </div>

        <div style={styles.toggleGroup}>
          <div style={styles.toggleRow}>
            <span style={styles.toggleLabel}>Downloadable</span>
            <button style={{ ...styles.toggle, backgroundColor: formData.is_downloadable ? 'var(--primary-blue)' : 'var(--border-light)' }} onClick={() => handleChange('is_downloadable', !formData.is_downloadable)}>
              <div style={{ ...styles.toggleKnob, transform: formData.is_downloadable ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
        </div>

        <button style={{ ...styles.saveBtn, opacity: !formData.title.trim() || saving ? 0.5 : 1 }} onClick={handleSave} disabled={!formData.title.trim() || saving}>
          {saving ? 'Saving...' : (item ? 'Update Content' : 'Add Content')}
        </button>
      </div>
    </div>
  );
};

// Multi-Category Content Modal with Org Selection - supports both Category and Content
const MultiCategoryContentModal = ({ isOpen, onClose, onSave, onSaveCategory, categories, allCategories, organizations, type }) => {
  const modalRef = React.useRef(null);
  const scrollYRef = React.useRef(0);

  // Mode: 'category' or 'content'
  const [mode, setMode] = useState('content');

  // Category form (for adding category to multiple orgs)
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [selectedOrgs, setSelectedOrgs] = useState([]); // array of org ids

  // Content form
  const [formData, setFormData] = useState({
    title: '', description: '', thumbnail_url: '', file_url: '', file_name: '',
    external_link: '', external_link_label: '', quiz_link: '', quiz_link_label: '',
    is_downloadable: true, use_company_logo: false,
  });
  // { [orgId]: [categoryIds] }
  const [selectedOrgCategories, setSelectedOrgCategories] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.width = '100%';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollYRef.current);
      };
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('content');
      setCategoryName('');
      setCategoryDesc('');
      setSelectedOrgs([]);
      setFormData({
        title: '', description: '', thumbnail_url: '', file_url: '', file_name: '',
        external_link: '', external_link_label: '', quiz_link: '', quiz_link_label: '',
        is_downloadable: true, use_company_logo: false,
      });
      setSelectedOrgCategories({});
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleOrg = (orgId) => {
    setSelectedOrgCategories(prev => {
      if (prev[orgId]) {
        const newState = { ...prev };
        delete newState[orgId];
        return newState;
      }
      return { ...prev, [orgId]: [] };
    });
  };

  const toggleCategory = (orgId, categoryId) => {
    setSelectedOrgCategories(prev => {
      const orgCats = prev[orgId] || [];
      if (orgCats.includes(categoryId)) {
        return { ...prev, [orgId]: orgCats.filter(id => id !== categoryId) };
      }
      return { ...prev, [orgId]: [...orgCats, categoryId] };
    });
  };

  const toggleOrgForCategory = (orgId) => {
    setSelectedOrgs(prev =>
      prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
    );
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      handleChange('thumbnail_url', data.publicUrl);
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      handleChange('file_url', data.publicUrl);
      handleChange('file_name', file.name);
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim() || selectedOrgs.length === 0) return;
    setSaving(true);
    try {
      await onSaveCategory(categoryName.trim(), categoryDesc.trim(), selectedOrgs);
      onClose();
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContent = async () => {
    const hasSelection = Object.entries(selectedOrgCategories).some(([, cats]) => cats.length > 0);
    if (!formData.title.trim() || !hasSelection) return;

    setSaving(true);
    try {
      await onSave(formData, selectedOrgCategories);
      onClose();
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const hasContentSelection = Object.entries(selectedOrgCategories).some(([, cats]) => cats.length > 0);
  const canSaveContent = formData.title.trim() && hasContentSelection && !saving;
  const canSaveCategory = categoryName.trim() && selectedOrgs.length > 0 && !saving;

  if (!isOpen) return null;

  // Get categories for each org (for content mode)
  const getCategoriesForOrg = (orgId) => {
    return allCategories.filter(cat => cat.organization_id === orgId);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div ref={modalRef} style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          <CloseIcon />
        </button>
        <h2 style={styles.modalTitle}>Add to Multiple Orgs</h2>

        {/* Mode Toggle */}
        <div style={styles.modeToggle}>
          <button
            style={{ ...styles.modeBtn, ...(mode === 'category' ? styles.modeBtnActive : {}) }}
            onClick={() => setMode('category')}
          >
            Add Category
          </button>
          <button
            style={{ ...styles.modeBtn, ...(mode === 'content' ? styles.modeBtnActive : {}) }}
            onClick={() => setMode('content')}
          >
            Add Content
          </button>
        </div>

        {mode === 'category' ? (
          <>
            {/* Category Mode */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Organizations *</label>
              <p style={styles.categoryHint}>Category will be created in each selected org</p>
              {organizations.map(org => (
                <label key={org.id} style={styles.orgCheckRow}>
                  <input
                    type="checkbox"
                    checked={selectedOrgs.includes(org.id)}
                    onChange={() => toggleOrgForCategory(org.id)}
                    style={styles.checkbox}
                  />
                  <span style={{ ...styles.orgLabel, color: org.code === 'AM' ? '#1d4ed8' : '#be185d' }}>
                    {org.name} ({org.code})
                  </span>
                </label>
              ))}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category Name *</label>
              <input
                type="text"
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                style={styles.input}
                placeholder="Enter category name"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description (optional)</label>
              <textarea
                value={categoryDesc}
                onChange={e => setCategoryDesc(e.target.value)}
                style={styles.textarea}
                placeholder="Brief description"
                rows={2}
              />
            </div>

            <button
              style={{ ...styles.saveBtn, opacity: canSaveCategory ? 1 : 0.5 }}
              onClick={handleSaveCategory}
              disabled={!canSaveCategory}
            >
              {saving ? 'Saving...' : `Add Category to ${selectedOrgs.length} Org${selectedOrgs.length !== 1 ? 's' : ''}`}
            </button>
          </>
        ) : (
          <>
            {/* Content Mode */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Organizations & Categories *</label>
          <p style={styles.categoryHint}>Choose where this content should appear</p>

          {organizations.map(org => (
            <div key={org.id} style={styles.orgSection}>
              <label style={styles.orgCheckRow}>
                <input
                  type="checkbox"
                  checked={!!selectedOrgCategories[org.id]}
                  onChange={() => toggleOrg(org.id)}
                  style={styles.checkbox}
                />
                <span style={{ ...styles.orgLabel, color: org.code === 'AM' ? '#1d4ed8' : '#be185d' }}>
                  {org.name} ({org.code})
                </span>
              </label>

              {selectedOrgCategories[org.id] && (
                <div style={styles.categoryCheckboxes}>
                  {getCategoriesForOrg(org.id).length > 0 ? (
                    getCategoriesForOrg(org.id).map(cat => (
                      <label key={cat.id} style={styles.catCheckRow}>
                        <input
                          type="checkbox"
                          checked={selectedOrgCategories[org.id]?.includes(cat.id)}
                          onChange={() => toggleCategory(org.id, cat.id)}
                          style={styles.checkbox}
                        />
                        <span style={styles.catLabel}>{cat.title}</span>
                      </label>
                    ))
                  ) : (
                    <p style={styles.noCatsHint}>No categories for this org yet. Create one first.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Title *</label>
          <input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} style={styles.input} placeholder="Content title" />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <textarea value={formData.description} onChange={e => handleChange('description', e.target.value)} style={styles.textarea} placeholder="Content description" rows={3} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Thumbnail (Square Image)</label>
          {formData.thumbnail_url ? (
            <div style={styles.thumbnailPreview}>
              <img src={formData.thumbnail_url} alt="Thumbnail" style={styles.previewImage} />
              <button style={styles.removeBtn} onClick={() => handleChange('thumbnail_url', '')}>Remove</button>
            </div>
          ) : (
            <label style={styles.uploadBtn}>
              <ImageIcon />
              <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
              <input type="file" accept="image/*" onChange={handleThumbnailUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>File Attachment</label>
          {formData.file_url ? (
            <div style={styles.filePreview}>
              <span>{formData.file_name || 'File uploaded'}</span>
              <button style={styles.removeBtn} onClick={() => { handleChange('file_url', ''); handleChange('file_name', ''); }}>Remove</button>
            </div>
          ) : (
            <label style={styles.uploadBtn}>
              <PlusIcon />
              <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
              <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>External Link</label>
          <input type="url" value={formData.external_link} onChange={e => handleChange('external_link', e.target.value)} style={styles.input} placeholder="https://..." />
        </div>

        <div style={styles.toggleGroup}>
          <div style={styles.toggleRow}>
            <span style={styles.toggleLabel}>Downloadable</span>
            <button style={{ ...styles.toggle, backgroundColor: formData.is_downloadable ? 'var(--primary-blue)' : 'var(--border-light)' }} onClick={() => handleChange('is_downloadable', !formData.is_downloadable)}>
              <div style={{ ...styles.toggleKnob, transform: formData.is_downloadable ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
        </div>

        <button style={{ ...styles.saveBtn, opacity: canSaveContent ? 1 : 0.5 }} onClick={handleSaveContent} disabled={!canSaveContent}>
          {saving ? 'Saving...' : 'Add Content'}
        </button>
          </>
        )}
      </div>
    </div>
  );
};

// Main Component
const ManageContentScreen = ({ type, title, backPath }) => {
  const navigate = useNavigate();
  const { refreshContent } = useContent();

  // All organizations (fetched from DB, not just user's orgs)
  const [allOrganizations, setAllOrganizations] = useState([]);

  // Categories with org_id support
  const [allCategories, setAllCategories] = useState([]);

  // Content and assignments
  const [contentItems, setContentItems] = useState([]);
  const [orgAssignments, setOrgAssignments] = useState([]);
  const [itemCategoryLinks, setItemCategoryLinks] = useState([]); // content_item_categories junction
  const [loading, setLoading] = useState(true);

  // Selected org for toggle view
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  // Modal states
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null });
  const [contentModal, setContentModal] = useState({ open: false, item: null, categoryId: null, orgId: null });
  const [multiCategoryModal, setMultiCategoryModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null, name: '', categoryId: null, inMultipleOrgs: false });
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load all data
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch ALL organizations, categories (with org_id), content items, assignments, and item-category links
      const [orgsResult, categoriesResult, itemsResult, assignmentsResult, itemCategoriesResult] = await Promise.all([
        supabase.from('organizations').select('*').order('code'),
        supabase.from('content_categories').select('*').eq('type', type).eq('is_active', true).order('sort_order'),
        supabase.from('content_items').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('content_item_assignments').select('*'),
        supabase.from('content_item_categories').select('*')
      ]);

      if (orgsResult.error) throw orgsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      // Don't throw on itemCategories error - table might not exist

      setAllOrganizations(orgsResult.data || []);
      setAllCategories(categoriesResult.data || []);
      setContentItems(itemsResult.data || []);
      setOrgAssignments(assignmentsResult.data || []);
      setItemCategoryLinks(itemCategoriesResult.data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Set default org on mount
  useEffect(() => {
    if (allOrganizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(allOrganizations[0].id);
    }
  }, [allOrganizations, selectedOrgId]);

  // Filter categories by selected org and sort by sort_order
  const categories = allCategories
    .filter(cat => cat.organization_id === selectedOrgId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Drag handlers for categories
  const handleDragStart = (event) => {
    const draggedCategory = categories.find(c => c.id === event.active.id);
    setActiveCategory(draggedCategory);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCategory(null);

    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex);

      // Optimistically update local state - rebuild array in new order
      const reorderedCurrentOrg = newOrder.map((cat, index) => ({ ...cat, sort_order: index }));
      const otherOrgCategories = allCategories.filter(c => c.organization_id !== selectedOrgId);
      setAllCategories([...otherOrgCategories, ...reorderedCurrentOrg]);

      // Update in database
      try {
        const updates = newOrder.map((cat, index) => ({
          id: cat.id,
          sort_order: index,
        }));
        for (const update of updates) {
          await supabase
            .from('content_categories')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
        }
      } catch (error) {
        console.error('Error reordering categories:', error);
        fetchContent(); // Refresh on error
      }
    }
  };

  // Handler for reordering content items within a category
  const handleReorderItems = async (categoryId, newItemIds) => {
    // Optimistically update local state - update sort_order in assignments
    setOrgAssignments(prev => prev.map(a => {
      if (a.organization_id === selectedOrgId && a.category_id === categoryId) {
        const newIndex = newItemIds.indexOf(a.content_item_id);
        return newIndex >= 0 ? { ...a, sort_order: newIndex } : a;
      }
      return a;
    }));

    try {
      // Update sort_order in assignments table
      for (let i = 0; i < newItemIds.length; i++) {
        await supabase
          .from('content_item_assignments')
          .update({ sort_order: i })
          .eq('content_item_id', newItemIds[i])
          .eq('category_id', categoryId)
          .eq('organization_id', selectedOrgId);
      }
      refreshContent && refreshContent();
    } catch (error) {
      console.error('Error reordering items:', error);
      fetchContent(); // Refresh on error
    }
  };

  // Get items for a category within selected org, sorted by assignment sort_order
  const getOrgCategoryItems = (categoryId) => {
    const assignments = orgAssignments
      .filter(a => a.organization_id === selectedOrgId && a.category_id === categoryId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return assignments
      .map(a => contentItems.find(item => item.id === a.content_item_id))
      .filter(Boolean);
  };

  // Category handlers - now with org_id support
  const handleSaveCategory = async (data) => {
    try {
      if (categoryModal.category) {
        // Update existing category
        const { error } = await supabase
          .from('content_categories')
          .update({ title: data.title, description: data.description })
          .eq('id', categoryModal.category.id);
        if (error) throw error;
      } else {
        // Add new category to selected org
        const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order || 0), 0);
        const { error } = await supabase
          .from('content_categories')
          .insert({
            type,
            title: data.title,
            description: data.description,
            organization_id: selectedOrgId,
            sort_order: maxOrder + 1,
          });
        if (error) throw error;
      }
      await fetchContent();
      refreshContent && refreshContent();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  // Check if category with same name exists in other orgs
  const checkCategoryInOtherOrgs = (categoryName, currentOrgId) => {
    return allCategories.some(cat =>
      cat.title === categoryName &&
      cat.organization_id !== currentOrgId
    );
  };

  // Delete category handler
  const handleDeleteCategory = async (deleteFromAllOrgs = false) => {
    try {
      if (deleteFromAllOrgs) {
        // Delete all categories with this name across all orgs
        const { error } = await supabase
          .from('content_categories')
          .delete()
          .eq('title', deleteConfirm.name)
          .eq('type', type);
        if (error) throw error;
      } else {
        // Delete just this category
        const { error } = await supabase
          .from('content_categories')
          .delete()
          .eq('id', deleteConfirm.id);
        if (error) throw error;
      }
      await fetchContent();
      refreshContent && refreshContent();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
    setDeleteConfirm({ open: false, type: null, id: null, name: '', categoryId: null, inMultipleOrgs: false });
  };

  // Content handlers - single category + current org
  const handleSaveContent = async (formData, categoryId, orgId, existingItemId, allSelectedCategories = []) => {
    console.log('[handleSaveContent] Called with:', { categoryId, orgId, existingItemId, allSelectedCategories });
    try {
      let itemId = existingItemId;

      if (existingItemId) {
        // Update existing item
        const { error } = await supabase
          .from('content_items')
          .update({
            title: formData.title,
            description: formData.description,
            thumbnail_url: formData.thumbnail_url,
            file_url: formData.file_url,
            file_name: formData.file_name,
            external_link: formData.external_link,
            external_link_label: formData.external_link_label,
            quiz_link: formData.quiz_link,
            quiz_link_label: formData.quiz_link_label,
            is_downloadable: formData.is_downloadable,
            use_company_logo: formData.use_company_logo,
          })
          .eq('id', existingItemId);

        if (error) throw error;

        // Update category assignments if categories were changed
        if (allSelectedCategories.length > 0) {
          console.log('[handleSaveContent] Updating category links for item:', existingItemId);

          // Delete existing category links for this item
          const { error: deleteError } = await supabase
            .from('content_item_categories')
            .delete()
            .eq('content_id', existingItemId);

          if (deleteError) console.error('[handleSaveContent] Delete error:', deleteError);
          else console.log('[handleSaveContent] Deleted old category links');

          // Insert new category links
          const categoryLinks = allSelectedCategories.map((catId, index) => ({
            content_id: existingItemId,
            category_id: catId,
            sort_order: index,
          }));
          console.log('[handleSaveContent] Inserting category links:', categoryLinks);

          const { error: linkError } = await supabase
            .from('content_item_categories')
            .insert(categoryLinks);

          if (linkError) console.error('[handleSaveContent] Insert error:', linkError);
          else console.log('[handleSaveContent] Category links saved successfully');

          // ALSO update content_item_assignments for the display
          // Delete existing assignments for this item in this org
          await supabase
            .from('content_item_assignments')
            .delete()
            .eq('content_item_id', existingItemId)
            .eq('organization_id', orgId);

          // Create assignment for each selected category
          const assignments = allSelectedCategories.map((catId, index) => ({
            content_item_id: existingItemId,
            organization_id: orgId,
            category_id: catId,
            sort_order: index,
          }));
          console.log('[handleSaveContent] Creating org assignments:', assignments);

          const { error: assignError } = await supabase
            .from('content_item_assignments')
            .insert(assignments);

          if (assignError) console.error('[handleSaveContent] Assignment error:', assignError);
          else console.log('[handleSaveContent] Org assignments saved successfully');
        }
      } else {
        // Create new item
        const { data: newItem, error } = await supabase
          .from('content_items')
          .insert({
            title: formData.title,
            description: formData.description,
            thumbnail_url: formData.thumbnail_url,
            file_url: formData.file_url,
            file_name: formData.file_name,
            external_link: formData.external_link,
            external_link_label: formData.external_link_label,
            quiz_link: formData.quiz_link,
            quiz_link_label: formData.quiz_link_label,
            is_downloadable: formData.is_downloadable,
            use_company_logo: formData.use_company_logo,
          })
          .select()
          .single();

        if (error) throw error;
        itemId = newItem.id;

        // Create assignment for this org + category
        const { error: assignmentError } = await supabase
          .from('content_item_assignments')
          .insert({
            content_item_id: itemId,
            organization_id: orgId,
            category_id: categoryId,
            sort_order: 0,
          });

        if (assignmentError) throw assignmentError;

        // Also create category link if provided
        if (categoryId) {
          await supabase
            .from('content_item_categories')
            .insert({
              content_id: itemId,
              category_id: categoryId,
              sort_order: 0,
            });
        }
      }

      await fetchContent();
      refreshContent && refreshContent();
    } catch (error) {
      console.error('Error saving content:', error);
      throw error;
    }
  };

  // Multi-category content handler
  const handleSaveMultiContent = async (formData, selectedOrgCategories) => {
    try {
      // Create content item
      const { data: newItem, error } = await supabase
        .from('content_items')
        .insert({
          title: formData.title,
          description: formData.description,
          thumbnail_url: formData.thumbnail_url,
          file_url: formData.file_url,
          file_name: formData.file_name,
          external_link: formData.external_link,
          external_link_label: formData.external_link_label,
          quiz_link: formData.quiz_link,
          quiz_link_label: formData.quiz_link_label,
          is_downloadable: formData.is_downloadable,
          use_company_logo: formData.use_company_logo,
        })
        .select()
        .single();

      if (error) throw error;

      // Create assignments for each org + category
      const assignments = [];
      Object.entries(selectedOrgCategories).forEach(([orgId, categoryIds]) => {
        categoryIds.forEach(catId => {
          assignments.push({
            content_item_id: newItem.id,
            organization_id: orgId,
            category_id: catId,
            sort_order: 0,
          });
        });
      });

      if (assignments.length > 0) {
        const { error: assignmentError } = await supabase
          .from('content_item_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      await fetchContent();
      refreshContent && refreshContent();
    } catch (error) {
      console.error('Error saving multi-category content:', error);
      throw error;
    }
  };

  // Multi-org category handler - creates category in each selected org
  const handleSaveMultiCategory = async (name, description, orgIds) => {
    try {
      const maxOrder = allCategories.reduce((max, c) => Math.max(max, c.sort_order || 0), 0);

      // Create a category row for each org
      const categoryRows = orgIds.map((orgId, index) => ({
        type,
        title: name,
        description: description || null,
        organization_id: orgId,
        sort_order: maxOrder + 1 + index,
      }));

      const { error } = await supabase
        .from('content_categories')
        .insert(categoryRows);

      if (error) throw error;

      await fetchContent();
      refreshContent && refreshContent();
    } catch (error) {
      console.error('Error saving multi-org category:', error);
      throw error;
    }
  };

  // Delete content handler
  const handleDeleteContent = async (removeFromCategoryOnly = false) => {
    try {
      if (removeFromCategoryOnly && deleteConfirm.categoryId) {
        // Just remove from this category (delete the assignment)
        await supabase
          .from('content_item_assignments')
          .delete()
          .eq('content_item_id', deleteConfirm.id)
          .eq('category_id', deleteConfirm.categoryId)
          .eq('organization_id', selectedOrgId);

        // Also remove from content_item_categories junction
        await supabase
          .from('content_item_categories')
          .delete()
          .eq('content_id', deleteConfirm.id)
          .eq('category_id', deleteConfirm.categoryId);
      } else {
        // Delete completely - remove all assignments first, then item
        await supabase
          .from('content_item_assignments')
          .delete()
          .eq('content_item_id', deleteConfirm.id);

        await supabase
          .from('content_item_categories')
          .delete()
          .eq('content_id', deleteConfirm.id);

        await supabase
          .from('content_items')
          .delete()
          .eq('id', deleteConfirm.id);
      }

      await fetchContent();
      refreshContent && refreshContent();
    } catch (err) {
      console.error('Error deleting content:', err);
      alert('Failed to delete');
    }
    setDeleteConfirm({ open: false, type: null, id: null, name: '', categoryId: null, inMultipleOrgs: false, inMultipleCategories: false });
  };

  // Check if content item is in multiple categories
  const isItemInMultipleCategories = (itemId) => {
    return orgAssignments.filter(a =>
      a.content_item_id === itemId && a.organization_id === selectedOrgId
    ).length > 1;
  };

  // Get item count for selected org
  const getOrgCategoryItemCount = (categoryId) => {
    return orgAssignments.filter(a =>
      a.organization_id === selectedOrgId && a.category_id === categoryId
    ).length;
  };

  if (loading && contentItems.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <button style={styles.backBtn} onClick={() => navigate(backPath)}>
            <BackIcon />
          </button>
          <h1 style={styles.headerTitle}>{title}</h1>
          <div style={{ width: 40 }} />
        </div>
        <div style={styles.headerBorder} />
      </header>

      <div style={styles.contentContainer}>
        <div style={styles.content}>
          {/* Org Toggle */}
          {allOrganizations.length > 1 && (
            <div style={styles.orgToggleContainer}>
              {allOrganizations.map(org => (
                <button
                  key={org.id}
                  style={{
                    ...styles.orgToggleBtn,
                    backgroundColor: selectedOrgId === org.id ? (org.code === 'AM' ? '#dbeafe' : '#fce7f3') : '#f8fafc',
                    color: selectedOrgId === org.id ? (org.code === 'AM' ? '#1d4ed8' : '#be185d') : '#64748b',
                    fontWeight: selectedOrgId === org.id ? '600' : '400',
                  }}
                  onClick={() => setSelectedOrgId(org.id)}
                >
                  {org.code}
                </button>
              ))}
            </div>
          )}

          <button style={styles.addMultiContentBtn} onClick={() => setMultiCategoryModal(true)}>
            <PlusIcon />
            <span>Add to Multiple Orgs/Categories</span>
          </button>

          <button style={styles.addCategoryBtn} onClick={() => setCategoryModal({ open: true, category: null })}>
            <PlusIcon />
            <span>Add Category for {allOrganizations.find(o => o.id === selectedOrgId)?.code || '...'}</span>
          </button>

          {/* Categories list with drag-and-drop */}
          {categories.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div style={styles.categoriesList}>
                  {categories.map(category => {
                    const isExpanded = expandedCategory === category.id;

                    return (
                      <SortableCategoryItem
                        key={category.id}
                        category={{ ...category, items: getOrgCategoryItems(category.id) }}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedCategory(isExpanded ? null : category.id)}
                        onEdit={() => setCategoryModal({ open: true, category })}
                        onDelete={() => {
                          const inOtherOrgs = checkCategoryInOtherOrgs(category.title, selectedOrgId);
                          setDeleteConfirm({ open: true, type: 'category', id: category.id, name: category.title, inMultipleOrgs: inOtherOrgs });
                        }}
                        onAddContent={() => setContentModal({ open: true, item: null, categoryId: category.id, orgId: selectedOrgId })}
                        onEditContent={(item) => setContentModal({ open: true, item, categoryId: category.id, orgId: selectedOrgId })}
                        onDeleteContent={(item) => setDeleteConfirm({ open: true, type: 'content', id: item.id, name: item.title, categoryId: category.id, inMultipleCategories: isItemInMultipleCategories(item.id) })}
                        onReorderItems={handleReorderItems}
                        selectedOrgId={selectedOrgId}
                        orgAssignments={orgAssignments}
                      />
                    );
                  })}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeCategory ? (
                  <div style={{ ...styles.categoryCard, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transform: 'scale(1.02)' }}>
                    <div style={styles.categoryHeader}>
                      <div style={styles.dragHandle}><GripIcon /></div>
                      <div style={styles.categoryInfo}>
                        <h3 style={styles.categoryName}>{activeCategory.title}</h3>
                        <span style={styles.categoryCount}>
                          {getOrgCategoryItemCount(activeCategory.id)} items
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No categories yet. Add one to get started!</p>
            </div>
          )}

          <div style={{ height: '40px' }} />
        </div>
      </div>

      <CategoryModal
        isOpen={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, category: null })}
        onSave={handleSaveCategory}
        category={categoryModal.category}
        title={categoryModal.category ? 'Edit Category' : 'Add Category'}
      />

      <ContentItemModal
        isOpen={contentModal.open}
        onClose={() => setContentModal({ open: false, item: null, categoryId: null, orgId: null })}
        onSave={handleSaveContent}
        item={contentModal.item}
        title={contentModal.item ? 'Edit Content' : 'Add Content'}
        type={type}
        categoryId={contentModal.categoryId}
        selectedOrgId={contentModal.orgId}
        categories={categories}
        itemCategories={contentModal.item ? itemCategoryLinks.filter(link => link.content_id === contentModal.item.id).map(link => link.category_id) : []}
      />

      <MultiCategoryContentModal
        isOpen={multiCategoryModal}
        onClose={() => setMultiCategoryModal(false)}
        onSave={handleSaveMultiContent}
        onSaveCategory={handleSaveMultiCategory}
        categories={categories}
        allCategories={allCategories}
        organizations={allOrganizations}
        type={type}
      />

      {deleteConfirm.open && (
        <div style={styles.modalOverlay} onClick={() => setDeleteConfirm({ open: false, type: null, id: null, name: '', categoryId: null, inMultipleOrgs: false, inMultipleCategories: false })}>
          <div style={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.deleteModalTitle}>
              {deleteConfirm.type === 'category' ? 'Delete Category?' : (deleteConfirm.inMultipleCategories ? 'Remove Content?' : 'Delete Content?')}
            </h2>
            <p style={styles.deleteText}>
              {deleteConfirm.type === 'category' && deleteConfirm.inMultipleOrgs
                ? `"${deleteConfirm.name}" exists in multiple organizations. Delete from this org only or all orgs?`
                : deleteConfirm.type === 'content' && deleteConfirm.inMultipleCategories
                ? `"${deleteConfirm.name}" is in multiple categories. Remove from this category only or delete completely?`
                : `Are you sure you want to delete "${deleteConfirm.name}"?`
              }
            </p>
            <div style={styles.deleteActionsVertical}>
              {deleteConfirm.type === 'category' ? (
                <>
                  <button style={styles.deleteBtnFull} onClick={() => handleDeleteCategory(false)}>
                    {deleteConfirm.inMultipleOrgs ? 'Delete from This Org Only' : 'Delete'}
                  </button>
                  {deleteConfirm.inMultipleOrgs && (
                    <button style={styles.deleteBtnFull} onClick={() => handleDeleteCategory(true)}>
                      Delete from All Orgs
                    </button>
                  )}
                </>
              ) : (
                <>
                  {deleteConfirm.inMultipleCategories ? (
                    <>
                      <button style={styles.removeBtnFull} onClick={() => handleDeleteContent(true)}>
                        Remove from This Category
                      </button>
                      <button style={styles.deleteBtnFull} onClick={() => handleDeleteContent(false)}>
                        Delete Completely
                      </button>
                    </>
                  ) : (
                    <button style={styles.deleteBtnFull} onClick={() => handleDeleteContent(false)}>
                      Delete
                    </button>
                  )}
                </>
              )}
              <button style={styles.cancelBtnFull} onClick={() => setDeleteConfirm({ open: false, type: null, id: null, name: '', categoryId: null, inMultipleOrgs: false, inMultipleCategories: false })}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100%', backgroundColor: 'var(--background-off-white)', display: 'flex', flexDirection: 'column' },
  loadingContainer: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  header: { width: '100%', backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px 16px', maxWidth: '600px', margin: '0 auto' },
  headerTitle: { color: 'var(--primary-blue)', fontSize: '20px', fontWeight: '700', margin: 0, textAlign: 'center' },
  headerBorder: { maxWidth: '600px', margin: '0 auto', height: '2px', backgroundColor: 'rgba(var(--primary-blue-rgb), 0.15)', borderRadius: '1px' },
  backBtn: { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-blue)', borderRadius: '10px' },
  contentContainer: { flex: 1, display: 'flex', justifyContent: 'center', overflow: 'auto' },
  content: { width: '100%', maxWidth: '600px', padding: '16px' },
  orgToggleContainer: { display: 'flex', gap: '8px', marginBottom: '16px', padding: '4px', backgroundColor: '#f1f5f9', borderRadius: '10px' },
  orgToggleBtn: { flex: 1, padding: '10px 16px', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' },
  addCategoryBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', backgroundColor: 'var(--primary-blue)', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' },
  addMultiContentBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', backgroundColor: '#ffffff', color: 'var(--primary-blue)', border: '2px solid var(--primary-blue)', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '20px' },
  categoriesList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  categoryCard: { backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' },
  categoryHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' },
  dragHandle: { color: '#94a3b8', cursor: 'grab', padding: '4px', touchAction: 'none' },
  dragHandleSmall: { color: '#94a3b8', cursor: 'grab', padding: '2px', touchAction: 'none' },
  categoryInfo: { flex: 1, cursor: 'pointer' },
  categoryName: { fontSize: '16px', fontWeight: '600', color: 'var(--text-dark)', margin: 0 },
  categoryCount: { fontSize: '13px', color: 'var(--text-muted)' },
  categoryActions: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' },
  expandIcon: { transition: 'transform 0.2s', cursor: 'pointer', padding: '4px' },
  iconBtn: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-light)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' },
  categoryContent: { padding: '0 16px 16px 16px', borderTop: '1px solid #f1f5f9' },
  addContentBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'var(--bg-light)', color: 'var(--primary-blue)', border: '1px dashed #cbd5e1', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '12px', marginTop: '12px', width: '100%', justifyContent: 'center' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  itemCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'var(--background-off-white)', borderRadius: '10px' },
  itemThumbnail: { width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--border-light)', flexShrink: 0 },
  itemThumbImage: { width: '100%', height: '100%', objectFit: 'cover' },
  itemThumbPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' },
  itemInfo: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: '14px', fontWeight: '500', color: 'var(--text-dark)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemDesc: { fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemActions: { display: 'flex', gap: '6px' },
  noItems: { color: 'var(--text-light)', fontSize: '14px', fontStyle: 'italic', textAlign: 'center', padding: '12px' },
  emptyState: { textAlign: 'center', padding: '40px 20px' },
  emptyText: { color: 'var(--text-muted)', fontSize: '15px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '24px', paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' },
  modal: { backgroundColor: '#ffffff', borderRadius: '24px', padding: '28px 24px', maxWidth: '480px', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s' },
  modalTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text-dark)', margin: '0 0 24px 0', paddingRight: '48px' },
  formGroup: { marginBottom: '20px' },
  categorySection: { backgroundColor: '#f8fafc', borderRadius: '14px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' },
  categorySectionHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary-blue)' },
  categorySectionTitle: { fontSize: '14px', fontWeight: '600', color: 'var(--primary-blue)' },
  labelSmall: { display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '6px' },
  select: { width: '100%', padding: '12px 14px', fontSize: '15px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff', cursor: 'pointer' },
  categoryChips: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  categoryChip: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', color: '#64748b', backgroundColor: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s' },
  categoryChipSelected: { backgroundColor: '#dbeafe', border: '2px solid var(--primary-blue)', color: 'var(--primary-blue)' },
  checkMark: { fontWeight: '600' },
  categoryError: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', border: '1px solid #fecaca' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '14px 16px', fontSize: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  textarea: { width: '100%', padding: '14px 16px', fontSize: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  saveBtn: { width: '100%', padding: '16px', backgroundColor: 'var(--primary-blue)', color: '#ffffff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '12px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)' },
  uploadBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '14px', cursor: 'pointer', color: '#64748b', fontSize: '15px', fontWeight: '500', transition: 'all 0.2s' },
  thumbnailPreview: { display: 'flex', alignItems: 'center', gap: '16px' },
  previewImage: { width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #e2e8f0' },
  filePreview: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '12px', fontSize: '15px', color: 'var(--text-dark)' },
  removeBtn: { padding: '8px 14px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' },
  toggleGroup: { marginBottom: '20px', padding: '4px 0' },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '2px solid #f1f5f9' },
  toggleLabel: { fontSize: '15px', color: 'var(--text-dark)', fontWeight: '500' },
  toggle: { width: '48px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s ease', padding: 0 },
  toggleKnob: { width: '24px', height: '24px', borderRadius: '12px', backgroundColor: '#ffffff', position: 'absolute', top: '2px', left: '2px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)', transition: 'transform 0.2s ease' },
  deleteText: { fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0, padding: '0 16px 16px', textAlign: 'center' },
  deleteModal: { backgroundColor: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '300px', overflow: 'hidden' },
  deleteModalTitle: { fontSize: '17px', fontWeight: '600', color: 'var(--text-dark)', margin: 0, padding: '20px 16px 8px', textAlign: 'center' },
  deleteActionsVertical: { display: 'flex', flexDirection: 'column', borderTop: '1px solid #e2e8f0', marginTop: '16px' },
  deleteBtnFull: { width: '100%', padding: '14px 16px', backgroundColor: 'transparent', color: '#dc2626', border: 'none', borderBottom: '1px solid #e2e8f0', fontSize: '17px', fontWeight: '600', cursor: 'pointer' },
  removeBtnFull: { width: '100%', padding: '14px 16px', backgroundColor: 'transparent', color: 'var(--primary-blue)', border: 'none', borderBottom: '1px solid #e2e8f0', fontSize: '17px', fontWeight: '600', cursor: 'pointer' },
  cancelBtnFull: { width: '100%', padding: '14px 16px', backgroundColor: 'transparent', color: '#007aff', border: 'none', fontSize: '17px', fontWeight: '600', cursor: 'pointer' },
  // Org selection styles
  categoryHint: { fontSize: '14px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4' },
  orgSection: { marginBottom: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '14px', border: '2px solid #e2e8f0', transition: 'border-color 0.2s' },
  orgCheckRow: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '4px 0' },
  orgLabel: { fontSize: '16px', fontWeight: '600' },
  categoryCheckboxes: { marginTop: '14px', marginLeft: '30px', paddingTop: '14px', borderTop: '2px solid #e2e8f0' },
  catCheckRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', cursor: 'pointer' },
  catLabel: { fontSize: '15px', color: 'var(--text-dark)' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-blue)' },
  noCatsHint: { fontSize: '14px', color: '#94a3b8', fontStyle: 'italic', margin: 0, padding: '8px 0' },
  // Mode toggle styles
  modeToggle: { display: 'flex', gap: '8px', marginBottom: '24px', padding: '6px', backgroundColor: '#f1f5f9', borderRadius: '14px' },
  modeBtn: { flex: 1, padding: '12px 20px', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'transparent', color: '#64748b', transition: 'all 0.2s' },
  modeBtnActive: { backgroundColor: '#ffffff', color: 'var(--primary-blue)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' },
};

export default ManageContentScreen;
