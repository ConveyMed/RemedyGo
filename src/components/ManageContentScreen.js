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

// Content Item Modal (single category + current org)
const ContentItemModal = ({ isOpen, onClose, onSave, item, title, type, categoryId, selectedOrgId }) => {
  const modalRef = React.useRef(null);
  const scrollYRef = React.useRef(0);
  const [formData, setFormData] = useState({
    title: '', description: '', thumbnail_url: '', file_url: '', file_name: '',
    external_link: '', external_link_label: '', quiz_link: '', quiz_link_label: '',
    is_downloadable: true, use_company_logo: false,
  });
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
    }
  }, [isOpen, item]);

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
    setSaving(true);
    try {
      await onSave(formData, categoryId, selectedOrgId, item?.id);
      onClose();
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div ref={modalRef} style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          <CloseIcon />
        </button>
        <h2 style={styles.modalTitle}>{title}</h2>

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

// Multi-Category Content Modal with Org Selection
const MultiCategoryContentModal = ({ isOpen, onClose, onSave, categories, organizations, type }) => {
  const modalRef = React.useRef(null);
  const scrollYRef = React.useRef(0);
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
    // Check if at least one org with at least one category is selected
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

  const hasSelection = Object.entries(selectedOrgCategories).some(([, cats]) => cats.length > 0);
  const canSave = formData.title.trim() && hasSelection && !saving;

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div ref={modalRef} style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          <CloseIcon />
        </button>
        <h2 style={styles.modalTitle}>Add to Multiple Orgs/Categories</h2>

        {/* Organization & Category Selection */}
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
                  {categories.length > 0 ? (
                    categories.map(cat => (
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
                    <p style={styles.noCatsHint}>No categories yet. Create one first.</p>
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

        <button style={{ ...styles.saveBtn, opacity: canSave ? 1 : 0.5 }} onClick={handleSave} disabled={!canSave}>
          {saving ? 'Saving...' : 'Add Content'}
        </button>
      </div>
    </div>
  );
};

// Main Component
const ManageContentScreen = ({ type, title, backPath }) => {
  const navigate = useNavigate();
  const { organizations } = useAuth();
  const { libraryCategories, trainingCategories, addCategory, updateCategory, deleteCategory, reorderCategories, reorderContentItems, refreshContent } = useContent();

  const categories = type === 'library' ? libraryCategories : trainingCategories;

  // Org toggle state - default to first org
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  // Content and assignments
  const [contentItems, setContentItems] = useState([]);
  const [orgAssignments, setOrgAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null });
  const [contentModal, setContentModal] = useState({ open: false, item: null, categoryId: null });
  const [multiCategoryModal, setMultiCategoryModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null, name: '', categoryId: null });
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Set default org on mount
  useEffect(() => {
    if (organizations?.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  // Load content items and assignments
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all content items
      const { data: items, error: itemsError } = await supabase
        .from('content_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (itemsError) throw itemsError;

      // Fetch all assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('content_item_assignments')
        .select('*');

      if (assignmentsError) throw assignmentsError;

      setContentItems(items || []);
      setOrgAssignments(assignments || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Merge content items into categories for display
  const categoriesWithItems = categories.map(cat => ({
    ...cat,
    items: contentItems.filter(item =>
      orgAssignments.some(a =>
        a.content_item_id === item.id &&
        a.category_id === cat.id
      )
    )
  }));

  // Category handlers
  const handleSaveCategory = async (data) => {
    if (categoryModal.category) {
      await updateCategory(categoryModal.category.id, data);
    } else {
      await addCategory(type, data.title, data.description);
    }
  };

  // Content handlers - single category + current org
  const handleSaveContent = async (formData, categoryId, orgId, existingItemId) => {
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

  // Delete handler
  const confirmDelete = async () => {
    try {
      if (deleteConfirm.type === 'category') {
        await deleteCategory(deleteConfirm.id);
      } else {
        // Delete content - remove assignments first, then item
        await supabase
          .from('content_item_assignments')
          .delete()
          .eq('content_item_id', deleteConfirm.id);

        await supabase
          .from('content_items')
          .delete()
          .eq('id', deleteConfirm.id);

        await fetchContent();
        refreshContent && refreshContent();
      }
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete');
    }
    setDeleteConfirm({ open: false, type: null, id: null, name: '', categoryId: null });
  };

  // Drag handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = categoriesWithItems.findIndex(c => c.id === active.id);
      const newIndex = categoriesWithItems.findIndex(c => c.id === over.id);
      const newOrder = arrayMove(categoriesWithItems, oldIndex, newIndex);
      reorderCategories(type, newOrder.map(c => c.id));
    }
  };

  const activeCategory = activeId ? categoriesWithItems.find(c => c.id === activeId) : null;

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
          {organizations?.length > 1 && (
            <div style={styles.orgToggleContainer}>
              {organizations.map(org => (
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

          <button style={styles.addCategoryBtn} onClick={() => setCategoryModal({ open: true, category: null })}>
            <PlusIcon />
            <span>Add Category</span>
          </button>

          <button style={styles.addMultiContentBtn} onClick={() => setMultiCategoryModal(true)}>
            <PlusIcon />
            <span>Add to Multiple Orgs/Categories</span>
          </button>

          {categoriesWithItems.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={categoriesWithItems.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div style={styles.categoriesList}>
                  {categoriesWithItems.map((category) => (
                    <SortableCategoryItem
                      key={category.id}
                      category={category}
                      isExpanded={expandedCategory === category.id}
                      onToggle={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                      onEdit={() => setCategoryModal({ open: true, category })}
                      onDelete={() => setDeleteConfirm({ open: true, type: 'category', id: category.id, name: category.title })}
                      onAddContent={() => setContentModal({ open: true, item: null, categoryId: category.id })}
                      onEditContent={(item) => setContentModal({ open: true, item, categoryId: category.id })}
                      onDeleteContent={(item) => setDeleteConfirm({ open: true, type: 'content', id: item.id, name: item.title, categoryId: category.id })}
                      onReorderItems={reorderContentItems}
                      selectedOrgId={selectedOrgId}
                      orgAssignments={orgAssignments}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeCategory ? (
                  <div style={{ ...styles.categoryCard, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transform: 'scale(1.02)' }}>
                    <div style={styles.categoryHeader}>
                      <div style={styles.dragHandle}><GripIcon /></div>
                      <div style={styles.categoryInfo}>
                        <h3 style={styles.categoryName}>{activeCategory.title}</h3>
                        <span style={styles.categoryCount}>{activeCategory.items.length} items</span>
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
        onClose={() => setContentModal({ open: false, item: null, categoryId: null })}
        onSave={handleSaveContent}
        item={contentModal.item}
        title={contentModal.item ? 'Edit Content' : 'Add Content'}
        type={type}
        categoryId={contentModal.categoryId}
        selectedOrgId={selectedOrgId}
      />

      <MultiCategoryContentModal
        isOpen={multiCategoryModal}
        onClose={() => setMultiCategoryModal(false)}
        onSave={handleSaveMultiContent}
        categories={categories}
        organizations={organizations || []}
        type={type}
      />

      {deleteConfirm.open && (
        <div style={styles.modalOverlay} onClick={() => setDeleteConfirm({ open: false, type: null, id: null, name: '', categoryId: null })}>
          <div style={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.deleteModalTitle}>
              {deleteConfirm.type === 'category' ? 'Delete Category?' : 'Delete Content?'}
            </h2>
            <p style={styles.deleteText}>
              {deleteConfirm.type === 'category'
                ? `Are you sure you want to delete "${deleteConfirm.name}"?`
                : `Are you sure you want to delete "${deleteConfirm.name}"?`
              }
            </p>
            <div style={styles.deleteActionsVertical}>
              <button style={styles.deleteBtnFull} onClick={confirmDelete}>
                Delete
              </button>
              <button style={styles.cancelBtnFull} onClick={() => setDeleteConfirm({ open: false, type: null, id: null, name: '', categoryId: null })}>Cancel</button>
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
  dragHandle: { color: 'var(--text-light)', cursor: 'grab', padding: '4px', touchAction: 'none' },
  dragHandleSmall: { color: 'var(--text-light)', cursor: 'grab', padding: '2px', touchAction: 'none' },
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
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px', paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' },
  modal: { backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '400px', width: '100%', position: 'relative', maxHeight: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' },
  modalTitle: { fontSize: '20px', fontWeight: '600', color: 'var(--text-dark)', margin: '0 0 20px 0', paddingRight: '40px' },
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' },
  input: { width: '100%', padding: '12px 14px', fontSize: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px 14px', fontSize: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  saveBtn: { width: '100%', padding: '14px', backgroundColor: 'var(--primary-blue)', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  uploadBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--background-off-white)', border: '1px dashed #cbd5e1', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px' },
  thumbnailPreview: { display: 'flex', alignItems: 'center', gap: '12px' },
  previewImage: { width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' },
  filePreview: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background-off-white)', borderRadius: '10px', fontSize: '14px', color: 'var(--text-dark)' },
  removeBtn: { padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  toggleGroup: { marginBottom: '16px' },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  toggleLabel: { fontSize: '14px', color: 'var(--text-dark)' },
  toggle: { width: '48px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s ease', padding: 0 },
  toggleKnob: { width: '24px', height: '24px', borderRadius: '12px', backgroundColor: '#ffffff', position: 'absolute', top: '2px', left: '2px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)', transition: 'transform 0.2s ease' },
  deleteText: { fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0, padding: '0 16px 16px', textAlign: 'center' },
  deleteModal: { backgroundColor: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '300px', overflow: 'hidden' },
  deleteModalTitle: { fontSize: '17px', fontWeight: '600', color: 'var(--text-dark)', margin: 0, padding: '20px 16px 8px', textAlign: 'center' },
  deleteActionsVertical: { display: 'flex', flexDirection: 'column', borderTop: '1px solid #e2e8f0', marginTop: '16px' },
  deleteBtnFull: { width: '100%', padding: '14px 16px', backgroundColor: 'transparent', color: '#dc2626', border: 'none', borderBottom: '1px solid #e2e8f0', fontSize: '17px', fontWeight: '600', cursor: 'pointer' },
  cancelBtnFull: { width: '100%', padding: '14px 16px', backgroundColor: 'transparent', color: '#007aff', border: 'none', fontSize: '17px', fontWeight: '600', cursor: 'pointer' },
  // Org selection styles
  categoryHint: { fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px 0' },
  orgSection: { marginBottom: '12px', padding: '12px', backgroundColor: 'var(--background-off-white)', borderRadius: '10px', border: '1px solid #e2e8f0' },
  orgCheckRow: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  orgLabel: { fontSize: '15px', fontWeight: '600' },
  categoryCheckboxes: { marginTop: '10px', marginLeft: '26px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' },
  catCheckRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', cursor: 'pointer' },
  catLabel: { fontSize: '14px', color: 'var(--text-dark)' },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-blue)' },
  noCatsHint: { fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 },
};

export default ManageContentScreen;
