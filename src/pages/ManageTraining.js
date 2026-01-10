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
} from '@dnd-kit/core';
import {
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

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Sortable Content Item
const SortableContentItem = ({ item, onEdit, onDelete, orgAssignments, organizations }) => {
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

  const isInBoth = orgAssignments && organizations.length === 2 &&
    organizations.every(org => orgAssignments.some(a => a.organization_id === org.id && a.content_item_id === item.id));

  return (
    <div ref={setNodeRef} style={{ ...styles.itemCard, ...style }}>
      <div {...attributes} {...listeners} style={styles.dragHandle}>
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
        {isInBoth && <span style={styles.bothBadge}>Both</span>}
      </div>
      <div style={styles.itemActions}>
        <button style={styles.iconBtn} onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
          <EditIcon />
        </button>
        <button style={styles.iconBtn} onClick={(e) => { e.stopPropagation(); onDelete(item); }}>
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

// Organization Column
const OrgColumn = ({
  org,
  items,
  categories,
  onAddContent,
  onEditContent,
  onDeleteContent,
  orgAssignments,
  organizations,
  expandedCategory,
  setExpandedCategory
}) => {
  return (
    <div style={styles.orgColumn}>
      <div style={{ ...styles.orgHeader, backgroundColor: org.code === 'AM' ? '#dbeafe' : '#fce7f3' }}>
        <span style={{ ...styles.orgCode, color: org.code === 'AM' ? '#1d4ed8' : '#be185d' }}>{org.code}</span>
        <span style={styles.orgName}>{org.name}</span>
      </div>

      <button style={styles.addContentBtnSmall} onClick={() => onAddContent(org)}>
        <PlusIcon />
        <span>Add</span>
      </button>

      <div style={styles.categoryList}>
        {categories.map(cat => {
          const categoryItems = items.filter(item =>
            orgAssignments.some(a =>
              a.content_item_id === item.id &&
              a.organization_id === org.id &&
              a.category_id === cat.id
            )
          );
          const isExpanded = expandedCategory === `${org.id}-${cat.id}`;

          return (
            <div key={cat.id} style={styles.categoryCard}>
              <div
                style={styles.categoryHeader}
                onClick={() => setExpandedCategory(isExpanded ? null : `${org.id}-${cat.id}`)}
              >
                <span style={styles.categoryName}>{cat.title}</span>
                <div style={styles.categoryMeta}>
                  <span style={styles.categoryCount}>{categoryItems.length}</span>
                  <div style={{ ...styles.expandIcon, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <ChevronDownIcon />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div style={styles.categoryContent}>
                  <SortableContext items={categoryItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {categoryItems.length > 0 ? (
                      categoryItems.map(item => (
                        <SortableContentItem
                          key={item.id}
                          item={item}
                          onEdit={onEditContent}
                          onDelete={onDeleteContent}
                          orgAssignments={orgAssignments}
                          organizations={organizations}
                        />
                      ))
                    ) : (
                      <p style={styles.emptyCategory}>No items</p>
                    )}
                  </SortableContext>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Content Item Modal
const ContentItemModal = ({ isOpen, onClose, onSave, item, organizations, trainingCategories, defaultOrg }) => {
  const modalRef = React.useRef(null);
  const scrollYRef = React.useRef(0);
  const [formData, setFormData] = useState({
    title: '', description: '', thumbnail_url: '', file_url: '', file_name: '',
    external_link: '', external_link_label: '', quiz_link: '', quiz_link_label: '',
    is_downloadable: true, use_company_logo: false,
  });
  const [orgCategories, setOrgCategories] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      if (item) {
        setFormData({
          title: item.title || '',
          description: item.description || '',
          thumbnail_url: item.thumbnail_url || '',
          file_url: item.file_url || '',
          file_name: item.file_name || '',
          external_link: item.external_link || '',
          external_link_label: item.external_link_label || '',
          quiz_link: item.quiz_link || '',
          quiz_link_label: item.quiz_link_label || '',
          is_downloadable: item.is_downloadable !== false,
          use_company_logo: item.use_company_logo || false,
        });
        if (item.assignments) {
          const cats = {};
          item.assignments.forEach(a => {
            if (!cats[a.organization_id]) cats[a.organization_id] = [];
            if (!cats[a.organization_id].includes(a.category_id)) {
              cats[a.organization_id].push(a.category_id);
            }
          });
          setOrgCategories(cats);
        } else {
          setOrgCategories({});
        }
      } else {
        setFormData({
          title: '', description: '', thumbnail_url: '', file_url: '', file_name: '',
          external_link: '', external_link_label: '', quiz_link: '', quiz_link_label: '',
          is_downloadable: true, use_company_logo: false,
        });
        if (defaultOrg) {
          setOrgCategories({ [defaultOrg.id]: [] });
        } else {
          setOrgCategories({});
        }
      }
    }
  }, [isOpen, item, defaultOrg]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleOrg = (orgId) => {
    setOrgCategories(prev => {
      if (prev[orgId]) {
        const newCats = { ...prev };
        delete newCats[orgId];
        return newCats;
      }
      return { ...prev, [orgId]: [] };
    });
  };

  const toggleCategory = (orgId, categoryId) => {
    setOrgCategories(prev => {
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
      const filePath = `training/${fileName}`;
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
      const filePath = `training/${fileName}`;
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
    const hasAssignment = Object.entries(orgCategories).some(([, cats]) => cats.length > 0);
    if (!hasAssignment) {
      alert('Please select at least one organization and category');
      return;
    }
    setSaving(true);
    try {
      await onSave(formData, orgCategories, item?.id);
      onClose();
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const canSave = formData.title.trim() && Object.entries(orgCategories).some(([, cats]) => cats.length > 0) && !saving;

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div ref={modalRef} style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          <CloseIcon />
        </button>
        <h2 style={styles.modalTitle}>{item ? 'Edit Training' : 'Add Training'}</h2>

        <div style={styles.formGroup}>
          <label style={styles.label}>Organizations & Categories *</label>
          {organizations.map(org => (
            <div key={org.id} style={styles.orgSection}>
              <label style={styles.orgCheckRow}>
                <input
                  type="checkbox"
                  checked={!!orgCategories[org.id]}
                  onChange={() => toggleOrg(org.id)}
                  style={styles.checkbox}
                />
                <span style={{ ...styles.orgLabel, color: org.code === 'AM' ? '#1d4ed8' : '#be185d' }}>
                  {org.name}
                </span>
              </label>
              {orgCategories[org.id] && (
                <div style={styles.categoryCheckboxes}>
                  {trainingCategories.map(cat => (
                    <label key={cat.id} style={styles.catCheckRow}>
                      <input
                        type="checkbox"
                        checked={orgCategories[org.id]?.includes(cat.id)}
                        onChange={() => toggleCategory(org.id, cat.id)}
                        style={styles.checkbox}
                      />
                      <span style={styles.catLabel}>{cat.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Title *</label>
          <input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)} style={styles.input} placeholder="Training title" />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <textarea value={formData.description} onChange={e => handleChange('description', e.target.value)} style={styles.textarea} placeholder="Training description" rows={3} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Thumbnail</label>
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
          <label style={styles.label}>Video Link</label>
          <input type="url" value={formData.external_link} onChange={e => handleChange('external_link', e.target.value)} style={styles.input} placeholder="https://..." />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Quiz Link</label>
          <input type="url" value={formData.quiz_link} onChange={e => handleChange('quiz_link', e.target.value)} style={styles.input} placeholder="https://..." />
        </div>

        <button style={{ ...styles.saveBtn, opacity: canSave ? 1 : 0.5 }} onClick={handleSave} disabled={!canSave}>
          {saving ? 'Saving...' : (item ? 'Update Training' : 'Add Training')}
        </button>
      </div>
    </div>
  );
};

// Main Component
const ManageTraining = () => {
  const navigate = useNavigate();
  const { organizations } = useAuth();
  const { trainingCategories, refreshContent } = useContent();

  const [contentItems, setContentItems] = useState([]);
  const [orgAssignments, setOrgAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentModal, setContentModal] = useState({ open: false, item: null, defaultOrg: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const [expandedCategory, setExpandedCategory] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchContent = useCallback(async () => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from('content_items')
        .select('*')
        .eq('content_type', 'training')
        .order('sort_order');

      if (itemsError) throw itemsError;

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

  const handleSaveContent = async (formData, orgCategories, existingItemId) => {
    try {
      let itemId = existingItemId;

      if (existingItemId) {
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

        await supabase
          .from('content_item_assignments')
          .delete()
          .eq('content_item_id', existingItemId);
      } else {
        const { data: newItem, error } = await supabase
          .from('content_items')
          .insert({
            content_type: 'training',
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
      }

      const assignments = [];
      Object.entries(orgCategories).forEach(([orgId, categoryIds]) => {
        categoryIds.forEach(categoryId => {
          assignments.push({
            content_item_id: itemId,
            organization_id: orgId,
            category_id: categoryId,
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
      console.error('Error saving content:', error);
      throw error;
    }
  };

  const handleDeleteContent = async () => {
    if (!deleteConfirm.item) return;

    try {
      await supabase
        .from('content_item_assignments')
        .delete()
        .eq('content_item_id', deleteConfirm.item.id);

      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', deleteConfirm.item.id);

      if (error) throw error;

      await fetchContent();
      refreshContent && refreshContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    } finally {
      setDeleteConfirm({ open: false, item: null });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  };

  const getItemWithAssignments = (item) => {
    const itemAssignments = orgAssignments.filter(a => a.content_item_id === item.id);
    return { ...item, assignments: itemAssignments };
  };

  if (loading) {
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
          <button style={styles.backBtn} onClick={() => navigate('/profile')}>
            <BackIcon />
          </button>
          <h1 style={styles.headerTitle}>Manage Training</h1>
          <div style={{ width: 40 }} />
        </div>
        <div style={styles.headerBorder} />
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div style={styles.twoColumnContainer}>
          {organizations.map(org => (
            <OrgColumn
              key={org.id}
              org={org}
              items={contentItems}
              categories={trainingCategories}
              onAddContent={(org) => setContentModal({ open: true, item: null, defaultOrg: org })}
              onEditContent={(item) => setContentModal({ open: true, item: getItemWithAssignments(item), defaultOrg: null })}
              onDeleteContent={(item) => setDeleteConfirm({ open: true, item })}
              orgAssignments={orgAssignments}
              organizations={organizations}
              expandedCategory={expandedCategory}
              setExpandedCategory={setExpandedCategory}
            />
          ))}
        </div>
      </DndContext>

      <ContentItemModal
        isOpen={contentModal.open}
        onClose={() => setContentModal({ open: false, item: null, defaultOrg: null })}
        onSave={handleSaveContent}
        item={contentModal.item}
        organizations={organizations}
        trainingCategories={trainingCategories}
        defaultOrg={contentModal.defaultOrg}
      />

      {deleteConfirm.open && (
        <div style={styles.modalOverlay} onClick={() => setDeleteConfirm({ open: false, item: null })}>
          <div style={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.deleteModalTitle}>Delete Training?</h2>
            <p style={styles.deleteText}>
              Are you sure you want to delete "{deleteConfirm.item?.title}"? This will remove it from all organizations.
            </p>
            <div style={styles.deleteActionsVertical}>
              <button style={styles.deleteBtnFull} onClick={handleDeleteContent}>Delete</button>
              <button style={styles.cancelBtnFull} onClick={() => setDeleteConfirm({ open: false, item: null })}>Cancel</button>
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
  headerInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px 16px', maxWidth: '1200px', margin: '0 auto' },
  headerTitle: { color: 'var(--primary-blue)', fontSize: '20px', fontWeight: '700', margin: 0, textAlign: 'center' },
  headerBorder: { maxWidth: '1200px', margin: '0 auto', height: '2px', backgroundColor: 'rgba(var(--primary-blue-rgb), 0.15)', borderRadius: '1px' },
  backBtn: { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-blue)', borderRadius: '10px' },
  twoColumnContainer: { display: 'flex', gap: '16px', padding: '16px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box', flexWrap: 'wrap' },
  orgColumn: { flex: '1 1 300px', minWidth: '280px', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' },
  orgHeader: { padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
  orgCode: { fontSize: '14px', fontWeight: '700', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '6px' },
  orgName: { fontSize: '16px', fontWeight: '600', color: 'var(--text-dark)' },
  addContentBtnSmall: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '0 16px 12px', padding: '10px', backgroundColor: 'var(--primary-blue)', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  categoryList: { padding: '0 12px 12px' },
  categoryCard: { backgroundColor: 'var(--background-off-white)', borderRadius: '10px', marginBottom: '8px', overflow: 'hidden' },
  categoryHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', cursor: 'pointer' },
  categoryName: { fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' },
  categoryMeta: { display: 'flex', alignItems: 'center', gap: '8px' },
  categoryCount: { fontSize: '12px', color: 'var(--text-muted)', backgroundColor: '#ffffff', padding: '2px 8px', borderRadius: '10px' },
  expandIcon: { transition: 'transform 0.2s', color: 'var(--text-muted)' },
  categoryContent: { padding: '0 8px 8px' },
  emptyCategory: { fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px', fontStyle: 'italic' },
  itemCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#ffffff', borderRadius: '8px', marginBottom: '6px' },
  dragHandle: { color: 'var(--text-light)', cursor: 'grab', padding: '2px', touchAction: 'none' },
  itemThumbnail: { width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--border-light)', flexShrink: 0 },
  itemThumbImage: { width: '100%', height: '100%', objectFit: 'cover' },
  itemThumbPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' },
  itemInfo: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  itemTitle: { fontSize: '13px', fontWeight: '500', color: 'var(--text-dark)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  bothBadge: { fontSize: '10px', fontWeight: '600', color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 },
  itemActions: { display: 'flex', gap: '4px' },
  iconBtn: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-light)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' },
  modal: { backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '450px', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' },
  modalTitle: { fontSize: '20px', fontWeight: '600', color: 'var(--text-dark)', margin: '0 0 20px 0', paddingRight: '40px' },
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' },
  orgSection: { marginBottom: '12px', padding: '12px', backgroundColor: 'var(--background-off-white)', borderRadius: '10px' },
  orgCheckRow: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  orgLabel: { fontSize: '15px', fontWeight: '600' },
  categoryCheckboxes: { marginTop: '10px', marginLeft: '28px' },
  catCheckRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', cursor: 'pointer' },
  catLabel: { fontSize: '14px', color: 'var(--text-dark)' },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-blue)' },
  input: { width: '100%', padding: '12px 14px', fontSize: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px 14px', fontSize: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  uploadBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--background-off-white)', border: '1px dashed #cbd5e1', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px' },
  thumbnailPreview: { display: 'flex', alignItems: 'center', gap: '12px' },
  previewImage: { width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' },
  filePreview: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background-off-white)', borderRadius: '10px', fontSize: '14px', color: 'var(--text-dark)' },
  removeBtn: { padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  saveBtn: { width: '100%', padding: '14px', backgroundColor: 'var(--primary-blue)', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  deleteModal: { backgroundColor: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '300px', overflow: 'hidden' },
  deleteModalTitle: { fontSize: '17px', fontWeight: '600', color: 'var(--text-dark)', margin: 0, padding: '20px 16px 8px', textAlign: 'center' },
  deleteText: { fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0, padding: '0 16px 16px', textAlign: 'center' },
  deleteActionsVertical: { display: 'flex', flexDirection: 'column', borderTop: '1px solid #e2e8f0' },
  deleteBtnFull: { width: '100%', padding: '14px 16px', backgroundColor: 'transparent', color: '#dc2626', border: 'none', borderBottom: '1px solid #e2e8f0', fontSize: '17px', fontWeight: '600', cursor: 'pointer' },
  cancelBtnFull: { width: '100%', padding: '14px 16px', backgroundColor: 'transparent', color: '#007aff', border: 'none', fontSize: '17px', fontWeight: '600', cursor: 'pointer' },
};

export default ManageTraining;
